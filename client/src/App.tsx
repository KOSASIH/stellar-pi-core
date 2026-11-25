import { useCallback, useEffect, useState, type FormEvent } from 'react';
import {
  Activity,
  AlertTriangle,
  AppWindow,
  CheckCircle2,
  Cpu,
  Globe2,
  Lock,
  Power,
  Rocket,
  Scale,
  ShieldAlert,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import {
  formatMicronNova,
  formatUsd,
  isValidNovaValue,
  nvcToUsd,
  type EcosystemSnapshot,
  type NovaAppRecord,
  type NovaTransaction,
} from '../../shared/novaPolicy.ts';

type TabId = 'transactions' | 'apps' | 'oracle' | 'audit';

function SupernovaIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="w-5 h-5 text-amber-400"
    >
      <path
        d="M12 2L14.4 8.6L21 6.5L16.3 12L21 17.5L14.4 15.4L12 22L9.6 15.4L3 17.5L7.7 12L3 6.5L9.6 8.6L12 2Z"
        fill="currentColor"
        fillOpacity="0.9"
      />
      <circle cx="12" cy="12" r="2.6" className="fill-amber-200" />
    </svg>
  );
}

export default function App() {
  const [snapshot, setSnapshot] = useState<EcosystemSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('transactions');
  const [feedback, setFeedback] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  // Transaction form state
  const [sender, setSender] = useState('NVC-MINER-RASPI-09');
  const [recipient, setRecipient] = useState('NVC-MERCHANT-04');
  const [amount, setAmount] = useState('25');
  const [source, setSource] = useState('mining');
  const [memo, setMemo] = useState('Peer-to-peer equipment settlement');
  const [reportedValueUsd, setReportedValueUsd] = useState('3.14');
  const [submittingTx, setSubmittingTx] = useState(false);

  // App builder form state
  const [appName, setAppName] = useState('');
  const [appCategory, setAppCategory] = useState('Commerce');
  const [appDescription, setAppDescription] = useState('');
  const [paymentAsset, setPaymentAsset] = useState('NVC');
  const [submittingApp, setSubmittingApp] = useState(false);

  const loadSnapshot = useCallback(async () => {
    try {
      const res = await fetch('/api/ecosystem');
      if (!res.ok) throw new Error('Failed to load ecosystem state');
      const data: EcosystemSnapshot = await res.json();
      setSnapshot(data);
    } catch (err) {
      setFeedback({
        kind: 'error',
        text: err instanceof Error ? err.message : 'Unable to reach Stellar Nova Core backend.',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSnapshot();
  }, [loadSnapshot]);

  async function handleTransactionSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmittingTx(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/nova/transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender,
          recipient,
          amount: Number(amount),
          source,
          memo,
          reportedValueUsd: Number(reportedValueUsd),
        }),
      });
      const data = await res.json();
      if (data.snapshot) setSnapshot(data.snapshot);
      if (res.ok) {
        setFeedback({
          kind: 'success',
          text: `Transaction ${data.transaction.id} (${data.transaction.amount} NVC = ${formatUsd(nvcToUsd(data.transaction.amount))} USD · ${formatMicronNova(data.transaction.amount)}) accepted by AHI AI.`,
        });
      } else {
        setFeedback({
          kind: 'error',
          text: data.transaction?.reason || data.error || 'Transaction rejected by compliance filter.',
        });
      }
    } catch {
      setFeedback({ kind: 'error', text: 'Network error submitting NVC transaction.' });
    } finally {
      setSubmittingTx(false);
    }
  }

  async function handleAppSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmittingApp(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/apps/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: appName,
          category: appCategory,
          description: appDescription,
          paymentAsset,
        }),
      });
      const data = await res.json();
      if (data.snapshot) setSnapshot(data.snapshot);
      if (res.ok) {
        setFeedback({ kind: 'success', text: `App "${data.app.name}" verified and deployed.` });
        setAppName('');
        setAppDescription('');
      } else {
        setFeedback({
          kind: 'error',
          text: data.app?.complianceReason || data.error || 'App specification rejected.',
        });
      }
    } catch {
      setFeedback({ kind: 'error', text: 'Network error building NVC application.' });
    } finally {
      setSubmittingApp(false);
    }
  }

  async function handleToggleApp(app: NovaAppRecord) {
    const res = await fetch(`/api/apps/${app.id}/halt`, { method: 'POST' });
    const data = await res.json();
    if (data.snapshot) setSnapshot(data.snapshot);
  }

  async function handleOracleVerify(nodeId: string, value: number) {
    setFeedback(null);
    const res = await fetch('/api/oracle/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nodeId, reportedValueUsd: value }),
    });
    const data = await res.json();
    if (data.snapshot) setSnapshot(data.snapshot);
    setFeedback({
      kind: isValidNovaValue(value) ? 'success' : 'error',
      text: isValidNovaValue(value)
        ? `Oracle ${nodeId} confirmed $3.14 Nova Peg valuation.`
        : `Oracle ${nodeId} deviated (${formatUsd(value)}) and was flagged for community vote.`,
    });
  }

  async function handleRunAudit() {
    setFeedback(null);
    const res = await fetch('/api/governance/audit', { method: 'POST' });
    const data = await res.json();
    if (data.snapshot) setSnapshot(data.snapshot);
    setFeedback({
      kind: data.compliant ? 'success' : 'error',
      text: data.compliant
        ? 'MainnetGovernor audit passed across all ecosystem components.'
        : 'MainnetGovernor audit flagged oracle nodes requiring community vote.',
    });
  }

  async function handleLaunchMainnet() {
    setFeedback(null);
    const res = await fetch('/api/governance/mainnet-launch', { method: 'POST' });
    const data = await res.json();
    if (data.snapshot) setSnapshot(data.snapshot);
    setFeedback({
      kind: res.ok ? 'success' : 'error',
      text: res.ok ? 'MainnetGovernor launched Stellar Nova Core Mainnet.' : data.error,
    });
  }

  if (loading || !snapshot) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-300">
        Loading Stellar Nova Core Ecosystem...
      </div>
    );
  }

  const { constants, metrics } = snapshot;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/70 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-500/15 border border-amber-400/30 flex items-center justify-center">
              <SupernovaIcon />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-white">
                Stellar Nova Core — Ecosystem Console
              </h1>
              <p className="text-xs text-slate-400">
                Stablecoin-Only · Fixed Value {formatUsd(constants.fixedValueUsd)} · Gambling-Free · RIBA-FREE · 0% Interest
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium border ${
                snapshot.mainnetLaunched
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
              }`}
            >
              <Rocket className="w-3.5 h-3.5" />
              {snapshot.mainnetLaunched ? 'Mainnet Active' : 'Governor Pre-Launch'}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium bg-slate-800 text-slate-200 border border-slate-700">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              1 NVC = {formatUsd(constants.fixedValueUsd)}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {feedback && (
          <div
            role="alert"
            className={`flex items-center justify-between gap-3 px-4 py-3 rounded-lg border text-sm ${
              feedback.kind === 'success'
                ? 'bg-emerald-950/60 border-emerald-700/60 text-emerald-200'
                : 'bg-rose-950/60 border-rose-700/60 text-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.kind === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              ) : (
                <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
              )}
              <span>{feedback.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="text-xs opacity-70 hover:opacity-100"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* 5 Metric Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Fixed NVC Peg</span>
              <Scale className="w-4 h-4 text-amber-400" />
            </div>
            <div className="mt-2 text-2xl font-semibold tabular-nums text-white">
              {formatUsd(constants.fixedValueUsd)}
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Supply: {(constants.totalSupply / 1e9).toFixed(0)}B NVC · {constants.collateralRatio}x Collateral
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Nova Purity & Filter</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-2 text-2xl font-semibold tabular-nums text-white">
              {metrics.acceptedTransactions}{' '}
              <span className="text-sm font-normal text-slate-400">
                / {metrics.rejectedTransactions} blocked
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Allowed: mining, rewards, p2p, marketplace
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Nova-Exclusive Apps</span>
              <AppWindow className="w-4 h-4 text-sky-400" />
            </div>
            <div className="mt-2 text-2xl font-semibold tabular-nums text-white">
              {metrics.activeApps}
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Anti-gambling rule: {snapshot.rules.noGambling}
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Oracle & AHI AI Health</span>
              <Activity className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-2 text-2xl font-semibold tabular-nums text-white">
              {snapshot.aiHealthScore}%
            </div>
            <p className="mt-1 text-xs text-slate-400">
              {metrics.verifiedOracleNodes} verified · {metrics.isolatedOracleNodes} flagged nodes
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>RibaGuard AI: 0% Interest - Halal</span>
              <ShieldAlert className="w-4 h-4 text-amber-400" />
            </div>
            <div className="mt-2 text-2xl font-semibold tabular-nums text-white">
              {snapshot.ribaBlockedTransactions} blocked
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Halal - No Interest - No APY
            </p>
          </div>
        </section>

        {/* Navigation Tabs */}
        <nav className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
          {(
            [
              { id: 'transactions', label: 'Stablecoin & AHI AI Filter', icon: Cpu },
              { id: 'apps', label: 'Autonomous App Builder', icon: AppWindow },
              { id: 'oracle', label: 'Oracle & Mainnet Governor', icon: Globe2 },
              { id: 'audit', label: 'Immutable Audit Trail', icon: ShieldCheck },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* TAB 1: Stablecoin & AHI AI Filter */}
        {activeTab === 'transactions' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <form
              onSubmit={handleTransactionSubmit}
              className="lg:col-span-5 rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4 h-fit"
            >
              <div>
                <h2 className="text-base font-semibold text-white">
                  Submit NVC Stablecoin Transaction
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Screened in real time by AHI AI, NovaValuePolicy, NovaPurityEnforcer, and RibaGuard AI. 1 NVC = {constants.micronNovaPerNvc.toLocaleString()} Micron Nova.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block text-xs text-slate-300 space-y-1">
                  <span>Sender</span>
                  <input
                    type="text"
                    value={sender}
                    onChange={(e) => setSender(e.target.value)}
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-white"
                    required
                  />
                </label>
                <label className="block text-xs text-slate-300 space-y-1">
                  <span>Recipient</span>
                  <input
                    type="text"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-white"
                    required
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block text-xs text-slate-300 space-y-1">
                  <span>Amount (NVC)</span>
                  <input
                    type="number"
                    min="0.000001"
                    step="any"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-white"
                    required
                  />
                  {Number.isFinite(Number(amount)) && Number(amount) > 0 && (
                    <span className="block text-[11px] text-amber-300/90 tabular-nums">
                      = {formatMicronNova(Number(amount))}
                    </span>
                  )}
                </label>
                <label className="block text-xs text-slate-300 space-y-1">
                  <span>Coin Origin Source</span>
                  <select
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-white"
                  >
                    <option value="mining">mining (allowed)</option>
                    <option value="contribution_rewards">contribution_rewards (allowed)</option>
                    <option value="p2p">p2p (allowed)</option>
                    <option value="marketplace">marketplace (allowed)</option>
                    <option value="app">app (allowed)</option>
                    <option value="exchange">exchange (blacklisted)</option>
                    <option value="bought">bought (blacklisted)</option>
                  </select>
                </label>
              </div>

              <label className="block text-xs text-slate-300 space-y-1">
                <span>Reported Valuation (USD)</span>
                <input
                  type="number"
                  step="any"
                  value={reportedValueUsd}
                  onChange={(e) => setReportedValueUsd(e.target.value)}
                  className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-white"
                  required
                />
              </label>

              <label className="block text-xs text-slate-300 space-y-1">
                <span>Transaction Memo</span>
                <input
                  type="text"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="Describe purpose (gambling & riba keywords are auto-rejected)"
                  className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-white"
                />
              </label>

              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="submit"
                  disabled={submittingTx}
                  className="flex-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm px-4 py-2.5 disabled:opacity-50"
                >
                  {submittingTx ? 'Verifying...' : 'Validate & Submit NVC Transfer'}
                </button>
              </div>

              <div className="pt-2 border-t border-slate-800 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSource('exchange');
                    setMemo('External exchange liquidity deposit');
                  }}
                  className="text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Test Exchange Rejection
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSource('p2p');
                    setMemo('Online casino jackpot entry');
                  }}
                  className="text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Test Gambling Filter
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSource('p2p');
                    setReportedValueUsd('3.14');
                    setMemo('Lending 100 NVC with 10% interest APY');
                  }}
                  className="text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300"
                >
                  Test Riba Rejection
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSource('mining');
                    setReportedValueUsd('3.14');
                    setMemo('Node mining reward settlement');
                  }}
                  className="text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Reset Valid Preset
                </button>
              </div>

              <div className="rounded-lg border border-emerald-800/40 bg-emerald-950/20 px-3 py-2 text-xs text-emerald-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>RibaGuard AI Active - 0% Interest Enforced</span>
              </div>
            </form>

            <div className="lg:col-span-7 rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-white">Ledger & Filter Verdicts</h2>
                <span className="text-xs text-slate-400">
                  {snapshot.transactions.length} recorded · SCP Consensus
                </span>
              </div>

              <div className="space-y-3 max-h-[540px] overflow-y-auto pr-1">
                {snapshot.transactions.map((tx: NovaTransaction) => (
                  <div
                    key={tx.id}
                    className={`rounded-lg border p-3.5 ${
                      tx.status === 'accepted'
                        ? 'border-emerald-800/50 bg-emerald-950/20'
                        : 'border-rose-800/50 bg-rose-950/20'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {tx.status === 'accepted' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-400" />
                        )}
                        <span className="font-mono text-xs text-slate-300">{tx.id}</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {tx.source}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded font-medium ${
                            tx.status === 'accepted'
                              ? 'bg-emerald-500/15 text-emerald-300'
                              : 'bg-rose-500/15 text-rose-300'
                          }`}
                        >
                          {tx.status}
                        </span>
                      </div>
                      <div className="text-right tabular-nums">
                        <span className="font-semibold text-xs sm:text-sm text-white">
                          {tx.amount} NVC = {formatUsd(tx.amount * tx.reportedValueUsd)} USD · {formatMicronNova(tx.amount)}
                        </span>
                      </div>
                    </div>
                    <p className="mt-1.5 text-xs text-slate-300">
                      {tx.sender} → {tx.recipient} · {tx.memo}
                    </p>
                    <p
                      className={`mt-1 text-xs ${
                        tx.status === 'accepted' ? 'text-emerald-300' : 'text-rose-300'
                      }`}
                    >
                      {tx.reason}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Autonomous App Builder */}
        {activeTab === 'apps' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <form
              onSubmit={handleAppSubmit}
              className="lg:col-span-5 rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4 h-fit"
            >
              <div>
                <h2 className="text-base font-semibold text-white">
                  Autonomous App Builder
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Generates Nova-exclusive internal applications. Gambling and non-NVC assets are strictly blocked.
                </p>
                <p className="text-xs text-amber-300/90 mt-1.5">
                  Forbidden: Lending with interest, Staking APY, Yield Farming, Leverage
                </p>
              </div>

              <label className="block text-xs text-slate-300 space-y-1">
                <span>Application Name</span>
                <input
                  type="text"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
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
                    onChange={(e) => setAppCategory(e.target.value)}
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
                    onChange={(e) => setPaymentAsset(e.target.value)}
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
                  onChange={(e) => setAppDescription(e.target.value)}
                  placeholder="Describe app capabilities..."
                  className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-white"
                  required
                />
              </label>

              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  disabled={submittingApp}
                  className="flex-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm px-4 py-2.5 disabled:opacity-50"
                >
                  {submittingApp ? 'Auditing & Building...' : 'Generate & Deploy NVC App'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAppName('Nova Lending APY');
                    setAppDescription('Lending NVC with 12% APY interest');
                    setPaymentAsset('NVC');
                  }}
                  className="rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-medium px-3 py-2.5"
                >
                  Test Riba App
                </button>
              </div>
            </form>

            <div className="lg:col-span-7 space-y-3">
              {snapshot.apps.map((app) => (
                <div
                  key={app.id}
                  className="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-2.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-semibold text-white">{app.name}</h3>
                      <p className="text-xs text-slate-400">{app.category}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded font-medium ${
                          app.status === 'deployed'
                            ? 'bg-emerald-500/15 text-emerald-300'
                            : app.status === 'halted'
                              ? 'bg-amber-500/15 text-amber-300'
                              : 'bg-rose-500/15 text-rose-300'
                        }`}
                      >
                        {app.status}
                      </span>
                      {app.status !== 'rejected' && (
                        <button
                          type="button"
                          onClick={() => handleToggleApp(app)}
                          className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
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
        )}

        {/* TAB 3: Global Oracle & Mainnet Governor */}
        {activeTab === 'oracle' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
              <div>
                <h2 className="text-base font-semibold text-white">
                  Global NOVA Oracle Compliance Verifier
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Nodes reporting any value other than $3.14 are flagged for community vote.
                </p>
              </div>

              <div className="space-y-3">
                {snapshot.oracleNodes.map((node) => (
                  <div
                    key={node.id}
                    className="rounded-lg border border-slate-800 bg-slate-950/70 p-4 flex flex-wrap items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-slate-300">{node.id}</span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded font-medium ${
                            node.status === 'verified'
                              ? 'bg-emerald-500/15 text-emerald-300'
                              : 'bg-rose-500/15 text-rose-300'
                          }`}
                        >
                          {node.status}
                        </span>
                      </div>
                      <p className="text-sm text-white mt-1">{node.region}</p>
                      <p className="text-xs text-slate-400 tabular-nums">
                        Reported: {formatUsd(node.reportedValueUsd)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOracleVerify(node.id, 3.14)}
                        className="text-xs px-3 py-1.5 rounded bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-600/40 text-emerald-300"
                      >
                        Sync $3.14
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOracleVerify(node.id, 3.20)}
                        className="text-xs px-3 py-1.5 rounded bg-rose-600/20 hover:bg-rose-600/30 border border-rose-600/40 text-rose-300"
                      >
                        Simulate Deviation
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5 rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4 h-fit">
              <div>
                <h2 className="text-base font-semibold text-white">
                  Mainnet Governor & Ethical Rules
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Audits all ecosystem components prior to mainnet activation.
                </p>
              </div>

              <dl className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-lg bg-slate-950 border border-slate-800 p-3">
                  <dt className="text-slate-400">Nova Exclusivity</dt>
                  <dd className="mt-1 font-medium text-white">{snapshot.rules.novaExclusivity}</dd>
                </div>
                <div className="rounded-lg bg-slate-950 border border-slate-800 p-3">
                  <dt className="text-slate-400">No Gambling</dt>
                  <dd className="mt-1 font-medium text-emerald-300">{snapshot.rules.noGambling}</dd>
                </div>
                <div className="rounded-lg bg-slate-950 border border-slate-800 p-3">
                  <dt className="text-slate-400">No Riba</dt>
                  <dd className="mt-1 font-medium text-emerald-300">{snapshot.rules.noRiba}</dd>
                </div>
                <div className="rounded-lg bg-slate-950 border border-slate-800 p-3">
                  <dt className="text-slate-400">Ethical AI Mode</dt>
                  <dd className="mt-1 font-medium text-white">{snapshot.rules.ethicalAi}</dd>
                </div>
                <div className="rounded-lg bg-slate-950 border border-slate-800 p-3">
                  <dt className="text-slate-400">Founder Policy</dt>
                  <dd className="mt-1 font-medium text-white">
                    {snapshot.rules.founderAccountability}
                  </dd>
                </div>
                <div className="rounded-lg bg-slate-950 border border-slate-800 p-3">
                  <dt className="text-slate-400">Sharia Compliant</dt>
                  <dd className="mt-1 font-medium text-emerald-300">
                    {snapshot.rules.shariaCompliant}
                  </dd>
                </div>
              </dl>

              {metrics.isolatedOracleNodes > 0 && (
                <div className="rounded-lg border border-amber-700/50 bg-amber-950/30 p-3 text-xs text-amber-200 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>
                    {metrics.isolatedOracleNodes} isolated node(s) must be restored to $3.14 before mainnet launch.
                  </span>
                </div>
              )}

              <div className="flex flex-col gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleRunAudit}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-sm font-medium text-white px-4 py-2.5"
                >
                  Run Ecosystem Compliance Audit
                </button>
                <button
                  type="button"
                  onClick={handleLaunchMainnet}
                  disabled={snapshot.mainnetLaunched}
                  className="w-full rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm px-4 py-2.5 disabled:opacity-50"
                >
                  {snapshot.mainnetLaunched ? 'Mainnet Launched' : 'Execute Mainnet Launch'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Immutable Audit Trail */}
        {activeTab === 'audit' && (
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">
                SHA-256 Audit Trail Logger
              </h2>
              <span className="text-xs text-slate-400">{snapshot.auditLog.length} entries</span>
            </div>
            <div className="space-y-2 max-h-[540px] overflow-y-auto pr-1">
              {snapshot.auditLog.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-lg border border-slate-800 bg-slate-950/70 p-3 flex flex-col gap-1"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-amber-300">{entry.module}</span>
                      <span className="font-mono text-slate-400">{entry.action}</span>
                    </div>
                    <span className="text-slate-500">
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-200">{entry.detail}</p>
                  <p className="font-mono text-[11px] text-slate-500 truncate">
                    sha256:{entry.hash}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
