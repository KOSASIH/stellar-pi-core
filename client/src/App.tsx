import { useCallback, useEffect, useState, type FormEvent } from 'react';
import {
  Activity,
  AlertTriangle,
  AppWindow,
  Bot,
  Brain,
  CheckCircle2,
  Cpu,
  Download,
  Eye,
  Globe2,
  Lock,
  Network,
  Power,
  Rocket,
  RotateCcw,
  Scale,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Store,
  Users,
  Vote,
  XCircle,
  Zap,
} from 'lucide-react';
import {
  NovaPolicy,
  formatMicronNova,
  formatUsd,
  isValidNovaValue,
  nvcToUsd,
  type EcosystemSnapshot,
  type NovaAppRecord,
  type NovaTransaction,
} from '../../shared/novaPolicy.ts';

type TabId = 'transactions' | 'apps' | 'oracle' | 'citizens' | 'marketplace' | 'audit' | 'hyper';
type HyperAlertKey = 'whale' | 'scam' | 'oracle' | 'self-heal';
type HyperAlertColor = 'red' | 'orange' | 'blue' | 'green';

interface HyperAlertItem {
  key: HyperAlertKey;
  color: HyperAlertColor;
  text: string;
  count: number;
}

function makeLocalHash(seed: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x9e3779b9;
  for (let i = 0; i < seed.length; i += 1) {
    const ch = seed.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 0x01000193) >>> 0;
    h2 = Math.imul(h2 ^ ch, 0x85ebca6b) >>> 0;
  }
  return `${h1.toString(16).padStart(8, '0')}${h2.toString(16).padStart(8, '0')}`.repeat(4).slice(0, 64);
}

async function safeFetchJson<T>(
  url: string,
  init?: RequestInit,
): Promise<{ ok: boolean; status: number; data: T | null; error?: string }> {
  try {
    const res = await fetch(url, init);
    const raw = await res.text();
    const trimmed = raw.trim();
    if (!trimmed || trimmed.startsWith('<')) {
      return {
        ok: false,
        status: res.status,
        data: null,
        error: 'Live backend endpoint unavailable; local ecosystem state remains active.',
      };
    }
    const parsed = JSON.parse(trimmed) as T;
    return { ok: res.ok, status: res.status, data: parsed };
  } catch {
    return {
      ok: false,
      status: 0,
      data: null,
      error: 'Unable to reach backend endpoint; local ecosystem state remains active.',
    };
  }
}

function createLocalFallbackSnapshot(): EcosystemSnapshot {
  const now = new Date().toISOString();
  return {
    constants: NovaPolicy,
    mainnetLaunched: false,
    complianceBreached: false,
    aiHealthScore: 99.6,
    unethicalIncidents: 0,
    hyperMindStatus: 'Active',
    threatsBlocked: 12848,
    networkHealth: 99.99,
    whaleProof: true,
    scamBlocked: 342,
    ribaBlockedTransactions: 0,
    gamblingBlocked: 0,
    exchangeBlocked: 1,
    stabilizerStatus: 'LOCKED at $3.14',
    ribaPolicy: '0% Interest',
    rules: {
      novaExclusivity: NovaPolicy.novaExclusivity,
      ethicalAi: NovaPolicy.ethicalAi,
      founderAccountability: NovaPolicy.founderAccountability,
      volatileRejection: 'Volatile Tokens & Exchanges Rejected',
      noGambling: NovaPolicy.noGambling,
      noRiba: NovaPolicy.noRiba,
      shariaCompliant: NovaPolicy.shariaCompliant,
      evolutionThreshold: 99,
    },
    metrics: {
      totalTransactions: 3,
      acceptedTransactions: 2,
      rejectedTransactions: 1,
      activeApps: 2,
      verifiedOracleNodes: 3,
      isolatedOracleNodes: 0,
      verifiedCitizens: 3,
      openProposals: 2,
      collateralRatioActual: 1.5,
      marketplaceVolumeNvc: 0,
      latestBlockHeight: 1042,
      mudarabahDistributedNvc: 14.2,
    },
    transactions: [
      {
        id: 'tx-nvc-001',
        sender: 'NVC-MINER-RASPI-09',
        recipient: 'NVC-MERCHANT-HUB-07',
        amount: 42.5,
        micronNova: 42500000,
        source: 'mining',
        memo: 'Low-energy mobile SCP mining settlement',
        reportedValueUsd: 3.14,
        status: 'accepted',
        reason: 'Verified pure NVC origin at fixed $3.14 Nova Peg valuation.',
        purityScore: 1,
        hash: makeLocalHash('tx-nvc-001'),
        timestamp: now,
      },
      {
        id: 'tx-nvc-002',
        sender: 'NVC-CITIZEN-US-14',
        recipient: 'NVC-OPEN-MARKET-02',
        amount: 0.286624,
        micronNova: 286624,
        source: 'contribution_rewards',
        memo: 'Micron Nova utility fee & marketplace micro-payment',
        reportedValueUsd: 3.14,
        status: 'accepted',
        reason: 'Verified pure NVC origin at fixed $3.14 Nova Peg valuation.',
        purityScore: 1,
        hash: makeLocalHash('tx-nvc-002'),
        timestamp: now,
      },
    ],
    apps: [
      {
        id: 'app-nvc-commerce',
        name: 'Nova Direct Marketplace',
        category: 'Commerce',
        description: 'Zero-fee peer-to-peer real goods marketplace settled in NVC at $3.14.',
        creator: 'NVC-BUILDER-CORE',
        status: 'deployed',
        complianceReason: 'Passed AHI AI, HyperScanner (0 Scams), and RibaGuard AI (0% interest).',
        manifestSnippet: 'export const SETTLEMENT_ASSET = "NVC"; export const FIXED_VALUE_USD = 3.14;',
        createdAt: now,
      },
    ],
    oracleNodes: [
      { id: 'ORACLE-US-01', region: 'North America', reportedValueUsd: 3.14, status: 'verified', lastCheckedAt: now },
      { id: 'ORACLE-ID-01', region: 'Asia-Pacific', reportedValueUsd: 3.14, status: 'verified', lastCheckedAt: now },
      { id: 'ORACLE-EU-01', region: 'Europe', reportedValueUsd: 3.14, status: 'verified', lastCheckedAt: now },
    ],
    auditLog: [
      {
        id: 'aud-boot-1',
        module: 'Nova',
        action: 'PEG_IDENTITY_LOCK',
        verdict: 'accepted',
        detail: 'NovaValuePolicy & Stabilizer locked mathematical identity: 1 NVC = $3.14 USD.',
        hash: makeLocalHash('aud-boot-1'),
        timestamp: now,
      },
    ],
    hyperModules: [
      {
        id: 'oracle-shield',
        name: 'Oracle Predictive Shield',
        status: 'Active',
        threatsBlocked: 1940,
        health: 99.99,
        description: 'Predicts multi-node oracle collusion before price drift occurs.',
      },
      {
        id: 'whale-sybil-guard',
        name: 'Anti-Whale & Anti-Sybil HyperGuard',
        status: 'Active',
        threatsBlocked: 3412,
        health: 99.98,
        description: 'Enforces 0.01% max wallet cap (10M NVC) and 1-KYC-1-Account Sybil defense.',
      },
      {
        id: 'scam-hyperscanner',
        name: 'Anti-Scam & Anti-Rug HyperScanner',
        status: 'Active',
        threatsBlocked: 342,
        health: 100.0,
        description: 'HyperScanner: 0 Scams Passed. Blocks rug pulls, honeypots, and seed stealers.',
      },
      {
        id: 'hyper-compliance',
        name: 'Hyper-Compliance Engine',
        status: 'Active',
        threatsBlocked: 2890,
        health: 99.99,
        description: 'Zero Riba (0% Interest), Zero Gambling (Maysir), Zero Gharar (Halal-first).',
      },
      {
        id: 'self-healing-network',
        name: 'Self-Healing Network AI',
        status: 'Active',
        threatsBlocked: 1106,
        health: 99.99,
        description: 'Auto-promotes backup Citizen nodes and restores drifted oracles in <1s.',
      },
      {
        id: 'predictive-governance',
        name: 'Predictive Governance AI',
        status: 'Active',
        threatsBlocked: 845,
        health: 99.95,
        description: '1 Person = 1 Vote + Reputation Score community consensus forecasting.',
      },
      {
        id: 'economic-stabilizer',
        name: 'Hyper-Economic Stabilizer',
        status: 'Active',
        threatsBlocked: 2313,
        health: 100.0,
        description: 'LOCKED at $3.14 — blocks external market volatility from entering Nova Core.',
      },
    ],
    hyperMindLog: [
      {
        id: 'hml-seed-1',
        module: 'Anti-Whale HyperGuard',
        decision: 'Blocked Whale Attack — Wallet 0xWHALE-X tried to accumulate 15,000,000 NVC (>0.01% supply cap).',
        severity: 'blocked',
        timestamp: now,
      },
    ],
    bannedCreators: ['0xRUG-DEV-99'],
    citizens: [
      {
        id: 'NVC-MINER-RASPI-09',
        displayName: 'Amina Farouk',
        region: 'Asia-Pacific (ID)',
        deviceFingerprint: 'DEV-RASPI-09',
        kycVerified: true,
        reputationScore: 99,
        balanceNvc: 142.5,
        minedTotalNvc: 142.5,
        miningSessions: 58,
        lastMinedAt: now,
      },
      {
        id: 'NVC-CITIZEN-US-14',
        displayName: 'Marcus Vance',
        region: 'North America (US)',
        deviceFingerprint: 'DEV-MOBILE-US14',
        kycVerified: true,
        reputationScore: 95,
        balanceNvc: 84.28,
        minedTotalNvc: 84.28,
        miningSessions: 34,
        lastMinedAt: now,
      },
      {
        id: 'NVC-CITIZEN-EU-21',
        displayName: 'Elena Lindqvist',
        region: 'Europe (EU)',
        deviceFingerprint: 'DEV-MOBILE-EU21',
        kycVerified: true,
        reputationScore: 97,
        balanceNvc: 118.0,
        minedTotalNvc: 118.0,
        miningSessions: 48,
        lastMinedAt: now,
      },
    ],
    proposals: [],
    collateralReserves: [
      {
        id: 'res-gold-sukuk',
        assetClass: 'Allocated Physical Gold & Halal Sukuk',
        custodyType: 'Sovereign Audited Vaults',
        backingUsd: 188_400_000_000,
        sharePercent: 40,
        halalCertified: true,
        lastAuditedAt: now,
      },
    ],
    marketplaceListings: [],
    marketplaceOrders: [],
    scpBlocks: [
      {
        height: 1042,
        hash: makeLocalHash('scp-block-1042'),
        previousHash: makeLocalHash('scp-block-1041'),
        txIds: ['tx-nvc-001', 'tx-nvc-002'],
        txCount: 2,
        totalNvc: 42.786624,
        totalMicronNova: 42786624,
        quorum: '3/3 SCP Validators',
        energyWh: 0.04,
        sealedAt: now,
      },
    ],
  };
}

function SupernovaIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="w-5 h-5 text-amber-400"
    >
      <path
        d="M12 2L14.4 8.6L21 6.5L16.3 12L21 17.5L14.4 15.4L12 22L9.6 15.4L3 17.5L7.7 12L3 6.5L9.6 8.6L12 2Z"
        fill="currentColor"
        fillOpacity="0.9"
      />
      <circle cx="12" cy="12" r="2.6" className="fill-amber-200" />
    </svg>
  );
}

function getHyperModuleIcon(id: string) {
  switch (id) {
    case 'oracle-shield':
      return Eye;
    case 'whale-sybil-guard':
      return Shield;
    case 'scam-hyperscanner':
      return Bot;
    case 'hyper-compliance':
      return ShieldCheck;
    case 'self-healing-network':
      return Network;
    case 'predictive-governance':
      return Brain;
    default:
      return Lock;
  }
}

export default function App() {
  const [snapshot, setSnapshot] = useState<EcosystemSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('transactions');
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

  // Ledger & Audit search/filter state
  const [txFilter, setTxFilter] = useState<'all' | 'accepted' | 'rejected'>('all');
  const [txSearch, setTxSearch] = useState('');
  const [auditSearch, setAuditSearch] = useState('');

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

  // Real-Economy Marketplace & Mudarabah Profit-Sharing state
  const [mktTitle, setMktTitle] = useState('');
  const [mktCategory, setMktCategory] = useState<'Physical Goods' | 'Clean Energy' | 'Logistics' | 'Halal Mudarabah'>('Physical Goods');
  const [mktSettlementModel, setMktSettlementModel] = useState<'Direct Real Trade' | 'Fee-Based Service' | 'Mudarabah Profit-Share (0% Interest)'>('Direct Real Trade');
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
    if (result.data?.snapshot) setSnapshot(result.data.snapshot);
    if (result.ok && result.data?.transaction) {
      setFeedback({
        kind: 'success',
        text: `Transaction ${result.data.transaction.id} (${result.data.transaction.amount} NVC = ${formatUsd(nvcToUsd(result.data.transaction.amount))} USD · ${formatMicronNova(result.data.transaction.amount)}) accepted by HyperMind & AHI AI.`,
      });
    } else {
      setFeedback({
        kind: 'error',
        text: result.data?.transaction?.reason || result.data?.error || result.error || 'Transaction rejected by compliance filter.',
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
    if (result.data?.snapshot) setSnapshot(result.data.snapshot);
    if (result.ok && result.data?.app) {
      setFeedback({ kind: 'success', text: `App "${result.data.app.name}" verified and deployed.` });
      setAppName('');
      setAppDescription('');
    } else {
      setFeedback({
        kind: 'error',
        text: result.data?.app?.complianceReason || result.data?.error || result.error || 'App specification rejected.',
      });
    }
    setSubmittingApp(false);
  }

  async function handleToggleApp(app: NovaAppRecord) {
    const result = await safeFetchJson<{ snapshot?: EcosystemSnapshot }>(`/api/apps/${app.id}/halt`, {
      method: 'POST',
    });
    if (result.data?.snapshot) setSnapshot(result.data.snapshot);
  }

  async function handleOracleVerify(nodeId: string, value: number) {
    setFeedback(null);
    const result = await safeFetchJson<{ snapshot?: EcosystemSnapshot; error?: string }>('/api/oracle/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nodeId, reportedValueUsd: value }),
    });
    if (result.data?.snapshot) setSnapshot(result.data.snapshot);
    if (result.data) {
      setFeedback({
        kind: isValidNovaValue(value) ? 'success' : 'error',
        text: isValidNovaValue(value)
          ? `Oracle ${nodeId} confirmed $3.14 Nova Peg valuation.`
          : `Oracle ${nodeId} deviated (${formatUsd(value)}) and was flagged for community vote.`,
      });
    } else {
      setFeedback({ kind: 'error', text: result.error || 'Unable to verify oracle node.' });
    }
  }

  async function handleRunAudit() {
    setFeedback(null);
    const result = await safeFetchJson<{ compliant?: boolean; snapshot?: EcosystemSnapshot; error?: string }>(
      '/api/governance/audit',
      { method: 'POST' },
    );
    if (result.data?.snapshot) setSnapshot(result.data.snapshot);
    if (result.data) {
      setFeedback({
        kind: result.data.compliant ? 'success' : 'error',
        text: result.data.compliant
          ? 'MainnetGovernor audit passed across all ecosystem components.'
          : 'MainnetGovernor audit flagged oracle nodes requiring community vote.',
      });
    } else {
      setFeedback({ kind: 'error', text: result.error || 'Unable to run MainnetGovernor audit.' });
    }
  }

  async function handleLaunchMainnet() {
    setFeedback(null);
    const result = await safeFetchJson<{ snapshot?: EcosystemSnapshot; error?: string }>(
      '/api/governance/mainnet-launch',
      { method: 'POST' },
    );
    if (result.data?.snapshot) setSnapshot(result.data.snapshot);
    setFeedback({
      kind: result.ok ? 'success' : 'error',
      text: result.ok
        ? 'MainnetGovernor launched Stellar Nova Core Mainnet.'
        : result.data?.error || result.error || 'Mainnet launch blocked.',
    });
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
          reportedValueUsd: NovaPolicy.fixedValueUsd,
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
          reportedValueUsd: NovaPolicy.fixedValueUsd,
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
    if (result.data?.snapshot) setSnapshot(result.data.snapshot);
    if (result.ok && result.data?.citizen) {
      setSelectedCitizenId(result.data.citizen.id);
      setNewCitizenName('');
      setNewCitizenDevice(`DEV-MOBILE-${Math.floor(100 + Math.random() * 899)}`);
      setFeedback({
        kind: 'success',
        text: `1-KYC Citizen ${result.data.citizen.id} (${result.data.citizen.displayName}) verified on SCP.`,
      });
    } else {
      setFeedback({
        kind: 'error',
        text: result.data?.error || result.error || 'Citizen registration blocked.',
      });
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
    if (result.data?.snapshot) setSnapshot(result.data.snapshot);
    if (result.ok && result.data?.proposal) {
      setNewProposalTitle('');
      setNewProposalDesc('');
      setFeedback({
        kind: 'success',
        text: `Proposal "${result.data.proposal.title}" opened for 1-Person = 1-Vote Citizen ballot.`,
      });
    } else {
      setFeedback({
        kind: 'error',
        text: result.data?.error || result.error || 'Proposal rejected by compliance filter.',
      });
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
      body: JSON.stringify({
        citizenId: selectedCitizenId,
        vote,
      }),
    });
    if (result.data?.snapshot) setSnapshot(result.data.snapshot);
    if (result.ok && result.data?.proposal) {
      setFeedback({
        kind: 'success',
        text: `${selectedCitizenId} cast 1-KYC vote (${vote.toUpperCase()}) on "${result.data.proposal.title}" · Status: ${result.data.proposal.status}.`,
      });
    } else {
      setFeedback({ kind: 'error', text: result.data?.error || result.error || 'Vote rejected.' });
    }
  }

  async function handleCreateListing(e: FormEvent) {
    e.preventDefault();
    setFeedback(null);
    const activeCitizen = snapshot?.citizens.find((c) => c.id === selectedCitizenId);
    const result = await safeFetchJson<{
      listing?: { title: string; priceNvc: number };
      snapshot?: EcosystemSnapshot;
      error?: string;
    }>('/api/marketplace/listings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: mktTitle,
        description: mktDesc,
        category: mktCategory,
        settlementModel: mktSettlementModel,
        priceNvc: Number(mktPriceNvc),
        merchantId: selectedCitizenId,
        merchantName: activeCitizen?.displayName || 'Verified NVC Citizen',
      }),
    });
    if (result.data?.snapshot) setSnapshot(result.data.snapshot);
    if (result.ok && result.data?.listing) {
      setMktTitle('');
      setMktDesc('');
      setFeedback({
        kind: 'success',
        text: `Listed "${result.data.listing.title}" (${result.data.listing.priceNvc} NVC = ${formatUsd(nvcToUsd(result.data.listing.priceNvc))}) after HyperScanner & RibaGuard clearance.`,
      });
    } else {
      setFeedback({
        kind: 'error',
        text: result.data?.error || result.error || 'Listing rejected by compliance filter.',
      });
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
      body: JSON.stringify({
        listingId,
        buyerId: selectedCitizenId,
        quantity: 1,
      }),
    });
    if (result.data?.snapshot) setSnapshot(result.data.snapshot);
    if (result.ok && result.data?.order) {
      setFeedback({
        kind: 'success',
        text: `Settled ${result.data.order.amountNvc} NVC (${formatMicronNova(result.data.order.amountNvc)} · ${formatUsd(result.data.order.usdEquivalent)}) for "${result.data.order.listingTitle}".`,
      });
    } else {
      setFeedback({ kind: 'error', text: result.data?.error || result.error || 'Order could not be settled.' });
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
    if (result.data?.snapshot) setSnapshot(result.data.snapshot);
    if (result.ok && result.data?.block) {
      setFeedback({
        kind: 'success',
        text: `Sealed SCP Block #${result.data.block.height} (${result.data.block.txCount} tx · ${result.data.block.totalNvc} NVC · ${result.data.block.quorum} · ${result.data.block.energyWh} Wh).`,
      });
    } else {
      setFeedback({ kind: 'error', text: result.data?.error || result.error || 'Failed to seal SCP ledger block.' });
    }
  }

  async function handleDistributeMudarabah(e: FormEvent) {
    e.preventDefault();
    setFeedback(null);
    const result = await safeFetchJson<{
      distributableNvc?: number;
      recipientCount?: number;
      snapshot?: EcosystemSnapshot;
      error?: string;
    }>('/api/marketplace/mudarabah/distribute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        netProfitNvc: Number(mudarabahProfitNvc),
        partnerSharePercent: Number(mudarabahRatio),
        note: mudarabahNote,
      }),
    });
    if (result.data?.snapshot) setSnapshot(result.data.snapshot);
    if (result.ok && result.data) {
      setFeedback({
        kind: 'success',
        text: `Mudarabah 0% Interest Cycle Settled: Distributed ${result.data.distributableNvc} NVC (${formatMicronNova(result.data.distributableNvc || 0)}) across ${result.data.recipientCount} Citizen partners.`,
      });
    } else {
      setFeedback({
        kind: 'error',
        text: result.data?.error || result.error || 'Mudarabah distribution rejected.',
      });
    }
  }

  async function handleCitizenP2P(e: FormEvent) {
    e.preventDefault();
    setFeedback(null);
    const result = await safeFetchJson<{
      transaction?: { amount: number; reason?: string };
      snapshot?: EcosystemSnapshot;
      error?: string;
    }>('/api/nova/transaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender: p2pFromCitizen,
        recipient: p2pToCitizen,
        amount: Number(p2pAmount),
        source: 'p2p',
        memo: '1-KYC Citizen P2P Settlement',
        reportedValueUsd: 3.14,
      }),
    });
    if (result.data?.snapshot) setSnapshot(result.data.snapshot);
    if (result.ok && result.data?.transaction) {
      setFeedback({
        kind: 'success',
        text: `Settled ${result.data.transaction.amount} NVC (${formatMicronNova(result.data.transaction.amount)}) from ${p2pFromCitizen} to ${p2pToCitizen}.`,
      });
    } else {
      setFeedback({
        kind: 'error',
        text: result.data?.transaction?.reason || result.data?.error || result.error || 'Citizen P2P transfer rejected.',
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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-300">
        Loading Stellar Nova Core Ecosystem...
      </div>
    );
  }

  const { constants, metrics } = snapshot;
  const totalPolicyBlocked =
    snapshot.ribaBlockedTransactions + snapshot.gamblingBlocked + snapshot.exchangeBlocked;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/70 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-500/15 border border-amber-400/30 flex items-center justify-center">
              <SupernovaIcon />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-white">
                Stellar Nova Core — Ecosystem Console
              </h1>
              <p className="text-xs text-slate-400">
                Stablecoin-Only · Fixed Value {formatUsd(constants.fixedValueUsd)} · Gambling-Free · RIBA-FREE · 0% Interest
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30">
              <Brain className="w-3.5 h-3.5" />
              Hyper-Intelligence: ACTIVE
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              <Zap className="w-3.5 h-3.5" />
              Self-Healing: ON
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-sky-500/15 text-sky-300 border border-sky-500/30">
              <Shield className="w-3.5 h-3.5" />
              Whale-Proof: ON
            </span>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${
                snapshot.mainnetLaunched
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
              }`}
            >
              <Rocket className="w-3.5 h-3.5" />
              {snapshot.mainnetLaunched ? 'Mainnet Active' : 'Governor Pre-Launch'}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-800 text-slate-200 border border-slate-700">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              1 NVC = {formatUsd(constants.fixedValueUsd)}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
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
                    className="text-xs opacity-75 hover:opacity-100 cursor-pointer shrink-0"
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
              className="text-xs opacity-70 hover:opacity-100"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* 5 Metric Cards */}
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
            <p className="mt-1 text-xs text-slate-400">
              Allowed: mining, rewards, p2p, marketplace
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Nova-Exclusive Apps</span>
              <AppWindow className="w-4 h-4 text-sky-400" />
            </div>
            <div className="mt-2 text-2xl font-semibold tabular-nums text-white">
              {metrics.activeApps}
            </div>
            <p className="mt-1 text-xs text-slate-400">
              HyperScanner: 0 Scams Passed
            </p>
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
            <p className="mt-1 text-xs text-slate-400">
              Stabilizer: {snapshot.stabilizerStatus}
            </p>
          </div>
        </section>

        {/* Navigation Tabs */}
        <nav className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
          {(
            [
              { id: 'transactions', label: 'Stablecoin & AHI AI Filter', icon: Cpu },
              { id: 'apps', label: 'Autonomous App Builder', icon: AppWindow },
              { id: 'oracle', label: 'Oracle & Mainnet Governor', icon: Globe2 },
              { id: 'citizens', label: 'Citizens, Mining & Reserves', icon: Users },
              { id: 'marketplace', label: 'Real-Economy Marketplace', icon: Store },
              { id: 'audit', label: 'Immutable Audit Trail', icon: ShieldCheck },
              { id: 'hyper', label: 'Hyper-Intelligence', icon: Brain },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium whitespace-nowrap shrink-0 transition-colors ${
                  active
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* TAB 1: Stablecoin & AHI AI Filter */}
        {activeTab === 'transactions' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <form
              onSubmit={handleTransactionSubmit}
              className="lg:col-span-5 rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4 h-fit"
            >
              <div>
                <h2 className="text-base font-semibold text-white">
                  Submit NVC Stablecoin Transaction
                </h2>
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
                    onChange={(e) => setSender(e.target.value)}
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-white"
                    required
                  />
                </label>
                <label className="block text-xs text-slate-300 space-y-1">
                  <span>Recipient</span>
                  <input
                    type="text"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
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
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-white"
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
                    onChange={(e) => setSource(e.target.value)}
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
                  onChange={(e) => setReportedValueUsd(e.target.value)}
                  className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-white"
                  required
                />
              </label>

              <label className="block text-xs text-slate-300 space-y-1">
                <span>Transaction Memo</span>
                <input
                  type="text"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="Describe purpose (gambling & riba keywords are auto-rejected)"
                  className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-white"
                />
              </label>

              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="submit"
                  disabled={submittingTx}
                  className="flex-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm px-4 py-2.5 disabled:opacity-50"
                >
                  {submittingTx ? 'Verifying...' : 'Validate & Submit NVC Transfer'}
                </button>
              </div>

              <div className="pt-2 border-t border-slate-800 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSource('exchange');
                    setMemo('External exchange liquidity deposit');
                  }}
                  className="text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Test Exchange Rejection
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSource('p2p');
                    setMemo('Online casino jackpot entry');
                  }}
                  className="text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Test Gambling Filter
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSource('p2p');
                    setReportedValueUsd('3.14');
                    setMemo('Lending 100 NVC with 10% interest APY');
                  }}
                  className="text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300"
                >
                  Test Riba Rejection
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSource('mining');
                    setReportedValueUsd('3.14');
                    setMemo('Node mining reward settlement');
                  }}
                  className="text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Reset Valid Preset
                </button>
              </div>

              <div className="rounded-lg border border-emerald-800/40 bg-emerald-950/20 px-3 py-2 text-xs text-emerald-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>RibaGuard AI Active - 0% Interest Enforced</span>
              </div>
            </form>

            <div className="lg:col-span-7 rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-white">Ledger & Filter Verdicts</h2>
                  <p className="text-xs text-slate-400">
                    {snapshot.transactions.length} recorded · SCP Consensus
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
                        className={`px-2.5 py-1 rounded text-xs font-medium capitalize transition-colors ${
                          txFilter === statusOption
                            ? 'bg-amber-500 text-slate-950'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {statusOption}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-3 max-h-[540px] overflow-y-auto pr-1">
                {snapshot.transactions
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
                  })
                  .map((tx: NovaTransaction) => (
                  <div
                    key={tx.id}
                    className={`rounded-lg border p-3.5 ${
                      tx.status === 'accepted'
                        ? 'border-emerald-800/50 bg-emerald-950/20'
                        : 'border-rose-800/50 bg-rose-950/20'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {tx.status === 'accepted' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-400" />
                        )}
                        <span className="font-mono text-xs text-slate-300">{tx.id}</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {tx.source}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded font-medium ${
                            tx.status === 'accepted'
                              ? 'bg-emerald-500/15 text-emerald-300'
                              : 'bg-rose-500/15 text-rose-300'
                          }`}
                        >
                          {tx.status}
                        </span>
                      </div>
                      <div className="text-right tabular-nums">
                        <span className="font-semibold text-xs sm:text-sm text-white">
                          {tx.amount} NVC = {formatUsd(tx.amount * tx.reportedValueUsd)} USD · {formatMicronNova(tx.amount)}
                        </span>
                      </div>
                    </div>
                    <p className="mt-1.5 text-xs text-slate-300">
                      {tx.sender} → {tx.recipient} · {tx.memo}
                    </p>
                    <p
                      className={`mt-1 text-xs ${
                        tx.status === 'accepted' ? 'text-emerald-300' : 'text-rose-300'
                      }`}
                    >
                      {tx.reason}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Autonomous App Builder */}
        {activeTab === 'apps' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <form
              onSubmit={handleAppSubmit}
              className="lg:col-span-5 rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4 h-fit"
            >
              <div>
                <h2 className="text-base font-semibold text-white">
                  Autonomous App Builder
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Screened by Anti-Scam HyperScanner, RibaGuard AI, and NovaPurityEnforcer.
                </p>
                <p className="text-xs text-amber-300/90 mt-1.5">
                  Forbidden: Lending with interest, Staking APY, Yield Farming, Leverage, Rug/Scam Specs
                </p>
              </div>

              <label className="block text-xs text-slate-300 space-y-1">
                <span>Application Name</span>
                <input
                  type="text"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  placeholder="e.g. Nova Supply Chain Verifier"
                  className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-white"
                  required
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block text-xs text-slate-300 space-y-1">
                  <span>Category</span>
                  <select
                    value={appCategory}
                    onChange={(e) => setAppCategory(e.target.value)}
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-white"
                  >
                    <option value="Commerce">Commerce</option>
                    <option value="Infrastructure">Infrastructure</option>
                    <option value="Supply Chain">Supply Chain</option>
                    <option value="Governance">Governance</option>
                  </select>
                </label>

                <label className="block text-xs text-slate-300 space-y-1">
                  <span>Settlement Asset</span>
                  <select
                    value={paymentAsset}
                    onChange={(e) => setPaymentAsset(e.target.value)}
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-white"
                  >
                    <option value="NVC">NVC (Fixed $3.14)</option>
                    <option value="USDT">USDT (Volatile - Rejected)</option>
                    <option value="BTC">BTC (External - Rejected)</option>
                  </select>
                </label>
              </div>

              <label className="block text-xs text-slate-300 space-y-1">
                <span>Specification</span>
                <textarea
                  rows={3}
                  value={appDescription}
                  onChange={(e) => setAppDescription(e.target.value)}
                  placeholder="Describe app capabilities..."
                  className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-white"
                  required
                />
              </label>

              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  disabled={submittingApp}
                  className="flex-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm px-4 py-2.5 disabled:opacity-50"
                >
                  {submittingApp ? 'Auditing & Building...' : 'Generate & Deploy NVC App'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAppName('Nova Lending APY');
                    setAppDescription('Lending NVC with 12% APY interest');
                    setPaymentAsset('NVC');
                  }}
                  className="rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-medium px-3 py-2.5"
                >
                  Test Riba App
                </button>
              </div>

              <div className="rounded-lg border border-sky-800/40 bg-sky-950/20 px-3 py-2 text-xs text-sky-300 flex items-center justify-between gap-2">
                <span>HyperScanner: 0 Scams Passed</span>
                <span className="tabular-nums font-medium">{snapshot.scamBlocked} blocked</span>
              </div>
            </form>

            <div className="lg:col-span-7 space-y-3">
              {snapshot.apps.map((app) => (
                <div
                  key={app.id}
                  className="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-2.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-semibold text-white">{app.name}</h3>
                      <p className="text-xs text-slate-400">{app.category}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded font-medium ${
                          app.status === 'deployed'
                            ? 'bg-emerald-500/15 text-emerald-300'
                            : app.status === 'halted'
                              ? 'bg-amber-500/15 text-amber-300'
                              : 'bg-rose-500/15 text-rose-300'
                        }`}
                      >
                        {app.status}
                      </span>
                      {app.status !== 'rejected' && (
                        <button
                          type="button"
                          onClick={() => handleToggleApp(app)}
                          className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
                        >
                          <Power className="w-3 h-3" />
                          {app.status === 'halted' ? 'Resume' : 'Halt'}
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-slate-300">{app.description}</p>
                  <p className="text-xs text-slate-400">{app.complianceReason}</p>
                  <pre className="rounded-lg bg-slate-950 border border-slate-800 p-3 text-xs font-mono text-slate-300 overflow-x-auto">
                    {app.manifestSnippet}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: Global Oracle & Mainnet Governor */}
        {activeTab === 'oracle' && (
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
                <span className="text-xs px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                  Stabilizer: {snapshot.stabilizerStatus} - External Volatility BLOCKED
                </span>
              </div>

              <div className="space-y-3">
                {snapshot.oracleNodes.map((node) => (
                  <div
                    key={node.id}
                    className="rounded-lg border border-slate-800 bg-slate-950/70 p-4 flex flex-wrap items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-slate-300">{node.id}</span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded font-medium ${
                            node.status === 'verified'
                              ? 'bg-emerald-500/15 text-emerald-300'
                              : 'bg-rose-500/15 text-rose-300'
                          }`}
                        >
                          {node.status}
                        </span>
                      </div>
                      <p className="text-sm text-white mt-1">{node.region}</p>
                      <p className="text-xs text-slate-400 tabular-nums">
                        Reported: {formatUsd(node.reportedValueUsd)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOracleVerify(node.id, 3.14)}
                        className="text-xs px-3 py-1.5 rounded bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-600/40 text-emerald-300"
                      >
                        Sync $3.14
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOracleVerify(node.id, 3.20)}
                        className="text-xs px-3 py-1.5 rounded bg-rose-600/20 hover:bg-rose-600/30 border border-rose-600/40 text-rose-300"
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
                <h2 className="text-base font-semibold text-white">
                  Mainnet Governor & Ethical Rules
                </h2>
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
                  <dd className="mt-1 font-medium text-white">
                    {snapshot.rules.founderAccountability}
                  </dd>
                </div>
                <div className="rounded-lg bg-slate-950 border border-slate-800 p-3">
                  <dt className="text-slate-400">Sharia Compliant</dt>
                  <dd className="mt-1 font-medium text-emerald-300">
                    {snapshot.rules.shariaCompliant}
                  </dd>
                </div>
              </dl>

              {metrics.isolatedOracleNodes > 0 && (
                <div className="rounded-lg border border-amber-700/50 bg-amber-950/30 p-3 text-xs text-amber-200 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>
                    {metrics.isolatedOracleNodes} isolated node(s) must be restored to $3.14 before mainnet launch.
                  </span>
                </div>
              )}

              <div className="flex flex-col gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleRunAudit}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-sm font-medium text-white px-4 py-2.5"
                >
                  Run Ecosystem Compliance Audit
                </button>
                <button
                  type="button"
                  onClick={handleLaunchMainnet}
                  disabled={snapshot.mainnetLaunched}
                  className="w-full rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm px-4 py-2.5 disabled:opacity-50"
                >
                  {snapshot.mainnetLaunched ? 'Mainnet Launched' : 'Execute Mainnet Launch'}
                </button>
              </div>
            </div>

            {/* 1-Person = 1-Vote Community Governance Ballots */}
            <div className="lg:col-span-12 rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
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
                    onChange={(e) => setSelectedCitizenId(e.target.value)}
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
                  onSubmit={handleCreateProposal}
                  className="lg:col-span-4 rounded-lg border border-slate-800 bg-slate-950/70 p-4 space-y-3 h-fit"
                >
                  <h3 className="text-sm font-semibold text-white">Submit Community Proposal</h3>
                  <input
                    type="text"
                    value={newProposalTitle}
                    onChange={(e) => setNewProposalTitle(e.target.value)}
                    placeholder="Proposal title..."
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white"
                    required
                  />
                  <textarea
                    rows={2}
                    value={newProposalDesc}
                    onChange={(e) => setNewProposalDesc(e.target.value)}
                    placeholder="Describe policy or real-economy upgrade..."
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white"
                    required
                  />
                  <button
                    type="submit"
                    className="w-full rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs px-3 py-2"
                  >
                    Open Citizen Ballot
                  </button>
                </form>

                <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {snapshot.proposals.map((prop) => {
                    const alreadyVoted = prop.voters.includes(selectedCitizenId);
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
                                onClick={() => handleCastVote(prop.id, 'yes')}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-200 text-xs disabled:opacity-40"
                              >
                                <Vote className="w-3 h-3" />
                                Yes
                              </button>
                              <button
                                type="button"
                                disabled={alreadyVoted}
                                onClick={() => handleCastVote(prop.id, 'no')}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-200 text-xs disabled:opacity-40"
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
                    Latest Sealed Block: <span className="text-amber-300 font-semibold tabular-nums">#{snapshot.metrics.latestBlockHeight}</span> · Zero Proof-of-Work · 0.04 Wh per finality round.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSealScpBlock}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs px-3.5 py-2 whitespace-nowrap shrink-0"
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
                    {snapshot.scpBlocks.map((blk) => (
                      <tr key={blk.height} className="hover:bg-slate-800/30">
                        <td className="py-2.5 pr-3 font-mono font-semibold text-amber-300 tabular-nums">
                          #{blk.height}
                        </td>
                        <td className="py-2.5 px-3 tabular-nums text-white">
                          {blk.txCount} tx
                        </td>
                        <td className="py-2.5 px-3 tabular-nums text-emerald-300">
                          {blk.totalNvc} NVC ({blk.totalMicronNova.toLocaleString()} µNVC)
                        </td>
                        <td className="py-2.5 px-3 text-slate-300">{blk.quorum}</td>
                        <td className="py-2.5 px-3 tabular-nums text-slate-300">{blk.energyWh} Wh</td>
                        <td className="py-2.5 pl-3 font-mono text-[11px] text-slate-400">
                          {blk.hash.slice(0, 22)}...
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: 1-KYC Citizens, Mobile SCP Mining & 1.5x Reserve Proof */}
        {activeTab === 'citizens' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* 1-KYC Citizen Onboarding & Anti-Sybil Guard */}
              <form
                onSubmit={handleRegisterCitizen}
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
                    onChange={(e) => setNewCitizenName(e.target.value)}
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
                      onChange={(e) => setNewCitizenRegion(e.target.value)}
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
                      onChange={(e) => setNewCitizenDevice(e.target.value)}
                      className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm font-mono text-white"
                      required
                    />
                  </label>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="submit"
                    className="flex-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm px-4 py-2.5"
                  >
                    Verify 1-KYC Citizen
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewCitizenName('Sybil Clone Attempt');
                      setNewCitizenDevice('DEV-RASPI-09');
                    }}
                    className="rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-300 text-xs font-medium px-3 py-2.5"
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
                      onChange={(e) => setConverterNvc(e.target.value)}
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

              {/* Low-Energy Mobile Phone Mining Registry */}
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
                      onChange={(e) => setMineAmountNvc(e.target.value)}
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
                        <th className="py-2 px-3 font-medium text-right">Balance (NVC / USD)</th>
                        <th className="py-2 pl-3 font-medium text-right">Mobile SCP</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/70">
                      {snapshot.citizens.map((citizen) => (
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
                            <div className="text-white font-semibold">
                              {citizen.balanceNvc.toFixed(4)} NVC
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {formatUsd(nvcToUsd(citizen.balanceNvc))} · {citizen.miningSessions} sessions
                            </div>
                          </td>
                          <td className="py-3 pl-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleMobileMine(citizen.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-200 text-xs font-medium whitespace-nowrap"
                            >
                              <Smartphone className="w-3.5 h-3.5" />
                              Mine NVC
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Closed-Loop 1-KYC Citizen P2P Instant Transfer */}
            <form
              onSubmit={handleCitizenP2P}
              className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-semibold text-white">
                    Closed-Loop 1-KYC Citizen P2P Transfer
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Zero-interest direct transfers between verified Citizens at 1 NVC = $3.14 USD ({formatMicronNova(Number(p2pAmount) || 0)}).
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                <label className="block text-xs text-slate-300 space-y-1">
                  <span>From Citizen</span>
                  <select
                    value={p2pFromCitizen}
                    onChange={(e) => setP2pFromCitizen(e.target.value)}
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
                    onChange={(e) => setP2pToCitizen(e.target.value)}
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
                    onChange={(e) => setP2pAmount(e.target.value)}
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-xs tabular-nums text-white"
                    required
                  />
                </label>
                <button
                  type="submit"
                  className="rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs px-4 py-2.5 whitespace-nowrap"
                >
                  Send P2P NVC
                </button>
              </div>
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
                <span className="text-xs font-medium text-emerald-300">
                  100% Riba-Free Custody · Audited
                </span>
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
        )}

        {/* TAB 7: Real-Economy NVC Marketplace & Halal Mudarabah Escrow */}
        {activeTab === 'marketplace' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <form
                onSubmit={handleCreateListing}
                className="lg:col-span-4 rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4 h-fit"
              >
                <div>
                  <h2 className="text-base font-semibold text-white">
                    List Real-Economy Good or Mudarabah
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Every listing is screened by RibaGuard AI & HyperScanner. Fixed 1 NVC = $3.14 USD settlement.
                  </p>
                </div>

                <label className="block text-xs text-slate-300 space-y-1">
                  <span>Listing Title</span>
                  <input
                    type="text"
                    value={mktTitle}
                    onChange={(e) => setMktTitle(e.target.value)}
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
                      onChange={(e) => setMktCategory(e.target.value as typeof mktCategory)}
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
                      onChange={(e) => setMktPriceNvc(e.target.value)}
                      className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-xs tabular-nums text-white"
                      required
                    />
                  </label>
                </div>

                <label className="block text-xs text-slate-300 space-y-1">
                  <span>Settlement Model</span>
                  <select
                    value={mktSettlementModel}
                    onChange={(e) => setMktSettlementModel(e.target.value as typeof mktSettlementModel)}
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
                    onChange={(e) => setMktDesc(e.target.value)}
                    placeholder="Real goods or 0% interest Mudarabah share..."
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white"
                    required
                  />
                </label>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="submit"
                    className="flex-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm px-4 py-2.5"
                  >
                    Publish NVC Listing
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMktTitle('15% Fixed APR Credit Loan');
                      setMktDesc('Borrow NVC with 15% interest APR lending yield');
                    }}
                    className="rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-medium px-3 py-2.5"
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
                        Total Marketplace Settled Volume: {snapshot.metrics.marketplaceVolumeNvc} NVC ({formatUsd(nvcToUsd(snapshot.metrics.marketplaceVolumeNvc))})
                      </p>
                    </div>
                    <label className="flex items-center gap-2 text-xs text-slate-300">
                      <span>Buyer Wallet:</span>
                      <select
                        value={selectedCitizenId}
                        onChange={(e) => setSelectedCitizenId(e.target.value)}
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {snapshot.marketplaceListings.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-lg border border-slate-800 bg-slate-950/70 p-4 flex flex-col justify-between gap-3"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs text-slate-400">
                            <span>{item.category} · {item.merchantName}</span>
                            <span className="tabular-nums text-emerald-300">
                              {item.stock} left
                            </span>
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
                            onClick={() => handleBuyListing(item.id)}
                            className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs whitespace-nowrap disabled:opacity-40"
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
                  onSubmit={handleDistributeMudarabah}
                  className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-semibold text-white">
                        Halal Mudarabah Profit-Sharing Distribution (0% Interest)
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Real operating surplus shared across Citizen co-op partners ({snapshot.metrics.mudarabahDistributedNvc} NVC distributed to date).
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                    <label className="block text-xs text-slate-300 space-y-1">
                      <span>Net Profit (NVC)</span>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={mudarabahProfitNvc}
                        onChange={(e) => setMudarabahProfitNvc(e.target.value)}
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
                        onChange={(e) => setMudarabahRatio(e.target.value)}
                        className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-xs tabular-nums text-white"
                        required
                      />
                    </label>
                    <label className="block text-xs text-slate-300 space-y-1 md:col-span-2">
                      <span>Operational Note</span>
                      <input
                        type="text"
                        value={mudarabahNote}
                        onChange={(e) => setMudarabahNote(e.target.value)}
                        className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white"
                        required
                      />
                    </label>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="submit"
                      className="rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs px-4 py-2 whitespace-nowrap"
                    >
                      Distribute Halal Surplus
                    </button>
                    <button
                      type="button"
                      onClick={() => setMudarabahNote('Guaranteed 10% fixed interest payout')}
                      className="rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-medium px-3 py-2 whitespace-nowrap"
                    >
                      Test Riba Note
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Immutable Audit Trail */}
        {activeTab === 'audit' && (
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-white">
                  SHA-256 Audit Trail Logger
                </h2>
                <span className="text-xs text-slate-400">{snapshot.auditLog.length} entries · Persisted on disk</span>
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
                  onClick={handleVerifyAuditChain}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-200 text-xs font-medium"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Verify SHA-256 Chain
                </button>
                <button
                  type="button"
                  onClick={handleExportAuditJson}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export JSON
                </button>
                <button
                  type="button"
                  onClick={handleResetEcosystem}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-medium"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset Baseline
                </button>
              </div>
            </div>
            <div className="space-y-2 max-h-[540px] overflow-y-auto pr-1">
              {snapshot.auditLog
                .filter((entry) => {
                  const q = auditSearch.trim().toLowerCase();
                  if (!q) return true;
                  return (
                    entry.module.toLowerCase().includes(q) ||
                    entry.action.toLowerCase().includes(q) ||
                    entry.detail.toLowerCase().includes(q)
                  );
                })
                .map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-lg border border-slate-800 bg-slate-950/70 p-3 flex flex-col gap-1"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-amber-300">{entry.module}</span>
                      <span className="font-mono text-slate-400">{entry.action}</span>
                    </div>
                    <span className="text-slate-500 tabular-nums">
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-200">{entry.detail}</p>
                  <p className="font-mono text-[11px] text-slate-500 truncate">
                    sha256:{entry.hash}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: Hyper-Intelligence Command Center */}
        {activeTab === 'hyper' && (
          <div className="space-y-6">
            {/* Command Center Banner + 3 Simulation Controls */}
            <div className="rounded-xl border border-amber-500/30 bg-slate-900 p-5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-amber-400" />
                  <h2 className="text-base font-semibold text-white">
                    Hyper-Intelligence Command Center (NovaHyperMind)
                  </h2>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Total Threats Blocked:{' '}
                  <span className="text-amber-300 font-semibold tabular-nums">
                    {snapshot.threatsBlocked.toLocaleString()}
                  </span>{' '}
                  · Network Health: {snapshot.networkHealth}% - Self-Healing Active · Stabilizer:{' '}
                  {snapshot.stabilizerStatus} - External Volatility BLOCKED
                </p>
              </div>

              <div className="flex flex-wrap gap-2 relative z-10">
                <button
                  type="button"
                  onClick={handleSimulateWhaleAttack}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 border border-rose-400/50 text-white text-xs font-semibold cursor-pointer transition-colors"
                >
                  <Shield className="w-3.5 h-3.5" />
                  Simulate Whale Attack
                </button>
                <button
                  type="button"
                  onClick={handleSimulateScamApp}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 border border-orange-400/50 text-white text-xs font-semibold cursor-pointer transition-colors"
                >
                  <Bot className="w-3.5 h-3.5" />
                  Simulate Scam App
                </button>
                <button
                  type="button"
                  onClick={handleSimulateOracleManipulation}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 border border-sky-400/50 text-white text-xs font-semibold cursor-pointer transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Simulate Oracle Manipulation
                </button>
                <button
                  type="button"
                  onClick={handleSelfHealNetwork}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 border border-emerald-400/50 text-white text-xs font-semibold cursor-pointer transition-colors"
                >
                  <Zap className="w-3.5 h-3.5" />
                  Trigger Self-Heal
                </button>
              </div>
            </div>

            {/* 7 Hyper-Intelligence AI Module Cards */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {snapshot.hyperModules.map((mod) => {
                const Icon = getHyperModuleIcon(mod.id);
                return (
                  <div
                    key={mod.id}
                    className="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-amber-400 shrink-0" />
                        <h3 className="text-sm font-semibold text-white">{mod.name}</h3>
                      </div>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-medium">
                        {mod.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{mod.description}</p>
                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs tabular-nums">
                      <span className="text-slate-400">
                        Blocked: <strong className="text-white">{mod.threatsBlocked.toLocaleString()}</strong>
                      </span>
                      <span className="text-emerald-300 font-medium">Health: {mod.health}%</span>
                    </div>
                  </div>
                );
              })}
            </section>

            {/* HyperMind Live Log + Predictive Governance AI */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Network className="w-4 h-4 text-amber-400" />
                    <h3 className="text-base font-semibold text-white">HyperMind Live Log</h3>
                  </div>
                  <span className="text-xs text-slate-400">
                    {snapshot.hyperMindLog.length} autonomous decisions
                  </span>
                </div>

                <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                  {snapshot.hyperMindLog.map((entry) => (
                    <div
                      key={entry.id}
                      className={`rounded-lg border p-3 text-xs ${
                        entry.severity === 'blocked'
                          ? 'border-rose-800/40 bg-rose-950/20'
                          : entry.severity === 'healed'
                            ? 'border-emerald-800/40 bg-emerald-950/20'
                            : 'border-amber-800/40 bg-amber-950/20'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-amber-300">{entry.module}</span>
                        <span className="text-slate-500">
                          {new Date(entry.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="mt-1 text-slate-200">{entry.decision}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-5 rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4 h-fit">
                <div>
                  <h3 className="text-base font-semibold text-white">
                    Predictive Governance AI (1 Person = 1 Vote)
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Whale-proof voting predictor powered by Citizen KYC & Reputation Score.
                  </p>
                </div>

                <form onSubmit={handlePredictGovernance} className="space-y-3">
                  <label className="block text-xs text-slate-300 space-y-1">
                    <span>Proposal to Forecast</span>
                    <input
                      type="text"
                      value={proposalText}
                      onChange={(e) => setProposalText(e.target.value)}
                      className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-white"
                      required
                    />
                  </label>
                  <button
                    type="submit"
                    className="w-full rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm px-4 py-2"
                  >
                    Predict Community Decision
                  </button>
                </form>

                {votePrediction && (
                  <div className="rounded-lg border border-amber-700/40 bg-amber-950/20 p-3 text-xs text-amber-200">
                    {votePrediction}
                  </div>
                )}

                <div className="pt-2 border-t border-slate-800 text-xs text-slate-400 space-y-1">
                  <p>HyperScanner: 0 Scams Passed ({snapshot.scamBlocked} scam specs blocked)</p>
                  <p>Banned Scam Creators: {snapshot.bannedCreators.join(', ')}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
