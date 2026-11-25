import { useState, type FormEvent } from 'react';
import { Check, Copy, Power, ShieldCheck } from 'lucide-react';
import type { EcosystemSnapshot, NovaAppRecord } from '../../../shared/novaPolicy.ts';
import { preScreenCompliance } from '../lib/novaLocalEngine.ts';

interface AppsPanelProps {
  snapshot: EcosystemSnapshot;
  appName: string;
  appCategory: string;
  appDescription: string;
  paymentAsset: string;
  submittingApp: boolean;
  onChangeAppName: (v: string) => void;
  onChangeAppCategory: (v: string) => void;
  onChangeAppDescription: (v: string) => void;
  onChangePaymentAsset: (v: string) => void;
  onSubmitApp: (e: FormEvent) => void;
  onToggleApp: (app: NovaAppRecord) => void;
}

export function AppsPanel({
  snapshot,
  appName,
  appCategory,
  appDescription,
  paymentAsset,
  submittingApp,
  onChangeAppName,
  onChangeAppCategory,
  onChangeAppDescription,
  onChangePaymentAsset,
  onSubmitApp,
  onToggleApp,
}: AppsPanelProps) {
  const [statusFilter, setStatusFilter] = useState<'all' | 'deployed' | 'halted' | 'rejected'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const appPreScan = preScreenCompliance(`${appName} ${appCategory} ${appDescription}`);

  const visibleApps = snapshot.apps.filter((app) =>
    statusFilter === 'all' ? true : app.status === statusFilter,
  );

  function handleCopyManifest(app: NovaAppRecord) {
    void navigator.clipboard?.writeText(app.manifestSnippet);
    setCopiedId(app.id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <form
        onSubmit={onSubmitApp}
        className="lg:col-span-5 rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4 h-fit"
      >
        <div>
          <h2 className="text-base font-semibold text-white">Autonomous App Builder</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Screened by Anti-Scam HyperScanner, RibaGuard AI, and NovaPurityEnforcer.
          </p>
          <p className="text-xs text-amber-300/90 mt-1.5">
            Forbidden: Lending with interest, Staking APY, Yield Farming, Leverage, Rug/Scam Specs
          </p>
        </div>

        <label className="block text-xs text-slate-300 space-y-1">
          <span>Application Name</span>
          <input
            type="text"
            value={appName}
            onChange={(e) => onChangeAppName(e.target.value)}
            placeholder="e.g. Nova Supply Chain Verifier"
            className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-white"
            required
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block text-xs text-slate-300 space-y-1">
            <span>Category</span>
            <select
              value={appCategory}
              onChange={(e) => onChangeAppCategory(e.target.value)}
              className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-white"
            >
              <option value="Commerce">Commerce</option>
              <option value="Infrastructure">Infrastructure</option>
              <option value="Supply Chain">Supply Chain</option>
              <option value="Governance">Governance</option>
            </select>
          </label>

          <label className="block text-xs text-slate-300 space-y-1">
            <span>Settlement Asset</span>
            <select
              value={paymentAsset}
              onChange={(e) => onChangePaymentAsset(e.target.value)}
              className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-white"
            >
              <option value="NVC">NVC (Fixed $3.14)</option>
              <option value="USDT">USDT (Volatile - Rejected)</option>
              <option value="BTC">BTC (External - Rejected)</option>
            </select>
          </label>
        </div>

        <label className="block text-xs text-slate-300 space-y-1">
          <span>Specification</span>
          <textarea
            rows={3}
            value={appDescription}
            onChange={(e) => onChangeAppDescription(e.target.value)}
            placeholder="Describe app capabilities..."
            className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-white"
            required
          />
        </label>

        {(appName || appDescription) && (
          <div
            className={`rounded-lg border px-3 py-2 text-xs flex items-center gap-2 ${
              appPreScan.passed
                ? 'border-emerald-800/40 bg-emerald-950/20 text-emerald-300'
                : 'border-rose-800/50 bg-rose-950/30 text-rose-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>{appPreScan.message}</span>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={submittingApp}
            className="flex-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm px-4 py-2.5 disabled:opacity-50 cursor-pointer"
          >
            {submittingApp ? 'Auditing & Building...' : 'Generate & Deploy NVC App'}
          </button>
          <button
            type="button"
            onClick={() => {
              onChangeAppName('Nova Lending APY');
              onChangeAppDescription('Lending NVC with 12% APY interest');
              onChangePaymentAsset('NVC');
            }}
            className="rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-medium px-3 py-2.5 cursor-pointer"
          >
            Test Riba App
          </button>
          <button
            type="button"
            onClick={() => {
              onChangeAppName('Double Your Money 1000x');
              onChangeAppDescription('1000x presale guaranteed profit rug pull pool');
              onChangePaymentAsset('NVC');
            }}
            className="rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-300 text-xs font-medium px-3 py-2.5 cursor-pointer"
          >
            Test Scam App
          </button>
        </div>

        <div className="pt-2 border-t border-slate-800 text-xs text-sky-300 flex items-center justify-between gap-2">
          <span>HyperScanner: 0 Scams Passed</span>
          <span className="tabular-nums font-medium">{snapshot.scamBlocked} blocked</span>
        </div>
      </form>

      <div className="lg:col-span-7 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-slate-400 tabular-nums">
            {visibleApps.length} of {snapshot.apps.length} app specifications
          </span>
          <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg">
            {(['all', 'deployed', 'halted', 'rejected'] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`px-2.5 py-1 rounded text-xs capitalize cursor-pointer ${
                  statusFilter === status
                    ? 'bg-amber-500 text-slate-950 font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {visibleApps.map((app) => (
          <div
            key={app.id}
            className="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-2.5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-xs text-slate-400">
                  {app.category} ·{' '}
                  <span
                    className={`font-medium capitalize ${
                      app.status === 'deployed'
                        ? 'text-emerald-300'
                        : app.status === 'halted'
                          ? 'text-amber-300'
                          : 'text-rose-300'
                    }`}
                  >
                    {app.status}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-white mt-0.5">{app.name}</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyManifest(app)}
                  className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-300 cursor-pointer"
                >
                  {copiedId === app.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copiedId === app.id ? 'Copied' : 'Copy Code'}
                </button>
                {app.status !== 'rejected' && (
                  <button
                    type="button"
                    onClick={() => onToggleApp(app)}
                    className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
                  >
                    <Power className="w-3 h-3" />
                    {app.status === 'halted' ? 'Resume' : 'Halt'}
                  </button>
                )}
              </div>
            </div>
            <p className="text-xs text-slate-300">{app.description}</p>
            <p className="text-xs text-slate-400">{app.complianceReason}</p>
            <pre className="rounded-lg bg-slate-950 border border-slate-800 p-3 text-xs font-mono text-slate-300 overflow-x-auto">
              {app.manifestSnippet}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}
