import { useState, type FormEvent } from 'react';
import {
  Activity,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Cpu,
  Pickaxe,
  Plus,
  Scale,
  ShieldAlert,
  ShieldCheck,
  Users,
} from 'lucide-react';
import {
  computePouwRewardNvc,
  computeQuadraticVotingPower,
  formatMicronNova,
  type EcosystemSnapshot,
  type WorkProofRecord,
  type WorkProofType,
} from '../../../shared/novaPolicy.ts';
import { createLocalFallbackSnapshot } from '../lib/novaLocalEngine.ts';

interface NovaHyperMindV2SectionProps {
  snapshot: EcosystemSnapshot;
  selectedCitizenId: string;
  onChangeSelectedCitizenId: (id: string) => void;
  onClaimWorkTask: (taskId: string) => void;
  onCreateWorkTask: (params: {
    title: string;
    workType: WorkProofType;
    offeredRewardNvc: number;
  }) => void;
  onAdaptConsensus: (
    scenario: 'tps-drop' | 'malicious-node' | 'healthy-1000' | 'restore-normal',
  ) => void;
  onRunFailureScan: () => void;
}

const WORK_TYPES: WorkProofType[] = [
  'Oracle Check',
  'Validating Halal TX',
  'HyperScanner Check',
  'Citizen Storage',
  'Self-Heal Task',
];

export function NovaHyperMindV2Section({
  snapshot,
  selectedCitizenId,
  onChangeSelectedCitizenId,
  onClaimWorkTask,
  onCreateWorkTask,
  onAdaptConsensus,
  onRunFailureScan,
}: NovaHyperMindV2SectionProps) {
  const fallback = createLocalFallbackSnapshot();
  const pouw = snapshot.pouw ?? fallback.pouw!;
  const antiPlutocracy = snapshot.antiPlutocracy ?? fallback.antiPlutocracy!;
  const adaptive = snapshot.adaptiveConsensus ?? fallback.adaptiveConsensus!;
  const failure = snapshot.failurePrevention ?? fallback.failurePrevention!;

  const [demoBalanceNvc, setDemoBalanceNvc] = useState(100);
  const [demoWorkScore, setDemoWorkScore] = useState(90);
  const [inspectedProof, setInspectedProof] = useState<WorkProofRecord | null>(null);
  const [showAdaptiveLog, setShowAdaptiveLog] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskType, setNewTaskType] = useState<WorkProofType>('Oracle Check');
  const [newTaskReward, setNewTaskReward] = useState('0.90');

  const citizenPreview = computePouwRewardNvc({
    usefulWorkScore: demoWorkScore,
    uptimeRatio: 1,
    purityScore: 1,
    walletHoldingNvc: demoBalanceNvc,
  });
  const nearCapPreview = computePouwRewardNvc({
    usefulWorkScore: demoWorkScore,
    uptimeRatio: 1,
    purityScore: 1,
    walletHoldingNvc: 9_500_000,
  });

  const citizenVotePower = computeQuadraticVotingPower({
    usefulWorkScore: demoWorkScore,
    reputationScore: 95,
    hasKyc: true,
  });

  function handlePostTask(e: FormEvent) {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    onCreateWorkTask({
      title: newTaskTitle.trim(),
      workType: newTaskType,
      offeredRewardNvc: Number(newTaskReward) || 0.9,
    });
    setNewTaskTitle('');
    setShowTaskForm(false);
  }

  return (
    <div className="space-y-6">
      {/* Row 1: Proof of Useful Work + Anti-Plutocracy Index + Adaptive Consensus Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Panel 1: Proof of Useful Work */}
        <section className="rounded-xl border border-slate-800 bg-slate-900 p-5 flex flex-col justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-white">Proof of Useful Work (PoUW)</h3>
              </div>
              <span className="text-xs font-medium text-emerald-300">Zero PoW Waste</span>
            </div>
            <p className="text-xs text-slate-400">
              Rewards only verifiable Halal TX checks, Oracle audits, HyperScanner sweeps, storage, and Self-Heal.
            </p>
          </div>

          <dl className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-xs tabular-nums">
            <div>
              <dt className="text-slate-400">Useful Work</dt>
              <dd className="mt-1 text-base font-semibold text-white">
                {pouw.totalUsefulWorkDone.toLocaleString()}
              </dd>
            </div>
            <div>
              <dt className="text-slate-400">Energy / Tx</dt>
              <dd className="mt-1 text-base font-mono font-semibold text-emerald-300">
                {pouw.energyPerTxWh} Wh
              </dd>
            </div>
            <div>
              <dt className="text-slate-400">Productive %</dt>
              <dd
                className={`mt-1 text-base font-semibold ${
                  pouw.productiveValueRatio >= 95 ? 'text-amber-300' : 'text-rose-300'
                }`}
              >
                {pouw.productiveValueRatio.toFixed(1)}%
              </dd>
            </div>
          </dl>

          {/* Interactive WealthConcentrationFactor Proof */}
          <div className="rounded-lg bg-slate-950 border border-slate-800 p-3 space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-300">
              <span>Test Wallet Holding</span>
              <span className="font-mono text-amber-300 tabular-nums">
                {demoBalanceNvc.toLocaleString()} NVC
              </span>
            </div>
            <input
              type="range"
              min={10}
              max={9_500_000}
              step={50_000}
              value={demoBalanceNvc}
              onChange={(e) => setDemoBalanceNvc(Number(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer"
              aria-label="Test wallet holding for PoUW multiplier"
            />
            <div className="flex items-center justify-between text-[11px] tabular-nums text-slate-400">
              <span>
                Your Reward: <strong className="text-emerald-300">{citizenPreview.rewardNvc} NVC</strong> ({citizenPreview.multiplier}x)
              </span>
              <span>
                9.5M Cap Node: <strong className="text-rose-300">{nearCapPreview.rewardNvc} NVC</strong>
              </span>
            </div>
          </div>
        </section>

        {/* Panel 2: Anti-Plutocracy Index + Live Citizen Power Proof */}
        <section className="rounded-xl border border-slate-800 bg-slate-900 p-5 flex flex-col justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-white">Anti-Plutocracy Index</h3>
              </div>
              <span className="text-xs font-medium text-emerald-300">No Wealth = No Votes</span>
            </div>
            <p className="text-xs text-slate-400">
              Quadratic Voting Power = sqrt(UsefulWork × Reputation × 1-KYC). Peg $3.14, 0% Riba & 10M Cap locked.
            </p>
          </div>

          <dl className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-xs tabular-nums">
            <div>
              <dt className="text-slate-400">Live Gini Index</dt>
              <dd className="mt-1 text-base font-semibold text-emerald-300">
                {antiPlutocracy.giniCoefficient.toFixed(2)}
              </dd>
            </div>
            <div>
              <dt className="text-slate-400">Top 10 Control</dt>
              <dd className="mt-1 text-base font-semibold text-white">
                {antiPlutocracy.top10ControlPercent.toFixed(1)}%
              </dd>
            </div>
            <div>
              <dt className="text-slate-400">Fairness</dt>
              <dd className="mt-1 text-base font-semibold text-amber-300">
                {antiPlutocracy.rewardFairnessScore.toFixed(1)}%
              </dd>
            </div>
          </dl>

          <div className="rounded-lg bg-slate-950 border border-slate-800 p-3 space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-300">
              <span>Useful Work Score</span>
              <span className="font-mono text-white tabular-nums">{demoWorkScore} pts</span>
            </div>
            <input
              type="range"
              min={10}
              max={100}
              step={5}
              value={demoWorkScore}
              onChange={(e) => setDemoWorkScore(Number(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer"
              aria-label="Test useful work score for quadratic voting power"
            />
            <div className="flex items-center justify-between text-[11px] tabular-nums text-slate-400">
              <span>10 NVC Citizen Vote: <strong className="text-emerald-300">{citizenVotePower}</strong></span>
              <span>10M NVC Whale Vote: <strong className="text-emerald-300">{citizenVotePower}</strong></span>
            </div>
          </div>

          {/* Live KYC Citizens Quadratic Vote Standing */}
          <div className="border-t border-slate-800 pt-2.5 space-y-1.5 text-[11px]">
            <div className="text-slate-400 font-medium">Live Citizen Quadratic Governance Weights</div>
            {snapshot.citizens.slice(0, 3).map((cit) => {
              const qVote = computeQuadraticVotingPower({
                usefulWorkScore: Math.min(100, Math.max(40, cit.miningSessions * 1.5)),
                reputationScore: cit.reputationScore,
                hasKyc: cit.kycVerified,
              });
              return (
                <div key={cit.id} className="flex items-center justify-between gap-2 tabular-nums">
                  <span className="text-slate-300 truncate">
                    {cit.displayName} ({cit.balanceNvc.toFixed(1)} NVC)
                  </span>
                  <span className="font-mono text-amber-300 shrink-0">
                    Vote {qVote} · Base 1-KYC
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Panel 3: Adaptive Consensus Status (Interactive Telemetry Controls + Expandable AdaptiveLog) */}
        <section className="rounded-xl border border-slate-800 bg-slate-900 p-5 flex flex-col justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-white">Adaptive Consensus Status</h3>
              </div>
              <span
                className={`text-xs font-semibold ${
                  adaptive.mode === 'Defensive'
                    ? 'text-rose-300'
                    : adaptive.mode === 'Eco'
                      ? 'text-emerald-300'
                      : 'text-amber-300'
                }`}
              >
                {adaptive.mode} Mode
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Self-monitors TPS, threats, and node health every block. Auto-quarantines repeat malicious validators.
            </p>
          </div>

          <dl className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-xs tabular-nums">
            <div>
              <dt className="text-slate-400">Healthy Streak</dt>
              <dd className="mt-1 text-base font-semibold text-white">
                {adaptive.healthyStreakBlocks.toLocaleString()} blk
              </dd>
            </div>
            <div>
              <dt className="text-slate-400">Quorum / Freq</dt>
              <dd className="mt-1 text-base font-semibold text-emerald-300">
                {adaptive.validatorRedundancy}V · {adaptive.oracleCheckFreqSec}s
              </dd>
            </div>
            <div>
              <dt className="text-slate-400">Batch Limit</dt>
              <dd className="mt-1 text-base font-semibold text-amber-300">
                {adaptive.maxTxBatchSize} tx
              </dd>
            </div>
          </dl>

          {adaptive.quarantinedNodes.length > 0 && (
            <div className="rounded-lg border border-rose-700/50 bg-rose-950/30 px-3 py-2 text-[11px] text-rose-200 flex items-center gap-2">
              <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-rose-400" />
              <span className="truncate">
                Quarantined (100 blk): {adaptive.quarantinedNodes.join(', ')}
              </span>
            </div>
          )}

          {/* Telemetry Scenario Triggers */}
          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
            <button
              type="button"
              onClick={() => onAdaptConsensus('tps-drop')}
              className="px-2.5 py-1.5 rounded bg-rose-950/50 hover:bg-rose-900/60 border border-rose-700/40 text-rose-200 cursor-pointer truncate"
            >
              TPS Drop (-25%)
            </button>
            <button
              type="button"
              onClick={() => onAdaptConsensus('malicious-node')}
              className="px-2.5 py-1.5 rounded bg-orange-950/50 hover:bg-orange-900/60 border border-orange-700/40 text-orange-200 cursor-pointer truncate"
            >
              Rogue Node 2x
            </button>
            <button
              type="button"
              onClick={() => onAdaptConsensus('healthy-1000')}
              className="px-2.5 py-1.5 rounded bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-700/40 text-emerald-200 cursor-pointer truncate"
            >
              1000 Healthy (Eco)
            </button>
            <button
              type="button"
              onClick={() => onAdaptConsensus('restore-normal')}
              className="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 cursor-pointer truncate"
            >
              Restore Normal
            </button>
          </div>

          <div className="rounded-lg bg-slate-950 border border-slate-800 p-3 space-y-1.5 text-xs">
            <div className="flex items-center justify-between gap-2 text-slate-400">
              <span>
                AdaptiveLog · Block #{adaptive.adaptiveLog[0]?.blockHeight ?? snapshot.metrics.latestBlockHeight}
              </span>
              <button
                type="button"
                onClick={() => setShowAdaptiveLog((v) => !v)}
                className="inline-flex items-center gap-1 text-[11px] text-amber-300 hover:text-amber-200 cursor-pointer"
              >
                {showAdaptiveLog ? 'Hide' : `History (${adaptive.adaptiveLog.length})`}
                {showAdaptiveLog ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>
            <p className="text-slate-200 line-clamp-2">
              {adaptive.adaptiveLog[0]?.reason || 'Balanced 3-validator quorum active.'}
            </p>
            {showAdaptiveLog && (
              <div className="pt-2 border-t border-slate-800/80 space-y-1.5 max-h-32 overflow-y-auto text-[11px]">
                {adaptive.adaptiveLog.map((item) => (
                  <div key={item.id} className="text-slate-400">
                    <span className="font-mono text-amber-300">#{item.blockHeight}</span> · {item.parameter}:{' '}
                    <span className="text-slate-300">{item.oldValue}</span> →{' '}
                    <span className="text-emerald-300">{item.newValue}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Panel 4: Autonomous Failure Prevention (7 Modes) */}
      <section className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h3 className="text-base font-semibold text-white">
                Autonomous Failure Prevention Engine (7 Failure Modes)
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 tabular-nums">
              Total Autonomous Fixes Executed:{' '}
              <strong className="text-amber-300">{failure.totalAutoFixes.toLocaleString()}</strong> · All 7 vectors verified every block.
            </p>
          </div>
          <button
            type="button"
            onClick={onRunFailureScan}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-emerald-500/40 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-200 text-xs font-medium cursor-pointer whitespace-nowrap"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Run 7-Point Block Audit
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {failure.checks.map((chk) => (
            <div
              key={chk.id}
              className="rounded-lg border border-slate-800 bg-slate-950/70 p-3.5 space-y-1.5"
            >
              <div className="flex items-center justify-between gap-2 text-[11px]">
                <span className="font-semibold text-emerald-300">{chk.status}</span>
                <span className="font-mono text-slate-400 tabular-nums">Fixes: {chk.fixCount}</span>
              </div>
              <div className="text-xs font-semibold text-white">{chk.name}</div>
              <p className="text-[11px] text-slate-400">{chk.lastAction}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Panel 5: Real Work Ledger (Click WorkProofID to Inspect) + UsefulWork Marketplace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-7 rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-semibold text-white">Real Work Ledger (WorkProofID)</h3>
              <p className="text-xs text-slate-400">
                No WorkProof = No Mint. Click any WorkProofID row to inspect its cryptographic verifier quorum.
              </p>
            </div>
            <span className="text-xs text-emerald-300 font-mono tabular-nums">
              Productive Ratio: {pouw.productiveValueRatio.toFixed(1)}% (&gt;95% Target)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2 pr-3 font-medium">WorkProofID & Type</th>
                  <th className="py-2 px-3 font-medium">Node & Verifiers</th>
                  <th className="py-2 px-3 font-medium text-right">Wealth Factor</th>
                  <th className="py-2 pl-3 font-medium text-right">Reward (NVC)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {pouw.workProofs.slice(0, 10).map((wp) => {
                  const selected = inspectedProof?.workProofId === wp.workProofId;
                  return (
                    <tr
                      key={wp.workProofId}
                      onClick={() => setInspectedProof(selected ? null : wp)}
                      className={`cursor-pointer transition-colors ${
                        selected ? 'bg-amber-500/10' : 'hover:bg-slate-800/30'
                      }`}
                    >
                      <td className="py-2.5 pr-3">
                        <div className="font-mono font-semibold text-amber-300">{wp.workProofId}</div>
                        <div className="text-slate-300">{wp.workType} · {wp.durationMs}ms</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-mono text-white">{wp.nodeId}</div>
                        <div className="text-[11px] text-slate-400">
                          {wp.verifierNodes.length} verifiers · {wp.energyWh} Wh
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-300">
                        {wp.wealthConcentrationFactor.toFixed(4)}x
                      </td>
                      <td className="py-2.5 pl-3 text-right tabular-nums">
                        <div className="font-semibold text-emerald-300">{wp.rewardNvc} NVC</div>
                        <div className="text-[11px] text-slate-400">{formatMicronNova(wp.rewardNvc)}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {inspectedProof && (
            <div className="rounded-lg border border-amber-500/30 bg-slate-950 p-3.5 text-xs space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <strong className="font-mono text-amber-300">
                  On-Chain Attestation: {inspectedProof.workProofId}
                </strong>
                <span className="text-slate-400 tabular-nums">
                  Score {inspectedProof.usefulWorkScore} / {inspectedProof.wealthConcentrationFactor.toFixed(4)}x = {inspectedProof.rewardNvc} NVC
                </span>
              </div>
              <div className="font-mono text-[11px] text-slate-300 truncate">
                Result Hash: {inspectedProof.resultHash}
              </div>
              <div className="text-[11px] text-emerald-300">
                Quorum Verifiers ({inspectedProof.verifierNodes.length}/3 min): {inspectedProof.verifierNodes.join(' · ')}
              </div>
            </div>
          )}
        </section>

        <section className="lg:col-span-5 rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                <h3 className="text-base font-semibold text-white">UsefulWork Marketplace</h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Circular work economy: post or execute protocol jobs paid in NVC.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowTaskForm((v) => !v)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-medium cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              Post Task
            </button>
          </div>

          <select
            value={selectedCitizenId}
            onChange={(e) => onChangeSelectedCitizenId(e.target.value)}
            className="w-full rounded-lg bg-slate-950 border border-slate-700 px-2.5 py-1.5 text-xs text-white"
            aria-label="Select Worker Citizen Node"
          >
            {snapshot.citizens.map((c) => (
              <option key={c.id} value={c.id}>
                Active Node: {c.displayName} ({c.balanceNvc.toFixed(2)} NVC)
              </option>
            ))}
          </select>

          {showTaskForm && (
            <form
              onSubmit={handlePostTask}
              className="rounded-lg border border-slate-800 bg-slate-950 p-3 space-y-2.5 text-xs"
            >
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Describe useful work (e.g. Audit 12 halal escrow bills)..."
                className="w-full rounded bg-slate-900 border border-slate-700 px-2.5 py-1.5 text-white"
                required
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={newTaskType}
                  onChange={(e) => setNewTaskType(e.target.value as WorkProofType)}
                  className="rounded bg-slate-900 border border-slate-700 px-2 py-1.5 text-white"
                >
                  {WORK_TYPES.map((wt) => (
                    <option key={wt} value={wt}>
                      {wt}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  step="0.01"
                  min="0.1"
                  max="50"
                  value={newTaskReward}
                  onChange={(e) => setNewTaskReward(e.target.value)}
                  className="rounded bg-slate-900 border border-slate-700 px-2.5 py-1.5 text-white tabular-nums"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold py-1.5 cursor-pointer"
              >
                Publish Halal UsefulWork Bounty
              </button>
            </form>
          )}

          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            {pouw.workMarketplace.map((task) => (
              <div
                key={task.id}
                className="rounded-lg border border-slate-800 bg-slate-950/70 p-3.5 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="text-[11px] text-slate-400">
                    {task.workType} · <span className="font-mono">{task.id}</span>
                  </div>
                  <div className="text-xs font-semibold text-white truncate">{task.title}</div>
                  {task.status === 'completed' && task.workProofId && (
                    <div className="text-[11px] text-emerald-300 font-mono mt-0.5">
                      Verified {task.workProofId} by {task.completedBy}
                    </div>
                  )}
                </div>

                {task.status === 'open' ? (
                  <button
                    type="button"
                    onClick={() => onClaimWorkTask(task.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Pickaxe className="w-3.5 h-3.5" />
                    Execute ({task.offeredRewardNvc} NVC)
                  </button>
                ) : (
                  <span className="text-xs font-medium text-emerald-300 shrink-0">Completed</span>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
