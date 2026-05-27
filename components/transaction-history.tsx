'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink, Shield, Clock } from 'lucide-react';

// Mock transaction data - replace with real data fetching
const mockTransactions = [
  {
    id: '1',
    amount: 8.88,
    token: 'USDC',
    to_address: '0x1234...5678',
    tx_hash: '0xabc...def',
    status: 'confirmed' as const,
    voice_verified: true,
    quickbooks_synced: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    amount: 25.0,
    token: 'USDC',
    to_address: '0x9876...4321',
    tx_hash: '0x123...789',
    status: 'confirmed' as const,
    voice_verified: true,
    quickbooks_synced: true,
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
];

export function TransactionHistory() {
  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-6">Transaction History</h2>
      
      <div className="space-y-4">
        {mockTransactions.map((tx) => (
          <Card key={tx.id} className="bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${
                    tx.status === 'confirmed' ? 'bg-primary' : 
                    tx.status === 'pending' ? 'bg-warning' : 'bg-destructive'
                  }`} />
                  {tx.amount} {tx.token}
                </span>
                <span className="text-xs font-normal text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(tx.created_at).toLocaleDateString()}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">To</span>
                  <span className="font-mono">{tx.to_address}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">TX Hash</span>
                  <a
                    href={`https://basescan.org/tx/${tx.tx_hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-primary hover:underline flex items-center gap-1"
                  >
                    {tx.tx_hash.slice(0, 10)}... <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <div className="flex gap-4 pt-2 text-xs">
                  <span className={tx.voice_verified ? 'text-primary' : 'text-muted-foreground'}>
                    <Shield className="h-3 w-3 inline mr-1" />
                    Voice: {tx.voice_verified ? 'Verified' : 'No'}
                  </span>
                  <span className={tx.quickbooks_synced ? 'text-primary' : 'text-muted-foreground'}>
                    QB: {tx.quickbooks_synced ? 'Synced' : 'Pending'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {mockTransactions.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>No transactions yet</p>
            <p className="text-sm mt-1">Make your first voice-verified payment</p>
          </div>
        )}
      </div>
    </div>
  );
}
