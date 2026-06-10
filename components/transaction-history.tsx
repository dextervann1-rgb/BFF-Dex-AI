'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink, Shield, Clock, Loader2 } from 'lucide-react';

interface Transaction {
  id: string;
  amount: number;
  token: string;
  to_address: string;
  tx_hash: string;
  status: 'confirmed' | 'pending' | 'failed';
  voice_verified: boolean;
  quickbooks_synced: boolean;
  created_at: string;
}

export function TransactionHistory() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/transactions?limit=50');
        
        if (!response.ok) {
          throw new Error('Failed to fetch transactions');
        }

        const result = await response.json();
        setTransactions(result.data || []);
        setError(null);
      } catch (err) {
        console.error('[BFFDex] Error fetching transactions:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();

    // Poll for new transactions every 10 seconds
    const interval = setInterval(fetchTransactions, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading transactions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="text-sm text-destructive">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-6">Transaction History</h2>
      
      <div className="space-y-4">
        {transactions.length > 0 ? (
          transactions.map((tx) => (
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
                    <span className="font-mono">{tx.to_address.slice(0, 10)}...{tx.to_address.slice(-8)}</span>
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
          ))
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p>No transactions yet</p>
            <p className="text-sm mt-1">Make your first voice-verified payment</p>
          </div>
        )}
      </div>
    </div>
  );
}
