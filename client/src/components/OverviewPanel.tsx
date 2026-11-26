import { useState } from 'react';
import { ArrowRight, Brain, Cpu, Globe2, Scale, ShieldCheck, Users } from 'lucide-react';
import {
  formatMicronNova,
  formatUsd,
  nvcToUsd,
  type EcosystemSnapshot,
} from '../../../shared/novaPolicy.ts';

export type WorkspaceTabId =
  | 'overview'
  | 'transactions'
  | 'hyper'
  | 'apps'
  | 'oracle'
  | 'citizens'
  | 'marketplace'
  | 'audit';

interface OverviewPanelProps {
  snapshot: EcosystemSnapshot;
  onNavigate: (tab: WorkspaceTabId) => void;
}

const RESERVE_COLORS = [
  'bg-amber-400',
  'bg-emerald-400',
  'bg-sky-400',
  'bg-slate-400',
];

export function OverviewPanel({ snapshot, onNavigate }: OverviewPanelProps) {
  const [calcNvc, setCalcNvc] = useState('0.286624');
  const numericCalcNvc = Math.max(0, Number(calcNvc) || 0);
  const maxModuleBlocked = Math.max(1, ...snapshot.hyperModules.map((m) => m.threatsBlocked));
  const sortedModules = [...snapshot.hyperModules].sort((a, b) => b.threatsBlocked - a.threatsBlocked);
  const totalReservesUsd = snapshot.collateralReserves.reduce((s, r) => s + r.backingUsd, 0);

  return (
    <div className="space-y-6">
      {/* Primary Monetary Identity & Peg Calculator Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <section className="lg:col-span-7 rounded-xl border border-slate-800 bg-slate-900 p-6 flex flex-col justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3 text-xs text-slate-400">
              <span>Mathematical Monetary Identity · Stellar Consensus Protocol</span>
              <span className="font-mono text-emerald-300 tabular-nums">
                {snapshot.metrics.verifiedOracleNodes}/{snapshot.oracleNodes.length} Oracles Aligned
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-white">
              Born From a Supernova. Not a Coin to Trade. A Currency to Use.
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed max-w-2xl">
              Every Nova Core Coin (NVC) settles at an immutable mathematical identity of{' '}
              <strong className="text-amber-300 font-semibold">$3.14 USD</strong> backed by{' '}
              <strong className="text-emerald-300 font-semibold">{snapshot.metrics.collateralRatioActual}x</strong>{' '}
              audited Halal real-economy assets with 0% interest and zero speculative exchanges.
            </p>
          </div>

          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-800 text-xs">
            <div>
              <dt className="text-slate-400">Network Value at Peg</dt>
              <dd className="mt-1 text-base font-semibold tabular-nums text-white">$314.00B</dd>
            </div>
            <div>
              <dt className="text-slate-400">Real-Economy Backing</dt>
              <dd className="mt-1 text-base font-semibold tabular-nums text-emerald-300">
                ${(totalReservesUsd / 1e9).toFixed(1)}B
              </dd>
            </div>
            <div>
              <dt className="text-slate-400">SCP Finality Block</dt>
              <dd className="mt-1 text-base font-mono font-semibold tabular-nums text-amber-300">
                #{snapshot.metrics.latestBlockHeight}
              </dd>
            </div>
            <div>
              <dt className="text-slate-400">Verified KYC Citizens</dt>
              <dd className="mt-1 text-base font-semibold tabular-nums text-white">
                {snapshot.metrics.verifiedCitizens} Active
              </dd>
            </div>
          </dl>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => onNavigate('hyper')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0 transition-colors"
            >
              <Brain className="w-3.5 h-3.5" />
              Open Hyper-Intelligence Simulations
            </button>
            <button
              type="button"
              onClick={() => onNavigate('transactions')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-700 bg-slate-950 hover:bg-slate-800 text-slate-200 text-xs font-medium cursor-pointer whitespace-nowrap shrink-0 transition-colors"
            >
              <Cpu className="w-3.5 h-3.5" />
              Submit NVC Transaction
            </button>
          </div>
        </section>

        {/* Interactive Peg & Micron Nova Converter */}
        <section className="lg:col-span-5 rounded-xl border border-slate-800 bg-slate-900 p-6 flex flex-col justify-between gap-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-base font-semibold text-white">
                NVC & Micron Nova (µNVC) Peg Converter
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                1 NVC = 1,000,000 µNVC = {formatUsd(snapshot.constants.fixedValueUsd)} USD
              </p>
            </div>
            <Scale className="w-4 h-4 text-amber-400 shrink-0" />
          </div>

          <div className="space-y-3">
            <label className="block text-xs text-slate-300 space-y-1.5">
              <span>Enter NVC Amount</span>
              <input
                type="number"
                min="0"
                step="any"
                value={calcNvc}
                onChange={(e) => setCalcNvc(e.target.value)}
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2.5 text-sm font-mono tabular-nums text-white"
              />
            </label>

            <div className="flex flex-wrap gap-1.5">
              {['0.286624', '1', '25', '100'].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setCalcNvc(preset)}
                  className={`px-2.5 py-1 rounded text-xs font-mono tabular-nums cursor-pointer transition-colors ${
                    calcNvc === preset
                      ? 'bg-amber-500 text-slate-950 font-semibold'
                      : 'bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {preset} NVC
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800 tabular-nums">
            <div className="rounded-lg bg-slate-950 border border-slate-800/80 p-3">
              <div className="text-xs text-slate-400">USD Settlement Value</div>
              <div className="mt-1 text-lg font-semibold text-emerald-300 font-mono">
                {formatUsd(nvcToUsd(numericCalcNvc))}
              </div>
            </div>
            <div className="rounded-lg bg-slate-950 border border-slate-800/80 p-3">
              <div className="text-xs text-slate-400">Micron Nova Units</div>
              <div className="mt-1 text-lg font-semibold text-amber-300 font-mono truncate">
                {formatMicronNova(numericCalcNvc)}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Collateral Allocation + HyperMind 7-Module Defense Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-6 rounded-xl border border-slate-800 bg-slate-900 p-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-white">
                1.5x Halal Real-Economy Reserve Custody
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                ${(totalReservesUsd / 1e9).toFixed(1)}B audited real-world collateral backing $314.0B peg value.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('citizens')}
              className="inline-flex items-center gap-1 text-xs font-medium text-amber-300 hover:text-amber-200 cursor-pointer whitespace-nowrap shrink-0"
            >
              Reserve Ledger
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Segmented proportional bar */}
          <div className="h-3 w-full rounded-full overflow-hidden flex bg-slate-950 border border-slate-800">
            {snapshot.collateralReserves.map((res, idx) => (
              <div
                key={res.id}
                style={{ width: `${res.sharePercent}%` }}
                className={RESERVE_COLORS[idx % RESERVE_COLORS.length]}
                title={`${res.assetClass}: ${res.sharePercent}%`}
              />
            ))}
          </div>

          <div className="divide-y divide-slate-800/80">
            {snapshot.collateralReserves.map((res, idx) => (
              <div key={res.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`w-2.5 h-2.5 rounded-sm shrink-0 ${RESERVE_COLORS[idx % RESERVE_COLORS.length]}`}
                  />
                  <div className="min-w-0">
                    <div className="font-medium text-white truncate">{res.assetClass}</div>
                    <div className="text-slate-400 truncate">{res.custodyType} · 0% Interest</div>
                  </div>
                </div>
                <div className="text-right tabular-nums shrink-0">
                  <div className="font-semibold text-white">${(res.backingUsd / 1e9).toFixed(1)}B</div>
                  <div className="text-slate-400">{res.sharePercent}%</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="lg:col-span-6 rounded-xl border border-slate-800 bg-slate-900 p-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-white">
                NovaHyperMind Threat Defense Distribution
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {snapshot.threatsBlocked.toLocaleString()} cumulative threats neutralized across 7 AI modules.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('hyper')}
              className="inline-flex items-center gap-1 text-xs font-medium text-amber-300 hover:text-amber-200 cursor-pointer whitespace-nowrap shrink-0"
            >
              Command Center
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {sortedModules.map((mod) => {
              const pct = Math.max(4, Math.round((mod.threatsBlocked / maxModuleBlocked) * 100));
              return (
                <div key={mod.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-200 font-medium truncate pr-2">{mod.name}</span>
                    <span className="font-mono tabular-nums text-amber-300 shrink-0">
                      {mod.threatsBlocked.toLocaleString()} blocked
                    </span>
                  </div>
                  <div className="h-2 w-full rounded bg-slate-950 overflow-hidden">
                    <div
                      className="h-full bg-amber-400/85 rounded transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* NovaHyperMind Autonomous Proof Summary Strip */}
      <section className="rounded-xl border border-amber-500/25 bg-slate-900 px-5 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-0.5">
          <div className="text-xs font-semibold text-amber-300">
            NovaHyperMind PoUW + Anti-Plutocracy + Adaptive Consensus
          </div>
          <p className="text-xs text-slate-400">
            Decentralized without PoW waste · Efficient without PoS plutocracy · Productive circular work economy
          </p>
        </div>

        <dl className="flex flex-wrap items-center gap-6 text-xs tabular-nums">
          <div>
            <dt className="text-slate-400">Productive Value</dt>
            <dd className="mt-0.5 font-semibold text-emerald-300">
              {(snapshot.pouw?.productiveValueRatio ?? 98.4).toFixed(1)}% (&gt;95%)
            </dd>
          </div>
          <div>
            <dt className="text-slate-400">Energy / Tx</dt>
            <dd className="mt-0.5 font-mono font-semibold text-white">
              {snapshot.pouw?.energyPerTxWh ?? 0.04} Wh
            </dd>
          </div>
          <div>
            <dt className="text-slate-400">Gini Index</dt>
            <dd className="mt-0.5 font-mono font-semibold text-emerald-300">
              {(snapshot.antiPlutocracy?.giniCoefficient ?? 0.21).toFixed(2)}
            </dd>
          </div>
          <div>
            <dt className="text-slate-400">Consensus</dt>
            <dd className="mt-0.5 font-semibold text-amber-300">
              {snapshot.adaptiveConsensus?.mode ?? 'Normal'}
            </dd>
          </div>
          <div>
            <dt className="text-slate-400">Failure Modes</dt>
            <dd className="mt-0.5 font-semibold text-emerald-300">
              {snapshot.failurePrevention?.checks.length ?? 7}/7 GREEN
            </dd>
          </div>
        </dl>

        <button
          type="button"
          onClick={() => onNavigate('hyper')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-300 hover:text-amber-200 cursor-pointer whitespace-nowrap shrink-0"
        >
          Inspect Proof Ledger
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </section>

      {/* Bottom Quick-Action Subsystems Row */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Global Oracle Consensus</span>
            <Globe2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="text-base font-semibold text-white">
              SCP Block #{snapshot.metrics.latestBlockHeight} Sealed
            </div>
            <p className="text-xs text-slate-400 mt-1">
              3/3 regional validators aligned at $3.14 USD · 0.04 Wh finality round.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('oracle')}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-300 hover:text-amber-200 cursor-pointer w-fit"
          >
            Inspect Consensus & Seal Block
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Fair Citizen Distribution</span>
            <Users className="w-4 h-4 text-sky-400" />
          </div>
          <div>
            <div className="text-base font-semibold text-white">
              1 Person = 1 KYC · 0.01% Max Cap
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Anti-whale ceiling locked at 10,000,000 NVC with low-energy mobile SCP mining.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('citizens')}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-300 hover:text-amber-200 cursor-pointer w-fit"
          >
            Citizens, Mining & P2P Transfer
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>SHA-256 Immutable Audit</span>
            <ShieldCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="text-base font-semibold text-white">
              {snapshot.auditLog.length} Cryptographic Entries
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Zero Riba ({snapshot.metrics.mudarabahDistributedNvc} NVC Mudarabah surplus shared) & full audit proof.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('audit')}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-300 hover:text-amber-200 cursor-pointer w-fit"
          >
            Verify SHA-256 Chain
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>
    </div>
  );
}
