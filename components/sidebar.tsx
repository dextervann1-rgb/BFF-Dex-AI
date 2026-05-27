'use client';

import { Shield, Wallet, Receipt, Settings, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  activeTab: 'chat' | 'history' | 'settings';
  onTabChange: (tab: 'chat' | 'history' | 'settings') => void;
}

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const navItems = [
    { id: 'chat' as const, icon: Shield, label: 'Pay' },
    { id: 'history' as const, icon: Receipt, label: 'History' },
    { id: 'settings' as const, icon: Settings, label: 'Settings' },
  ];

  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-semibold text-sidebar-foreground">BFFDex AI</h1>
            <p className="text-xs text-muted-foreground">Voice-Verified Payments</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => (
          <Button
            key={item.id}
            variant={activeTab === item.id ? 'secondary' : 'ghost'}
            className={`w-full justify-start gap-3 ${
              activeTab === item.id 
                ? 'bg-sidebar-accent text-sidebar-accent-foreground' 
                : 'text-muted-foreground hover:text-sidebar-foreground'
            }`}
            onClick={() => onTabChange(item.id)}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Button>
        ))}
      </nav>

      {/* Wallet Status */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="bg-sidebar-accent rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Wallet</span>
          </div>
          <p className="text-xs text-muted-foreground truncate">
            Connected to Base
          </p>
        </div>
      </div>

      {/* Integrations */}
      <div className="p-4 border-t border-sidebar-border">
        <h3 className="text-xs font-medium text-muted-foreground mb-3">Integrations</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">QuickBooks</span>
            <Link2 className="h-4 w-4 text-primary" />
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">EAS</span>
            <Link2 className="h-4 w-4 text-primary" />
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">ElevenLabs</span>
            <Link2 className="h-4 w-4 text-primary" />
          </div>
        </div>
      </div>
    </aside>
  );
}
