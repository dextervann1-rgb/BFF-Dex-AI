import { tool } from 'ai';
import { z } from 'zod';
import { ethers } from 'ethers';
import { EAS, SchemaEncoder } from '@ethereum-attestation-service/eas-sdk';
import { verifyVoiceAuthorization } from './voice';
import { createQuickBooksExpense } from './quickbooks';
import {
  saveTransaction,
  updateTransaction,
  saveVoiceLog,
  saveEasAttestation,
} from './supabase';

// Base Mainnet config
const BASE_RPC = 'https://mainnet.base.org';
const EAS_CONTRACT = '0x4200000000000000000000000000000000000021';
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

function getProvider() {
  return new ethers.JsonRpcProvider(BASE_RPC);
}

function getSigner() {
  const privateKey = process.env.WALLET_PRIVATE_KEY;
  if (!privateKey) throw new Error('Wallet not configured');
  return new ethers.Wallet(privateKey, getProvider());
}

function requireTransactionSigningEnabled() {
  if (process.env.BFFDEX_TRANSACTION_SIGNING_ENABLED !== 'true') {
    throw new Error(
      'Transaction execution is disabled. Set BFFDEX_TRANSACTION_SIGNING_ENABLED=true only after completing wallet custody, testnet rehearsal, and approval checks.'
    );
  }
}

export const payEip681 = tool({
  description: 'Parse Base EIP-681 payment link, show details, execute after voice confirm',
  parameters: z.object({
    eip681_url: z.string().describe('Full ethereum: payment link'),
    audio_base64: z.string().describe('User saying "Armor up" to confirm'),
  }),
  execute: async ({ eip681_url, audio_base64 }) => {
    // Live transfers are intentionally disabled unless explicitly enabled in the server environment.
    requireTransactionSigningEnabled();

    // 1. Voice gate - mandatory for any send
    const voice = await verifyVoiceAuthorization(audio_base64, 'armor up');
    if (!voice.verified) {
      throw new Error(voice.error || 'Voice verification failed');
    }

    // 2. Parse EIP-681
    const url = new URL(eip681_url);
    const pathParts = url.pathname.split('/');
    const tokenChain = pathParts[0] || pathParts[1];
    const [token, chainIdStr] = tokenChain.split('@');
    let to = url.searchParams.get('address');
    const amountRaw = url.searchParams.get('uint256');

    if (!to || !amountRaw) {
      throw new Error('Invalid EIP-681 URL: an explicit recipient address and amount are required');
    }
    if (!ethers.isAddress(to)) {
      throw new Error('Invalid EIP-681 URL: recipient is not a valid address');
    }
    if (!ethers.isAddress(token) || token.toLowerCase() !== USDC_ADDRESS.toLowerCase()) {
      throw new Error('Only the canonical Base USDC contract is supported');
    }
    if (!/^\d+$/.test(amountRaw)) {
      throw new Error('Invalid EIP-681 URL: amount must be an integer number of USDC base units');
    }

    const chainId = chainIdStr ? parseInt(chainIdStr, 10) : 8453;
    if (chainId !== 8453) {
      throw new Error('Only Base chain (8453) is supported');
    }

    const amountUnits = BigInt(amountRaw);
    const maxWithoutAdditionalApproval = 500_000_000n; // 500 USDC at six decimals
    if (amountUnits <= 0n) {
      throw new Error('Payment amount must be greater than zero');
    }
    if (amountUnits > maxWithoutAdditionalApproval) {
      throw new Error('Amount exceeds the $500 execution limit and requires a separate approved flow.');
    }
    const recipient = ethers.getAddress(to);
    const amount = Number(amountUnits) / 1e6;
    const tokenName = 'USDC';

    // 4. Execute transfer
    const signer = getSigner();
    const usdc = new ethers.Contract(
      token,
      ['function transfer(address to, uint256 amount) returns (bool)'],
      signer
    );
    
    const tx = await usdc.transfer(recipient, amountUnits);
    await tx.wait();

    // 5. Save transaction to Supabase
    const signerAddress = await signer.getAddress();
    const savedTx = await saveTransaction({
      amount,
      token: tokenName,
      from_address: signerAddress,
      to_address: recipient,
      tx_hash: tx.hash,
      status: 'confirmed',
      voice_verified: true,
      voice_similarity: voice.similarity,
      quickbooks_synced: false,
      chain_id: chainId,
      metadata: {
        eip681_url: eip681_url,
        verified_phrase: voice.text,
      },
    });

    // 6. Save voice log
    if (savedTx) {
      await saveVoiceLog({
        transaction_id: savedTx.id,
        phrase_required: 'armor up',
        phrase_spoken: voice.text,
        similarity: voice.similarity,
        verified: true,
      });
    }

    // 7. Log to QuickBooks
    const qbResult = await createQuickBooksExpense({
      amount,
      vendor: recipient,
      memo: 'Voice-approved via BFFDex AI',
      category: 'MaShabak Ops',
      txHash: tx.hash,
    });

    // Update QB sync status in Supabase
    if (savedTx) {
      await updateTransaction(savedTx.id, {
        quickbooks_synced: qbResult.success,
        quickbooks_error: qbResult.error,
      });
    }

    // 8. EAS attest payment
    let attestationUid: string | undefined;
    try {
      const eas = new EAS(EAS_CONTRACT);
      eas.connect(signer);

      const schemaUid = process.env.PAYMENT_SCHEMA_UID;
      if (schemaUid) {
        const schemaEncoder = new SchemaEncoder(
          'string action,address to,uint256 amount,string token'
        );
        const encoded = schemaEncoder.encodeData([
          { name: 'action', value: 'Voice-Verified Payment', type: 'string' },
          { name: 'to', value: recipient, type: 'address' },
          { name: 'amount', value: amountUnits, type: 'uint256' },
          { name: 'token', value: tokenName, type: 'string' },
        ]);

        const attestTx = await eas.attest({
          schema: schemaUid,
          data: {
            recipient: await signer.getAddress(),
            data: encoded,
            expirationTime: BigInt(0),
            revocable: true,
          },
        });
        attestationUid = await attestTx.wait();

        // Save attestation to Supabase
        if (savedTx && attestationUid) {
          await saveEasAttestation({
            transaction_id: savedTx.id,
            attestation_uid: attestationUid,
            schema_uid: schemaUid,
            recipient_address: signerAddress,
            data: {
              action: 'Voice-Verified Payment',
              to: recipient,
              amount: amountUnits.toString(),
              token: tokenName,
            },
          });

          // Update transaction with attestation UID
          await updateTransaction(savedTx.id, {
            attestation_uid: attestationUid,
          });
        }
      }
    } catch (err) {
      console.error('[BFFDex] EAS attestation failed:', err);
      if (savedTx) {
        await updateTransaction(savedTx.id, {
          attestation_error: String(err),
        });
      }
    }

    return {
      success: true,
      sent: `${amount} ${tokenName}`,
      to_address: recipient,
      tx_hash: tx.hash,
      basescan: `https://basescan.org/tx/${tx.hash}`,
      attestation_uid: attestationUid,
      quickbooks_synced: qbResult.success,
      message: `Blessed w/ BASS. ${amount} ${tokenName} sent. Voice-verified by Dexter Vann.`,
    };
  },
});

export const checkBalance = tool({
  description: 'Check USDC balance on Base',
  parameters: z.object({}),
  execute: async () => {
    const signer = getSigner();
    const address = await signer.getAddress();
    
    const usdc = new ethers.Contract(
      USDC_ADDRESS,
      ['function balanceOf(address) view returns (uint256)'],
      getProvider()
    );
    
    const balance = await usdc.balanceOf(address);
    const formatted = Number(balance) / 1e6;
    
    return {
      address,
      balance: formatted,
      token: 'USDC',
      chain: 'Base',
    };
  },
});

export const parseEip681 = tool({
  description: 'Parse an EIP-681 payment link without executing (preview only)',
  parameters: z.object({
    eip681_url: z.string().describe('Full ethereum: payment link to parse'),
  }),
  execute: async ({ eip681_url }) => {
    const url = new URL(eip681_url);
    const pathParts = url.pathname.split('/');
    const tokenChain = pathParts[0] || pathParts[1];
    const [token, chainIdStr] = tokenChain.split('@');
    let to = url.searchParams.get('address');
    const amountRaw = url.searchParams.get('uint256');

    const chainId = chainIdStr ? parseInt(chainIdStr, 10) : 8453;
    const amountUnits = amountRaw && /^\d+$/.test(amountRaw) ? BigInt(amountRaw) : null;
    const supportedToken = ethers.isAddress(token) && token.toLowerCase() === USDC_ADDRESS.toLowerCase();
    const validRecipient = Boolean(to && ethers.isAddress(to));
    const validAmount = Boolean(amountUnits && amountUnits > 0n);

    return {
      token_address: token,
      token_name: supportedToken ? 'USDC' : 'Unsupported token',
      recipient: to,
      amount: amountUnits ? Number(amountUnits) / 1e6 : 0,
      chain_id: chainId,
      chain_name: chainId === 8453 ? 'Base' : 'Unsupported chain',
      requires_voice: true,
      execution_enabled: process.env.BFFDEX_TRANSACTION_SIGNING_ENABLED === 'true',
      executable: supportedToken && validRecipient && validAmount && chainId === 8453 && amountUnits! <= 500_000_000n,
      max_without_additional_approval: 500,
    };
  },
});

export const bffdexTools: any = {
  pay_eip681: payEip681,
  check_balance: checkBalance,
  parse_eip681: parseEip681,
};
