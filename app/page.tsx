'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/sidebar';
import { ChatInterface } from '@/components/chat-interface';
import { TransactionHistory } from '@/components/transaction-history';
import { SettingsPanel } from '@/components/settings-panel';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'chat' | 'history' | 'settings'>('chat');

  return (
    <div className="flex h-screen bg-background">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-14 border-b border-border flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <h2 className="font-medium">
              {activeTab === 'chat' && 'Voice-Verified Payments'}
              {activeTab === 'history' && 'Transaction History'}
              {activeTab === 'settings' && 'Settings'}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span className="text-muted-foreground">Base Mainnet</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'chat' && <ChatInterface />}
          {activeTab === 'history' && (
            <div className="h-full overflow-y-auto">
              <TransactionHistory />
            </div>
          )}
          {activeTab === 'settings' && (
            <div className="h-full overflow-y-auto">
              <SettingsPanel />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
