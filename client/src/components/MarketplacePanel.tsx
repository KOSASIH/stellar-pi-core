import { useState, type FormEvent } from 'react';
import { ShieldCheck } from 'lucide-react';
import {
  formatMicronNova,
  formatUsd,
  nvcToUsd,
  type EcosystemSnapshot,
  type MarketplaceListing,
} from '../../../shared/novaPolicy.ts';
import { preScreenCompliance } from '../lib/novaLocalEngine.ts';

interface MarketplacePanelProps {
  snapshot: EcosystemSnapshot;
  selectedCitizenId: string;
  mktTitle: string;
  mktCategory: MarketplaceListing['category'];
  mktSettlementModel: MarketplaceListing['settlementModel'];
  mktPriceNvc: string;
  mktDesc: string;
  mudarabahProfitNvc: string;
  mudarabahRatio: string;
  mudarabahNote: string;
  onChangeSelectedCitizenId: (id: string) => void;
  onChangeMktTitle: (v: string) => void;
  onChangeMktCategory: (v: MarketplaceListing['category']) => void;
  onChangeMktSettlementModel: (v: MarketplaceListing['settlementModel']) => void;
  onChangeMktPriceNvc: (v: string) => void;
  onChangeMktDesc: (v: string) => void;
  onChangeMudarabahProfitNvc: (v: string) => void;
  onChangeMudarabahRatio: (v: string) => void;
  onChangeMudarabahNote: (v: string) => void;
  onCreateListing: (e: FormEvent) => void;
  onBuyListing: (listingId: string) => void;
  onDistributeMudarabah: (e: FormEvent) => void;
}

export function MarketplacePanel({
  snapshot,
  selectedCitizenId,
  mktTitle,
  mktCategory,
  mktSettlementModel,
  mktPriceNvc,
  mktDesc,
  mudarabahProfitNvc,
  mudarabahRatio,
  mudarabahNote,
  onChangeSelectedCitizenId,
  onChangeMktTitle,
  onChangeMktCategory,
  onChangeMktSettlementModel,
  onChangeMktPriceNvc,
  onChangeMktDesc,
  onChangeMudarabahProfitNvc,
  onChangeMudarabahRatio,
  onChangeMudarabahNote,
  onCreateListing,
  onBuyListing,
  onDistributeMudarabah,
}: MarketplacePanelProps) {
  const [categoryFilter, setCategoryFilter] = useState<'All' | MarketplaceListing['category']>('All');

  const listingScan = preScreenCompliance(`${mktTitle} ${mktDesc}`);
  const mudarabahScan = preScreenCompliance(mudarabahNote);
  const netProfit = Math.max(0, Number(mudarabahProfitNvc) || 0);
  const ratio = Math.min(90, Math.max(1, Number(mudarabahRatio) || 70));
  const partnerShareNvc = (netProfit * ratio) / 100;
  const operatorShareNvc = netProfit - partnerShareNvc;

  const visibleListings = snapshot.marketplaceListings.filter((l) =>
    categoryFilter === 'All' ? true : l.category === categoryFilter,
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <form
        onSubmit={onCreateListing}
        className="lg:col-span-4 rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4 h-fit"
      >
        <div>
          <h2 className="text-base font-semibold text-white">List Real-Economy Good or Mudarabah</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Every listing is screened by RibaGuard AI & HyperScanner. Fixed 1 NVC = $3.14 USD settlement.
          </p>
        </div>

        <label className="block text-xs text-slate-300 space-y-1">
          <span>Listing Title</span>
          <input
            type="text"
            value={mktTitle}
            onChange={(e) => onChangeMktTitle(e.target.value)}
            placeholder="e.g. Solar Irrigation Pump Kit"
            className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-white"
            required
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block text-xs text-slate-300 space-y-1">
            <span>Category</span>
            <select
              value={mktCategory}
              onChange={(e) => onChangeMktCategory(e.target.value as MarketplaceListing['category'])}
              className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white"
            >
              <option value="Physical Goods">Physical Goods</option>
              <option value="Clean Energy">Clean Energy</option>
              <option value="Logistics">Logistics</option>
              <option value="Halal Mudarabah">Halal Mudarabah</option>
            </select>
          </label>
          <label className="block text-xs text-slate-300 space-y-1">
            <span>Price (NVC)</span>
            <input
              type="number"
              min="0.001"
              step="any"
              value={mktPriceNvc}
              onChange={(e) => onChangeMktPriceNvc(e.target.value)}
              className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-xs tabular-nums text-white"
              required
            />
          </label>
        </div>

        <label className="block text-xs text-slate-300 space-y-1">
          <span>Settlement Model</span>
          <select
            value={mktSettlementModel}
            onChange={(e) =>
              onChangeMktSettlementModel(e.target.value as MarketplaceListing['settlementModel'])
            }
            className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white"
          >
            <option value="Direct Real Trade">Direct Real Trade</option>
            <option value="Fee-Based Service">Fee-Based Service</option>
            <option value="Mudarabah Profit-Share (0% Interest)">Mudarabah Profit-Share (0% Interest)</option>
          </select>
        </label>

        <label className="block text-xs text-slate-300 space-y-1">
          <span>Description</span>
          <textarea
            rows={3}
            value={mktDesc}
            onChange={(e) => onChangeMktDesc(e.target.value)}
            placeholder="Real goods or 0% interest Mudarabah share..."
            className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white"
            required
          />
        </label>

        {(mktTitle || mktDesc) && (
          <div
            className={`rounded-lg border px-3 py-2 text-xs flex items-center gap-2 ${
              listingScan.passed
                ? 'border-emerald-800/40 bg-emerald-950/20 text-emerald-300'
                : 'border-rose-800/50 bg-rose-950/30 text-rose-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>{listingScan.message}</span>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            className="flex-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm px-4 py-2.5 cursor-pointer"
          >
            Publish NVC Listing
          </button>
          <button
            type="button"
            onClick={() => {
              onChangeMktTitle('15% Fixed APR Credit Loan');
              onChangeMktDesc('Borrow NVC with 15% interest APR lending yield');
            }}
            className="rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-medium px-3 py-2.5 cursor-pointer"
          >
            Test Riba Listing
          </button>
        </div>
      </form>

      <div className="lg:col-span-8 space-y-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-white">
                Real-Economy Commerce & Mudarabah Catalog
              </h2>
              <p className="text-xs text-slate-400">
                Total Marketplace Settled Volume: {snapshot.metrics.marketplaceVolumeNvc} NVC (
                {formatUsd(nvcToUsd(snapshot.metrics.marketplaceVolumeNvc))})
              </p>
            </div>
            <label className="flex items-center gap-2 text-xs text-slate-300">
              <span>Buyer Wallet:</span>
              <select
                value={selectedCitizenId}
                onChange={(e) => onChangeSelectedCitizenId(e.target.value)}
                className="rounded-lg bg-slate-950 border border-slate-700 px-2.5 py-1.5 text-xs text-white"
              >
                {snapshot.citizens.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.displayName} ({c.balanceNvc.toFixed(2)} NVC)
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {(['All', 'Physical Goods', 'Clean Energy', 'Logistics', 'Halal Mudarabah'] as const).map(
              (cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1 rounded-lg text-xs cursor-pointer transition-colors ${
                    categoryFilter === cat
                      ? 'bg-amber-500 text-slate-950 font-semibold'
                      : 'bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ),
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {visibleListings.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border border-slate-800 bg-slate-950/70 p-4 flex flex-col justify-between gap-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>
                      {item.category} · {item.merchantName}
                    </span>
                    <span className="tabular-nums text-emerald-300">{item.stock} left</span>
                  </div>
                  <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                  <p className="text-xs text-slate-400">{item.description}</p>
                  <p className="text-[11px] text-amber-300/90">{item.settlementModel}</p>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                  <div className="tabular-nums">
                    <div className="text-sm font-semibold text-white">
                      {item.priceNvc} NVC · {formatUsd(nvcToUsd(item.priceNvc))}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {formatMicronNova(item.priceNvc)} · {item.soldCount} sold
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={item.stock < 1}
                    onClick={() => onBuyListing(item.id)}
                    className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs whitespace-nowrap disabled:opacity-40 cursor-pointer"
                  >
                    Pay with NVC
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {snapshot.marketplaceOrders.length > 0 && (
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-3">
            <h3 className="text-sm font-semibold text-white">
              Recent Real-Economy Settlements ({snapshot.marketplaceOrders.length})
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-2 pr-3 font-medium">Order / TX</th>
                    <th className="py-2 px-3 font-medium">Item</th>
                    <th className="py-2 px-3 font-medium">Buyer</th>
                    <th className="py-2 pl-3 font-medium text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {snapshot.marketplaceOrders.map((ord) => (
                    <tr key={ord.id}>
                      <td className="py-2 pr-3 font-mono text-[11px] text-slate-300">{ord.txId}</td>
                      <td className="py-2 px-3 text-white">{ord.listingTitle}</td>
                      <td className="py-2 px-3 font-mono text-[11px] text-slate-400">{ord.buyerId}</td>
                      <td className="py-2 pl-3 text-right tabular-nums text-emerald-300 font-medium">
                        {ord.amountNvc} NVC ({formatUsd(ord.usdEquivalent)})
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <form
          onSubmit={onDistributeMudarabah}
          className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4"
        >
          <div>
            <h3 className="text-sm font-semibold text-white">
              Halal Mudarabah Profit-Sharing Distribution (0% Interest)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Real operating surplus shared across Citizen co-op partners ({snapshot.metrics.mudarabahDistributedNvc} NVC distributed to date).
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            <label className="block text-xs text-slate-300 space-y-1">
              <span>Net Profit (NVC)</span>
              <input
                type="number"
                min="0"
                step="any"
                value={mudarabahProfitNvc}
                onChange={(e) => onChangeMudarabahProfitNvc(e.target.value)}
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-xs tabular-nums text-white"
                required
              />
            </label>
            <label className="block text-xs text-slate-300 space-y-1">
              <span>Partner Share (%)</span>
              <input
                type="number"
                min="1"
                max="90"
                value={mudarabahRatio}
                onChange={(e) => onChangeMudarabahRatio(e.target.value)}
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-xs tabular-nums text-white"
                required
              />
            </label>
            <label className="block text-xs text-slate-300 space-y-1 md:col-span-2">
              <span>Operational Note</span>
              <input
                type="text"
                value={mudarabahNote}
                onChange={(e) => onChangeMudarabahNote(e.target.value)}
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white"
                required
              />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-lg bg-slate-950 border border-slate-800 p-3 text-xs tabular-nums">
            <div>
              <span className="text-slate-400">Partner Capital Pool ({ratio}%)</span>
              <div className="mt-0.5 font-semibold text-emerald-300">
                {partnerShareNvc.toFixed(4)} NVC · {formatUsd(nvcToUsd(partnerShareNvc))}
              </div>
            </div>
            <div>
              <span className="text-slate-400">Operating Guild Retained ({100 - ratio}%)</span>
              <div className="mt-0.5 font-semibold text-amber-300">
                {operatorShareNvc.toFixed(4)} NVC · {formatUsd(nvcToUsd(operatorShareNvc))}
              </div>
            </div>
          </div>

          <div
            className={`rounded-lg border px-3 py-2 text-xs flex items-center gap-2 ${
              mudarabahScan.passed
                ? 'border-emerald-800/40 bg-emerald-950/20 text-emerald-300'
                : 'border-rose-800/50 bg-rose-950/30 text-rose-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>{mudarabahScan.message}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="submit"
              className="rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs px-4 py-2 whitespace-nowrap cursor-pointer"
            >
              Distribute Halal Surplus
            </button>
            <button
              type="button"
              onClick={() => onChangeMudarabahNote('Guaranteed 10% fixed interest payout')}
              className="rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-medium px-3 py-2 whitespace-nowrap cursor-pointer"
            >
              Test Riba Note
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
