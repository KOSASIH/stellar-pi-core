import { useState, type FormEvent } from 'react';
import { AlertTriangle, Cpu, ShieldCheck, Vote } from 'lucide-react';
import { formatUsd, type EcosystemSnapshot, type ScpBlock } from '../../../shared/novaPolicy.ts';
import { preScreenCompliance } from '../lib/novaLocalEngine.ts';

interface OracleScpPanelProps {
  snapshot: EcosystemSnapshot;
  selectedCitizenId: string;
  newProposalTitle: string;
  newProposalDesc: string;
  onChangeSelectedCitizenId: (id: string) => void;
  onChangeNewProposalTitle: (v: string) => void;
  onChangeNewProposalDesc: (v: string) => void;
  onOracleVerify: (nodeId: string, value: number) => void;
  onRunAudit: () => void;
  onLaunchMainnet: () => void;
  onCreateProposal: (e: FormEvent) => void;
  onCastVote: (proposalId: string, vote: 'yes' | 'no') => void;
  onSealScpBlock: () => void;
}

export function OracleScpPanel({
  snapshot,
  selectedCitizenId,
  newProposalTitle,
  newProposalDesc,
  onChangeSelectedCitizenId,
  onChangeNewProposalTitle,
  onChangeNewProposalDesc,
  onOracleVerify,
  onRunAudit,
  onLaunchMainnet,
  onCreateProposal,
  onCastVote,
  onSealScpBlock,
}: OracleScpPanelProps) {
  const [inspectedBlock, setInspectedBlock] = useState<ScpBlock | null>(null);
  const proposalPreScan = preScreenCompliance(`${newProposalTitle} ${newProposalDesc}`);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-white">
                Global NOVA Oracle Compliance Verifier
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Nodes reporting any value other than $3.14 are flagged for community vote.
              </p>
            </div>
            <span className="text-xs font-medium text-emerald-300">
              Stabilizer: {snapshot.stabilizerStatus}
            </span>
          </div>

          <div className="divide-y divide-slate-800/80">
            {snapshot.oracleNodes.map((node) => (
              <div
                key={node.id}
                className="py-3.5 first:pt-1 last:pb-1 flex flex-wrap items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-mono text-slate-300">{node.id}</span>
                    <span className="text-slate-500">·</span>
                    <span
                      className={`font-medium capitalize ${
                        node.status === 'verified' ? 'text-emerald-300' : 'text-rose-300'
                      }`}
                    >
                      {node.status}
                    </span>
                  </div>
                  <p className="text-sm text-white mt-0.5">{node.region}</p>
                  <p className="text-xs text-slate-400 tabular-nums">
                    Reported: {formatUsd(node.reportedValueUsd)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onOracleVerify(node.id, 3.14)}
                    className="text-xs px-3 py-1.5 rounded bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-600/40 text-emerald-300 cursor-pointer whitespace-nowrap"
                  >
                    Sync $3.14
                  </button>
                  <button
                    type="button"
                    onClick={() => onOracleVerify(node.id, 3.2)}
                    className="text-xs px-3 py-1.5 rounded bg-rose-600/20 hover:bg-rose-600/30 border border-rose-600/40 text-rose-300 cursor-pointer whitespace-nowrap"
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
            <h2 className="text-base font-semibold text-white">Mainnet Governor & Ethical Rules</h2>
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
              <dd className="mt-1 font-medium text-white">{snapshot.rules.founderAccountability}</dd>
            </div>
            <div className="rounded-lg bg-slate-950 border border-slate-800 p-3">
              <dt className="text-slate-400">Sharia Compliant</dt>
              <dd className="mt-1 font-medium text-emerald-300">{snapshot.rules.shariaCompliant}</dd>
            </div>
          </dl>

          {snapshot.metrics.isolatedOracleNodes > 0 && (
            <div className="rounded-lg border border-amber-700/50 bg-amber-950/30 p-3 text-xs text-amber-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>
                {snapshot.metrics.isolatedOracleNodes} isolated node(s) must be restored to $3.14 before mainnet launch.
              </span>
            </div>
          )}

          <div className="flex flex-col gap-2.5 pt-1">
            <button
              type="button"
              onClick={onRunAudit}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-sm font-medium text-white px-4 py-2.5 cursor-pointer"
            >
              Run Ecosystem Compliance Audit
            </button>
            <button
              type="button"
              onClick={onLaunchMainnet}
              disabled={snapshot.mainnetLaunched}
              className="w-full rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm px-4 py-2.5 disabled:opacity-50 cursor-pointer"
            >
              {snapshot.mainnetLaunched ? 'Mainnet Launched' : 'Execute Mainnet Launch'}
            </button>
          </div>
        </div>
      </div>

      {/* 1-Person = 1-Vote Community Governance Ballots */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-white">
              1-Person = 1-Vote Community Governance Ballots
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Every 1-KYC verified Citizen casts one equal vote. Proposals violating $3.14, Zero Riba, or Zero Gambling are blocked automatically.
            </p>
          </div>
          <label className="flex items-center gap-2 text-xs text-slate-300">
            <span>Active Voter:</span>
            <select
              value={selectedCitizenId}
              onChange={(e) => onChangeSelectedCitizenId(e.target.value)}
              className="rounded-lg bg-slate-950 border border-slate-700 px-3 py-1.5 text-xs text-white"
            >
              {snapshot.citizens.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.displayName} ({c.id}) · Rep {c.reputationScore}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <form
            onSubmit={onCreateProposal}
            className="lg:col-span-4 rounded-lg border border-slate-800 bg-slate-950/70 p-4 space-y-3 h-fit"
          >
            <h3 className="text-sm font-semibold text-white">Submit Community Proposal</h3>
            <input
              type="text"
              value={newProposalTitle}
              onChange={(e) => onChangeNewProposalTitle(e.target.value)}
              placeholder="Proposal title..."
              className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white"
              required
            />
            <textarea
              rows={2}
              value={newProposalDesc}
              onChange={(e) => onChangeNewProposalDesc(e.target.value)}
              placeholder="Describe policy or real-economy upgrade..."
              className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white"
              required
            />
            {(newProposalTitle || newProposalDesc) && (
              <div
                className={`rounded-lg border px-2.5 py-1.5 text-[11px] flex items-center gap-1.5 ${
                  proposalPreScan.passed
                    ? 'border-emerald-800/40 bg-emerald-950/20 text-emerald-300'
                    : 'border-rose-800/50 bg-rose-950/30 text-rose-200'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span>{proposalPreScan.message}</span>
              </div>
            )}
            <button
              type="submit"
              className="w-full rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs px-3 py-2 cursor-pointer"
            >
              Open Citizen Ballot
            </button>
          </form>

          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-3">
            {snapshot.proposals.map((prop) => {
              const alreadyVoted = prop.voters.includes(selectedCitizenId);
              const totalVotes = Math.max(1, prop.yesVotes + prop.noVotes);
              const yesPct = Math.round((prop.yesVotes / totalVotes) * 100);
              return (
                <div
                  key={prop.id}
                  className="rounded-lg border border-slate-800 bg-slate-950/70 p-4 flex flex-col justify-between gap-3"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2 text-xs text-slate-400">
                      <span>{prop.category}</span>
                      <span
                        className={`font-medium capitalize ${
                          prop.status === 'passed'
                            ? 'text-emerald-300'
                            : prop.status === 'rejected'
                              ? 'text-rose-300'
                              : 'text-amber-300'
                        }`}
                      >
                        {prop.status}
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-white">{prop.title}</h4>
                    <p className="text-xs text-slate-400">{prop.description}</p>
                    <p className="text-[11px] text-amber-300/90">{prop.aiForecast}</p>
                    <div className="h-1.5 w-full rounded bg-slate-900 overflow-hidden flex pt-0.5">
                      <div className="bg-emerald-400" style={{ width: `${yesPct}%` }} />
                      <div className="bg-rose-500/80" style={{ width: `${100 - yesPct}%` }} />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                    <span className="text-xs tabular-nums text-slate-300">
                      Yes: <strong className="text-emerald-300">{prop.yesVotes}</strong> · No:{' '}
                      <strong className="text-rose-300">{prop.noVotes}</strong>
                    </span>
                    {prop.status === 'open' ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={alreadyVoted}
                          onClick={() => onCastVote(prop.id, 'yes')}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-200 text-xs disabled:opacity-40 cursor-pointer"
                        >
                          <Vote className="w-3 h-3" />
                          Yes
                        </button>
                        <button
                          type="button"
                          disabled={alreadyVoted}
                          onClick={() => onCastVote(prop.id, 'no')}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-200 text-xs disabled:opacity-40 cursor-pointer"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-500">Ballot finalized</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* SCP Consensus Block Explorer & Sealer */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-white">
              Stellar Consensus Protocol (SCP) Block Explorer
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Latest Sealed Block:{' '}
              <span className="text-amber-300 font-semibold tabular-nums">
                #{snapshot.metrics.latestBlockHeight}
              </span>{' '}
              · Zero Proof-of-Work · 0.04 Wh per finality round. Click any block to inspect cryptographic linkage.
            </p>
          </div>
          <button
            type="button"
            onClick={onSealScpBlock}
            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs px-3.5 py-2 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Cpu className="w-3.5 h-3.5" />
            Seal SCP Block
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-2 pr-3 font-medium">Height</th>
                <th className="py-2 px-3 font-medium">Transactions</th>
                <th className="py-2 px-3 font-medium">Settled Value</th>
                <th className="py-2 px-3 font-medium">Validator Quorum</th>
                <th className="py-2 px-3 font-medium">Energy</th>
                <th className="py-2 pl-3 font-medium">Block Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {snapshot.scpBlocks.map((blk) => {
                const selected = inspectedBlock?.height === blk.height;
                return (
                  <tr
                    key={blk.height}
                    onClick={() => setInspectedBlock(selected ? null : blk)}
                    className={`cursor-pointer transition-colors ${
                      selected ? 'bg-amber-500/10' : 'hover:bg-slate-800/30'
                    }`}
                  >
                    <td className="py-2.5 pr-3 font-mono font-semibold text-amber-300 tabular-nums">
                      #{blk.height}
                    </td>
                    <td className="py-2.5 px-3 tabular-nums text-white">{blk.txCount} tx</td>
                    <td className="py-2.5 px-3 tabular-nums text-emerald-300">
                      {blk.totalNvc} NVC ({blk.totalMicronNova.toLocaleString()} µNVC)
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">{blk.quorum}</td>
                    <td className="py-2.5 px-3 tabular-nums text-slate-300">{blk.energyWh} Wh</td>
                    <td className="py-2.5 pl-3 font-mono text-[11px] text-slate-400">
                      {blk.hash.slice(0, 22)}...
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {inspectedBlock && (
          <div className="rounded-lg border border-amber-500/30 bg-slate-950 p-4 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <strong className="text-amber-300 font-mono">
                SCP Block #{inspectedBlock.height} Cryptographic Header
              </strong>
              <span className="text-slate-400 tabular-nums">
                Sealed {new Date(inspectedBlock.sealedAt).toLocaleString()}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 font-mono text-[11px] text-slate-300">
              <div className="truncate">Hash: {inspectedBlock.hash}</div>
              <div className="truncate">Prev: {inspectedBlock.previousHash}</div>
            </div>
            <div className="text-slate-300">
              Included TXs:{' '}
              <span className="font-mono text-white">
                {inspectedBlock.txIds.length > 0 ? inspectedBlock.txIds.join(', ') : 'Empty heartbeat round'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
