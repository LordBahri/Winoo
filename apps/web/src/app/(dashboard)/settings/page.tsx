'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, Key, Bell, Globe, Shield, Palette, Check } from 'lucide-react';
import { useTheme } from '@/app/providers';

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-8 py-4">
      <div className="min-w-0">
        <p className="text-[13px] font-medium">{label}</p>
        {description && <p className="mt-0.5 text-[12px] text-muted-foreground">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Toggle({ defaultOn = false, label }: { defaultOn?: boolean; label?: string }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <button
      onClick={() => setOn(!on)}
      className={`relative h-5 w-9 rounded-full transition-colors ${on ? 'bg-primary' : 'bg-border'}`}
      aria-label={label}
    >
      <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-4' : ''}`} />
    </button>
  );
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Manage platform configuration and preferences</p>
        </div>
        <Button size="sm" onClick={handleSave} className="gap-1.5">
          {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {saved ? 'Saved!' : 'Save Changes'}
        </Button>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <div className="rounded-xl border bg-card shadow-sm">
            <div className="p-5 pb-0">
              <p className="text-[13px] font-semibold">Platform Settings</p>
            </div>
            <div className="px-5 divide-y">
              <SettingRow label="Platform name" description="Displayed across the admin UI">
                <Input defaultValue="PetID" className="w-48 h-8 text-sm" />
              </SettingRow>
              <SettingRow label="Support email" description="Shown to end users in emails">
                <Input defaultValue="support@petid.app" className="w-48 h-8 text-sm" />
              </SettingRow>
              <SettingRow label="Default country" description="Used for new tag activations">
                <Input defaultValue="France" className="w-48 h-8 text-sm" />
              </SettingRow>
              <SettingRow label="Maintenance mode" description="Blocks all public API access">
                <Toggle defaultOn={false} label="Maintenance mode" />
              </SettingRow>
            </div>
          </div>

          <div className="mt-4 rounded-xl border bg-card shadow-sm">
            <div className="p-5 pb-0">
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-muted-foreground" />
                <p className="text-[13px] font-semibold">Appearance</p>
              </div>
            </div>
            <div className="px-5 divide-y">
              <SettingRow label="Color theme" description="Admin dashboard appearance">
                <div className="flex gap-2">
                  {['light', 'dark'].map((t) => (
                    <button
                      key={t}
                      onClick={() => setTheme(t)}
                      className={`flex h-8 items-center gap-2 rounded-md border px-3 text-[12px] font-medium capitalize transition-colors ${theme === t ? 'border-primary bg-primary/10 text-primary' : 'hover:bg-accent'}`}
                    >
                      {theme === t && <Check className="h-3 w-3" />}
                      {t}
                    </button>
                  ))}
                </div>
              </SettingRow>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="security">
          <div className="rounded-xl border bg-card shadow-sm">
            <div className="p-5 pb-0">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <p className="text-[13px] font-semibold">Security Policies</p>
              </div>
            </div>
            <div className="px-5 divide-y">
              <SettingRow label="Two-factor auth required" description="Force 2FA for all admin accounts">
                <Toggle defaultOn={true} />
              </SettingRow>
              <SettingRow label="Session timeout" description="Inactivity timeout for admin sessions">
                <div className="flex items-center gap-2">
                  <Input defaultValue="15" className="w-16 h-8 text-sm text-center" />
                  <span className="text-[12px] text-muted-foreground">minutes</span>
                </div>
              </SettingRow>
              <SettingRow label="IP allowlist" description="Restrict admin access to specific IPs">
                <Toggle defaultOn={false} />
              </SettingRow>
              <SettingRow label="Audit logging" description="Log all admin actions to audit trail">
                <Toggle defaultOn={true} />
              </SettingRow>
              <SettingRow label="Failed login lockout" description="Lock account after N failed attempts">
                <div className="flex items-center gap-2">
                  <Input defaultValue="5" className="w-16 h-8 text-sm text-center" />
                  <span className="text-[12px] text-muted-foreground">attempts</span>
                </div>
              </SettingRow>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="notifications">
          <div className="rounded-xl border bg-card shadow-sm">
            <div className="p-5 pb-0">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <p className="text-[13px] font-semibold">Alert Preferences</p>
              </div>
            </div>
            <div className="px-5 divide-y">
              {[
                { label: 'Lost pet alerts', description: 'Notify when a pet is reported lost', on: true },
                { label: 'New user registrations', description: 'Notify on new signups', on: false },
                { label: 'Subscription changes', description: 'New plans, upgrades, and cancellations', on: true },
                { label: 'Tag deactivations', description: 'Bulk tag deactivation alerts', on: true },
                { label: 'System errors', description: 'API errors and service disruptions', on: true },
                { label: 'Weekly digest', description: 'Sunday summary of platform metrics', on: true },
              ].map(({ label, description, on }) => (
                <SettingRow key={label} label={label} description={description}>
                  <Toggle defaultOn={on} />
                </SettingRow>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="api">
          <div className="rounded-xl border bg-card shadow-sm">
            <div className="p-5 pb-0">
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4 text-muted-foreground" />
                <p className="text-[13px] font-semibold">API Keys</p>
              </div>
            </div>
            <div className="p-5 space-y-3">
              {[
                { name: 'Production key', key: 'pk_live_••••••••••••••••••••••••4a2f', created: 'Jan 12, 2024', status: 'active' },
                { name: 'Staging key', key: 'pk_test_••••••••••••••••••••••••9b1c', created: 'Mar 5, 2024', status: 'active' },
                { name: 'Webhook secret', key: 'whsec_••••••••••••••••••••••••7d3e', created: 'Jan 12, 2024', status: 'active' },
              ].map(({ name, key, created, status }) => (
                <div key={name} className="flex items-center gap-4 rounded-lg border bg-muted/30 p-4">
                  <div className="flex-1">
                    <p className="text-[13px] font-medium">{name}</p>
                    <p className="mt-0.5 font-mono text-[12px] text-muted-foreground">{key}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground/60">Created {created}</p>
                  </div>
                  <Badge variant="success">Active</Badge>
                  <Button variant="outline" size="sm" className="h-7 text-[12px]">Rotate</Button>
                </div>
              ))}
              <Button variant="outline" size="sm" className="w-full mt-2">
                + Generate new key
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
