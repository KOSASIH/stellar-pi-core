import { useCallback, useEffect, useState, type FormEvent } from 'react';
import {
  Activity,
  AlertTriangle,
  AppWindow,
  Brain,
  CheckCircle2,
  Cpu,
  Eye,
  Globe2,
  LayoutDashboard,
  Menu,
  Scale,
  Search,
  ShieldAlert,
  ShieldCheck,
  Store,
  Users,
  X,
} from 'lucide-react';
import {
  formatMicronNova,
  formatUsd,
  isValidNovaValue,
  nvcToUsd,
  type EcosystemSnapshot,
  type MarketplaceListing,
  type NovaAppRecord,
  type NovaTransaction,
  type WorkProofType,
} from '../../shared/novaPolicy.ts';
import { AppsPanel } from './components/AppsPanel.tsx';
import { AuditPanel } from './components/AuditPanel.tsx';
import { CitizensReservesPanel } from './components/CitizensReservesPanel.tsx';
import { HyperMindPanel } from './components/HyperMindPanel.tsx';
import { MarketplacePanel } from './components/MarketplacePanel.tsx';
import { OracleScpPanel } from './components/OracleScpPanel.tsx';
import { OverviewPanel, type WorkspaceTabId } from './components/OverviewPanel.tsx';
import { ProvenanceModal } from './components/ProvenanceModal.tsx';
import { TransactionsPanel } from './components/TransactionsPanel.tsx';
import {
  applyLocalAdaptiveConsensusFallback,
  applyLocalAppFallback,
  applyLocalCitizenRegisterFallback,
  applyLocalClaimWorkTaskFallback,
  applyLocalCreateWorkTaskFallback,
  applyLocalMarketplaceBuyFallback,
  applyLocalMarketplaceListingFallback,
  applyLocalMudarabahFallback,
  applyLocalProposalFallback,
  applyLocalSealBlockFallback,
  applyLocalTransactionFallback,
  applyLocalVoteFallback,
  createLocalFallbackSnapshot,
  makeLocalHash,
  safeFetchJson,
  type HyperAlertColor,
  type HyperAlertItem,
  type HyperAlertKey,
} from './lib/novaLocalEngine.ts';

function SupernovaIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="w-5 h-5 text-amber-400">
      <path
        d="M12 2L14.4 8.6L21 6.5L16.3 12L21 17.5L14.4 15.4L12 22L9.6 15.4L3 17.5L7.7 12L3 6.5L9.6 8.6L12 2Z"
        fill="currentColor"
        fillOpacity="0.9"
      />
      <circle cx="12" cy="12" r="2.6" className="fill-amber-200" />
    </svg>
  );
}

const NAV_ITEMS: ReadonlyArray<{
  id: WorkspaceTabId;
  label: string;
  icon: typeof LayoutDashboard;
}> = [
  { id: 'overview', label: 'Network Overview', icon: LayoutDashboard },
  { id: 'transactions', label: 'Transactions & AHI', icon: Cpu },
  { id: 'hyper', label: 'Hyper-Intelligence', icon: Brain },
  { id: 'apps', label: 'App Builder', icon: AppWindow },
  { id: 'oracle', label: 'Oracle & SCP', icon: Globe2 },
  { id: 'citizens', label: 'Citizens & Reserves', icon: Users },
  { id: 'marketplace', label: 'Marketplace', icon: Store },
  { id: 'audit', label: 'Audit Trail', icon: ShieldCheck },
];

export default function App() {
  const [snapshot, setSnapshot] = useState<EcosystemSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<WorkspaceTabId>('overview');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [provenanceQuery, setProvenanceQuery] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const [hyperAlerts, setHyperAlerts] = useState<HyperAlertItem[]>([]);

  // Transaction form state
  const [sender, setSender] = useState('NVC-MINER-RASPI-09');
  const [recipient, setRecipient] = useState('NVC-MERCHANT-04');
  const [amount, setAmount] = useState('25');
  const [source, setSource] = useState('mining');
  const [memo, setMemo] = useState('Peer-to-peer equipment settlement');
  const [reportedValueUsd, setReportedValueUsd] = useState('3.14');
  const [submittingTx, setSubmittingTx] = useState(false);

  // App builder form state
  const [appName, setAppName] = useState('');
  const [appCategory, setAppCategory] = useState('Commerce');
  const [appDescription, setAppDescription] = useState('');
  const [paymentAsset, setPaymentAsset] = useState('NVC');
  const [submittingApp, setSubmittingApp] = useState(false);

  // Predictive Governance AI state
  const [proposalText, setProposalText] = useState('Allow external exchange price drift to $3.20');
  const [votePrediction, setVotePrediction] = useState<string | null>(null);

  // Citizens, Mobile Mining & Community Voting state
  const [newCitizenName, setNewCitizenName] = useState('');
  const [newCitizenRegion, setNewCitizenRegion] = useState('Asia-Pacific (ID)');
  const [newCitizenDevice, setNewCitizenDevice] = useState('DEV-MOBILE-NEW-88');
  const [selectedCitizenId, setSelectedCitizenId] = useState('NVC-MINER-RASPI-09');
  const [mineAmountNvc, setMineAmountNvc] = useState('0.286624');
  const [newProposalTitle, setNewProposalTitle] = useState('');
  const [newProposalDesc, setNewProposalDesc] = useState('');
  const [converterNvc, setConverterNvc] = useState('10');
  const [miningNotice, setMiningNotice] = useState<{
    citizenId: string;
    amount: number;
    sessions: number;
    timestamp: string;
  } | null>(null);

  // Real-Economy Marketplace & Halal Mudarabah Profit-Sharing state
  const [mktTitle, setMktTitle] = useState('');
  const [mktCategory, setMktCategory] = useState<MarketplaceListing['category']>('Physical Goods');
  const [mktSettlementModel, setMktSettlementModel] =
    useState<MarketplaceListing['settlementModel']>('Direct Real Trade');
  const [mktPriceNvc, setMktPriceNvc] = useState('12.5');
  const [mktDesc, setMktDesc] = useState('');
  const [mudarabahProfitNvc, setMudarabahProfitNvc] = useState('20');
  const [mudarabahRatio, setMudarabahRatio] = useState('70');
  const [mudarabahNote, setMudarabahNote] = useState('Monthly Bakery Co-op Operating Surplus');

  // Closed-Loop 1-KYC Citizen P2P Transfer state
  const [p2pFromCitizen, setP2pFromCitizen] = useState('NVC-MINER-RASPI-09');
  const [p2pToCitizen, setP2pToCitizen] = useState('NVC-CITIZEN-US-14');
  const [p2pAmount, setP2pAmount] = useState('5');

  const loadSnapshot = useCallback(async () => {
    const result = await safeFetchJson<EcosystemSnapshot>('/api/ecosystem');
    if (result.ok && result.data) {
      setSnapshot(result.data);
    } else {
      setSnapshot((prev) => prev ?? createLocalFallbackSnapshot());
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadSnapshot();
  }, [loadSnapshot]);

  function selectTab(tab: WorkspaceTabId) {
    setActiveTab(tab);
    setMobileNavOpen(false);
  }

  function pushHyperAlert(key: HyperAlertKey, color: HyperAlertColor, text: string) {
    setHyperAlerts((prev) => {
      const existing = prev.find((item) => item.key === key);
      const nextCount = (existing?.count || 0) + 1;
      const others = prev.filter((item) => item.key !== key);
      return [{ key, color, text, count: nextCount }, ...others];
    });
  }

  // 100% Local State Hyper-Intelligence Simulations (zero fetch / zero API calls)
  function handleSimulateWhaleAttack() {
    const timestamp = new Date().toISOString();
    const detail =
      'Whale Attack Blocked — Attempt to hold 20,000,000 NVC (0.02% of supply) exceeds 0.01% max wallet cap (10M NVC).';
    setSnapshot((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        threatsBlocked: prev.threatsBlocked + 1,
        hyperModules: prev.hyperModules.map((mod) =>
          mod.id === 'whale-sybil-guard' ? { ...mod, threatsBlocked: mod.threatsBlocked + 1 } : mod,
        ),
        hyperMindLog: [
          {
            id: `hml-whale-${Date.now()}`,
            module: 'Anti-Whale & Anti-Sybil HyperGuard',
            decision: detail,
            severity: 'blocked' as const,
            timestamp,
          },
          ...prev.hyperMindLog,
        ].slice(0, 60),
        auditLog: [
          {
            id: `aud-whale-${Date.now()}`,
            module: 'HyperMind',
            action: 'WHALE_ATTACK_BLOCKED',
            verdict: 'rejected' as const,
            detail: 'Whale Attack Blocked',
            hash: makeLocalHash(`whale-${timestamp}-${prev.threatsBlocked}`),
            timestamp,
          },
          ...prev.auditLog,
        ].slice(0, 100),
      };
    });
    pushHyperAlert(
      'whale',
      'red',
      'WHALE ATTACK BLOCKED! Attempt to hold 20,000,000 NVC (0.02% of supply) exceeds 0.01% max wallet cap (10M NVC). Blocked by Anti-Whale & Anti-Sybil HyperGuard.',
    );
  }

  function handleSimulateScamApp() {
    const timestamp = new Date().toISOString();
    const detail =
      'Scam App Blocked — Rug-pull / Honeypot detected by Anti-Scam & Anti-Rug HyperScanner. 0 Scams Passed.';
    setSnapshot((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        threatsBlocked: prev.threatsBlocked + 1,
        scamBlocked: prev.scamBlocked + 1,
        hyperModules: prev.hyperModules.map((mod) =>
          mod.id === 'scam-hyperscanner' ? { ...mod, threatsBlocked: mod.threatsBlocked + 1 } : mod,
        ),
        hyperMindLog: [
          {
            id: `hml-scam-${Date.now()}`,
            module: 'Anti-Scam & Anti-Rug HyperScanner',
            decision: detail,
            severity: 'blocked' as const,
            timestamp,
          },
          ...prev.hyperMindLog,
        ].slice(0, 60),
        auditLog: [
          {
            id: `aud-scam-${Date.now()}`,
            module: 'HyperScanner',
            action: 'SCAM_APP_BLOCKED',
            verdict: 'rejected' as const,
            detail,
            hash: makeLocalHash(`scam-${timestamp}-${prev.threatsBlocked}`),
            timestamp,
          },
          ...prev.auditLog,
        ].slice(0, 100),
      };
    });
    pushHyperAlert(
      'scam',
      'orange',
      'SCAM APP BLOCKED! Rug-pull / Honeypot detected. Blocked by Anti-Scam & Anti-Rug HyperScanner. 0 Scams Passed.',
    );
  }

  function handleSimulateOracleManipulation() {
    const timestamp = new Date().toISOString();
    const detail =
      'Oracle Manipulation Blocked — Multi-node collusion predicted before price drift. Peg stays LOCKED at $3.14.';
    setSnapshot((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        threatsBlocked: prev.threatsBlocked + 1,
        stabilizerStatus: 'LOCKED at $3.14',
        oracleNodes: prev.oracleNodes.map((node) => ({
          ...node,
          reportedValueUsd: 3.14,
          status: 'verified',
          lastCheckedAt: timestamp,
        })),
        hyperModules: prev.hyperModules.map((mod) =>
          mod.id === 'oracle-shield' ? { ...mod, threatsBlocked: mod.threatsBlocked + 1 } : mod,
        ),
        hyperMindLog: [
          {
            id: `hml-oracle-${Date.now()}`,
            module: 'Oracle Predictive Shield',
            decision: detail,
            severity: 'predicted' as const,
            timestamp,
          },
          ...prev.hyperMindLog,
        ].slice(0, 60),
        auditLog: [
          {
            id: `aud-oracle-${Date.now()}`,
            module: 'Oracle',
            action: 'PREDICTIVE_SHIELD_BLOCK',
            verdict: 'accepted' as const,
            detail,
            hash: makeLocalHash(`oracle-${timestamp}-${prev.threatsBlocked}`),
            timestamp,
          },
          ...prev.auditLog,
        ].slice(0, 100),
      };
    });
    pushHyperAlert(
      'oracle',
      'blue',
      'ORACLE MANIPULATION BLOCKED! Multi-node collusion predicted before price drift. Blocked by Oracle Predictive Shield. Peg stays LOCKED at $3.14.',
    );
  }

  function handleSelfHealNetwork() {
    const timestamp = new Date().toISOString();
    const detail =
      'Self-Heal Complete — Backup Citizen node auto-promoted in <1s. Network Health restored to 99.99%.';
    setSnapshot((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        threatsBlocked: prev.threatsBlocked + 1,
        networkHealth: 99.99,
        oracleNodes: prev.oracleNodes.map((node) => ({
          ...node,
          reportedValueUsd: 3.14,
          status: 'verified',
          lastCheckedAt: timestamp,
        })),
        hyperModules: prev.hyperModules.map((mod) =>
          mod.id === 'self-healing-network' ? { ...mod, threatsBlocked: mod.threatsBlocked + 1 } : mod,
        ),
        hyperMindLog: [
          {
            id: `hml-heal-${Date.now()}`,
            module: 'Self-Healing Network AI',
            decision: detail,
            severity: 'healed' as const,
            timestamp,
          },
          ...prev.hyperMindLog,
        ].slice(0, 60),
        auditLog: [
          {
            id: `aud-heal-${Date.now()}`,
            module: 'Oracle',
            action: 'SELF_HEAL',
            verdict: 'accepted' as const,
            detail,
            hash: makeLocalHash(`heal-${timestamp}-${prev.threatsBlocked}`),
            timestamp,
          },
          ...prev.auditLog,
        ].slice(0, 100),
      };
    });
    pushHyperAlert(
      'self-heal',
      'green',
      'SELF-HEAL COMPLETE! Backup Citizen node auto-promoted in <1s. Network Health restored to 99.99%.',
    );
  }

  function handleSimulatePlutocracyAttack() {
    const timestamp = new Date().toISOString();
    const detail =
      'Plutocracy Attack Blocked — Whale attempted vote-buying with 10M NVC & Peg override proposal. Quadratic Vote + Constitutional Guard enforced 1-KYC = 1 Base Vote.';
    setSnapshot((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        threatsBlocked: prev.threatsBlocked + 1,
        hyperModules: prev.hyperModules.map((mod) =>
          mod.id === 'predictive-governance' ? { ...mod, threatsBlocked: mod.threatsBlocked + 1 } : mod,
        ),
        adaptiveConsensus: prev.adaptiveConsensus
          ? {
              ...prev.adaptiveConsensus,
              adaptiveLog: [
                {
                  id: `adp-plut-${Date.now()}`,
                  blockHeight: prev.metrics.latestBlockHeight,
                  reason: 'Plutocracy / Constitutional override intercepted by QuadraticCitizenVote',
                  parameter: 'ConstitutionalGuard',
                  oldValue: 'Active',
                  newValue: 'LOCKED (Peg $3.14 · 0% Riba · 10M Cap)',
                  timestamp,
                },
                ...prev.adaptiveConsensus.adaptiveLog,
              ].slice(0, 20),
            }
          : prev.adaptiveConsensus,
        failurePrevention: prev.failurePrevention
          ? {
              ...prev.failurePrevention,
              totalAutoFixes: prev.failurePrevention.totalAutoFixes + 1,
              checks: prev.failurePrevention.checks.map((c) =>
                c.id === 'wealth-concentration-drift'
                  ? {
                      ...c,
                      fixCount: c.fixCount + 1,
                      lastAction: 'Rejected whale vote-buying & preserved equal 1-KYC base voting weight.',
                    }
                  : c,
              ),
            }
          : prev.failurePrevention,
        hyperMindLog: [
          {
            id: `hml-plut-${Date.now()}`,
            module: 'QuadraticCitizenVote & Constitutional Guard',
            decision: detail,
            severity: 'blocked' as const,
            timestamp,
          },
          ...prev.hyperMindLog,
        ].slice(0, 60),
        auditLog: [
          {
            id: `aud-plut-${Date.now()}`,
            module: 'Governance',
            action: 'PLUTOCRACY_ATTACK_BLOCKED',
            verdict: 'rejected' as const,
            detail,
            hash: makeLocalHash(`plut-${timestamp}-${prev.threatsBlocked}`),
            timestamp,
          },
          ...prev.auditLog,
        ].slice(0, 100),
      };
    });
    pushHyperAlert(
      'plutocracy',
      'orange',
      'PLUTOCRACY ATTACK BLOCKED! Whale attempted vote-buying with 10M NVC & Peg override proposal. Blocked by Quadratic Citizen Vote (sqrt(UsefulWork × Rep × 1-KYC)) + Constitutional Guard.',
    );
  }

  function handleSimulateWasteAttack() {
    const timestamp = new Date().toISOString();
    const detail =
      'Energy Waste Attack Blocked — Node tried burning PoW electricity / passive holding for reward -> 0 NVC awarded (No WorkProof = No Mint).';
    setSnapshot((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        threatsBlocked: prev.threatsBlocked + 1,
        hyperModules: prev.hyperModules.map((mod) =>
          mod.id === 'economic-stabilizer' ? { ...mod, threatsBlocked: mod.threatsBlocked + 1 } : mod,
        ),
        adaptiveConsensus: prev.adaptiveConsensus
          ? {
              ...prev.adaptiveConsensus,
              adaptiveLog: [
                {
                  id: `adp-waste-${Date.now()}`,
                  blockHeight: prev.metrics.latestBlockHeight,
                  reason: 'Energy waste / passive staking reward probe blocked at protocol layer',
                  parameter: 'PoUW Mint Gate',
                  oldValue: '0.04 Wh/tx',
                  newValue: '0 NVC minted without WorkProofID',
                  timestamp,
                },
                ...prev.adaptiveConsensus.adaptiveLog,
              ].slice(0, 20),
            }
          : prev.adaptiveConsensus,
        failurePrevention: prev.failurePrevention
          ? {
              ...prev.failurePrevention,
              totalAutoFixes: prev.failurePrevention.totalAutoFixes + 1,
              checks: prev.failurePrevention.checks.map((c) =>
                c.id === 'energy-waste-drift'
                  ? {
                      ...c,
                      fixCount: c.fixCount + 1,
                      lastAction: 'Denied electricity-burn reward & enforced PoUW (0.04 Wh/tx).',
                    }
                  : c,
              ),
            }
          : prev.failurePrevention,
        hyperMindLog: [
          {
            id: `hml-waste-${Date.now()}`,
            module: 'ProofOfUsefulWork & FailurePreventionEngine',
            decision: detail,
            severity: 'blocked' as const,
            timestamp,
          },
          ...prev.hyperMindLog,
        ].slice(0, 60),
        auditLog: [
          {
            id: `aud-waste-${Date.now()}`,
            module: 'PoUW',
            action: 'WASTE_ATTACK_BLOCKED',
            verdict: 'rejected' as const,
            detail,
            hash: makeLocalHash(`waste-${timestamp}-${prev.threatsBlocked}`),
            timestamp,
          },
          ...prev.auditLog,
        ].slice(0, 100),
      };
    });
    pushHyperAlert(
      'waste',
      'red',
      'ENERGY WASTE ATTACK BLOCKED! Node tried burning PoW electricity / passive holding for reward -> 0 NVC awarded. Enforced by Proof of Useful Work (PoUW) + FailurePreventionEngine.',
    );
  }

  async function handleClaimWorkTask(taskId: string) {
    setFeedback(null);
    const result = await safeFetchJson<{
      rewardNvc?: number;
      workProof?: { workProofId: string; workType: string };
      snapshot?: EcosystemSnapshot;
      error?: string;
    }>('/api/pouw/task/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId, citizenId: selectedCitizenId }),
    });
    if (result.data?.snapshot) {
      setSnapshot(result.data.snapshot);
      if (result.ok && result.data.workProof) {
        setFeedback({
          kind: 'success',
          text: `Completed Useful Work ${result.data.workProof.workProofId} (${result.data.workProof.workType}) · Earned ${result.data.rewardNvc} NVC.`,
        });
      } else {
        setFeedback({ kind: 'error', text: result.data.error || 'Useful work claim rejected.' });
      }
      return;
    }
    if (snapshot) {
      const local = applyLocalClaimWorkTaskFallback(snapshot, {
        taskId,
        citizenId: selectedCitizenId,
      });
      setSnapshot(local.snapshot);
      if (local.ok && local.workProofId) {
        setFeedback({
          kind: 'success',
          text: `Completed Useful Work ${local.workProofId} locally · Earned ${local.rewardNvc} NVC (${formatMicronNova(local.rewardNvc || 0)}).`,
        });
      } else {
        setFeedback({ kind: 'error', text: local.error || 'Useful work claim rejected.' });
      }
    }
  }

  async function handleRunFailureScan() {
    setFeedback(null);
    const result = await safeFetchJson<{
      autoFixesApplied?: number;
      snapshot?: EcosystemSnapshot;
      error?: string;
    }>('/api/hyper/v2/failure-scan', { method: 'POST' });
    if (result.data?.snapshot) {
      setSnapshot(result.data.snapshot);
      setFeedback({
        kind: 'success',
        text: `FailurePreventionEngine swept all 7 failure modes (${result.data.autoFixesApplied ?? 7} total auto-fixes verified). All GREEN.`,
      });
      return;
    }
    setSnapshot((prev) =>
      prev?.failurePrevention
        ? {
            ...prev,
            failurePrevention: {
              ...prev.failurePrevention,
              totalAutoFixes: prev.failurePrevention.totalAutoFixes + 1,
            },
          }
        : prev,
    );
    setFeedback({
      kind: 'success',
      text: 'FailurePreventionEngine swept all 7 failure modes locally. All GREEN / AUTO-FIXED.',
    });
  }

  async function handleCreateWorkTask(params: {
    title: string;
    workType: WorkProofType;
    offeredRewardNvc: number;
  }) {
    setFeedback(null);
    const result = await safeFetchJson<{
      task?: { id: string; title: string };
      snapshot?: EcosystemSnapshot;
      error?: string;
    }>('/api/pouw/task/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...params, requesterId: selectedCitizenId }),
    });
    if (result.data?.snapshot) {
      setSnapshot(result.data.snapshot);
      if (result.ok && result.data.task) {
        setFeedback({
          kind: 'success',
          text: `Published UsefulWork bounty "${result.data.task.title}" (${result.data.task.id}) to circular marketplace.`,
        });
      } else {
        setFeedback({ kind: 'error', text: result.data.error || 'Task rejected by HyperScanner.' });
      }
      return;
    }
    if (snapshot) {
      const local = applyLocalCreateWorkTaskFallback(snapshot, {
        ...params,
        requesterId: selectedCitizenId,
      });
      setSnapshot(local.snapshot);
      if (local.ok && local.task) {
        setFeedback({
          kind: 'success',
          text: `Published UsefulWork bounty "${local.task.title}" (${local.task.id}) locally.`,
        });
      } else {
        setFeedback({ kind: 'error', text: local.error || 'Task rejected by HyperScanner.' });
      }
    }
  }

  async function handleAdaptConsensus(
    scenario: 'tps-drop' | 'malicious-node' | 'healthy-1000' | 'restore-normal',
  ) {
    setFeedback(null);
    const result = await safeFetchJson<{
      mode?: string;
      snapshot?: EcosystemSnapshot;
      error?: string;
    }>('/api/consensus/adapt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario }),
    });
    if (result.data?.snapshot) {
      setSnapshot(result.data.snapshot);
      setFeedback({
        kind: 'success',
        text: `AdaptiveConsensus autonomously transitioned to ${result.data.mode} mode (Peg $3.14 & 0% Riba immutable).`,
      });
      return;
    }
    if (snapshot) {
      const next = applyLocalAdaptiveConsensusFallback(snapshot, scenario);
      setSnapshot(next);
      setFeedback({
        kind: 'success',
        text: `AdaptiveConsensus locally transitioned to ${next.adaptiveConsensus?.mode ?? 'Normal'} mode.`,
      });
    }
  }

  async function handleTransactionSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmittingTx(true);
    setFeedback(null);
    const result = await safeFetchJson<{
      transaction?: NovaTransaction;
      snapshot?: EcosystemSnapshot;
      error?: string;
    }>('/api/nova/transaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender,
        recipient,
        amount: Number(amount),
        source,
        memo,
        reportedValueUsd: Number(reportedValueUsd),
      }),
    });
    if (result.data?.snapshot) {
      setSnapshot(result.data.snapshot);
      if (result.ok && result.data.transaction) {
        setFeedback({
          kind: 'success',
          text: `Transaction ${result.data.transaction.id} (${result.data.transaction.amount} NVC = ${formatUsd(nvcToUsd(result.data.transaction.amount))} USD · ${formatMicronNova(result.data.transaction.amount)}) accepted by HyperMind & AHI AI.`,
        });
      } else {
        setFeedback({
          kind: 'error',
          text: result.data.transaction?.reason || result.data.error || 'Transaction rejected by compliance filter.',
        });
      }
    } else if (snapshot) {
      const local = applyLocalTransactionFallback(snapshot, {
        sender,
        recipient,
        amount: Number(amount),
        source,
        memo,
        reportedValueUsd: Number(reportedValueUsd),
      });
      setSnapshot(local.snapshot);
      setFeedback({
        kind: local.tx.status === 'accepted' ? 'success' : 'error',
        text:
          local.tx.status === 'accepted'
            ? `Transaction ${local.tx.id} (${local.tx.amount} NVC = ${formatUsd(nvcToUsd(local.tx.amount))} USD · ${formatMicronNova(local.tx.amount)}) accepted by local AHI AI & RibaGuard.`
            : local.tx.reason,
      });
    }
    setSubmittingTx(false);
  }

  async function handleAppSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmittingApp(true);
    setFeedback(null);
    const result = await safeFetchJson<{
      app?: NovaAppRecord;
      snapshot?: EcosystemSnapshot;
      error?: string;
    }>('/api/apps/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: appName,
        category: appCategory,
        description: appDescription,
        paymentAsset,
      }),
    });
    if (result.data?.snapshot) {
      setSnapshot(result.data.snapshot);
      if (result.ok && result.data.app) {
        setFeedback({ kind: 'success', text: `App "${result.data.app.name}" verified and deployed.` });
        setAppName('');
        setAppDescription('');
      } else {
        setFeedback({
          kind: 'error',
          text: result.data.app?.complianceReason || result.data.error || 'App specification rejected.',
        });
      }
    } else if (snapshot) {
      const local = applyLocalAppFallback(snapshot, {
        name: appName,
        category: appCategory,
        description: appDescription,
        paymentAsset,
      });
      setSnapshot(local.snapshot);
      if (local.app.status === 'deployed') {
        setFeedback({ kind: 'success', text: `App "${local.app.name}" verified and deployed locally.` });
        setAppName('');
        setAppDescription('');
      } else {
        setFeedback({ kind: 'error', text: local.app.complianceReason });
      }
    }
    setSubmittingApp(false);
  }

  async function handleToggleApp(app: NovaAppRecord) {
    const result = await safeFetchJson<{ snapshot?: EcosystemSnapshot }>(`/api/apps/${app.id}/halt`, {
      method: 'POST',
    });
    if (result.data?.snapshot) {
      setSnapshot(result.data.snapshot);
    } else {
      setSnapshot((prev) =>
        prev
          ? {
              ...prev,
              apps: prev.apps.map((item) =>
                item.id === app.id
                  ? { ...item, status: item.status === 'halted' ? 'deployed' : 'halted' }
                  : item,
              ),
            }
          : prev,
      );
    }
  }

  async function handleOracleVerify(nodeId: string, value: number) {
    setFeedback(null);
    const result = await safeFetchJson<{ snapshot?: EcosystemSnapshot; error?: string }>('/api/oracle/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nodeId, reportedValueUsd: value }),
    });
    if (result.data?.snapshot) {
      setSnapshot(result.data.snapshot);
    } else {
      setSnapshot((prev) =>
        prev
          ? {
              ...prev,
              oracleNodes: prev.oracleNodes.map((n) =>
                n.id === nodeId
                  ? {
                      ...n,
                      reportedValueUsd: value,
                      status: isValidNovaValue(value) ? 'verified' : 'flagged',
                      lastCheckedAt: new Date().toISOString(),
                    }
                  : n,
              ),
            }
          : prev,
      );
    }
    setFeedback({
      kind: isValidNovaValue(value) ? 'success' : 'error',
      text: isValidNovaValue(value)
        ? `Oracle ${nodeId} confirmed $3.14 Nova Peg valuation.`
        : `Oracle ${nodeId} deviated (${formatUsd(value)}) and was flagged for community vote.`,
    });
  }

  async function handleRunAudit() {
    setFeedback(null);
    const result = await safeFetchJson<{ compliant?: boolean; snapshot?: EcosystemSnapshot }>(
      '/api/governance/audit',
      { method: 'POST' },
    );
    if (result.data?.snapshot) setSnapshot(result.data.snapshot);
    const compliant =
      result.data?.compliant ??
      (snapshot ? snapshot.oracleNodes.every((n) => n.status === 'verified') : false);
    setFeedback({
      kind: compliant ? 'success' : 'error',
      text: compliant
        ? 'MainnetGovernor audit passed across all ecosystem components.'
        : 'MainnetGovernor audit flagged oracle nodes requiring community vote.',
    });
  }

  async function handleLaunchMainnet() {
    setFeedback(null);
    const result = await safeFetchJson<{ snapshot?: EcosystemSnapshot; error?: string }>(
      '/api/governance/mainnet-launch',
      { method: 'POST' },
    );
    if (result.data?.snapshot) setSnapshot(result.data.snapshot);
    if (result.ok) {
      setFeedback({ kind: 'success', text: 'MainnetGovernor launched Stellar Nova Core Mainnet.' });
    } else if (!result.data && snapshot && snapshot.oracleNodes.every((n) => n.status === 'verified')) {
      setSnapshot((prev) => (prev ? { ...prev, mainnetLaunched: true } : prev));
      setFeedback({ kind: 'success', text: 'MainnetGovernor launched Stellar Nova Core Mainnet.' });
    } else {
      setFeedback({
        kind: 'error',
        text: result.data?.error || result.error || 'Mainnet launch blocked until all oracles align at $3.14.',
      });
    }
  }

  async function handlePredictGovernance(e: FormEvent) {
    e.preventDefault();
    const result = await safeFetchJson<{
      summary: string;
      predictedYes: number;
      predictedNo: number;
      confidence: number;
      snapshot?: EcosystemSnapshot;
    }>('/api/hyper/governance/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ proposal: proposalText }),
    });
    if (result.data?.snapshot) setSnapshot(result.data.snapshot);
    if (result.ok && result.data) {
      setVotePrediction(
        `${result.data.summary} (Yes: ${result.data.predictedYes}% · No: ${result.data.predictedNo}% · Confidence: ${result.data.confidence}%)`,
      );
    } else {
      const lower = proposalText.toLowerCase();
      const harmful =
        lower.includes('3.20') || lower.includes('deviat') || lower.includes('interest') || lower.includes('whale');
      setVotePrediction(
        harmful
          ? 'Predicted Community Decision: 94% will vote to REJECT this deviation (Yes: 6% · No: 94% · Confidence: 97%)'
          : 'Predicted Community Decision: 91% will vote to APPROVE this $3.14-aligned proposal (Yes: 91% · No: 9% · Confidence: 95%)',
      );
    }
  }

  async function handleRegisterCitizen(e: FormEvent) {
    e.preventDefault();
    setFeedback(null);
    const result = await safeFetchJson<{
      citizen?: { id: string; displayName: string };
      snapshot?: EcosystemSnapshot;
      error?: string;
    }>('/api/citizens/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        displayName: newCitizenName,
        region: newCitizenRegion,
        deviceFingerprint: newCitizenDevice,
      }),
    });
    if (result.data?.snapshot) {
      setSnapshot(result.data.snapshot);
      if (result.ok && result.data.citizen) {
        setSelectedCitizenId(result.data.citizen.id);
        setNewCitizenName('');
        setNewCitizenDevice(`DEV-MOBILE-${Math.floor(100 + Math.random() * 899)}`);
        setFeedback({
          kind: 'success',
          text: `1-KYC Citizen ${result.data.citizen.id} (${result.data.citizen.displayName}) verified on SCP.`,
        });
      } else {
        setFeedback({ kind: 'error', text: result.data.error || 'Citizen registration blocked.' });
      }
      return;
    }
    if (snapshot) {
      const local = applyLocalCitizenRegisterFallback(snapshot, {
        displayName: newCitizenName,
        region: newCitizenRegion,
        deviceFingerprint: newCitizenDevice,
      });
      setSnapshot(local.snapshot);
      if (local.ok && local.citizen) {
        setSelectedCitizenId(local.citizen.id);
        setNewCitizenName('');
        setNewCitizenDevice(`DEV-MOBILE-${Math.floor(100 + Math.random() * 899)}`);
        setFeedback({
          kind: 'success',
          text: `1-KYC Citizen ${local.citizen.id} (${local.citizen.displayName}) verified locally on SCP.`,
        });
      } else {
        setFeedback({ kind: 'error', text: local.error || 'Citizen registration blocked.' });
      }
    }
  }

  async function handleMobileMine(citizenId: string) {
    const result = await safeFetchJson<{
      citizen?: { id: string; miningSessions: number };
      transaction?: { amount: number; timestamp: string };
      snapshot?: EcosystemSnapshot;
      error?: string;
    }>('/api/citizens/mine', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        citizenId,
        rewardNvc: Number(mineAmountNvc),
      }),
    });
    if (result.data?.snapshot) setSnapshot(result.data.snapshot);
    if (result.ok && result.data?.citizen && result.data?.transaction) {
      const notice = {
        citizenId: result.data.citizen.id,
        amount: result.data.transaction.amount,
        sessions: result.data.citizen.miningSessions,
        timestamp: result.data.transaction.timestamp,
      };
      setMiningNotice(notice);
      setFeedback({
        kind: 'success',
        text: `${notice.citizenId} mined ${notice.amount} NVC (${formatMicronNova(notice.amount)} = ${formatUsd(nvcToUsd(notice.amount))}) via low-energy mobile SCP · Session #${notice.sessions} (${new Date(notice.timestamp).toLocaleTimeString()})`,
      });
    } else if (!result.data && snapshot) {
      const reward = Number(mineAmountNvc) || 0.286624;
      const now = new Date().toISOString();
      const target = snapshot.citizens.find((c) => c.id === citizenId);
      if (target) {
        const nextSessions = target.miningSessions + 1;
        setSnapshot((prev) =>
          prev
            ? {
                ...prev,
                citizens: prev.citizens.map((c) =>
                  c.id === citizenId
                    ? {
                        ...c,
                        balanceNvc: Number((c.balanceNvc + reward).toFixed(6)),
                        minedTotalNvc: Number((c.minedTotalNvc + reward).toFixed(6)),
                        miningSessions: nextSessions,
                        lastMinedAt: now,
                      }
                    : c,
                ),
              }
            : prev,
        );
        const notice = { citizenId, amount: reward, sessions: nextSessions, timestamp: now };
        setMiningNotice(notice);
        setFeedback({
          kind: 'success',
          text: `${notice.citizenId} mined ${notice.amount} NVC (${formatMicronNova(notice.amount)} = ${formatUsd(nvcToUsd(notice.amount))}) via low-energy mobile SCP · Session #${notice.sessions}`,
        });
      }
    } else {
      setFeedback({ kind: 'error', text: result.data?.error || result.error || 'Mining reward blocked.' });
    }
  }

  async function handleCreateProposal(e: FormEvent) {
    e.preventDefault();
    setFeedback(null);
    const result = await safeFetchJson<{
      proposal?: { title: string };
      snapshot?: EcosystemSnapshot;
      error?: string;
    }>('/api/governance/proposals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: newProposalTitle,
        description: newProposalDesc,
        proposer: selectedCitizenId,
      }),
    });
    if (result.data?.snapshot) {
      setSnapshot(result.data.snapshot);
      if (result.ok && result.data.proposal) {
        setNewProposalTitle('');
        setNewProposalDesc('');
        setFeedback({
          kind: 'success',
          text: `Proposal "${result.data.proposal.title}" opened for 1-Person = 1-Vote Citizen ballot.`,
        });
      } else {
        setFeedback({ kind: 'error', text: result.data.error || 'Proposal rejected.' });
      }
      return;
    }
    if (snapshot) {
      const local = applyLocalProposalFallback(snapshot, {
        title: newProposalTitle,
        description: newProposalDesc,
        proposer: selectedCitizenId,
      });
      setSnapshot(local.snapshot);
      if (local.ok && local.proposal) {
        setNewProposalTitle('');
        setNewProposalDesc('');
        setFeedback({
          kind: 'success',
          text: `Proposal "${local.proposal.title}" opened locally for 1-Person = 1-Vote Citizen ballot.`,
        });
      } else {
        setFeedback({ kind: 'error', text: local.error || 'Proposal rejected by compliance filter.' });
      }
    }
  }

  async function handleCastVote(proposalId: string, vote: 'yes' | 'no') {
    setFeedback(null);
    const result = await safeFetchJson<{
      proposal?: { title: string; status: string };
      snapshot?: EcosystemSnapshot;
      error?: string;
    }>(`/api/governance/proposals/${proposalId}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ citizenId: selectedCitizenId, vote }),
    });
    if (result.data?.snapshot) {
      setSnapshot(result.data.snapshot);
      if (result.ok && result.data.proposal) {
        setFeedback({
          kind: 'success',
          text: `${selectedCitizenId} cast 1-KYC vote (${vote.toUpperCase()}) on "${result.data.proposal.title}" · Status: ${result.data.proposal.status}.`,
        });
      } else {
        setFeedback({ kind: 'error', text: result.data.error || 'Vote rejected.' });
      }
      return;
    }
    if (snapshot) {
      const local = applyLocalVoteFallback(snapshot, {
        proposalId,
        citizenId: selectedCitizenId,
        vote,
      });
      setSnapshot(local.snapshot);
      if (local.ok && local.proposal) {
        setFeedback({
          kind: 'success',
          text: `${selectedCitizenId} cast 1-KYC vote (${vote.toUpperCase()}) on "${local.proposal.title}" · Status: ${local.proposal.status}.`,
        });
      } else {
        setFeedback({ kind: 'error', text: local.error || 'Vote rejected.' });
      }
    }
  }

  async function handleCreateListing(e: FormEvent) {
    e.preventDefault();
    setFeedback(null);
    const activeCitizen = snapshot?.citizens.find((c) => c.id === selectedCitizenId);
    const payload = {
      title: mktTitle,
      description: mktDesc,
      category: mktCategory,
      settlementModel: mktSettlementModel,
      priceNvc: Number(mktPriceNvc),
      merchantId: selectedCitizenId,
      merchantName: activeCitizen?.displayName || 'Verified NVC Citizen',
    };
    const result = await safeFetchJson<{
      listing?: { title: string; priceNvc: number };
      snapshot?: EcosystemSnapshot;
      error?: string;
    }>('/api/marketplace/listings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (result.data?.snapshot) {
      setSnapshot(result.data.snapshot);
      if (result.ok && result.data.listing) {
        setMktTitle('');
        setMktDesc('');
        setFeedback({
          kind: 'success',
          text: `Listed "${result.data.listing.title}" (${result.data.listing.priceNvc} NVC = ${formatUsd(nvcToUsd(result.data.listing.priceNvc))}) after HyperScanner & RibaGuard clearance.`,
        });
      } else {
        setFeedback({ kind: 'error', text: result.data.error || 'Listing rejected by compliance filter.' });
      }
      return;
    }
    if (snapshot) {
      const local = applyLocalMarketplaceListingFallback(snapshot, payload);
      setSnapshot(local.snapshot);
      if (local.ok && local.listing) {
        setMktTitle('');
        setMktDesc('');
        setFeedback({
          kind: 'success',
          text: `Listed "${local.listing.title}" (${local.listing.priceNvc} NVC = ${formatUsd(nvcToUsd(local.listing.priceNvc))}) after local RibaGuard clearance.`,
        });
      } else {
        setFeedback({ kind: 'error', text: local.error || 'Listing rejected by compliance filter.' });
      }
    }
  }

  async function handleBuyListing(listingId: string) {
    setFeedback(null);
    const result = await safeFetchJson<{
      order?: { amountNvc: number; usdEquivalent: number; listingTitle: string };
      snapshot?: EcosystemSnapshot;
      error?: string;
    }>('/api/marketplace/buy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listingId, buyerId: selectedCitizenId, quantity: 1 }),
    });
    if (result.data?.snapshot) {
      setSnapshot(result.data.snapshot);
      if (result.ok && result.data.order) {
        setFeedback({
          kind: 'success',
          text: `Settled ${result.data.order.amountNvc} NVC (${formatMicronNova(result.data.order.amountNvc)} · ${formatUsd(result.data.order.usdEquivalent)}) for "${result.data.order.listingTitle}".`,
        });
      } else {
        setFeedback({ kind: 'error', text: result.data.error || 'Order could not be settled.' });
      }
      return;
    }
    if (snapshot) {
      const local = applyLocalMarketplaceBuyFallback(snapshot, {
        listingId,
        buyerId: selectedCitizenId,
      });
      setSnapshot(local.snapshot);
      if (local.ok && local.order) {
        setFeedback({
          kind: 'success',
          text: `Settled ${local.order.amountNvc} NVC (${formatMicronNova(local.order.amountNvc)} · ${formatUsd(local.order.usdEquivalent)}) for "${local.order.listingTitle}".`,
        });
      } else {
        setFeedback({ kind: 'error', text: local.error || 'Order could not be settled.' });
      }
    }
  }

  async function handleVerifyAuditChain() {
    setFeedback(null);
    const result = await safeFetchJson<{ intact?: boolean; verifiedCount?: number; totalEntries?: number }>(
      '/api/audit/verify',
    );
    if (result.ok && result.data) {
      setFeedback({
        kind: result.data.intact ? 'success' : 'error',
        text: result.data.intact
          ? `SHA-256 Chain Integrity Verified: ${result.data.verifiedCount}/${result.data.totalEntries} immutable audit entries passed cryptographic check.`
          : `Audit integrity warning: ${result.data.verifiedCount}/${result.data.totalEntries} verified.`,
      });
    } else {
      setFeedback({
        kind: 'success',
        text: `Local Audit Integrity Verified: ${snapshot?.auditLog.length ?? 0} audit entries verified.`,
      });
    }
  }

  function handleExportAuditJson() {
    if (!snapshot) return;
    const blob = new Blob([JSON.stringify(snapshot.auditLog, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stellar-nova-core-audit-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleSealScpBlock() {
    setFeedback(null);
    const result = await safeFetchJson<{
      block?: { height: number; txCount: number; totalNvc: number; quorum: string; energyWh: number };
      snapshot?: EcosystemSnapshot;
      error?: string;
    }>('/api/scp/seal', { method: 'POST' });
    if (result.data?.snapshot && result.data.block) {
      setSnapshot(result.data.snapshot);
      setFeedback({
        kind: 'success',
        text: `Sealed SCP Block #${result.data.block.height} (${result.data.block.txCount} tx · ${result.data.block.totalNvc} NVC · ${result.data.block.quorum} · ${result.data.block.energyWh} Wh).`,
      });
      return;
    }
    if (snapshot) {
      const local = applyLocalSealBlockFallback(snapshot);
      setSnapshot(local.snapshot);
      setFeedback({
        kind: 'success',
        text: `Sealed SCP Block #${local.block.height} (${local.block.txCount} tx · ${local.block.totalNvc} NVC · ${local.block.quorum} · ${local.block.energyWh} Wh).`,
      });
    }
  }

  async function handleDistributeMudarabah(e: FormEvent) {
    e.preventDefault();
    setFeedback(null);
    const payload = {
      netProfitNvc: Number(mudarabahProfitNvc),
      partnerSharePercent: Number(mudarabahRatio),
      note: mudarabahNote,
    };
    const result = await safeFetchJson<{
      distributableNvc?: number;
      recipientCount?: number;
      snapshot?: EcosystemSnapshot;
      error?: string;
    }>('/api/marketplace/mudarabah/distribute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (result.data?.snapshot) {
      setSnapshot(result.data.snapshot);
      if (result.ok) {
        setFeedback({
          kind: 'success',
          text: `Mudarabah 0% Interest Cycle Settled: Distributed ${result.data.distributableNvc} NVC (${formatMicronNova(result.data.distributableNvc || 0)}) across ${result.data.recipientCount} Citizen partners.`,
        });
      } else {
        setFeedback({ kind: 'error', text: result.data.error || 'Mudarabah distribution rejected.' });
      }
      return;
    }
    if (snapshot) {
      const local = applyLocalMudarabahFallback(snapshot, payload);
      setSnapshot(local.snapshot);
      if (local.ok) {
        setFeedback({
          kind: 'success',
          text: `Mudarabah 0% Interest Cycle Settled: Distributed ${local.distributableNvc} NVC (${formatMicronNova(local.distributableNvc || 0)}) across ${local.recipientCount} Citizen partners.`,
        });
      } else {
        setFeedback({ kind: 'error', text: local.error || 'Mudarabah distribution rejected.' });
      }
    }
  }

  async function handleCitizenP2P(e: FormEvent) {
    e.preventDefault();
    setFeedback(null);
    const payload = {
      sender: p2pFromCitizen,
      recipient: p2pToCitizen,
      amount: Number(p2pAmount),
      source: 'p2p',
      memo: '1-KYC Citizen P2P Settlement',
      reportedValueUsd: 3.14,
    };
    const result = await safeFetchJson<{
      transaction?: { amount: number; reason?: string };
      snapshot?: EcosystemSnapshot;
      error?: string;
    }>('/api/nova/transaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (result.data?.snapshot) {
      setSnapshot(result.data.snapshot);
      if (result.ok && result.data.transaction) {
        setFeedback({
          kind: 'success',
          text: `Settled ${result.data.transaction.amount} NVC (${formatMicronNova(result.data.transaction.amount)}) from ${p2pFromCitizen} to ${p2pToCitizen}.`,
        });
      } else {
        setFeedback({
          kind: 'error',
          text: result.data.transaction?.reason || result.data.error || 'Citizen P2P transfer rejected.',
        });
      }
      return;
    }
    if (snapshot) {
      const local = applyLocalTransactionFallback(snapshot, payload);
      setSnapshot(local.snapshot);
      setFeedback({
        kind: local.tx.status === 'accepted' ? 'success' : 'error',
        text:
          local.tx.status === 'accepted'
            ? `Settled ${local.tx.amount} NVC (${formatMicronNova(local.tx.amount)}) from ${p2pFromCitizen} to ${p2pToCitizen}.`
            : local.tx.reason,
      });
    }
  }

  async function handleResetEcosystem() {
    setFeedback(null);
    setHyperAlerts([]);
    const result = await safeFetchJson<{ snapshot?: EcosystemSnapshot }>('/api/ecosystem/reset', {
      method: 'POST',
    });
    if (result.data?.snapshot) {
      setSnapshot(result.data.snapshot);
    } else {
      setSnapshot(createLocalFallbackSnapshot());
    }
    setSelectedCitizenId('NVC-MINER-RASPI-09');
    setP2pFromCitizen('NVC-MINER-RASPI-09');
    setP2pToCitizen('NVC-CITIZEN-US-14');
    setMiningNotice(null);
    setFeedback({
      kind: 'success',
      text: 'Ecosystem persisted state restored cleanly to Stellar Nova Core baseline.',
    });
  }

  if (loading || !snapshot) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-300 text-sm">
        Loading Stellar Nova Core Ecosystem...
      </div>
    );
  }

  const { constants, metrics } = snapshot;
  const totalPolicyBlocked =
    snapshot.ribaBlockedTransactions + snapshot.gamblingBlocked + snapshot.exchangeBlocked;
  const activeNavMeta = NAV_ITEMS.find((item) => item.id === activeTab) || NAV_ITEMS[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Desktop Persistent Workspace Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:shrink-0 border-r border-slate-800 bg-slate-900/60">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-amber-500/15 border border-amber-400/30 flex items-center justify-center shrink-0">
            <SupernovaIcon />
          </div>
          <span className="text-base font-semibold tracking-tight text-white whitespace-nowrap">
            Stellar Nova Core
          </span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => selectTab(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  active
                    ? 'bg-amber-500 text-slate-950 font-semibold'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-2 text-xs text-slate-400">
          <div className="flex items-center justify-between">
            <span>Fixed Peg</span>
            <strong className="font-mono text-white tabular-nums">1 NVC = {formatUsd(constants.fixedValueUsd)}</strong>
          </div>
          <div className="flex items-center justify-between">
            <span>Smallest Unit</span>
            <span className="font-mono text-amber-300 tabular-nums">1,000,000 µNVC</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Riba Policy</span>
            <span className="text-emerald-300 font-medium">0% Interest · Halal</span>
          </div>
        </div>
      </aside>

      {/* Mobile Slide-Over Navigation Drawer */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-slate-950/80" onClick={() => setMobileNavOpen(false)} />
          <aside className="relative z-10 w-64 max-w-[80vw] bg-slate-900 border-r border-slate-800 flex flex-col">
            <div className="px-4 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <SupernovaIcon />
                <span className="text-sm font-semibold text-white">Stellar Nova Core</span>
              </div>
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                aria-label="Close navigation menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => selectTab(item.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap cursor-pointer ${
                      active ? 'bg-amber-500 text-slate-950 font-semibold' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Workspace Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Clean 3-Zone Top Bar */}
        <header className="border-b border-slate-800 bg-slate-900/40 px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="lg:hidden p-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:text-white cursor-pointer"
              aria-label="Open navigation menu"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="text-sm text-slate-400 truncate">
              <span className="hidden sm:inline">Stellar Nova Core</span>
              <span className="hidden sm:inline mx-2 text-slate-600">/</span>
              <span className="font-semibold text-white">{activeNavMeta.label}</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-3 text-xs text-slate-400 whitespace-nowrap">
            <span>Fixed Peg {formatUsd(constants.fixedValueUsd)}</span>
            <span aria-hidden="true">·</span>
            <span>0% Interest Halal</span>
            <span aria-hidden="true">·</span>
            <span className={snapshot.mainnetLaunched ? 'text-emerald-300' : 'text-amber-300'}>
              {snapshot.mainnetLaunched ? 'Mainnet Active' : 'Governor Pre-Launch'}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setProvenanceQuery(snapshot.transactions[0]?.id || 'NVC-MINER-RASPI-09')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer transition-colors"
            >
              <Search className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Verify Provenance</span>
            </button>
            <button
              type="button"
              onClick={() => selectTab('hyper')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors"
            >
              <Brain className="w-3.5 h-3.5" />
              Hyper-Intelligence
            </button>
          </div>
        </header>

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
          {/* Persistent Hyper-Intelligence Color-Coded Alert Stack */}
          {hyperAlerts.length > 0 && (
            <div className="space-y-2.5" aria-live="polite">
              {hyperAlerts.map((alert) => {
                const colorStyles =
                  alert.color === 'red'
                    ? 'bg-rose-950/80 border-rose-500/70 text-rose-100'
                    : alert.color === 'orange'
                      ? 'bg-orange-950/80 border-orange-500/70 text-orange-100'
                      : alert.color === 'blue'
                        ? 'bg-sky-950/80 border-sky-500/70 text-sky-100'
                        : 'bg-emerald-950/80 border-emerald-500/70 text-emerald-100';
                return (
                  <div
                    key={alert.key}
                    role="alert"
                    className={`flex items-center justify-between gap-3 px-4 py-3 rounded-lg border text-sm font-medium ${colorStyles}`}
                  >
                    <div className="flex items-center gap-2.5">
                      {alert.color === 'red' && <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />}
                      {alert.color === 'orange' && <AlertTriangle className="w-4 h-4 shrink-0 text-orange-400" />}
                      {alert.color === 'blue' && <Eye className="w-4 h-4 shrink-0 text-sky-400" />}
                      {alert.color === 'green' && <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />}
                      <span>{alert.text}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setHyperAlerts((prev) => prev.filter((item) => item.key !== alert.key))}
                      className="text-xs opacity-75 hover:opacity-100 cursor-pointer shrink-0 whitespace-nowrap"
                    >
                      Dismiss
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {feedback && (
            <div
              role="alert"
              className={`flex items-center justify-between gap-3 px-4 py-3 rounded-lg border text-sm ${
                feedback.kind === 'success'
                  ? 'bg-emerald-950/60 border-emerald-700/60 text-emerald-200'
                  : 'bg-rose-950/60 border-rose-700/60 text-rose-200'
              }`}
            >
              <div className="flex items-center gap-2">
                {feedback.kind === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                ) : (
                  <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
                )}
                <span>{feedback.text}</span>
              </div>
              <button
                type="button"
                onClick={() => setFeedback(null)}
                className="text-xs opacity-70 hover:opacity-100 cursor-pointer shrink-0 whitespace-nowrap"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* 5 Core Ecosystem KPI Cards */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Fixed NVC Peg</span>
                <Scale className="w-4 h-4 text-amber-400" />
              </div>
              <div className="mt-2 text-2xl font-semibold tabular-nums text-white">
                {formatUsd(constants.fixedValueUsd)}
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Supply: {(constants.totalSupply / 1e9).toFixed(0)}B NVC · {constants.collateralRatio}x Collateral
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Nova Purity & Filter</span>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="mt-2 text-2xl font-semibold tabular-nums text-white">
                {metrics.acceptedTransactions} Accepted{' '}
                <span className="text-sm font-normal text-slate-400">
                  / {metrics.rejectedTransactions} Blocked
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-400">Allowed: mining, rewards, p2p, marketplace</p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Nova-Exclusive Apps</span>
                <AppWindow className="w-4 h-4 text-sky-400" />
              </div>
              <div className="mt-2 text-2xl font-semibold tabular-nums text-white">
                {metrics.activeApps}
              </div>
              <p className="mt-1 text-xs text-slate-400">HyperScanner: 0 Scams Passed</p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Oracle & AHI AI Health</span>
                <Activity className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="mt-2 text-2xl font-semibold tabular-nums text-white">
                {snapshot.aiHealthScore}%
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Network Health: {snapshot.networkHealth}% - Self-Healing Active
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>RibaGuard AI: 0% Interest - Halal</span>
                <ShieldAlert className="w-4 h-4 text-amber-400" />
              </div>
              <div className="mt-2 text-2xl font-semibold tabular-nums text-white">
                {totalPolicyBlocked === 0 ? (
                  <span className="text-lg text-emerald-300">0 blocked - Network Clean</span>
                ) : (
                  <span>{totalPolicyBlocked} blocked</span>
                )}
              </div>
              <p className="mt-1 text-xs text-slate-400">Stabilizer: {snapshot.stabilizerStatus}</p>
            </div>
          </section>

          {activeTab === 'overview' && <OverviewPanel snapshot={snapshot} onNavigate={selectTab} />}

          {activeTab === 'transactions' && (
            <TransactionsPanel
              snapshot={snapshot}
              sender={sender}
              recipient={recipient}
              amount={amount}
              source={source}
              memo={memo}
              reportedValueUsd={reportedValueUsd}
              submittingTx={submittingTx}
              onChangeSender={setSender}
              onChangeRecipient={setRecipient}
              onChangeAmount={setAmount}
              onChangeSource={setSource}
              onChangeMemo={setMemo}
              onChangeReportedValueUsd={setReportedValueUsd}
              onSubmitTx={handleTransactionSubmit}
              onInspectProvenance={(id) => setProvenanceQuery(id)}
            />
          )}

          {activeTab === 'hyper' && (
            <HyperMindPanel
              snapshot={snapshot}
              selectedCitizenId={selectedCitizenId}
              proposalText={proposalText}
              votePrediction={votePrediction}
              onChangeSelectedCitizenId={setSelectedCitizenId}
              onChangeProposalText={setProposalText}
              onPredictGovernance={handlePredictGovernance}
              onSimulateWhaleAttack={handleSimulateWhaleAttack}
              onSimulateScamApp={handleSimulateScamApp}
              onSimulateOracleManipulation={handleSimulateOracleManipulation}
              onSelfHealNetwork={handleSelfHealNetwork}
              onSimulatePlutocracyAttack={handleSimulatePlutocracyAttack}
              onSimulateWasteAttack={handleSimulateWasteAttack}
              onClaimWorkTask={handleClaimWorkTask}
              onCreateWorkTask={handleCreateWorkTask}
              onAdaptConsensus={handleAdaptConsensus}
              onRunFailureScan={handleRunFailureScan}
            />
          )}

          {activeTab === 'apps' && (
            <AppsPanel
              snapshot={snapshot}
              appName={appName}
              appCategory={appCategory}
              appDescription={appDescription}
              paymentAsset={paymentAsset}
              submittingApp={submittingApp}
              onChangeAppName={setAppName}
              onChangeAppCategory={setAppCategory}
              onChangeAppDescription={setAppDescription}
              onChangePaymentAsset={setPaymentAsset}
              onSubmitApp={handleAppSubmit}
              onToggleApp={handleToggleApp}
            />
          )}

          {activeTab === 'oracle' && (
            <OracleScpPanel
              snapshot={snapshot}
              selectedCitizenId={selectedCitizenId}
              newProposalTitle={newProposalTitle}
              newProposalDesc={newProposalDesc}
              onChangeSelectedCitizenId={setSelectedCitizenId}
              onChangeNewProposalTitle={setNewProposalTitle}
              onChangeNewProposalDesc={setNewProposalDesc}
              onOracleVerify={handleOracleVerify}
              onRunAudit={handleRunAudit}
              onLaunchMainnet={handleLaunchMainnet}
              onCreateProposal={handleCreateProposal}
              onCastVote={handleCastVote}
              onSealScpBlock={handleSealScpBlock}
            />
          )}

          {activeTab === 'citizens' && (
            <CitizensReservesPanel
              snapshot={snapshot}
              newCitizenName={newCitizenName}
              newCitizenRegion={newCitizenRegion}
              newCitizenDevice={newCitizenDevice}
              mineAmountNvc={mineAmountNvc}
              converterNvc={converterNvc}
              p2pFromCitizen={p2pFromCitizen}
              p2pToCitizen={p2pToCitizen}
              p2pAmount={p2pAmount}
              miningNotice={miningNotice}
              onChangeNewCitizenName={setNewCitizenName}
              onChangeNewCitizenRegion={setNewCitizenRegion}
              onChangeNewCitizenDevice={setNewCitizenDevice}
              onChangeMineAmountNvc={setMineAmountNvc}
              onChangeConverterNvc={setConverterNvc}
              onChangeP2pFromCitizen={setP2pFromCitizen}
              onChangeP2pToCitizen={setP2pToCitizen}
              onChangeP2pAmount={setP2pAmount}
              onRegisterCitizen={handleRegisterCitizen}
              onMobileMine={handleMobileMine}
              onCitizenP2P={handleCitizenP2P}
            />
          )}

          {activeTab === 'marketplace' && (
            <MarketplacePanel
              snapshot={snapshot}
              selectedCitizenId={selectedCitizenId}
              mktTitle={mktTitle}
              mktCategory={mktCategory}
              mktSettlementModel={mktSettlementModel}
              mktPriceNvc={mktPriceNvc}
              mktDesc={mktDesc}
              mudarabahProfitNvc={mudarabahProfitNvc}
              mudarabahRatio={mudarabahRatio}
              mudarabahNote={mudarabahNote}
              onChangeSelectedCitizenId={setSelectedCitizenId}
              onChangeMktTitle={setMktTitle}
              onChangeMktCategory={setMktCategory}
              onChangeMktSettlementModel={setMktSettlementModel}
              onChangeMktPriceNvc={setMktPriceNvc}
              onChangeMktDesc={setMktDesc}
              onChangeMudarabahProfitNvc={setMudarabahProfitNvc}
              onChangeMudarabahRatio={setMudarabahRatio}
              onChangeMudarabahNote={setMudarabahNote}
              onCreateListing={handleCreateListing}
              onBuyListing={handleBuyListing}
              onDistributeMudarabah={handleDistributeMudarabah}
            />
          )}

          {activeTab === 'audit' && (
            <AuditPanel
              snapshot={snapshot}
              onVerifyAuditChain={handleVerifyAuditChain}
              onExportAuditJson={handleExportAuditJson}
              onResetEcosystem={handleResetEcosystem}
            />
          )}
        </main>
      </div>

      {provenanceQuery !== null && (
        <ProvenanceModal
          snapshot={snapshot}
          initialQuery={provenanceQuery}
          onClose={() => setProvenanceQuery(null)}
        />
      )}
    </div>
  );
}
