'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Shield, Key, Wallet, Receipt } from 'lucide-react';

export function SettingsPanel() {
  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h2 className="text-xl font-semibold">Settings</h2>
      
      {/* Wallet Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Wallet className="h-4 w-4 text-primary" />
            Wallet Configuration
          </CardTitle>
          <CardDescription>Configure your Base wallet for payments</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="wallet">Wallet Address</Label>
            <Input 
              id="wallet" 
              placeholder="0x..." 
              className="font-mono bg-secondary"
              disabled
            />
            <p className="text-xs text-muted-foreground">
              Set via WALLET_PRIVATE_KEY environment variable
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Voice Verification */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            Voice Verification
          </CardTitle>
          <CardDescription>ElevenLabs voice authentication settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="voice-id">Voice ID</Label>
            <Input 
              id="voice-id" 
              placeholder="Your ElevenLabs Voice ID" 
              className="bg-secondary"
              disabled
            />
            <p className="text-xs text-muted-foreground">
              Set via DEXTER_VOICE_ID environment variable
            </p>
          </div>
          <div className="space-y-2">
            <Label>Passphrase</Label>
            <div className="bg-secondary rounded-md px-3 py-2 text-sm">
              &quot;Armor up&quot;
            </div>
            <p className="text-xs text-muted-foreground">
              Say this phrase to authorize payments
            </p>
          </div>
        </CardContent>
      </Card>

      {/* QuickBooks */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Receipt className="h-4 w-4 text-primary" />
            QuickBooks Integration
          </CardTitle>
          <CardDescription>Automatic expense logging</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="qb-realm">Realm ID</Label>
              <Input 
                id="qb-realm" 
                placeholder="QB_REALM_ID" 
                className="bg-secondary"
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="qb-account">Expense Account</Label>
              <Input 
                id="qb-account" 
                placeholder="QB_EXPENSE_ACCOUNT_ID" 
                className="bg-secondary"
                disabled
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Configure via environment variables. Default category: MaShabak Ops
          </p>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Key className="h-4 w-4 text-primary" />
            Security Settings
          </CardTitle>
          <CardDescription>Payment limits and 2FA</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Max Transaction (No 2FA)</p>
              <p className="text-xs text-muted-foreground">Voice-only limit</p>
            </div>
            <span className="text-lg font-semibold text-primary">$500</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">EAS Attestations</p>
              <p className="text-xs text-muted-foreground">On-chain payment proofs</p>
            </div>
            <span className="text-sm text-primary">Enabled</span>
          </div>
        </CardContent>
      </Card>

      <div className="pt-4">
        <Button className="w-full" disabled>
          Save Changes
        </Button>
        <p className="text-xs text-center text-muted-foreground mt-2">
          Settings are managed via environment variables
        </p>
      </div>
    </div>
  );
}
