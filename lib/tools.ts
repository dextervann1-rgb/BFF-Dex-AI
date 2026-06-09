import { tool } from 'ai';
import { z } from 'zod';
import { ethers } from 'ethers';
import { EAS, SchemaEncoder } from '@ethereum-attestation-service/eas-sdk';
import { verifyVoiceAuthorization } from './voice';
import { createQuickBooksExpense } from './quickbooks';

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

export const payEip681 = tool({
  description: 'Parse Base EIP-681 payment link, show details, execute after voice confirm',
  parameters: z.object({
    eip681_url: z.string().describe('Full ethereum: payment link'),
    audio_base64: z.string().describe('User saying "Armor up" to confirm'),
  }),
  execute: async ({ eip681_url, audio_base64 }) => {
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
    const to = url.searchParams.get('address');
    const amountRaw = url.searchParams.get('uint256');

    if (!to || !amountRaw) {
      throw new Error('Invalid EIP-681 URL: missing address or amount');
    }

    // USDC = 6 decimals
    const amount = Number(amountRaw) / 1e6;
    const tokenName = token.toLowerCase() === USDC_ADDRESS.toLowerCase() ? 'USDC' : 'Unknown Token';
    const chainId = chainIdStr ? parseInt(chainIdStr) : 8453; // Default to Base

    if (chainId !== 8453) {
      throw new Error('Only Base chain (8453) is supported');
    }

    // 3. Safety check: $500 max without 2FA
    if (amount > 500) {
      throw new Error('Amount >$500. Requires 2FA. Contact Dexter.');
    }

    // 4. Execute transfer
    const signer = getSigner();
    const usdc = new ethers.Contract(
      token,
      ['function transfer(address to, uint256 amount) returns (bool)'],
      signer
    );
    
    const tx = await usdc.transfer(to, amountRaw);
    await tx.wait();

    // 5. Log to QuickBooks
    const qbResult = await createQuickBooksExpense({
      amount,
      vendor: to,
      memo: 'Voice-approved via BFFDex AI',
      category: 'MaShabak Ops',
      txHash: tx.hash,
    });

    // 6. EAS attest payment
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
          { name: 'to', value: to, type: 'address' },
          { name: 'amount', value: BigInt(amountRaw), type: 'uint256' },
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
      }
    } catch (err) {
      console.error('[BFFDex] EAS attestation failed:', err);
    }

    return {
      success: true,
      sent: `${amount} ${tokenName}`,
      to_address: to,
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
    const to = url.searchParams.get('address');
    const amountRaw = url.searchParams.get('uint256');

    const amount = amountRaw ? Number(amountRaw) / 1e6 : 0;
    const tokenName = token.toLowerCase() === USDC_ADDRESS.toLowerCase() ? 'USDC' : 'Unknown Token';
    const chainId = chainIdStr ? parseInt(chainIdStr) : 8453;

    return {
      token_address: token,
      token_name: tokenName,
      recipient: to,
      amount,
      chain_id: chainId,
      chain_name: chainId === 8453 ? 'Base' : 'Unknown',
      requires_voice: true,
      max_without_2fa: 500,
    };
  },
});

export const bffdexTools: any = {
  pay_eip681: payEip681,
  check_balance: checkBalance,
  parse_eip681: parseEip681,
};
