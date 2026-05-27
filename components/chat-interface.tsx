'use client';

import { useChat } from '@ai-sdk/react';
import { useState } from 'react';
import { Send, Shield, Wallet, Receipt, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { VoiceRecorder } from './voice-recorder';

export function ChatInterface() {
  const [audioBase64, setAudioBase64] = useState<string>('');
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (audioBase64) {
      handleSubmit(e, {
        body: {
          audio_base64: audioBase64,
        },
      });
      setAudioBase64('');
    } else {
      handleSubmit(e);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">BFFDex AI</h3>
            <p className="text-muted-foreground max-w-md">
              Voice-verified payments on Base. Paste an EIP-681 payment link or ask me to check your balance.
            </p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card border border-border'
              }`}
            >
              {message.parts ? (
                message.parts.map((part, i) => {
                  if (part.type === 'text') {
                    return <p key={i} className="whitespace-pre-wrap">{part.text}</p>;
                  }
                  if (part.type === 'tool-invocation') {
                    return (
                      <ToolResultCard key={i} toolName={part.toolInvocation.toolName} result={part.toolInvocation.result} />
                    );
                  }
                  return null;
                })
              ) : (
                <p className="whitespace-pre-wrap">{message.content}</p>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-card border border-border rounded-lg px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse delay-150" />
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse delay-300" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Voice Recorder */}
      <div className="px-4 py-2 border-t border-border">
        <VoiceRecorder
          onRecordingComplete={setAudioBase64}
          disabled={isLoading}
        />
        {audioBase64 && (
          <div className="flex items-center gap-2 mt-2 text-sm text-primary">
            <Shield className="h-4 w-4" />
            Voice recorded - ready to authorize payment
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={onSubmit} className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder="Paste EIP-681 link or ask a question..."
            className="flex-1 bg-secondary border-border"
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}

function ToolResultCard({ toolName, result }: { toolName: string; result: unknown }) {
  if (!result) return null;
  
  const data = result as Record<string, unknown>;

  if (toolName === 'check_balance') {
    return (
      <Card className="mt-2 bg-secondary/50">
        <CardHeader className="py-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Wallet className="h-4 w-4 text-primary" />
            Wallet Balance
          </CardTitle>
        </CardHeader>
        <CardContent className="py-2">
          <p className="text-2xl font-bold">{String(data.balance)} {String(data.token)}</p>
          <p className="text-xs text-muted-foreground truncate mt-1">{String(data.address)}</p>
        </CardContent>
      </Card>
    );
  }

  if (toolName === 'parse_eip681') {
    return (
      <Card className="mt-2 bg-secondary/50">
        <CardHeader className="py-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Receipt className="h-4 w-4 text-primary" />
            Payment Preview
          </CardTitle>
        </CardHeader>
        <CardContent className="py-2 space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Amount</span>
            <span className="font-semibold">{String(data.amount)} {String(data.token_name)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Chain</span>
            <span>{String(data.chain_name)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">To</span>
            <span className="font-mono text-xs truncate max-w-32">{String(data.recipient)}</span>
          </div>
          <div className="pt-2 text-xs text-warning flex items-center gap-1">
            <Shield className="h-3 w-3" />
            Voice verification required
          </div>
        </CardContent>
      </Card>
    );
  }

  if (toolName === 'pay_eip681') {
    return (
      <Card className="mt-2 bg-primary/10 border-primary/30">
        <CardHeader className="py-3">
          <CardTitle className="text-sm flex items-center gap-2 text-primary">
            <Shield className="h-4 w-4" />
            Payment Confirmed
          </CardTitle>
        </CardHeader>
        <CardContent className="py-2 space-y-2">
          <p className="font-semibold">{String(data.sent)}</p>
          <p className="text-sm text-muted-foreground">{String(data.message)}</p>
          {data.basescan && (
            <a
              href={String(data.basescan)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              View on Basescan <ExternalLink className="h-3 w-3" />
            </a>
          )}
          <div className="flex gap-4 pt-2 text-xs">
            <span className={data.quickbooks_synced ? 'text-primary' : 'text-muted-foreground'}>
              QuickBooks: {data.quickbooks_synced ? 'Synced' : 'Not synced'}
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <pre className="mt-2 p-2 bg-secondary/50 rounded text-xs overflow-auto">
      {JSON.stringify(result, null, 2)}
    </pre>
  );
}
