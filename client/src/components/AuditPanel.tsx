import { useState } from 'react';
import { Check, Copy, Download, RotateCcw, Search, ShieldCheck } from 'lucide-react';
import type { EcosystemSnapshot } from '../../../shared/novaPolicy.ts';

interface AuditPanelProps {
  snapshot: EcosystemSnapshot;
  onVerifyAuditChain: () => void;
  onExportAuditJson: () => void;
  onResetEcosystem: () => void;
}

export function AuditPanel({
  snapshot,
  onVerifyAuditChain,
  onExportAuditJson,
  onResetEcosystem,
}: AuditPanelProps) {
  const [auditSearch, setAuditSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState<string>('All');
  const [copiedHashId, setCopiedHashId] = useState<string | null>(null);

  const uniqueModules = ['All', ...Array.from(new Set(snapshot.auditLog.map((a) => a.module)))];

  const filteredEntries = snapshot.auditLog
    .filter((entry) => (moduleFilter === 'All' ? true : entry.module === moduleFilter))
    .filter((entry) => {
      const q = auditSearch.trim().toLowerCase();
      if (!q) return true;
      return (
        entry.module.toLowerCase().includes(q) ||
        entry.action.toLowerCase().includes(q) ||
        entry.detail.toLowerCase().includes(q)
      );
    });

  function handleCopyHash(id: string, hash: string) {
    void navigator.clipboard?.writeText(hash);
    setCopiedHashId(id);
    setTimeout(() => setCopiedHashId(null), 1500);
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-white">SHA-256 Audit Trail Logger</h2>
          <span className="text-xs text-slate-400">
            {filteredEntries.length} of {snapshot.auditLog.length} entries · Immutable cryptographic trail
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={auditSearch}
              onChange={(e) => setAuditSearch(e.target.value)}
              placeholder="Filter audit log..."
              className="pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white w-48"
            />
          </div>
          <button
            type="button"
            onClick={onVerifyAuditChain}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-200 text-xs font-medium cursor-pointer whitespace-nowrap"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Verify SHA-256 Chain
          </button>
          <button
            type="button"
            onClick={onExportAuditJson}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium cursor-pointer whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            Export JSON
          </button>
          <button
            type="button"
            onClick={onResetEcosystem}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-medium cursor-pointer whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Baseline
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {uniqueModules.map((mod) => (
          <button
            key={mod}
            type="button"
            onClick={() => setModuleFilter(mod)}
            className={`px-2.5 py-1 rounded-lg text-xs cursor-pointer transition-colors ${
              moduleFilter === mod
                ? 'bg-amber-500 text-slate-950 font-semibold'
                : 'bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            {mod}
          </button>
        ))}
      </div>

      <div className="divide-y divide-slate-800/80 max-h-[540px] overflow-y-auto pr-1">
        {filteredEntries.map((entry) => (
          <div key={entry.id} className="py-3 first:pt-1 last:pb-1 flex flex-col gap-1">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-amber-300">{entry.module}</span>
                <span className="text-slate-600">·</span>
                <span className="font-mono text-slate-400">{entry.action}</span>
              </div>
              <span className="text-slate-500 tabular-nums">
                {new Date(entry.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <p className="text-xs text-slate-200">{entry.detail}</p>
            <div className="flex items-center justify-between gap-2">
              <p className="font-mono text-[11px] text-slate-500 truncate">sha256:{entry.hash}</p>
              <button
                type="button"
                onClick={() => handleCopyHash(entry.id, entry.hash)}
                className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-white cursor-pointer shrink-0"
              >
                {copiedHashId === entry.id ? (
                  <Check className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
                {copiedHashId === entry.id ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
