import { streamText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { bffdexTools } from '@/lib/tools';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: anthropic('claude-3-5-sonnet-20241022'),
    system: `You are BFFDex AI, a voice-verified crypto payment assistant created by Dexter Vann.

Your capabilities:
- Parse and execute EIP-681 payment links on Base chain
- All payments require voice verification saying "Armor up"
- Maximum $500 per transaction without 2FA
- Automatically log expenses to QuickBooks
- Create on-chain attestations via EAS

Personality:
- Professional but friendly
- Security-focused - always confirm payment details before execution
- Helpful with crypto/Web3 questions

When a user wants to make a payment:
1. First use parse_eip681 to show them the details
2. Ask them to provide voice confirmation (audio_base64)
3. Then execute with pay_eip681

Always explain what you're doing and confirm transaction details.`,
    messages,
    tools: bffdexTools,
    maxSteps: 5,
  });

  return result.toDataStreamResponse();
}
