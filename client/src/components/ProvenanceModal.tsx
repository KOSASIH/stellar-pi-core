import { useEffect, useState, type FormEvent } from 'react';
import { CheckCircle2, Search, ShieldAlert, ShieldCheck, X, XCircle } from 'lucide-react';
import {
  formatMicronNova,
  formatUsd,
  nvcToUsd,
  type EcosystemSnapshot,
} from '../../../shared/novaPolicy.ts';
import {
  buildLocalProvenanceReport,
  safeFetchJson,
  type ProvenanceInspection,
} from '../lib/novaLocalEngine.ts';

interface ProvenanceModalProps {
  snapshot: EcosystemSnapshot;
  initialQuery: string;
  onClose: () => void;
}

export function ProvenanceModal({ snapshot, initialQuery, onClose }: ProvenanceModalProps) {
  const [query, setQuery] = useState(initialQuery);
  const [report, setReport] = useState<ProvenanceInspection>(() =>
    buildLocalProvenanceReport(snapshot, initialQuery),
  );
  const [checking, setChecking] = useState(false);

  async function runInspection(targetQuery: string) {
    const clean = targetQuery.trim() || 'NVC-MINER-RASPI-09';
    setChecking(true);
    const localReport = buildLocalProvenanceReport(snapshot, clean);
    const statusRes = await safeFetchJson<{
      coinId?: string;
      status?: string;
      error?: string;
    }>(`/api/nova/status/${encodeURIComponent(clean)}`);

    if (statusRes.data && statusRes.data.status === 'rejected') {
      setReport({
        ...localReport,
        status: 'rejected',
        purityScore: 0,
        riskScore: 95,
        reason: statusRes.data.error || localReport.reason,
      });
    } else {
      setReport(localReport);
    }
    setChecking(false);
  }

  useEffect(() => {
    setQuery(initialQuery);
    void runInspection(initialQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    void runInspection(query);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Provenance and Anti-Whale Inspector"
    >
      <div className="w-full max-w-2xl rounded-xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-sm font-semibold text-white">
                NVC Coin & Ledger Provenance Verifier
              </h2>
              <p className="text-xs text-slate-400">
                Inspect purity score, SHA-256 hash, SCP finality, and 0.01% max wallet cap.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
            aria-label="Close Provenance Inspector"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <form onSubmit={handleSubmit} className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter TX ID, Citizen ID, or Wallet (e.g. tx-nvc-001, exchange_wallet_1)..."
                className="w-full pl-8 pr-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={checking}
              className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold cursor-pointer whitespace-nowrap"
            >
              {checking ? 'Verifying...' : 'Inspect Provenance'}
            </button>
          </form>

          <div className="flex flex-wrap gap-1.5 text-xs">
            {[
              snapshot.transactions[0]?.id || 'tx-nvc-001',
              'NVC-MINER-RASPI-09',
              'exchange_wallet_1',
            ].map((sample) => (
              <button
                key={sample}
                type="button"
                onClick={() => {
                  setQuery(sample);
                  void runInspection(sample);
                }}
                className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-300 font-mono cursor-pointer"
              >
                {sample}
              </button>
            ))}
          </div>

          <div
            className={`rounded-xl border p-4 space-y-3 ${
              report.status === 'valid'
                ? 'border-emerald-700/60 bg-emerald-950/25'
                : 'border-rose-700/60 bg-rose-950/30'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {report.status === 'valid' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span className="font-mono text-sm font-semibold text-white">{report.queryId}</span>
                <span className="text-slate-500">·</span>
                <span className="text-xs uppercase tracking-wide text-slate-400">
                  {report.entityType}
                </span>
              </div>
              <span
                className={`text-xs font-semibold uppercase ${
                  report.status === 'valid' ? 'text-emerald-300' : 'text-rose-300'
                }`}
              >
                {report.status === 'valid' ? 'Pure NVC Verified' : 'Rejected / Tainted'}
              </span>
            </div>

            <p className="text-xs text-slate-200">{report.reason}</p>

            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-800/80 text-xs tabular-nums">
              <div>
                <dt className="text-slate-400">Purity Score</dt>
                <dd className="mt-0.5 font-mono font-semibold text-white">
                  {report.purityScore.toFixed(2)} / 1.00
                </dd>
              </div>
              <div>
                <dt className="text-slate-400">HyperMind Risk</dt>
                <dd className="mt-0.5 font-mono font-semibold text-amber-300">
                  {report.riskScore} / 100
                </dd>
              </div>
              <div>
                <dt className="text-slate-400">Value at $3.14</dt>
                <dd className="mt-0.5 font-mono font-semibold text-emerald-300">
                  {report.holdingNvc.toFixed(4)} NVC ({formatUsd(nvcToUsd(report.holdingNvc))})
                </dd>
              </div>
              <div>
                <dt className="text-slate-400">SCP Finality Block</dt>
                <dd className="mt-0.5 font-mono font-semibold text-white">
                  #{report.blockHeight ?? snapshot.metrics.latestBlockHeight}
                </dd>
              </div>
            </dl>

            <div className="pt-2 border-t border-slate-800/80 space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-slate-400 tabular-nums">
                <span>0.01% Max Wallet Cap Utilization (10,000,000 NVC ceiling)</span>
                <span className="font-mono text-white">
                  {report.capPercent.toFixed(5)}% · {formatMicronNova(report.holdingNvc)}
                </span>
              </div>
              <div className="h-1.5 w-full rounded bg-slate-950 overflow-hidden">
                <div
                  className="h-full bg-emerald-400"
                  style={{ width: `${Math.min(100, Math.max(2, report.capPercent * 100))}%` }}
                />
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 truncate pt-1">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">sha256:{report.sha256}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
