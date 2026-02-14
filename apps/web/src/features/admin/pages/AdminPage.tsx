import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPatch } from '@/lib/apiClient';
import { cn } from '@/lib/cn';
import {
  Activity,
  AlertTriangle,
  DollarSign,
  Users,
  Key,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// ─── Types ──────────────────────────────────────────────────────────────────

interface SystemHealth {
  publishSuccessRate: number;
  publishedCount: number;
  failedCount: number;
  activeUsersToday: number;
  totalUsers: number;
  totalContent: number;
  costToday: number;
}

interface PublishError {
  id: string;
  userId: string;
  userEmail: string;
  contentItemId: string;
  contentType: string;
  platform: string;
  errorMessage: string | null;
  errorCode: string | null;
  attemptCount: number;
  createdAt: string;
  updatedAt: string;
}

interface CostByService {
  service: string;
  totalCost: number;
  requestCount: number;
}

interface CostByUser {
  userId: string;
  userEmail: string;
  displayName: string;
  subscriptionTier: string;
  totalCost: number;
  requestCount: number;
}

interface DailyTrend {
  date: string;
  totalCost: number;
  requestCount: number;
}

interface UserRow {
  id: string;
  email: string;
  displayName: string;
  role: string;
  subscriptionTier: string;
  createdAt: string;
}

interface ExpiringToken {
  id: string;
  userId: string;
  userEmail: string;
  platform: string;
  platformUsername: string;
  tokenExpiresAt: string | null;
  connectedAt: string;
}

// ─── Tab definitions ────────────────────────────────────────────────────────

const TABS = [
  { id: 'health', label: 'Health', icon: Activity },
  { id: 'errors', label: 'Errors', icon: AlertTriangle },
  { id: 'costs', label: 'Costs', icon: DollarSign },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'tokens', label: 'Tokens', icon: Key },
] as const;

type TabId = (typeof TABS)[number]['id'];

// ─── Main Component ─────────────────────────────────────────────────────────

export function AdminPage() {
  const [activeTab, setActiveTab] = useState<TabId>('health');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="size-6 text-primary" />
        <h1 className="text-2xl font-bold">Administration</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border bg-muted/50 p-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors',
              activeTab === tab.id
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <tab.icon className="size-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'health' && <HealthTab />}
      {activeTab === 'errors' && <ErrorsTab />}
      {activeTab === 'costs' && <CostsTab />}
      {activeTab === 'users' && <UsersTab />}
      {activeTab === 'tokens' && <TokensTab />}
    </div>
  );
}

// ─── Health Tab ─────────────────────────────────────────────────────────────

function HealthTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'health'],
    queryFn: () => apiGet<{ data: SystemHealth }>('/api/admin/health').then((r) => r.data),
  });

  if (isLoading) return <div className="text-muted-foreground">Loading...</div>;
  if (!data) return null;

  const stats = [
    { label: 'Publish Success Rate', value: `${data.publishSuccessRate}%`, accent: data.publishSuccessRate >= 90 },
    { label: 'Published (30d)', value: data.publishedCount.toLocaleString() },
    { label: 'Failed (30d)', value: data.failedCount.toLocaleString(), warn: data.failedCount > 0 },
    { label: 'Active Users Today', value: data.activeUsersToday.toLocaleString() },
    { label: 'Total Users', value: data.totalUsers.toLocaleString() },
    { label: 'Total Content', value: data.totalContent.toLocaleString() },
    { label: "Cost Today", value: `$${data.costToday.toFixed(2)}` },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((s) => (
        <div key={s.label} className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">{s.label}</p>
          <p className={cn('mt-1 text-2xl font-bold', s.accent && 'text-green-500', s.warn && 'text-red-500')}>
            {s.value}
          </p>
        </div>
      ))}
    </div>
  );
}

// ─── Errors Tab ─────────────────────────────────────────────────────────────

function ErrorsTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'errors'],
    queryFn: () =>
      apiGet<{ data: { rows: PublishError[]; total: number } }>('/api/admin/errors').then((r) => r.data),
  });

  if (isLoading) return <div className="text-muted-foreground">Loading...</div>;
  if (!data) return null;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{data.total} failed publish jobs</p>
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">User</th>
              <th className="px-4 py-3 text-left font-medium">Type</th>
              <th className="px-4 py-3 text-left font-medium">Platform</th>
              <th className="px-4 py-3 text-left font-medium">Error</th>
              <th className="px-4 py-3 text-left font-medium">Attempts</th>
              <th className="px-4 py-3 text-left font-medium">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.rows.map((err) => (
              <tr key={err.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 font-mono text-xs">{err.userEmail}</td>
                <td className="px-4 py-3">{err.contentType}</td>
                <td className="px-4 py-3 capitalize">{err.platform}</td>
                <td className="max-w-xs truncate px-4 py-3 text-red-500" title={err.errorMessage ?? ''}>
                  {err.errorMessage ?? 'Unknown'}
                </td>
                <td className="px-4 py-3 text-center">{err.attemptCount}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(err.updatedAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {data.rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No publishing errors
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Costs Tab ──────────────────────────────────────────────────────────────

function CostsTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'costs'],
    queryFn: () =>
      apiGet<{ data: { byService: CostByService[]; byUser: CostByUser[]; dailyTrend: DailyTrend[] } }>(
        '/api/admin/costs',
      ).then((r) => r.data),
  });

  if (isLoading) return <div className="text-muted-foreground">Loading...</div>;
  if (!data) return null;

  const totalCost = data.byService.reduce((sum, s) => sum + s.totalCost, 0);

  return (
    <div className="space-y-6">
      {/* Total + by service */}
      <div>
        <h3 className="mb-3 text-lg font-semibold">Cost by Service (30 days)</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border bg-card p-4">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="mt-1 text-2xl font-bold">${totalCost.toFixed(2)}</p>
          </div>
          {data.byService.map((s) => (
            <div key={s.service} className="rounded-xl border bg-card p-4">
              <p className="text-sm capitalize text-muted-foreground">{s.service}</p>
              <p className="mt-1 text-xl font-bold">${s.totalCost.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">{s.requestCount} requests</p>
            </div>
          ))}
        </div>
      </div>

      {/* Top users by cost */}
      <div>
        <h3 className="mb-3 text-lg font-semibold">Top Users by Cost</h3>
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium">User</th>
                <th className="px-4 py-3 text-left font-medium">Tier</th>
                <th className="px-4 py-3 text-right font-medium">Cost</th>
                <th className="px-4 py-3 text-right font-medium">Requests</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.byUser.map((u) => (
                <tr key={u.userId} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="font-medium">{u.displayName}</div>
                    <div className="text-xs text-muted-foreground">{u.userEmail}</div>
                  </td>
                  <td className="px-4 py-3 capitalize">{u.subscriptionTier}</td>
                  <td className="px-4 py-3 text-right font-mono">${u.totalCost.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">{u.requestCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Daily trend (simple text-based) */}
      <div>
        <h3 className="mb-3 text-lg font-semibold">Daily Trend</h3>
        <div className="max-h-64 overflow-y-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-muted/50">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Date</th>
                <th className="px-4 py-2 text-right font-medium">Cost</th>
                <th className="px-4 py-2 text-left font-medium">Bar</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.dailyTrend.map((d) => {
                const maxCost = Math.max(...data.dailyTrend.map((t) => t.totalCost), 0.01);
                const pct = (d.totalCost / maxCost) * 100;
                return (
                  <tr key={d.date}>
                    <td className="px-4 py-2 text-muted-foreground">{d.date}</td>
                    <td className="px-4 py-2 text-right font-mono">${d.totalCost.toFixed(2)}</td>
                    <td className="px-4 py-2">
                      <div className="h-4 rounded bg-primary/20" style={{ width: `${Math.max(pct, 2)}%` }}>
                        <div className="h-full rounded bg-primary" style={{ width: '100%' }} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Users Tab ──────────────────────────────────────────────────────────────

function UsersTab() {
  const [search, setSearch] = useState('');
  const [editingQuota, setEditingQuota] = useState<string | null>(null);
  const [creditsLimit, setCreditsLimit] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users', search],
    queryFn: () => {
      const params = search ? `?search=${encodeURIComponent(search)}` : '';
      return apiGet<{ data: { rows: UserRow[]; total: number } }>(`/api/admin/users${params}`).then(
        (r) => r.data,
      );
    },
  });

  const adjustMutation = useMutation({
    mutationFn: ({ userId, creditsLimit }: { userId: string; creditsLimit: number }) =>
      apiPatch(`/api/admin/users/${userId}/quota`, { creditsLimit }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setEditingQuota(null);
      setCreditsLimit('');
    },
  });

  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Search by email or name..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-sm rounded-lg border bg-background px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      />

      {isLoading && <div className="text-muted-foreground">Loading...</div>}

      {data && (
        <>
          <p className="text-sm text-muted-foreground">{data.total} users</p>
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">User</th>
                  <th className="px-4 py-3 text-left font-medium">Role</th>
                  <th className="px-4 py-3 text-left font-medium">Tier</th>
                  <th className="px-4 py-3 text-left font-medium">Signed Up</th>
                  <th className="px-4 py-3 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.rows.map((user) => (
                  <tr key={user.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="font-medium">{user.displayName}</div>
                      <div className="text-xs text-muted-foreground">{user.email}</div>
                    </td>
                    <td className="px-4 py-3 capitalize">{user.role}</td>
                    <td className="px-4 py-3 capitalize">{user.subscriptionTier}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      {editingQuota === user.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            value={creditsLimit}
                            onChange={(e) => setCreditsLimit(e.target.value)}
                            placeholder="Credits limit"
                            className="w-24 rounded border px-2 py-1 text-xs"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              adjustMutation.mutate({
                                userId: user.id,
                                creditsLimit: parseInt(creditsLimit),
                              })
                            }
                            disabled={!creditsLimit || adjustMutation.isPending}
                          >
                            Save
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingQuota(null)}>
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => setEditingQuota(user.id)}>
                          Adjust Quota
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Tokens Tab ─────────────────────────────────────────────────────────────

function TokensTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'tokens'],
    queryFn: () =>
      apiGet<{ data: ExpiringToken[] }>('/api/admin/tokens/expiring').then((r) => r.data),
  });

  if (isLoading) return <div className="text-muted-foreground">Loading...</div>;
  if (!data) return null;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {data.length} tokens expiring within 7 days
      </p>
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">User</th>
              <th className="px-4 py-3 text-left font-medium">Platform</th>
              <th className="px-4 py-3 text-left font-medium">Username</th>
              <th className="px-4 py-3 text-left font-medium">Expires</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.map((token) => {
              const isExpired = token.tokenExpiresAt && new Date(token.tokenExpiresAt) < new Date();
              return (
                <tr key={token.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono text-xs">{token.userEmail}</td>
                  <td className="px-4 py-3 capitalize">{token.platform}</td>
                  <td className="px-4 py-3">{token.platformUsername}</td>
                  <td className={cn('px-4 py-3', isExpired ? 'font-semibold text-red-500' : 'text-yellow-500')}>
                    {token.tokenExpiresAt
                      ? new Date(token.tokenExpiresAt).toLocaleDateString()
                      : 'N/A'}
                    {isExpired && ' (Expired)'}
                  </td>
                </tr>
              );
            })}
            {data.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                  No expiring tokens
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
