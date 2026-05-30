# BFFDex AI

**Voice-Verified Crypto Payments on Base** — by Dexter Vann

BFFDex AI is an intelligent payment assistant that combines voice authentication, EIP-681 payment link parsing, on-chain attestations via EAS, and automatic QuickBooks expense logging into a single seamless interface.

## Features

- **Voice-Verified Payments** — Say "Armor up" to authorize transactions via ElevenLabs voice biometrics
- **EIP-681 Payment Links** — Paste any `ethereum:` payment link and get a full preview before executing
- **Base Chain** — All payments execute on Base (Coinbase's L2) using USDC
- **QuickBooks Integration** — Automatic expense logging after every confirmed transaction
- **EAS Attestations** — On-chain payment attestations via Ethereum Attestation Service
- **Transaction History** — Full audit trail of all voice-verified payments

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **AI:** Vercel AI SDK with Anthropic Claude
- **Web3:** ethers.js v6, EAS SDK
- **Voice:** ElevenLabs Speech-to-Text + Voice Verification
- **Analytics:** Vercel Analytics

## Getting Started

```bash
git clone https://github.com/dextervann1-rgb/BFF-Dex-AI.git
cd BFF-Dex-AI
npm install
cp .env.example .env.local
# Fill in your values in .env.local
npm run dev
```

## Environment Variables

| Variable | Description |
|---|---|
| `WALLET_PRIVATE_KEY` | Base wallet private key for signing transactions |
| `ELEVENLABS_API_KEY` | ElevenLabs API key for voice verification |
| `DEXTER_VOICE_ID` | Your ElevenLabs Voice ID for biometric auth |
| `PAYMENT_SCHEMA_UID` | EAS schema UID for payment attestations |
| `QUICKBOOKS_CLIENT_ID` | QuickBooks OAuth client ID |
| `QUICKBOOKS_CLIENT_SECRET` | QuickBooks OAuth client secret |

## Security

All payments require voice biometric verification. Never commit `.env.local` or any file containing private keys.

## License

MIT — Built by Dexter Vann
