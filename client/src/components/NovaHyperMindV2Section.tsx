import { useState } from 'react';
import { Activity, CheckCircle2, Cpu, Pickaxe, Scale, ShieldCheck, Users } from 'lucide-react';
import {
  computePouwRewardNvc,
  computeQuadraticVotingPower,
  formatMicronNova,
  type EcosystemSnapshot,
} from '../../../shared/novaPolicy.ts';
import { createLocalFallbackSnapshot } from '../lib/novaLocalEngine.ts';

interface NovaHyperMindV2SectionProps {
  snapshot: EcosystemSnapshot;
  selectedCitizenId: string;
  onChangeSelectedCitizenId: (id: string) => void;
  onClaimWorkTask: (taskId: string) => void;
  onRunFailureScan: () => void;
}

export function NovaHyperMindV2Section({
  snapshot,
  selectedCitizenId,
  onChangeSelectedCitizenId,
  onClaimWorkTask,
  onRunFailureScan,
}: NovaHyperMindV2SectionProps) {
  const fallback = createLocalFallbackSnapshot();
  const pouw = snapshot.pouw ?? fallback.pouw!;
  const antiPlutocracy = snapshot.antiPlutocracy ?? fallback.antiPlutocracy!;
  const adaptive = snapshot.adaptiveConsensus ?? fallback.adaptiveConsensus!;
  const failure = snapshot.failurePrevention ?? fallback.failurePrevention!;

  const [demoBalanceNvc, setDemoBalanceNvc] = useState(100);
  const [demoWorkScore, setDemoWorkScore] = useState(90);

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
              <dd className="mt-1 text-base font-semibold text-amber-300">
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

        {/* Panel 2: Anti-Plutocracy Index */}
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
              <dt className="text-slate-400">Gini Index</dt>
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
        </section>

        {/* Panel 3: Adaptive Consensus Status */}
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
              <dt className="text-slate-400">Oracle Freq</dt>
              <dd className="mt-1 text-base font-semibold text-emerald-300">
                {adaptive.oracleCheckFreqSec}s
              </dd>
            </div>
            <div>
              <dt className="text-slate-400">Batch Limit</dt>
              <dd className="mt-1 text-base font-semibold text-amber-300">
                {adaptive.maxTxBatchSize} tx
              </dd>
            </div>
          </dl>

          <div className="rounded-lg bg-slate-950 border border-slate-800 p-3 space-y-1 text-xs">
            <div className="text-slate-400">
              Last Auto-Adaptation · Block #{adaptive.adaptiveLog[0]?.blockHeight ?? snapshot.metrics.latestBlockHeight}
            </div>
            <p className="text-slate-200 line-clamp-2">
              {adaptive.adaptiveLog[0]?.reason || 'Balanced 3-validator quorum active.'}
            </p>
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

      {/* Panel 5: Real Work Ledger (Last 10 WorkProofIDs) + UsefulWork Marketplace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-7 rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-semibold text-white">Real Work Ledger (WorkProofID)</h3>
              <p className="text-xs text-slate-400">
                No WorkProof = No Mint. Every reward requires at least 3 peer verifier attestations.
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
                {pouw.workProofs.slice(0, 10).map((wp) => (
                  <tr key={wp.workProofId} className="hover:bg-slate-800/30">
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
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="lg:col-span-5 rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                <h3 className="text-base font-semibold text-white">UsefulWork Marketplace</h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Citizen nodes earn NVC by completing useful protocol work.
              </p>
            </div>
            <select
              value={selectedCitizenId}
              onChange={(e) => onChangeSelectedCitizenId(e.target.value)}
              className="rounded-lg bg-slate-950 border border-slate-700 px-2.5 py-1.5 text-xs text-white"
              aria-label="Select Worker Citizen Node"
            >
              {snapshot.citizens.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.displayName} ({c.balanceNvc.toFixed(2)} NVC)
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2.5">
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
