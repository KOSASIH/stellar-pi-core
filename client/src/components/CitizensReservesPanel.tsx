import type { FormEvent } from 'react';
import { CheckCircle2, Smartphone } from 'lucide-react';
import {
  formatMicronNova,
  formatUsd,
  nvcToUsd,
  type EcosystemSnapshot,
} from '../../../shared/novaPolicy.ts';

interface CitizensReservesPanelProps {
  snapshot: EcosystemSnapshot;
  newCitizenName: string;
  newCitizenRegion: string;
  newCitizenDevice: string;
  mineAmountNvc: string;
  converterNvc: string;
  p2pFromCitizen: string;
  p2pToCitizen: string;
  p2pAmount: string;
  miningNotice: {
    citizenId: string;
    amount: number;
    sessions: number;
    timestamp: string;
  } | null;
  onChangeNewCitizenName: (v: string) => void;
  onChangeNewCitizenRegion: (v: string) => void;
  onChangeNewCitizenDevice: (v: string) => void;
  onChangeMineAmountNvc: (v: string) => void;
  onChangeConverterNvc: (v: string) => void;
  onChangeP2pFromCitizen: (v: string) => void;
  onChangeP2pToCitizen: (v: string) => void;
  onChangeP2pAmount: (v: string) => void;
  onRegisterCitizen: (e: FormEvent) => void;
  onMobileMine: (citizenId: string) => void;
  onCitizenP2P: (e: FormEvent) => void;
}

export function CitizensReservesPanel({
  snapshot,
  newCitizenName,
  newCitizenRegion,
  newCitizenDevice,
  mineAmountNvc,
  converterNvc,
  p2pFromCitizen,
  p2pToCitizen,
  p2pAmount,
  miningNotice,
  onChangeNewCitizenName,
  onChangeNewCitizenRegion,
  onChangeNewCitizenDevice,
  onChangeMineAmountNvc,
  onChangeConverterNvc,
  onChangeP2pFromCitizen,
  onChangeP2pToCitizen,
  onChangeP2pAmount,
  onRegisterCitizen,
  onMobileMine,
  onCitizenP2P,
}: CitizensReservesPanelProps) {
  const { constants } = snapshot;
  const senderCitizen = snapshot.citizens.find((c) => c.id === p2pFromCitizen);
  const p2pNumeric = Number(p2pAmount) || 0;
  const p2pSelf = p2pFromCitizen === p2pToCitizen;
  const p2pInsufficient = Boolean(senderCitizen && p2pNumeric > senderCitizen.balanceNvc);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <form
          onSubmit={onRegisterCitizen}
          className="lg:col-span-5 rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4 h-fit"
        >
          <div>
            <h2 className="text-base font-semibold text-white">
              1-Person = 1-KYC Citizen Onboarding
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Mobile-first fair distribution protected by Anti-Sybil HyperGuard and 0.01% max wallet cap (10M NVC).
            </p>
          </div>

          <label className="block text-xs text-slate-300 space-y-1">
            <span>Citizen Full Name</span>
            <input
              type="text"
              value={newCitizenName}
              onChange={(e) => onChangeNewCitizenName(e.target.value)}
              placeholder="e.g. Tariq Al-Mansoor"
              className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-white"
              required
            />
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block text-xs text-slate-300 space-y-1">
              <span>Region</span>
              <select
                value={newCitizenRegion}
                onChange={(e) => onChangeNewCitizenRegion(e.target.value)}
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-white"
              >
                <option value="Asia-Pacific (ID)">Asia-Pacific (ID)</option>
                <option value="Middle East (AE)">Middle East (AE)</option>
                <option value="Europe (EU)">Europe (EU)</option>
                <option value="North America (US)">North America (US)</option>
                <option value="Africa (NG)">Africa (NG)</option>
              </select>
            </label>
            <label className="block text-xs text-slate-300 space-y-1">
              <span>Mobile Device ID</span>
              <input
                type="text"
                value={newCitizenDevice}
                onChange={(e) => onChangeNewCitizenDevice(e.target.value)}
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm font-mono text-white"
                required
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              className="flex-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm px-4 py-2.5 cursor-pointer"
            >
              Verify 1-KYC Citizen
            </button>
            <button
              type="button"
              onClick={() => {
                onChangeNewCitizenName('Sybil Clone Attempt');
                onChangeNewCitizenDevice('DEV-RASPI-09');
              }}
              className="rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-300 text-xs font-medium px-3 py-2.5 cursor-pointer"
            >
              Test Sybil Device
            </button>
          </div>

          {/* Live NVC <-> USD <-> Micron Nova Utility Converter */}
          <div className="pt-4 border-t border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-white">Real-Economy Settlement Converter</span>
              <span className="text-slate-400">0% Interest · $0.001 SCP Fee</span>
            </div>
            <div className="grid grid-cols-3 gap-2 items-center">
              <input
                type="number"
                min="0"
                step="any"
                value={converterNvc}
                onChange={(e) => onChangeConverterNvc(e.target.value)}
                className="rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm tabular-nums text-white"
              />
              <div className="rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs tabular-nums">
                <span className="text-slate-400 block">USD Value</span>
                <strong className="text-emerald-300">
                  {formatUsd(nvcToUsd(Number(converterNvc) || 0))}
                </strong>
              </div>
              <div className="rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs tabular-nums">
                <span className="text-slate-400 block">Micron Nova</span>
                <strong className="text-amber-300">
                  {formatMicronNova(Number(converterNvc) || 0)}
                </strong>
              </div>
            </div>
          </div>
        </form>

        <div className="lg:col-span-7 rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-white">
                Mobile SCP Mining & Verified Citizens ({snapshot.metrics.verifiedCitizens})
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Zero Proof-of-Work waste. Every mobile mining payout is validated by NovaHyperMind at $3.14.
              </p>
            </div>
            <label className="flex items-center gap-2 text-xs text-slate-300">
              <span>Mine Reward:</span>
              <select
                value={mineAmountNvc}
                onChange={(e) => onChangeMineAmountNvc(e.target.value)}
                className="rounded-lg bg-slate-950 border border-slate-700 px-2.5 py-1.5 text-xs text-white tabular-nums"
              >
                <option value="0.286624">0.286624 NVC (286,624 µNVC)</option>
                <option value="1">1.00 NVC (1,000,000 µNVC)</option>
                <option value="5">5.00 NVC (5,000,000 µNVC)</option>
              </select>
            </label>
          </div>

          {miningNotice && (
            <div
              role="status"
              className="flex items-center justify-between gap-2 rounded-lg border border-emerald-700/60 bg-emerald-950/60 px-3.5 py-2.5 text-xs text-emerald-200"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span className="tabular-nums">
                  {miningNotice.citizenId} mined {miningNotice.amount} NVC (
                  {formatMicronNova(miningNotice.amount)} ={' '}
                  {formatUsd(nvcToUsd(miningNotice.amount))}) · Session #{miningNotice.sessions}
                </span>
              </div>
              <span className="text-[11px] text-emerald-300/80 tabular-nums shrink-0">
                {new Date(miningNotice.timestamp).toLocaleTimeString()}
              </span>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2 pr-3 font-medium">Citizen & Device</th>
                  <th className="py-2 px-3 font-medium">Region</th>
                  <th className="py-2 px-3 font-medium text-right">Reputation</th>
                  <th className="py-2 px-3 font-medium text-right">Balance & 0.01% Cap</th>
                  <th className="py-2 pl-3 font-medium text-right">Mobile SCP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {snapshot.citizens.map((citizen) => {
                  const capPct = (citizen.balanceNvc / constants.maxWalletHoldingNvc) * 100;
                  return (
                    <tr key={citizen.id} className="hover:bg-slate-800/30">
                      <td className="py-3 pr-3">
                        <div className="font-medium text-white">{citizen.displayName}</div>
                        <div className="font-mono text-[11px] text-slate-400">
                          {citizen.id} · {citizen.deviceFingerprint}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-300">{citizen.region}</td>
                      <td className="py-3 px-3 text-right tabular-nums text-emerald-300 font-medium">
                        {citizen.reputationScore}/100
                      </td>
                      <td className="py-3 px-3 text-right tabular-nums">
                        <div className="text-white font-semibold">{citizen.balanceNvc.toFixed(4)} NVC</div>
                        <div className="text-[11px] text-slate-400">
                          {formatUsd(nvcToUsd(citizen.balanceNvc))} · {capPct.toFixed(4)}% of cap
                        </div>
                      </td>
                      <td className="py-3 pl-3 text-right">
                        <button
                          type="button"
                          onClick={() => onMobileMine(citizen.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-200 text-xs font-medium whitespace-nowrap cursor-pointer"
                        >
                          <Smartphone className="w-3.5 h-3.5" />
                          Mine NVC
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Closed-Loop 1-KYC Citizen P2P Instant Transfer */}
      <form
        onSubmit={onCitizenP2P}
        className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4"
      >
        <div>
          <h2 className="text-base font-semibold text-white">
            Closed-Loop 1-KYC Citizen P2P Transfer
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Zero-interest direct transfers between verified Citizens at 1 NVC = $3.14 USD ({formatMicronNova(p2pNumeric)} · {formatUsd(nvcToUsd(p2pNumeric))}).
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <label className="block text-xs text-slate-300 space-y-1">
            <span>From Citizen</span>
            <select
              value={p2pFromCitizen}
              onChange={(e) => onChangeP2pFromCitizen(e.target.value)}
              className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white"
            >
              {snapshot.citizens.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.displayName} ({c.balanceNvc.toFixed(2)} NVC)
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs text-slate-300 space-y-1">
            <span>To Citizen</span>
            <select
              value={p2pToCitizen}
              onChange={(e) => onChangeP2pToCitizen(e.target.value)}
              className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white"
            >
              {snapshot.citizens.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.displayName} ({c.balanceNvc.toFixed(2)} NVC)
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs text-slate-300 space-y-1">
            <span>Amount (NVC)</span>
            <input
              type="number"
              min="0.000001"
              step="any"
              value={p2pAmount}
              onChange={(e) => onChangeP2pAmount(e.target.value)}
              className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-xs tabular-nums text-white"
              required
            />
          </label>
          <button
            type="submit"
            disabled={p2pSelf || p2pInsufficient}
            className="rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs px-4 py-2.5 whitespace-nowrap disabled:opacity-40 cursor-pointer"
          >
            Send P2P NVC
          </button>
        </div>
        {(p2pSelf || p2pInsufficient) && (
          <p className="text-xs text-rose-300">
            {p2pSelf
              ? 'Sender and recipient must be distinct verified Citizens.'
              : `Insufficient balance (${senderCitizen?.balanceNvc.toFixed(4)} NVC available).`}
          </p>
        )}
      </form>

      {/* 1.5x Reserve Proof-of-Collateral Ledger */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-white">
              1.5x Real-Economy Reserve Proof-of-Collateral
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              $471.00B audited Halal real-economy assets backing $314.00B NVC network peg value ({snapshot.metrics.collateralRatioActual}x actual vs {constants.collateralRatio}x target).
            </p>
          </div>
          <span className="text-xs font-medium text-emerald-300">100% Riba-Free Custody · Audited</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-2 pr-3 font-medium">Asset Class</th>
                <th className="py-2 px-3 font-medium">Custody & Structure</th>
                <th className="py-2 px-3 font-medium text-right">Share</th>
                <th className="py-2 px-3 font-medium text-right">Audited Backing (USD)</th>
                <th className="py-2 pl-3 font-medium text-right">Sharia Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {snapshot.collateralReserves.map((res) => (
                <tr key={res.id} className="hover:bg-slate-800/30">
                  <td className="py-3 pr-3 font-medium text-white">{res.assetClass}</td>
                  <td className="py-3 px-3 text-slate-300">{res.custodyType}</td>
                  <td className="py-3 px-3 text-right tabular-nums text-amber-300 font-medium">
                    {res.sharePercent}%
                  </td>
                  <td className="py-3 px-3 text-right tabular-nums text-white font-semibold">
                    ${(res.backingUsd / 1e9).toFixed(1)}B
                  </td>
                  <td className="py-3 pl-3 text-right text-emerald-300 font-medium">
                    {res.halalCertified ? 'Halal · 0% Interest' : 'Pending'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
