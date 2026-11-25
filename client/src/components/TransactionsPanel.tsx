import { useState, type FormEvent } from 'react';
import { CheckCircle2, Download, Eye, Search, ShieldCheck, XCircle } from 'lucide-react';
import {
  formatMicronNova,
  formatUsd,
  type EcosystemSnapshot,
  type NovaTransaction,
} from '../../../shared/novaPolicy.ts';
import { preScreenCompliance } from '../lib/novaLocalEngine.ts';

interface TransactionsPanelProps {
  snapshot: EcosystemSnapshot;
  sender: string;
  recipient: string;
  amount: string;
  source: string;
  memo: string;
  reportedValueUsd: string;
  submittingTx: boolean;
  onChangeSender: (v: string) => void;
  onChangeRecipient: (v: string) => void;
  onChangeAmount: (v: string) => void;
  onChangeSource: (v: string) => void;
  onChangeMemo: (v: string) => void;
  onChangeReportedValueUsd: (v: string) => void;
  onSubmitTx: (e: FormEvent) => void;
  onInspectProvenance: (queryId: string) => void;
}

export function TransactionsPanel({
  snapshot,
  sender,
  recipient,
  amount,
  source,
  memo,
  reportedValueUsd,
  submittingTx,
  onChangeSender,
  onChangeRecipient,
  onChangeAmount,
  onChangeSource,
  onChangeMemo,
  onChangeReportedValueUsd,
  onSubmitTx,
  onInspectProvenance,
}: TransactionsPanelProps) {
  const [txFilter, setTxFilter] = useState<'all' | 'accepted' | 'rejected'>('all');
  const [txSearch, setTxSearch] = useState('');

  const txPreScan = preScreenCompliance(`${sender} ${recipient} ${memo}`);
  const filteredTransactions = snapshot.transactions
    .filter((tx) => (txFilter === 'all' ? true : tx.status === txFilter))
    .filter((tx) => {
      const q = txSearch.trim().toLowerCase();
      if (!q) return true;
      return (
        tx.id.toLowerCase().includes(q) ||
        tx.sender.toLowerCase().includes(q) ||
        tx.recipient.toLowerCase().includes(q) ||
        tx.memo.toLowerCase().includes(q) ||
        tx.source.toLowerCase().includes(q)
      );
    });

  function handleExportCsv() {
    const header = 'id,sender,recipient,amount_nvc,micron_nova,reported_usd,source,status,purity,risk,reason,hash,timestamp';
    const rows = filteredTransactions.map((tx) =>
      [
        tx.id,
        tx.sender,
        tx.recipient,
        tx.amount,
        tx.micronNova,
        tx.reportedValueUsd,
        tx.source,
        tx.status,
        tx.purityScore,
        tx.riskScore ?? 0,
        `"${tx.reason.replace(/"/g, '""')}"`,
        tx.hash,
        tx.timestamp,
      ].join(','),
    );
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stellar-nova-ledger-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <form
        onSubmit={onSubmitTx}
        className="lg:col-span-5 rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4 h-fit"
      >
        <div>
          <h2 className="text-base font-semibold text-white">Submit NVC Stablecoin Transaction</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Screened in real time by NovaHyperMind, AHI AI, NovaValuePolicy, NovaPurityEnforcer, and RibaGuard AI.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block text-xs text-slate-300 space-y-1">
            <span>Sender</span>
            <input
              type="text"
              value={sender}
              onChange={(e) => onChangeSender(e.target.value)}
              className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-white"
              required
            />
          </label>
          <label className="block text-xs text-slate-300 space-y-1">
            <span>Recipient</span>
            <input
              type="text"
              value={recipient}
              onChange={(e) => onChangeRecipient(e.target.value)}
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
              onChange={(e) => onChangeAmount(e.target.value)}
              className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm tabular-nums text-white"
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
              onChange={(e) => onChangeSource(e.target.value)}
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
            onChange={(e) => onChangeReportedValueUsd(e.target.value)}
            className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm tabular-nums text-white"
            required
          />
        </label>

        <label className="block text-xs text-slate-300 space-y-1">
          <span>Transaction Memo</span>
          <input
            type="text"
            value={memo}
            onChange={(e) => onChangeMemo(e.target.value)}
            placeholder="Describe purpose (gambling & riba keywords are auto-rejected)"
            className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-white"
          />
        </label>

        <div
          className={`rounded-lg border px-3 py-2 text-xs flex items-center gap-2 ${
            txPreScan.passed
              ? 'border-emerald-800/40 bg-emerald-950/20 text-emerald-300'
              : 'border-rose-800/50 bg-rose-950/30 text-rose-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>{txPreScan.message}</span>
        </div>

        <button
          type="submit"
          disabled={submittingTx}
          className="w-full rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm px-4 py-2.5 disabled:opacity-50 cursor-pointer"
        >
          {submittingTx ? 'Verifying...' : 'Validate & Submit NVC Transfer'}
        </button>

        <div className="pt-2 border-t border-slate-800 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              onChangeSource('exchange');
              onChangeMemo('External exchange liquidity deposit');
            }}
            className="text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
          >
            Test Exchange Rejection
          </button>
          <button
            type="button"
            onClick={() => {
              onChangeSource('p2p');
              onChangeMemo('Online casino jackpot entry');
            }}
            className="text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
          >
            Test Gambling Filter
          </button>
          <button
            type="button"
            onClick={() => {
              onChangeSource('p2p');
              onChangeReportedValueUsd('3.14');
              onChangeMemo('Lending 100 NVC with 10% interest APY');
            }}
            className="text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 cursor-pointer"
          >
            Test Riba Rejection
          </button>
          <button
            type="button"
            onClick={() => {
              onChangeSource('mining');
              onChangeReportedValueUsd('3.14');
              onChangeMemo('Node mining reward settlement');
            }}
            className="text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
          >
            Reset Valid Preset
          </button>
        </div>
      </form>

      <div className="lg:col-span-7 rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-white">Ledger & Filter Verdicts</h2>
            <p className="text-xs text-slate-400">
              {filteredTransactions.length} shown of {snapshot.transactions.length} recorded · SCP Consensus
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={txSearch}
                onChange={(e) => setTxSearch(e.target.value)}
                placeholder="Search address or memo..."
                className="pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white w-44"
              />
            </div>
            <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-lg">
              {(['all', 'accepted', 'rejected'] as const).map((statusOption) => (
                <button
                  key={statusOption}
                  type="button"
                  onClick={() => setTxFilter(statusOption)}
                  className={`px-2.5 py-1 rounded text-xs font-medium capitalize transition-colors cursor-pointer ${
                    txFilter === statusOption
                      ? 'bg-amber-500 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {statusOption}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium cursor-pointer whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              CSV
            </button>
          </div>
        </div>

        <div className="divide-y divide-slate-800/80 max-h-[560px] overflow-y-auto pr-1">
          {filteredTransactions.map((tx: NovaTransaction) => (
            <div key={tx.id} className="py-3.5 first:pt-1 last:pb-1 space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs">
                  {tx.status === 'accepted' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span className="font-mono text-slate-200">{tx.id}</span>
                  <span className="text-slate-500">·</span>
                  <span className="text-slate-400">{tx.source}</span>
                  <span className="text-slate-500">·</span>
                  <span
                    className={`font-medium capitalize ${
                      tx.status === 'accepted' ? 'text-emerald-300' : 'text-rose-300'
                    }`}
                  >
                    {tx.status}
                  </span>
                </div>
                <div className="flex items-center gap-2.5 tabular-nums">
                  <span className="font-semibold text-xs sm:text-sm text-white">
                    {tx.amount} NVC = {formatUsd(tx.amount * tx.reportedValueUsd)} USD ·{' '}
                    {formatMicronNova(tx.amount)}
                  </span>
                  <button
                    type="button"
                    onClick={() => onInspectProvenance(tx.id)}
                    className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 cursor-pointer whitespace-nowrap"
                  >
                    <Eye className="w-3 h-3" />
                    Inspect
                  </button>
                </div>
              </div>
              <p className="text-xs text-slate-300">
                {tx.sender} → {tx.recipient} · {tx.memo}
              </p>
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className={tx.status === 'accepted' ? 'text-emerald-300' : 'text-rose-300'}>
                  {tx.reason}
                </span>
                <span className="font-mono text-[11px] text-slate-500 tabular-nums">
                  Purity {tx.purityScore.toFixed(2)} · Risk {tx.riskScore ?? (tx.status === 'accepted' ? 4 : 92)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
