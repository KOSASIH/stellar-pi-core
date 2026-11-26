import { useState, type FormEvent } from 'react';
import { Bot, Brain, Eye, Flame, Lock, Network, Scale, Shield, ShieldCheck, Zap } from 'lucide-react';
import { NovaPolicy, type EcosystemSnapshot } from '../../../shared/novaPolicy.ts';
import { safeFetchJson } from '../lib/novaLocalEngine.ts';
import { NovaHyperMindV2Section } from './NovaHyperMindV2Section.tsx';

interface HyperMindPanelProps {
  snapshot: EcosystemSnapshot;
  selectedCitizenId: string;
  proposalText: string;
  votePrediction: string | null;
  onChangeSelectedCitizenId: (id: string) => void;
  onChangeProposalText: (v: string) => void;
  onPredictGovernance: (e: FormEvent) => void;
  onSimulateWhaleAttack: () => void;
  onSimulateScamApp: () => void;
  onSimulateOracleManipulation: () => void;
  onSelfHealNetwork: () => void;
  onSimulatePlutocracyAttack: () => void;
  onSimulateWasteAttack: () => void;
  onClaimWorkTask: (taskId: string) => void;
  onRunFailureScan: () => void;
}

function getHyperModuleIcon(id: string) {
  switch (id) {
    case 'oracle-shield':
      return Eye;
    case 'whale-sybil-guard':
      return Shield;
    case 'scam-hyperscanner':
      return Bot;
    case 'hyper-compliance':
      return ShieldCheck;
    case 'self-healing-network':
      return Network;
    case 'predictive-governance':
      return Brain;
    default:
      return Lock;
  }
}

export function HyperMindPanel({
  snapshot,
  selectedCitizenId,
  proposalText,
  votePrediction,
  onChangeSelectedCitizenId,
  onChangeProposalText,
  onPredictGovernance,
  onSimulateWhaleAttack,
  onSimulateScamApp,
  onSimulateOracleManipulation,
  onSelfHealNetwork,
  onSimulatePlutocracyAttack,
  onSimulateWasteAttack,
  onClaimWorkTask,
  onRunFailureScan,
}: HyperMindPanelProps) {
  const [logSeverityFilter, setLogSeverityFilter] = useState<'all' | 'blocked' | 'predicted' | 'healed'>('all');
  const [checkWallet, setCheckWallet] = useState('NVC-MINER-RASPI-09');
  const [checkAmount, setCheckAmount] = useState('12000000');
  const [whaleResult, setWhaleResult] = useState<{ allowed: boolean; reason: string } | null>(null);

  const filteredLogs = snapshot.hyperMindLog.filter((entry) =>
    logSeverityFilter === 'all' ? true : entry.severity === logSeverityFilter,
  );

  async function handleRunWhaleCapTest(e: FormEvent) {
    e.preventDefault();
    const numericAmt = Number(checkAmount);
    const res = await safeFetchJson<{ allowed: boolean; reason: string }>('/api/hyper/whale-check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallet: checkWallet, amount: numericAmt }),
    });
    if (res.data && typeof res.data.allowed === 'boolean') {
      setWhaleResult(res.data);
      return;
    }
    const existing =
      snapshot.citizens.find((c) => c.id.toLowerCase() === checkWallet.trim().toLowerCase())?.balanceNvc || 0;
    const projected = existing + (Number.isFinite(numericAmt) ? numericAmt : 0);
    if (!Number.isFinite(numericAmt) || numericAmt <= 0) {
      setWhaleResult({ allowed: false, reason: 'Enter a valid positive NVC amount.' });
    } else if (projected > NovaPolicy.maxWalletHoldingNvc) {
      setWhaleResult({
        allowed: false,
        reason: `Anti-Whale HyperGuard: Projected holding ${projected.toLocaleString()} NVC exceeds 0.01% max wallet cap (${NovaPolicy.maxWalletHoldingNvc.toLocaleString()} NVC).`,
      });
    } else {
      setWhaleResult({
        allowed: true,
        reason: `HyperGuard Clear: Projected holding ${projected.toLocaleString()} NVC is within 0.01% fair distribution cap.`,
      });
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-amber-500/30 bg-slate-900 p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-semibold text-white">
              Hyper-Intelligence Command Center (NovaHyperMind v2)
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Total Threats Blocked:{' '}
            <span className="text-amber-300 font-semibold tabular-nums">
              {snapshot.threatsBlocked.toLocaleString()}
            </span>{' '}
            · Network Health: {snapshot.networkHealth}% - Self-Healing Active · Stabilizer:{' '}
            {snapshot.stabilizerStatus} - External Volatility BLOCKED
          </p>
        </div>

        {/* 100% Local State Simulation Controls */}
        <div className="flex flex-wrap gap-2 relative z-10">
          <button
            type="button"
            onClick={onSimulateWhaleAttack}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 border border-rose-400/50 text-white text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0 transition-colors"
          >
            <Shield className="w-3.5 h-3.5" />
            Simulate Whale Attack
          </button>
          <button
            type="button"
            onClick={onSimulateScamApp}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 border border-orange-400/50 text-white text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0 transition-colors"
          >
            <Bot className="w-3.5 h-3.5" />
            Simulate Scam App
          </button>
          <button
            type="button"
            onClick={onSimulateOracleManipulation}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 border border-sky-400/50 text-white text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            Simulate Oracle Manipulation
          </button>
          <button
            type="button"
            onClick={onSelfHealNetwork}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 border border-emerald-400/50 text-white text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0 transition-colors"
          >
            <Zap className="w-3.5 h-3.5" />
            Trigger Self-Heal
          </button>
          <button
            type="button"
            onClick={onSimulatePlutocracyAttack}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 border border-amber-400/50 text-slate-950 text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0 transition-colors"
          >
            <Scale className="w-3.5 h-3.5" />
            Simulate Plutocracy Attack
          </button>
          <button
            type="button"
            onClick={onSimulateWasteAttack}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-red-700 hover:bg-red-600 border border-red-400/50 text-white text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0 transition-colors"
          >
            <Flame className="w-3.5 h-3.5" />
            Simulate Waste Attack
          </button>
        </div>
      </div>

      {/* NovaHyperMind v2 Panels: PoUW, Anti-Plutocracy, Adaptive Consensus, Failure Prevention, Real Work Ledger */}
      <NovaHyperMindV2Section
        snapshot={snapshot}
        selectedCitizenId={selectedCitizenId}
        onChangeSelectedCitizenId={onChangeSelectedCitizenId}
        onClaimWorkTask={onClaimWorkTask}
        onRunFailureScan={onRunFailureScan}
      />

      {/* 7 Hyper-Intelligence AI Module Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {snapshot.hyperModules.map((mod) => {
          const Icon = getHyperModuleIcon(mod.id);
          return (
            <div
              key={mod.id}
              className="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-2.5 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2 text-xs text-emerald-300">
                  <span className="font-medium">{mod.status}</span>
                  <span className="tabular-nums font-medium">Health: {mod.health}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-amber-400 shrink-0" />
                  <h3 className="text-sm font-semibold text-white">{mod.name}</h3>
                </div>
                <p className="text-xs text-slate-400">{mod.description}</p>
              </div>
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs tabular-nums">
                <span className="text-slate-400">Blocked</span>
                <strong className="text-white font-mono">{mod.threatsBlocked.toLocaleString()}</strong>
              </div>
            </div>
          );
        })}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Network className="w-4 h-4 text-amber-400" />
              <h3 className="text-base font-semibold text-white">HyperMind Live Log</h3>
            </div>
            <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-lg">
              {(['all', 'blocked', 'predicted', 'healed'] as const).map((sev) => (
                <button
                  key={sev}
                  type="button"
                  onClick={() => setLogSeverityFilter(sev)}
                  className={`px-2 py-0.5 rounded text-xs capitalize cursor-pointer ${
                    logSeverityFilter === sev ? 'bg-amber-500 text-slate-950 font-semibold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-slate-800/80 max-h-[380px] overflow-y-auto pr-1">
            {filteredLogs.map((entry) => (
              <div key={entry.id} className="py-3 first:pt-1 last:pb-1 text-xs space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`font-semibold ${
                      entry.severity === 'blocked'
                        ? 'text-rose-300'
                        : entry.severity === 'healed'
                          ? 'text-emerald-300'
                          : 'text-amber-300'
                    }`}
                  >
                    {entry.module}
                  </span>
                  <span className="text-slate-500 tabular-nums">
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-slate-200">{entry.decision}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5 space-y-5">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
            <div>
              <h3 className="text-base font-semibold text-white">
                Predictive Governance AI (Quadratic 1-KYC Vote)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Whale-proof voting predictor: sqrt(UsefulWork × Reputation × 1-KYC).
              </p>
            </div>

            <form onSubmit={onPredictGovernance} className="space-y-3">
              <label className="block text-xs text-slate-300 space-y-1">
                <span>Proposal to Forecast</span>
                <input
                  type="text"
                  value={proposalText}
                  onChange={(e) => onChangeProposalText(e.target.value)}
                  className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-white"
                  required
                />
              </label>
              <button
                type="submit"
                className="w-full rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm px-4 py-2 cursor-pointer"
              >
                Predict Community Decision
              </button>
            </form>

            {votePrediction && (
              <div className="rounded-lg border border-amber-700/40 bg-amber-950/20 p-3 text-xs text-amber-200">
                {votePrediction}
              </div>
            )}

            <div className="pt-2 border-t border-slate-800 text-xs text-slate-400 space-y-1">
              <p>HyperScanner: 0 Scams Passed ({snapshot.scamBlocked} scam specs blocked)</p>
              <p>Banned Scam Creators: {snapshot.bannedCreators.join(', ')}</p>
            </div>
          </div>

          <form
            onSubmit={handleRunWhaleCapTest}
            className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-3"
          >
            <div>
              <h3 className="text-sm font-semibold text-white">Anti-Whale Wallet Cap Tester (0.01%)</h3>
              <p className="text-xs text-slate-400">
                Verify any wallet holding against the 10,000,000 NVC ceiling.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={checkWallet}
                onChange={(e) => setCheckWallet(e.target.value)}
                placeholder="Wallet ID"
                className="rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-xs font-mono text-white"
                required
              />
              <input
                type="number"
                value={checkAmount}
                onChange={(e) => setCheckAmount(e.target.value)}
                placeholder="NVC amount"
                className="rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-xs tabular-nums text-white"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-white py-2 cursor-pointer"
            >
              Verify 0.01% Max Wallet Cap
            </button>
            {whaleResult && (
              <div
                className={`rounded-lg border px-3 py-2 text-xs ${
                  whaleResult.allowed
                    ? 'border-emerald-700/50 bg-emerald-950/20 text-emerald-200'
                    : 'border-rose-700/50 bg-rose-950/30 text-rose-200'
                }`}
              >
                {whaleResult.reason}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

