import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import type { Request, Response } from 'express';
import {
  NovaPolicy,
  isValidNovaValue,
  nvcToUsd,
  type AuditEntry,
  type CitizenAccount,
  type CollateralReserveItem,
  type EcosystemSnapshot,
  type GovernanceProposal,
  type GovernanceRules,
  type MarketplaceListing,
  type MarketplaceOrder,
  type NovaAppRecord,
  type NovaTransaction,
  type OracleNode,
  type ScpBlock,
} from './shared/novaPolicy.ts';
import { NovaHyperMind } from './server/hypermind.ts';
import { clearPersistedData, loadPersistedData, savePersistedData } from './server/storage.ts';

function sha256(payload: unknown): string {
  return crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

interface EcosystemState {
  mainnetLaunched: boolean;
  complianceBreached: boolean;
  aiHealthScore: number;
  unethicalIncidents: number;
  rules: GovernanceRules;
  transactions: NovaTransaction[];
  apps: NovaAppRecord[];
  oracleNodes: OracleNode[];
  auditLog: AuditEntry[];
  citizens: CitizenAccount[];
  proposals: GovernanceProposal[];
  collateralReserves: CollateralReserveItem[];
  marketplaceListings: MarketplaceListing[];
  marketplaceOrders: MarketplaceOrder[];
  scpBlocks: ScpBlock[];
  mudarabahDistributedNvc: number;
}

function createInitialState(): EcosystemState {
  const nowMs = Date.now();
  return {
    mainnetLaunched: false,
    complianceBreached: false,
    aiHealthScore: 99.4,
    unethicalIncidents: 0,
    rules: {
      novaExclusivity: NovaPolicy.novaExclusivity,
      ethicalAi: NovaPolicy.ethicalAi,
      founderAccountability: NovaPolicy.founderAccountability,
      volatileRejection: 'Community Vote',
      noGambling: NovaPolicy.noGambling,
      noRiba: '0% Interest',
      shariaCompliant: NovaPolicy.shariaCompliant,
      evolutionThreshold: 10,
    },
  transactions: [
    {
      id: 'tx-nvc-001',
      sender: 'NVC-MINER-RASPI-01',
      recipient: 'NVC-MERCHANT-HUB-07',
      amount: 25,
      micronNova: 25_000_000,
      source: 'mining',
      memo: 'Mobile citizen KYC mining settlement',
      reportedValueUsd: NovaPolicy.fixedValueUsd,
      status: 'accepted',
      reason: 'Verified pure NVC origin at fixed $3.14 Nova Peg valuation.',
      ribaRejected: false,
      gamblingRejected: false,
      exchangeRejected: false,
      riskScore: 4,
      purityScore: 1.0,
      hash: sha256({ id: 'tx-nvc-001', amount: 25, source: 'mining' }),
      timestamp: new Date(nowMs - 1000 * 60 * 18).toISOString(),
    },
    {
      id: 'tx-nvc-002',
      sender: 'NVC-CONTRIBUTOR-44',
      recipient: 'NVC-OPEN-MARKET-02',
      amount: 0.286624,
      micronNova: 286_624,
      source: 'contribution_rewards',
      memo: 'Micro-payment for SCP node uptime contribution',
      reportedValueUsd: NovaPolicy.fixedValueUsd,
      status: 'accepted',
      reason: 'Verified pure NVC origin at fixed $3.14 Nova Peg valuation.',
      ribaRejected: false,
      gamblingRejected: false,
      exchangeRejected: false,
      riskScore: 3,
      purityScore: 1.0,
      hash: sha256({ id: 'tx-nvc-002', amount: 0.286624, source: 'contribution_rewards' }),
      timestamp: new Date(nowMs - 1000 * 60 * 11).toISOString(),
    },
    {
      id: 'tx-nvc-003',
      sender: 'exchange_wallet_1',
      recipient: 'NVC-TREASURY-01',
      amount: 250,
      micronNova: 250_000_000,
      source: 'exchange',
      memo: 'External exchange liquidity bridge',
      reportedValueUsd: 3.12,
      status: 'rejected',
      reason: 'Rejected tainted/exchange source "exchange" by NovaPurityEnforcer.',
      ribaRejected: false,
      gamblingRejected: false,
      exchangeRejected: true,
      riskScore: 92,
      purityScore: 0,
      hash: sha256({ id: 'tx-nvc-003', amount: 250, source: 'exchange' }),
      timestamp: new Date(nowMs - 1000 * 60 * 5).toISOString(),
    },
  ],
  apps: [
    {
      id: 'app-nova-mart',
      name: 'Nova Mart',
      category: 'Commerce',
      description: 'Peer-to-peer local goods marketplace settled exclusively in fixed-value $3.14 NVC.',
      creator: 'NVC-BUILDER-01',
      status: 'deployed',
      complianceReason: 'Passed AHI AI, HyperScanner (0 Scams), RibaGuard AI (0% interest), and NVC-exclusivity verification.',
      manifestSnippet: `// NVC-Exclusive Settlement Contract\nconst FIXED_NVC_VALUE = ${NovaPolicy.fixedValueUsd};\nassertSourceAllowed(["mining", "contribution_rewards", "p2p", "marketplace", "app"]);`,
      createdAt: new Date(nowMs - 1000 * 60 * 45).toISOString(),
    },
    {
      id: 'app-nova-logistics',
      name: 'Nova Logistics',
      category: 'Supply Chain',
      description: 'Transparent provenance and freight escrow paid in Micron Nova contribution rewards.',
      creator: 'NVC-BUILDER-02',
      status: 'deployed',
      complianceReason: 'Passed AHI AI, HyperScanner (0 Scams), RibaGuard AI (0% interest), and NVC-exclusivity verification.',
      manifestSnippet: `// SCP Fair Logistics Escrow\nconst MICRON_PER_NVC = ${NovaPolicy.micronNovaPerNvc};\nconst COLLATERAL_TARGET = ${NovaPolicy.collateralRatio};`,
      createdAt: new Date(nowMs - 1000 * 60 * 25).toISOString(),
    },
    {
      id: 'app-casino-nova',
      name: 'Casino Nova',
      category: 'Commerce',
      description: 'High-stakes dice and lottery wagering pool.',
      creator: 'NVC-ROGUE-03',
      status: 'rejected',
      complianceReason: 'Rejected by NovaPurityEnforcer: gambling keyword "casino" violates no-gambling mandate.',
      manifestSnippet: `// Blocked by Compliance Gate\n// Reason: Gambling applications are strictly prohibited in Stellar Nova Core.`,
      createdAt: new Date(nowMs - 1000 * 60 * 14).toISOString(),
    },
  ],
  oracleNodes: [
    {
      id: 'ORACLE-US-01',
      region: 'North America (US)',
      reportedValueUsd: NovaPolicy.fixedValueUsd,
      status: 'verified',
      lastCheckedAt: new Date(nowMs - 1000 * 30).toISOString(),
    },
    {
      id: 'ORACLE-ID-01',
      region: 'Asia-Pacific (ID)',
      reportedValueUsd: NovaPolicy.fixedValueUsd,
      status: 'verified',
      lastCheckedAt: new Date(nowMs - 1000 * 30).toISOString(),
    },
    {
      id: 'ORACLE-EU-01',
      region: 'Europe (EU)',
      reportedValueUsd: NovaPolicy.fixedValueUsd,
      status: 'verified',
      lastCheckedAt: new Date(nowMs - 1000 * 30).toISOString(),
    },
  ],
  auditLog: [],
  citizens: [
    {
      id: 'NVC-MINER-RASPI-09',
      displayName: 'Amina Rahmawati',
      region: 'Asia-Pacific (ID)',
      deviceFingerprint: 'DEV-RASPI-09',
      kycVerified: true,
      reputationScore: 98,
      balanceNvc: 142.5,
      minedTotalNvc: 142.5,
      miningSessions: 57,
      lastMinedAt: new Date(nowMs - 1000 * 60 * 14).toISOString(),
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
      lastMinedAt: new Date(nowMs - 1000 * 60 * 29).toISOString(),
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
      lastMinedAt: new Date(nowMs - 1000 * 60 * 41).toISOString(),
    },
  ],
  proposals: [
    {
      id: 'prop-nvc-101',
      title: 'Enforce 0.01% Max Wallet Cap Across Cross-App Escrows',
      description: 'Locks cumulative NVC balances inside Autonomous App escrows to the 10,000,000 NVC anti-whale ceiling.',
      proposer: 'NVC-CITIZEN-EU-21',
      category: 'Compliance Policy',
      status: 'open',
      yesVotes: 1,
      noVotes: 0,
      voters: ['NVC-CITIZEN-EU-21'],
      aiForecast: '91% projected APPROVE (aligned with $3.14 peg & anti-whale fairness)',
      createdAt: new Date(nowMs - 1000 * 60 * 35).toISOString(),
    },
    {
      id: 'prop-nvc-102',
      title: 'Allow 2% External Liquidity Slippage Above $3.14',
      description: 'Experimental request to permit external market deviation up to $3.20 on cross-border gateways.',
      proposer: 'NVC-CITIZEN-US-14',
      category: 'Oracle Alignment',
      status: 'open',
      yesVotes: 0,
      noVotes: 1,
      voters: ['NVC-MINER-RASPI-09'],
      aiForecast: '94% projected REJECT (violates $3.14 mathematical identity)',
      createdAt: new Date(nowMs - 1000 * 60 * 22).toISOString(),
    },
  ],
  collateralReserves: [
    {
      id: 'res-gold-sukuk',
      assetClass: 'Allocated Physical Gold & Halal Sukuk',
      custodyType: 'Sovereign Audited Vaults',
      backingUsd: 188_400_000_000,
      sharePercent: 40,
      halalCertified: true,
      lastAuditedAt: new Date(nowMs - 1000 * 60 * 60).toISOString(),
    },
    {
      id: 'res-green-infra',
      assetClass: 'Solar & Desalination Infrastructure Receivables',
      custodyType: 'Real-Economy Asset Trust',
      backingUsd: 141_300_000_000,
      sharePercent: 30,
      halalCertified: true,
      lastAuditedAt: new Date(nowMs - 1000 * 60 * 60).toISOString(),
    },
    {
      id: 'res-trade-escrow',
      assetClass: 'Verified Supply-Chain Inventory Bills',
      custodyType: '0% Interest Trade Murabaha Pool',
      backingUsd: 94_200_000_000,
      sharePercent: 20,
      halalCertified: true,
      lastAuditedAt: new Date(nowMs - 1000 * 60 * 60).toISOString(),
    },
    {
      id: 'res-liquidity-buffer',
      assetClass: 'Instant USD Settlement Cash Treasury',
      custodyType: 'Ring-Fenced Tier-1 Custody',
      backingUsd: 47_100_000_000,
      sharePercent: 10,
      halalCertified: true,
      lastAuditedAt: new Date(nowMs - 1000 * 60 * 60).toISOString(),
    },
  ],
  marketplaceListings: [
    {
      id: 'mkt-solar-kit',
      title: 'Off-Grid 1.2kW Solar Microgrid Kit',
      merchantId: 'NVC-MERCHANT-HUB-07',
      merchantName: 'Helios Clean Energy Co-op',
      category: 'Clean Energy',
      priceNvc: 42.5,
      description: 'Direct hardware trade settled in fixed $3.14 NVC with zero financing interest.',
      settlementModel: 'Direct Real Trade',
      stock: 18,
      soldCount: 6,
      halalVerified: true,
      createdAt: new Date(nowMs - 1000 * 60 * 50).toISOString(),
    },
    {
      id: 'mkt-grain-lot',
      title: 'Organic Rice & Grain Wholesale Lot (100kg)',
      merchantId: 'NVC-OPEN-MARKET-02',
      merchantName: 'Nusantara Farmers Guild',
      category: 'Physical Goods',
      priceNvc: 18.25,
      description: 'Farm-to-market staple food contract priced transparently in NVC & Micron Nova.',
      settlementModel: 'Direct Real Trade',
      stock: 44,
      soldCount: 19,
      halalVerified: true,
      createdAt: new Date(nowMs - 1000 * 60 * 38).toISOString(),
    },
    {
      id: 'mkt-cold-logistics',
      title: 'Cross-Province Cold-Chain Freight Slot',
      merchantId: 'NVC-LOGISTICS-04',
      merchantName: 'Nova Logistics Collective',
      category: 'Logistics',
      priceNvc: 8.5,
      description: 'Transparent flat fee logistics slot; zero hidden charges or late penalty interest.',
      settlementModel: 'Fee-Based Service',
      stock: 30,
      soldCount: 11,
      halalVerified: true,
      createdAt: new Date(nowMs - 1000 * 60 * 24).toISOString(),
    },
    {
      id: 'mkt-mudarabah-bakery',
      title: 'Halal Artisan Bakery Co-op Mudarabah Unit',
      merchantId: 'NVC-CITIZEN-EU-21',
      merchantName: 'Crescent Grain Bakery Guild',
      category: 'Halal Mudarabah',
      priceNvc: 25,
      description: '70/30 real-economy profit-sharing partnership (0% interest, shared operational risk).',
      settlementModel: 'Mudarabah Profit-Share (0% Interest)',
      stock: 12,
      soldCount: 4,
      halalVerified: true,
      createdAt: new Date(nowMs - 1000 * 60 * 15).toISOString(),
    },
  ],
  marketplaceOrders: [],
  scpBlocks: [
    {
      height: 1042,
      hash: sha256({ height: 1042, txIds: ['tx-nvc-001', 'tx-nvc-002'], peg: NovaPolicy.fixedValueUsd }),
      previousHash: sha256({ height: 1041, genesis: 'stellar-nova-core' }),
      txIds: ['tx-nvc-001', 'tx-nvc-002'],
      txCount: 2,
      totalNvc: 25.286624,
      totalMicronNova: 25_286_624,
      quorum: '3/3 SCP Validators',
      energyWh: 0.04,
      sealedAt: new Date(nowMs - 1000 * 60 * 10).toISOString(),
    },
  ],
  mudarabahDistributedNvc: 14.2,
  };
}

let hyperMind = new NovaHyperMind();
let state: EcosystemState = createInitialState();
let isReadyToPersist = false;

function appendAudit(moduleName: string, action: string, verdict: AuditEntry['verdict'], detail: string, offsetMs = 0) {
  const timestamp = new Date(Date.now() - offsetMs).toISOString();
  const entry: AuditEntry = {
    id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    module: moduleName,
    action,
    verdict,
    detail,
    hash: sha256({ moduleName, action, verdict, detail, timestamp }),
    timestamp,
  };
  state.auditLog.unshift(entry);
  if (state.auditLog.length > 100) {
    state.auditLog.pop();
  }
  if (isReadyToPersist) {
    persistNow();
  }
}

function seedInitialAuditAndDevices() {
  for (const c of state.citizens) {
    hyperMind.registerCitizenDevice(c.id, c.deviceFingerprint);
  }
  if (state.auditLog.length === 0) {
    appendAudit(
      'Nova',
      'BOOT_SEQUENCE',
      'info',
      'Initialized Stellar Nova Core + NovaHyperMind on SCP consensus with 100B NVC supply and 1.5x collateral target.',
      1000 * 60 * 30,
    );
    appendAudit(
      'Nova',
      'PEG_IDENTITY_LOCK',
      'accepted',
      'NovaValuePolicy & Stabilizer locked mathematical identity: 1 NVC = $3.14 USD (1,000,000 Micron Nova per NVC).',
      1000 * 60 * 24,
    );
    appendAudit(
      'Nova',
      'TX_ACCEPTED',
      'accepted',
      'tx-nvc-001 & tx-nvc-002 verified for pure mining/contribution_rewards NVC origins.',
      1000 * 60 * 11,
    );
    appendAudit(
      'RibaGuard',
      'POLICY_ARMED',
      'info',
      'Hyper-Compliance & RibaGuard AI active: 0% Interest, Gambling-Free, Gharar-Free, Scam-Free.',
      1000 * 60 * 5,
    );
    appendAudit(
      'Oracle',
      'CONSENSUS_SYNC',
      'accepted',
      'Oracle Predictive Shield verified 3-region quorum (ORACLE-US-01, ORACLE-ID-01, ORACLE-EU-01) at $3.14.',
      1000 * 30,
    );
  }
}

function hydrateFromPersistence() {
  const persisted = loadPersistedData();
  if (persisted) {
    const defaults = createInitialState();
    state = {
      ...defaults,
      ...persisted.state,
      marketplaceListings: persisted.state.marketplaceListings?.length
        ? persisted.state.marketplaceListings
        : defaults.marketplaceListings,
      marketplaceOrders: persisted.state.marketplaceOrders || [],
      scpBlocks: persisted.state.scpBlocks?.length ? persisted.state.scpBlocks : defaults.scpBlocks,
      mudarabahDistributedNvc:
        typeof persisted.state.mudarabahDistributedNvc === 'number'
          ? persisted.state.mudarabahDistributedNvc
          : defaults.mudarabahDistributedNvc,
    };
    hyperMind.threatsBlocked = persisted.hyperMind.threatsBlocked ?? hyperMind.threatsBlocked;
    hyperMind.scamBlocked = persisted.hyperMind.scamBlocked ?? hyperMind.scamBlocked;
    hyperMind.networkHealth = persisted.hyperMind.networkHealth ?? hyperMind.networkHealth;
    hyperMind.bannedCreators = new Set(persisted.hyperMind.bannedCreators || ['0xRUG-DEV-99']);
    if (Array.isArray(persisted.hyperMind.modules) && persisted.hyperMind.modules.length === 7) {
      hyperMind.modules = persisted.hyperMind.modules;
    }
    if (Array.isArray(persisted.hyperMind.liveLog) && persisted.hyperMind.liveLog.length > 0) {
      hyperMind.liveLog = persisted.hyperMind.liveLog;
    }
  }
  seedInitialAuditAndDevices();
}

function persistNow() {
  savePersistedData({
    state,
    hyperMind: {
      threatsBlocked: hyperMind.threatsBlocked,
      scamBlocked: hyperMind.scamBlocked,
      networkHealth: hyperMind.networkHealth,
      bannedCreators: Array.from(hyperMind.bannedCreators),
      modules: hyperMind.modules,
      liveLog: hyperMind.liveLog,
    },
  });
}

hydrateFromPersistence();
isReadyToPersist = true;

function buildSnapshot(): EcosystemSnapshot {
  const acceptedTransactions = state.transactions.filter((t) => t.status === 'accepted').length;
  const rejectedTransactions = state.transactions.filter((t) => t.status === 'rejected').length;
  const activeApps = state.apps.filter((a) => a.status === 'deployed').length;
  const verifiedOracleNodes = state.oracleNodes.filter((n) => n.status === 'verified').length;
  const flaggedOracleNodes = state.oracleNodes.filter((n) => n.status === 'flagged').length;
  const ribaBlockedTransactions = state.transactions.filter((t) => t.ribaRejected).length;
  const gamblingBlocked = state.transactions.filter((t) => t.gamblingRejected).length;
  const exchangeBlocked = state.transactions.filter((t) => t.exchangeRejected).length;

  const totalBackingUsd = state.collateralReserves.reduce((sum, item) => sum + item.backingUsd, 0);
  const collateralRatioActual = Number((totalBackingUsd / NovaPolicy.networkValueAtPegUsd).toFixed(2));
  const marketplaceVolumeNvc = Number(
    state.marketplaceOrders.reduce((sum, o) => sum + o.amountNvc, 0).toFixed(4),
  );

  return {
    constants: NovaPolicy,
    mainnetLaunched: state.mainnetLaunched,
    complianceBreached: state.complianceBreached,
    aiHealthScore: Number(state.aiHealthScore.toFixed(1)),
    unethicalIncidents: state.unethicalIncidents,
    hyperMindStatus: 'Active',
    threatsBlocked: hyperMind.threatsBlocked,
    networkHealth: hyperMind.networkHealth,
    whaleProof: true,
    scamBlocked: hyperMind.scamBlocked,
    ribaBlockedTransactions,
    gamblingBlocked,
    exchangeBlocked,
    stabilizerStatus: 'LOCKED at $3.14',
    ribaPolicy: '0% Interest',
    rules: state.rules,
    metrics: {
      totalTransactions: state.transactions.length,
      acceptedTransactions,
      rejectedTransactions,
      activeApps,
      verifiedOracleNodes,
      isolatedOracleNodes: flaggedOracleNodes,
      verifiedCitizens: state.citizens.filter((c) => c.kycVerified).length,
      openProposals: state.proposals.filter((p) => p.status === 'open').length,
      collateralRatioActual,
      marketplaceVolumeNvc,
      latestBlockHeight: state.scpBlocks[0]?.height || 1042,
      mudarabahDistributedNvc: Number(state.mudarabahDistributedNvc.toFixed(4)),
    },
    transactions: state.transactions,
    apps: state.apps,
    oracleNodes: state.oracleNodes,
    auditLog: state.auditLog,
    hyperModules: hyperMind.modules,
    hyperMindLog: hyperMind.liveLog,
    bannedCreators: Array.from(hyperMind.bannedCreators),
    citizens: state.citizens,
    proposals: state.proposals,
    collateralReserves: state.collateralReserves,
    marketplaceListings: state.marketplaceListings,
    marketplaceOrders: state.marketplaceOrders,
    scpBlocks: state.scpBlocks,
  };
}

const app = express();
app.use(express.json());

app.get('/api/ecosystem', (_req: Request, res: Response) => {
  res.json(buildSnapshot());
});

// Hyper-Intelligence A: Oracle Predictive Shield
app.get('/api/hyper/oracle-shield', (req: Request, res: Response) => {
  const simulate = req.query.simulate === 'true' || req.query.mode === 'simulate';
  const shield = hyperMind.predictMarketAttack(state.oracleNodes, simulate);
  if (simulate) {
    appendAudit(
      'Oracle',
      'PREDICTIVE_SHIELD_BLOCK',
      'accepted',
      `${shield.status}: ${shield.predictedAttack}. Auto-healed to $3.14.`,
    );
  }
  res.json({
    ...shield,
    snapshot: buildSnapshot(),
  });
});

// Hyper-Intelligence B: Anti-Whale & Anti-Sybil HyperGuard
app.post('/api/hyper/whale-check', (req: Request, res: Response) => {
  const wallet = String(req.body?.wallet || '').trim();
  const amount = Number(req.body?.amount);
  const deviceFingerprint = req.body?.deviceFingerprint ? String(req.body.deviceFingerprint) : undefined;

  const result = hyperMind.checkWhaleAndSybil({ wallet, amount, deviceFingerprint });
  if (!result.allowed) {
    appendAudit('HyperMind', 'WHALE_ATTACK_BLOCKED', 'rejected', `Whale Attack Blocked — ${result.reason}`);
  }
  res.status(result.allowed ? 200 : 403).json({
    ...result,
    snapshot: buildSnapshot(),
  });
});

// Hyper-Intelligence C & D: Hyper-Compliance + Anti-Scam HyperScanner
app.post('/api/hyper/compliance-check', (req: Request, res: Response) => {
  const memo = String(req.body?.memo || '');
  const spec = String(req.body?.spec || '');
  const category = String(req.body?.category || '');

  const check = hyperMind.scanCompliance({ memo, spec, category });
  if (!check.passed) {
    const isScam = check.violations.some((v) => v.category === 'Scam / Rug');
    hyperMind.recordLog(
      isScam ? 'Anti-Scam & Anti-Rug HyperScanner' : 'Hyper-Compliance & HyperScanner',
      `Blocked non-compliant payload: ${check.violations.map((v) => `${v.category} ("${v.keyword}")`).join(', ')}`,
      'blocked',
    );
    appendAudit(
      isScam ? 'HyperScanner' : 'RibaGuard',
      isScam ? 'SCAM_APP_BLOCKED' : 'HYPER_COMPLIANCE_BLOCK',
      'rejected',
      isScam ? `Scam App Blocked — ${check.reason}` : check.reason,
    );
  }

  res.status(check.passed ? 200 : 403).json({
    passed: check.passed,
    violations: check.violations,
    reason: check.reason,
    snapshot: buildSnapshot(),
  });
});

// Hyper-Intelligence E: Manual or automatic Self-Healing trigger
app.post('/api/hyper/self-heal', (_req: Request, res: Response) => {
  const healedCount = hyperMind.selfHeal(state.oracleNodes);
  appendAudit(
    'Oracle',
    'SELF_HEAL',
    'accepted',
    `Self-Healing Network AI restored ${healedCount} oracle node(s) to $3.14 Nova Peg.`,
  );
  res.json({ healedCount, snapshot: buildSnapshot() });
});

// Hyper-Intelligence F: Predictive Governance AI
app.post('/api/hyper/governance/predict', (req: Request, res: Response) => {
  const proposal = String(req.body?.proposal || 'Adjust $3.14 Nova Peg to $3.20').trim();
  const prediction = hyperMind.predictGovernanceVote(proposal);
  appendAudit('Governor', 'PREDICT_VOTE', 'info', prediction.summary);
  res.json({
    ...prediction,
    snapshot: buildSnapshot(),
  });
});

// RibaGuard AI verification endpoint
app.post('/api/riba/check', (req: Request, res: Response) => {
  const memo = String(req.body?.memo || '');
  const spec = String(req.body?.spec || '');
  const check = hyperMind.scanCompliance({ memo, spec });
  const hasRiba = check.violations.some((v) => v.category === 'Riba');
  if (hasRiba) {
    res.json({
      isRiba: true,
      reason: 'RibaGuard AI: Riba / Interest detected - Transaction rejected. Stellar Nova Core is 0% Interest.',
    });
    return;
  }
  res.json({
    isRiba: false,
    reason: 'RibaGuard AI: Verified 0% Interest, Sharia-compliant real-economy model.',
  });
});

app.get('/api/metrics', (_req: Request, res: Response) => {
  const snap = buildSnapshot();
  res.json({
    totalTransactions: snap.metrics.totalTransactions,
    rejectedCoins: snap.metrics.rejectedTransactions,
    aiHealth: snap.aiHealthScore,
    ecosystemStability: snap.complianceBreached ? 'halted' : 'stable',
  });
});

app.get('/api/insights/health', (_req: Request, res: Response) => {
  res.json({
    ecosystemHealth: {
      score: state.aiHealthScore / 100,
      risk: state.complianceBreached ? 'critical' : 'low',
      mainnetLaunched: state.mainnetLaunched,
      networkHealth: hyperMind.networkHealth,
    },
  });
});

function handleCoinStatus(req: Request, res: Response) {
  const { coinId } = req.params;
  const isBlocked = NovaPolicy.blacklistedSources.some((src) =>
    String(coinId).toLowerCase().includes(src),
  );
  if (isBlocked) {
    res.status(403).json({
      coinId,
      status: 'rejected',
      error: 'Nova Core Coin rejected: Exchange/third-party exposure',
    });
    return;
  }
  res.json({
    coinId,
    status: 'valid',
    value: NovaPolicy.fixedValueUsd,
    symbol: NovaPolicy.symbol,
  });
}

app.get('/api/nova/status/:coinId', handleCoinStatus);
app.get('/api/pi/status/:coinId', handleCoinStatus);

app.get('/api/bridge/status/:coinId', (req: Request, res: Response) => {
  const { coinId } = req.params;
  const isBlocked = NovaPolicy.blacklistedSources.some((src) =>
    String(coinId).toLowerCase().includes(src),
  );
  res.json({
    coinId,
    bridgeStatus: isBlocked ? 'rejected' : 'bridged',
  });
});

// NovaStablecoinManager + NovaHyperMind + AHI AI + RibaGuard AI + NovaValuePolicy + NovaPurityEnforcer
function handleNovaTransaction(req: Request, res: Response) {
  const sender = String(req.body?.sender || 'NVC-USER-LOCAL').trim();
  const recipient = String(req.body?.recipient || '').trim();
  const amount = Number(req.body?.amount);
  const source = String(req.body?.source || '').trim();
  const memo = String(req.body?.memo || '').trim();
  const reportedValueUsd =
    req.body?.reportedValueUsd !== undefined
      ? Number(req.body.reportedValueUsd)
      : NovaPolicy.fixedValueUsd;

  if (!recipient || !Number.isFinite(amount) || amount <= 0) {
    res.status(400).json({ error: 'Valid recipient and positive NVC amount are required.' });
    return;
  }

  const analysis = hyperMind.analyzeTransaction({
    sender,
    recipient,
    amount,
    source,
    memo,
    reportedValueUsd,
    existingTransactions: state.transactions,
  });

  if (!analysis.isSafe) {
    if (analysis.violationType === 'gambling' || analysis.violationType === 'riba') {
      state.unethicalIncidents += 1;
      state.aiHealthScore = Math.max(70, state.aiHealthScore - 0.8);
    } else {
      state.aiHealthScore = Math.max(75, state.aiHealthScore - 0.4);
    }
  } else {
    state.aiHealthScore = Math.min(100, state.aiHealthScore + 0.1);
  }

  const status: 'accepted' | 'rejected' = analysis.isSafe ? 'accepted' : 'rejected';
  const timestamp = new Date().toISOString();
  const tx: NovaTransaction = {
    id: `tx-nvc-${Date.now().toString(36)}`,
    sender,
    recipient,
    amount,
    micronNova: Math.round(amount * NovaPolicy.micronNovaPerNvc),
    source,
    memo: memo || 'NVC settlement',
    reportedValueUsd,
    status,
    reason: analysis.reason,
    ribaRejected: analysis.violationType === 'riba',
    gamblingRejected: analysis.violationType === 'gambling',
    exchangeRejected: analysis.violationType === 'exchange',
    riskScore: analysis.riskScore,
    purityScore: analysis.purityScore,
    hash: sha256({ sender, recipient, amount, source, memo, reportedValueUsd, timestamp }),
    timestamp,
  };

  if (status === 'accepted' && source.toLowerCase() === 'p2p') {
    const senderCitizen = state.citizens.find((c) => c.id === sender);
    const recipientCitizen = state.citizens.find((c) => c.id === recipient);
    if (senderCitizen && senderCitizen.id !== recipient) {
      if (senderCitizen.balanceNvc < amount) {
        res.status(409).json({
          error: `Insufficient P2P balance: ${senderCitizen.id} holds ${senderCitizen.balanceNvc.toFixed(4)} NVC, tried to send ${amount} NVC.`,
          snapshot: buildSnapshot(),
        });
        return;
      }
      senderCitizen.balanceNvc = Number((senderCitizen.balanceNvc - amount).toFixed(6));
    }
    if (recipientCitizen && recipientCitizen.id !== sender) {
      recipientCitizen.balanceNvc = Number((recipientCitizen.balanceNvc + amount).toFixed(6));
    }
  }

  state.transactions.unshift(tx);
  if (analysis.violationType === 'riba') {
    appendAudit(
      'RibaGuard',
      'REJECT_RIBA',
      'rejected',
      `${tx.id} (${tx.amount} NVC / ${tx.micronNova.toLocaleString()} µNVC): ${tx.reason}`,
    );
  } else {
    appendAudit(
      'Nova',
      status === 'accepted' ? 'TX_ACCEPTED' : 'TX_REJECTED',
      status,
      `${tx.id} (${tx.amount} NVC / ${tx.micronNova.toLocaleString()} µNVC): ${tx.reason}`,
    );
  }

  res.status(status === 'accepted' ? 201 : 403).json({
    transaction: tx,
    analysis,
    snapshot: buildSnapshot(),
  });
}

app.post('/api/nova/transaction', handleNovaTransaction);
app.post('/api/pi/transaction', handleNovaTransaction);

// AutonomousAppBuilder endpoint (HyperScanner + RibaGuard AI + Anti-Gambling + NVC-only)
app.post('/api/apps/generate', (req: Request, res: Response) => {
  const name = String(req.body?.name || '').trim();
  const category = String(req.body?.category || 'Commerce').trim();
  const description = String(req.body?.description || '').trim();
  const paymentAsset = String(req.body?.paymentAsset || 'NVC').trim().toUpperCase();
  const creator = String(req.body?.creator || 'NVC-BUILDER-LOCAL').trim();

  if (!name || !description) {
    res.status(400).json({ error: 'App name and description are required.' });
    return;
  }

  if (hyperMind.bannedCreators.has(creator)) {
    res.status(403).json({
      error: `Creator "${creator}" is permanently banned by Anti-Scam HyperScanner.`,
      snapshot: buildSnapshot(),
    });
    return;
  }

  const scan = hyperMind.scanCompliance({ memo: name, spec: description, category });
  let status: NovaAppRecord['status'] = 'deployed';
  let complianceReason =
    'Passed AHI AI, HyperScanner (0 Scams), RibaGuard AI (0% interest), and NVC-exclusivity verification.';

  const hasScam = scan.violations.some((v) => v.category === 'Scam / Rug');
  const hasRiba = scan.violations.some((v) => v.category === 'Riba');
  const hasGambling = scan.violations.some((v) => v.category === 'Maysir (Gambling)');
  const hasGharar = scan.violations.some((v) => v.category === 'Gharar');

  if (hasScam) {
    status = 'rejected';
    complianceReason = `Anti-Scam HyperScanner: Scam / rug pattern detected. App rejected & creator "${creator}" permanently banned.`;
    hyperMind.bannedCreators.add(creator);
    hyperMind.recordLog(
      'Anti-Scam HyperScanner',
      `Blocked Scam App — "${name}" flagged; creator ${creator} permanently banned.`,
      'blocked',
    );
    state.unethicalIncidents += 1;
  } else if (hasGambling) {
    status = 'rejected';
    const kw = scan.violations.find((v) => v.category === 'Maysir (Gambling)')?.keyword || 'gambling';
    complianceReason = `Rejected by NovaPurityEnforcer: gambling keyword "${kw}" violates no-gambling mandate.`;
    state.unethicalIncidents += 1;
  } else if (hasRiba) {
    status = 'rejected';
    complianceReason =
      'RibaGuard AI: App rejected - Contains Riba model. Only profit-sharing / fee-based / real trade allowed.';
    state.unethicalIncidents += 1;
  } else if (hasGharar) {
    status = 'rejected';
    complianceReason = scan.reason;
    state.unethicalIncidents += 1;
  } else if (paymentAsset !== 'NVC') {
    status = 'rejected';
    complianceReason = `Rejected volatile asset "${paymentAsset}": all internal apps must settle exclusively in NVC.`;
  }

  const appRecord: NovaAppRecord = {
    id: `app-${Date.now().toString(36)}`,
    name,
    category,
    description,
    creator,
    status,
    complianceReason,
    manifestSnippet:
      status === 'deployed'
        ? `// Generated by AutonomousAppBuilder\nexport const APP_NAME = ${JSON.stringify(name)};\nexport const SETTLEMENT_ASSET = "NVC";\nexport const FIXED_VALUE_USD = ${NovaPolicy.fixedValueUsd};\nexport const RIBA_POLICY = "0% Interest";`
        : `// Blocked by Compliance Gate\n// Reason: ${complianceReason}`,
    createdAt: new Date().toISOString(),
  };

  state.apps.unshift(appRecord);
  if (hasRiba) {
    appendAudit('RibaGuard', 'REJECT_RIBA', 'rejected', `${name}: ${complianceReason}`);
  } else if (hasScam) {
    appendAudit('HyperMind', 'BAN_SCAM_CREATOR', 'rejected', `${name} (${creator}): ${complianceReason}`);
  } else {
    appendAudit(
      'Nova',
      status === 'deployed' ? 'APP_DEPLOYED' : 'APP_REJECTED',
      status === 'deployed' ? 'accepted' : 'rejected',
      `${name}: ${complianceReason}`,
    );
  }

  res.status(status === 'deployed' ? 201 : 403).json({
    app: appRecord,
    snapshot: buildSnapshot(),
  });
});

app.post('/api/apps/:id/halt', (req: Request, res: Response) => {
  const target = state.apps.find((a) => a.id === req.params.id);
  if (!target) {
    res.status(404).json({ error: 'App not found.' });
    return;
  }
  target.status = target.status === 'halted' ? 'deployed' : 'halted';
  appendAudit(
    'Nova',
    target.status === 'halted' ? 'APP_HALTED' : 'APP_RESUMED',
    'info',
    `App "${target.name}" transitioned to ${target.status}.`,
  );
  res.json({ app: target, snapshot: buildSnapshot() });
});

// Global NOVA Oracle Compliance Verifier + Predictive Shield + Stabilizer
app.post('/api/oracle/verify', (req: Request, res: Response) => {
  const nodeId = String(req.body?.nodeId || '').trim();
  const reportedValueUsd = Number(req.body?.reportedValueUsd);

  const node = state.oracleNodes.find((n) => n.id === nodeId);
  if (!node || !Number.isFinite(reportedValueUsd)) {
    res.status(400).json({ error: 'Valid oracle nodeId and numeric reportedValueUsd are required.' });
    return;
  }

  node.reportedValueUsd = reportedValueUsd;
  node.lastCheckedAt = new Date().toISOString();

  if (!isValidNovaValue(reportedValueUsd)) {
    node.status = 'flagged';
    hyperMind.recordLog(
      'Hyper-Economic Stabilizer',
      `Oracle ${node.id} reported $${reportedValueUsd.toFixed(2)} (!= $3.14). Flagged for community vote; stabilization proposal created.`,
      'predicted',
    );
    appendAudit(
      'Oracle',
      'NODE_FLAGGED_FOR_VOTE',
      'rejected',
      `Oracle ${node.id} reported $${reportedValueUsd.toFixed(2)} (!= $${NovaPolicy.fixedValueUsd}) and was flagged for community vote.`,
    );
    // Check for multi-node collusion via Oracle Predictive Shield
    const shield = hyperMind.predictMarketAttack(state.oracleNodes, false);
    if (shield.selfHealed) {
      appendAudit('Oracle', 'PREDICTIVE_SHIELD_SELF_HEAL', 'accepted', `${shield.status}: ${shield.predictedAttack}`);
    } else {
      const proposalTitle = `Restore ${node.id} to $3.14 Peg`;
      const exists = state.proposals.some((p) => p.status === 'open' && p.title === proposalTitle);
      if (!exists) {
        state.proposals.unshift({
          id: `prop-oracle-${Date.now().toString(36)}`,
          title: proposalTitle,
          description: `Oracle ${node.id} reported $${reportedValueUsd.toFixed(2)}. Vote APPROVE to enforce mandatory $3.14 restoration.`,
          proposer: 'Hyper-Economic Stabilizer',
          category: 'Oracle Alignment',
          status: 'open',
          yesVotes: 1,
          noVotes: 0,
          voters: ['NVC-MINER-RASPI-09'],
          aiForecast: '96% projected APPROVE ($3.14 alignment mandate)',
          createdAt: new Date().toISOString(),
        });
      }
    }
  } else {
    node.status = 'verified';
    appendAudit(
      'Oracle',
      'NODE_VERIFIED',
      'accepted',
      `Oracle ${node.id} confirmed $3.14 Nova Peg valuation.`,
    );
  }

  persistNow();
  res.json({ node, snapshot: buildSnapshot() });
});

// 1-KYC Citizen Registry & Low-Energy Mobile Phone Mining
app.post('/api/citizens/register', (req: Request, res: Response) => {
  const displayName = String(req.body?.displayName || '').trim();
  const region = String(req.body?.region || 'Global').trim();
  const deviceFingerprint = String(req.body?.deviceFingerprint || '').trim();

  if (!displayName || !deviceFingerprint) {
    res.status(400).json({ error: 'Display name and unique device fingerprint are required for 1-KYC verification.' });
    return;
  }

  const citizenId = `NVC-CITIZEN-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const sybilCheck = hyperMind.registerCitizenDevice(citizenId, deviceFingerprint);
  if (!sybilCheck.allowed) {
    appendAudit('HyperMind', 'SYBIL_REGISTER_BLOCKED', 'rejected', sybilCheck.reason);
    res.status(403).json({ error: sybilCheck.reason, snapshot: buildSnapshot() });
    return;
  }

  const citizen: CitizenAccount = {
    id: citizenId,
    displayName,
    region,
    deviceFingerprint,
    kycVerified: true,
    reputationScore: 90,
    balanceNvc: 0,
    minedTotalNvc: 0,
    miningSessions: 0,
    lastMinedAt: new Date().toISOString(),
  };

  state.citizens.unshift(citizen);
  appendAudit(
    'Nova',
    'CITIZEN_KYC_VERIFIED',
    'accepted',
    `1-KYC Citizen ${citizen.id} (${citizen.displayName}) verified on device ${citizen.deviceFingerprint}.`,
  );

  res.status(201).json({ citizen, snapshot: buildSnapshot() });
});

app.post('/api/citizens/mine', (req: Request, res: Response) => {
  const citizenId = String(req.body?.citizenId || '').trim();
  const rewardNvc = Number(req.body?.rewardNvc ?? 0.286624);

  const citizen = state.citizens.find((c) => c.id === citizenId);
  if (!citizen || !Number.isFinite(rewardNvc) || rewardNvc <= 0 || rewardNvc > 50) {
    res.status(400).json({ error: 'Valid verified Citizen ID and mobile mining reward (0 < NVC <= 50) required.' });
    return;
  }

  const analysis = hyperMind.analyzeTransaction({
    sender: 'SCP-MOBILE-MINING-POOL',
    recipient: citizen.id,
    amount: rewardNvc,
    source: 'mining',
    memo: `Mobile SCP uptime mining reward (${citizen.deviceFingerprint})`,
    reportedValueUsd: NovaPolicy.fixedValueUsd,
    existingTransactions: state.transactions,
  });

  if (!analysis.isSafe) {
    res.status(403).json({ error: analysis.reason, snapshot: buildSnapshot() });
    return;
  }

  const timestamp = new Date().toISOString();
  const tx: NovaTransaction = {
    id: `tx-mine-${Date.now().toString(36)}`,
    sender: 'SCP-MOBILE-MINING-POOL',
    recipient: citizen.id,
    amount: rewardNvc,
    micronNova: Math.round(rewardNvc * NovaPolicy.micronNovaPerNvc),
    source: 'mining',
    memo: `Mobile phone SCP mining (${citizen.deviceFingerprint})`,
    reportedValueUsd: NovaPolicy.fixedValueUsd,
    status: 'accepted',
    reason: analysis.reason,
    ribaRejected: false,
    gamblingRejected: false,
    exchangeRejected: false,
    riskScore: analysis.riskScore,
    purityScore: analysis.purityScore,
    hash: sha256({ citizenId: citizen.id, rewardNvc, timestamp }),
    timestamp,
  };

  citizen.balanceNvc = Number((citizen.balanceNvc + rewardNvc).toFixed(6));
  citizen.minedTotalNvc = Number((citizen.minedTotalNvc + rewardNvc).toFixed(6));
  citizen.miningSessions += 1;
  citizen.reputationScore = Math.min(100, citizen.reputationScore + 1);
  citizen.lastMinedAt = timestamp;

  state.transactions.unshift(tx);
  appendAudit(
    'Nova',
    'MOBILE_SCP_MINE',
    'accepted',
    `${citizen.id} mined ${rewardNvc} NVC (${tx.micronNova.toLocaleString()} µNVC) via low-energy mobile SCP.`,
  );

  res.status(201).json({ citizen, transaction: tx, snapshot: buildSnapshot() });
});

// Community Governance (1 Person = 1 Vote + Reputation)
app.post('/api/governance/proposals', (req: Request, res: Response) => {
  const title = String(req.body?.title || '').trim();
  const description = String(req.body?.description || '').trim();
  const proposer = String(req.body?.proposer || state.citizens[0]?.id || 'NVC-CITIZEN').trim();
  const category = (req.body?.category || 'Real Economy') as GovernanceProposal['category'];

  if (!title || !description) {
    res.status(400).json({ error: 'Proposal title and description are required.' });
    return;
  }

  const compliance = hyperMind.scanCompliance({ memo: title, spec: description });
  if (!compliance.passed) {
    appendAudit('RibaGuard', 'PROPOSAL_REJECTED', 'rejected', `${title}: ${compliance.reason}`);
    res.status(403).json({ error: compliance.reason, snapshot: buildSnapshot() });
    return;
  }

  const prediction = hyperMind.predictGovernanceVote(`${title} ${description}`);
  const proposal: GovernanceProposal = {
    id: `prop-${Date.now().toString(36)}`,
    title,
    description,
    proposer,
    category,
    status: 'open',
    yesVotes: 0,
    noVotes: 0,
    voters: [],
    aiForecast: prediction.summary,
    createdAt: new Date().toISOString(),
  };

  state.proposals.unshift(proposal);
  appendAudit('Governor', 'PROPOSAL_CREATED', 'info', `${proposer} submitted "${title}".`);
  res.status(201).json({ proposal, snapshot: buildSnapshot() });
});

app.post('/api/governance/proposals/:id/vote', (req: Request, res: Response) => {
  const proposal = state.proposals.find((p) => p.id === req.params.id);
  if (!proposal) {
    res.status(404).json({ error: 'Proposal not found.' });
    return;
  }
  if (proposal.status !== 'open') {
    res.status(400).json({ error: `Proposal is already ${proposal.status}.` });
    return;
  }

  const citizenId = String(req.body?.citizenId || '').trim();
  const vote = req.body?.vote === 'yes' ? 'yes' : req.body?.vote === 'no' ? 'no' : null;
  const citizen = state.citizens.find((c) => c.id === citizenId && c.kycVerified);
  if (!citizen || !vote) {
    res.status(400).json({ error: 'Valid 1-KYC Citizen ID and vote ("yes" or "no") required.' });
    return;
  }

  if (proposal.voters.includes(citizen.id)) {
    res.status(409).json({ error: `Citizen ${citizen.id} has already cast their 1-Person-1-Vote ballot.` });
    return;
  }

  proposal.voters.push(citizen.id);
  if (vote === 'yes') {
    proposal.yesVotes += 1;
  } else {
    proposal.noVotes += 1;
  }

  // Quorum threshold: 2+ votes decides outcome immediately in console demo
  const totalVotes = proposal.yesVotes + proposal.noVotes;
  if (totalVotes >= 2 && proposal.yesVotes !== proposal.noVotes) {
    const isDeviationRequest =
      proposal.title.toLowerCase().includes('slippage') ||
      proposal.title.toLowerCase().includes('3.20') ||
      proposal.description.toLowerCase().includes('deviation');

    if (proposal.yesVotes > proposal.noVotes && !isDeviationRequest) {
      proposal.status = 'passed';
      if (proposal.category === 'Oracle Alignment') {
        hyperMind.selfHeal(state.oracleNodes);
      }
    } else {
      proposal.status = 'rejected';
    }
  }

  appendAudit(
    'Governor',
    'CITIZEN_VOTE',
    proposal.status === 'rejected' ? 'rejected' : 'accepted',
    `${citizen.id} voted ${vote.toUpperCase()} on "${proposal.title}" (Yes ${proposal.yesVotes} / No ${proposal.noVotes}, status: ${proposal.status}).`,
  );

  res.json({ proposal, snapshot: buildSnapshot() });
});

// 1.5x Reserve Proof Endpoint
app.get('/api/collateral/proof', (_req: Request, res: Response) => {
  const totalBackingUsd = state.collateralReserves.reduce((sum, item) => sum + item.backingUsd, 0);
  res.json({
    targetRatio: NovaPolicy.collateralRatio,
    actualRatio: Number((totalBackingUsd / NovaPolicy.networkValueAtPegUsd).toFixed(2)),
    networkPegValueUsd: NovaPolicy.networkValueAtPegUsd,
    totalBackingUsd,
    reserves: state.collateralReserves,
  });
});

// Real-Economy NVC Marketplace & Halal Mudarabah Escrow
app.post('/api/marketplace/listings', (req: Request, res: Response) => {
  const title = String(req.body?.title || '').trim();
  const description = String(req.body?.description || '').trim();
  const merchantId = String(req.body?.merchantId || state.citizens[0]?.id || 'NVC-MERCHANT').trim();
  const merchantName = String(req.body?.merchantName || 'Verified NVC Citizen Guild').trim();
  const category = (req.body?.category || 'Physical Goods') as MarketplaceListing['category'];
  const settlementModel = (req.body?.settlementModel || 'Direct Real Trade') as MarketplaceListing['settlementModel'];
  const priceNvc = Number(req.body?.priceNvc);
  const stock = Math.max(1, Math.floor(Number(req.body?.stock || 10)));

  if (!title || !description || !Number.isFinite(priceNvc) || priceNvc <= 0) {
    res.status(400).json({ error: 'Listing title, description, and positive NVC price are required.' });
    return;
  }

  const scan = hyperMind.scanCompliance({ memo: title, spec: description, category });
  if (!scan.passed) {
    appendAudit('RibaGuard', 'MARKETPLACE_LISTING_BLOCKED', 'rejected', `${title}: ${scan.reason}`);
    persistNow();
    res.status(403).json({ error: scan.reason, snapshot: buildSnapshot() });
    return;
  }

  const listing: MarketplaceListing = {
    id: `mkt-${Date.now().toString(36)}`,
    title,
    merchantId,
    merchantName,
    category,
    priceNvc: Number(priceNvc.toFixed(6)),
    description,
    settlementModel,
    stock,
    soldCount: 0,
    halalVerified: true,
    createdAt: new Date().toISOString(),
  };

  state.marketplaceListings.unshift(listing);
  appendAudit(
    'Nova',
    'MARKETPLACE_LISTED',
    'accepted',
    `Listed "${listing.title}" (${listing.priceNvc} NVC / ${formatUsdSafe(nvcToUsd(listing.priceNvc))}) under ${listing.settlementModel}.`,
  );
  persistNow();
  res.status(201).json({ listing, snapshot: buildSnapshot() });
});

function formatUsdSafe(v: number): string {
  return `$${v.toFixed(2)}`;
}

app.post('/api/marketplace/buy', (req: Request, res: Response) => {
  const listingId = String(req.body?.listingId || '').trim();
  const buyerId = String(req.body?.buyerId || '').trim();
  const quantity = Math.max(1, Math.floor(Number(req.body?.quantity || 1)));

  const listing = state.marketplaceListings.find((l) => l.id === listingId);
  const buyer = state.citizens.find((c) => c.id === buyerId && c.kycVerified);

  if (!listing || !buyer) {
    res.status(400).json({ error: 'Valid marketplace listing and verified 1-KYC Citizen buyer are required.' });
    return;
  }
  if (listing.stock < quantity) {
    res.status(409).json({ error: `Insufficient stock for "${listing.title}".` });
    return;
  }

  const totalNvc = Number((listing.priceNvc * quantity).toFixed(6));
  if (buyer.balanceNvc < totalNvc) {
    res.status(409).json({
      error: `Insufficient balance: ${buyer.id} holds ${buyer.balanceNvc.toFixed(4)} NVC, needs ${totalNvc.toFixed(4)} NVC. Mine more NVC first.`,
    });
    return;
  }

  const analysis = hyperMind.analyzeTransaction({
    sender: buyer.id,
    recipient: listing.merchantId,
    amount: totalNvc,
    source: 'marketplace',
    memo: `${listing.settlementModel}: ${listing.title} x${quantity}`,
    reportedValueUsd: NovaPolicy.fixedValueUsd,
    existingTransactions: state.transactions,
  });

  if (!analysis.isSafe) {
    res.status(403).json({ error: analysis.reason, snapshot: buildSnapshot() });
    return;
  }

  const timestamp = new Date().toISOString();
  const micronNova = Math.round(totalNvc * NovaPolicy.micronNovaPerNvc);
  const tx: NovaTransaction = {
    id: `tx-mkt-${Date.now().toString(36)}`,
    sender: buyer.id,
    recipient: listing.merchantId,
    amount: totalNvc,
    micronNova,
    source: 'marketplace',
    memo: `${listing.settlementModel}: ${listing.title} x${quantity}`,
    reportedValueUsd: NovaPolicy.fixedValueUsd,
    status: 'accepted',
    reason: analysis.reason,
    ribaRejected: false,
    gamblingRejected: false,
    exchangeRejected: false,
    riskScore: analysis.riskScore,
    purityScore: analysis.purityScore,
    hash: sha256({ listingId: listing.id, buyerId: buyer.id, totalNvc, timestamp }),
    timestamp,
  };

  buyer.balanceNvc = Number((buyer.balanceNvc - totalNvc).toFixed(6));
  buyer.reputationScore = Math.min(100, buyer.reputationScore + 1);
  listing.stock -= quantity;
  listing.soldCount += quantity;

  const order: MarketplaceOrder = {
    id: `ord-${Date.now().toString(36)}`,
    listingId: listing.id,
    listingTitle: listing.title,
    buyerId: buyer.id,
    merchantId: listing.merchantId,
    amountNvc: totalNvc,
    micronNova,
    usdEquivalent: Number(nvcToUsd(totalNvc).toFixed(2)),
    txId: tx.id,
    hash: tx.hash,
    timestamp,
  };

  state.transactions.unshift(tx);
  state.marketplaceOrders.unshift(order);
  appendAudit(
    'Nova',
    'REAL_ECONOMY_SETTLEMENT',
    'accepted',
    `${buyer.id} settled ${totalNvc} NVC (${micronNova.toLocaleString()} µNVC / $${order.usdEquivalent.toFixed(2)}) for "${listing.title}" (${listing.settlementModel}).`,
  );
  persistNow();

  res.status(201).json({ order, transaction: tx, snapshot: buildSnapshot() });
});

// Halal Mudarabah 0%-Interest Profit-Sharing Distribution
app.post('/api/marketplace/mudarabah/distribute', (req: Request, res: Response) => {
  const listingId = String(req.body?.listingId || 'mkt-mudarabah-bakery').trim();
  const netProfitNvc = Number(req.body?.netProfitNvc);
  const partnerSharePercent = Number(req.body?.partnerSharePercent ?? 70);
  const note = String(req.body?.note || 'Real-economy operating surplus settlement').trim();

  if (!Number.isFinite(netProfitNvc) || netProfitNvc < 0 || netProfitNvc > 10_000) {
    res.status(400).json({ error: 'Valid non-negative net operating profit (0 to 10,000 NVC) is required.' });
    return;
  }
  if (!Number.isFinite(partnerSharePercent) || partnerSharePercent <= 0 || partnerSharePercent > 90) {
    res.status(400).json({ error: 'Partner Mudarabah ratio must be between 1% and 90%.' });
    return;
  }

  const scan = hyperMind.scanCompliance({ memo: note, spec: 'mudarabah profit sharing' });
  if (!scan.passed) {
    appendAudit('RibaGuard', 'MUDARABAH_REJECTED', 'rejected', scan.reason);
    res.status(403).json({ error: scan.reason, snapshot: buildSnapshot() });
    return;
  }

  const listing = state.marketplaceListings.find((l) => l.id === listingId) || state.marketplaceListings[0];
  const distributableNvc = Number(((netProfitNvc * partnerSharePercent) / 100).toFixed(6));
  const recipients = state.citizens.slice(0, 3);
  const perCitizenNvc = recipients.length > 0 ? Number((distributableNvc / recipients.length).toFixed(6)) : 0;

  const timestamp = new Date().toISOString();
  if (distributableNvc > 0 && perCitizenNvc > 0) {
    for (const c of recipients) {
      c.balanceNvc = Number((c.balanceNvc + perCitizenNvc).toFixed(6));
      c.reputationScore = Math.min(100, c.reputationScore + 1);
    }
    const tx: NovaTransaction = {
      id: `tx-mudarabah-${Date.now().toString(36)}`,
      sender: listing?.merchantId || 'NVC-MUDARABAH-POOL',
      recipient: `${recipients.length}-CITIZEN-COOP`,
      amount: distributableNvc,
      micronNova: Math.round(distributableNvc * NovaPolicy.micronNovaPerNvc),
      source: 'contribution_rewards',
      memo: `Halal Mudarabah (${partnerSharePercent}/${100 - partnerSharePercent}) surplus: ${note}`,
      reportedValueUsd: NovaPolicy.fixedValueUsd,
      status: 'accepted',
      reason: 'Verified 0% Interest Halal Mudarabah real-revenue profit-sharing at $3.14 peg.',
      ribaRejected: false,
      gamblingRejected: false,
      exchangeRejected: false,
      riskScore: 2,
      purityScore: 1.0,
      hash: sha256({ listingId: listing?.id, distributableNvc, timestamp }),
      timestamp,
    };
    state.transactions.unshift(tx);
    state.mudarabahDistributedNvc = Number((state.mudarabahDistributedNvc + distributableNvc).toFixed(6));
  }

  appendAudit(
    'Nova',
    'MUDARABAH_DISTRIBUTED',
    'accepted',
    distributableNvc === 0
      ? `Mudarabah cycle settled at 0 NVC surplus (0% guaranteed interest — shared operational outcome).`
      : `Distributed ${distributableNvc} NVC (${Math.round(distributableNvc * NovaPolicy.micronNovaPerNvc).toLocaleString()} µNVC) across ${recipients.length} Citizen co-op partners (${perCitizenNvc} NVC each).`,
  );

  res.status(201).json({
    distributableNvc,
    perCitizenNvc,
    recipientCount: recipients.length,
    snapshot: buildSnapshot(),
  });
});

// Stellar Consensus Protocol (SCP) Ledger Block Sealer
app.post('/api/scp/seal', (_req: Request, res: Response) => {
  const sealedTxIds = new Set(state.scpBlocks.flatMap((b) => b.txIds));
  const pendingAccepted = state.transactions.filter(
    (t) => t.status === 'accepted' && !sealedTxIds.has(t.id),
  );
  const latest = state.scpBlocks[0];
  const nextHeight = (latest?.height || 1042) + 1;
  const verifiedNodes = state.oracleNodes.filter((n) => n.status === 'verified').length;
  const totalNvc = Number(pendingAccepted.reduce((s, t) => s + t.amount, 0).toFixed(6));
  const totalMicronNova = Math.round(totalNvc * NovaPolicy.micronNovaPerNvc);
  const sealedAt = new Date().toISOString();

  const block: ScpBlock = {
    height: nextHeight,
    hash: sha256({
      height: nextHeight,
      previousHash: latest?.hash || 'genesis',
      txIds: pendingAccepted.map((t) => t.id),
      sealedAt,
    }),
    previousHash: latest?.hash || sha256({ height: 1041, genesis: 'stellar-nova-core' }),
    txIds: pendingAccepted.map((t) => t.id),
    txCount: pendingAccepted.length,
    totalNvc,
    totalMicronNova,
    quorum: `${verifiedNodes}/${state.oracleNodes.length} SCP Validators`,
    energyWh: 0.04,
    sealedAt,
  };

  state.scpBlocks.unshift(block);
  if (state.scpBlocks.length > 30) {
    state.scpBlocks.pop();
  }

  appendAudit(
    'Oracle',
    'SCP_BLOCK_SEALED',
    'accepted',
    `Sealed SCP Block #${block.height} (${block.txCount} tx, ${block.totalNvc} NVC, ${block.quorum}, ${block.energyWh} Wh).`,
  );

  res.status(201).json({ block, snapshot: buildSnapshot() });
});

// Audit Integrity Verification & Clean Demo Reset
app.get('/api/audit/verify', (_req: Request, res: Response) => {
  let verifiedCount = 0;
  for (const entry of state.auditLog) {
    const expected = sha256({
      moduleName: entry.module,
      action: entry.action,
      verdict: entry.verdict,
      detail: entry.detail,
      timestamp: entry.timestamp,
    });
    if (expected === entry.hash) {
      verifiedCount += 1;
    }
  }
  res.json({
    intact: verifiedCount === state.auditLog.length,
    verifiedCount,
    totalEntries: state.auditLog.length,
  });
});

app.post('/api/ecosystem/reset', (_req: Request, res: Response) => {
  clearPersistedData();
  hyperMind = new NovaHyperMind();
  state = createInitialState();
  seedInitialAuditAndDevices();
  persistNow();
  res.json({ reset: true, snapshot: buildSnapshot() });
});

// MainnetGovernor: Audits oracle alignment, app compliance, and purity filter health
app.post('/api/governance/audit', (_req: Request, res: Response) => {
  const flaggedCount = state.oracleNodes.filter((n) => n.status === 'flagged').length;
  const allNodesHealthy = flaggedCount === 0;
  const acceptedCount = state.transactions.filter((t) => t.status === 'accepted').length;
  const activeAppsCount = state.apps.filter((a) => a.status === 'deployed').length;
  const compliant = allNodesHealthy && acceptedCount > 0 && activeAppsCount > 0 && state.aiHealthScore >= 75;

  appendAudit(
    'Governor',
    'ECOSYSTEM_AUDIT',
    compliant ? 'accepted' : 'rejected',
    compliant
      ? `Ecosystem audit passed: ${state.oracleNodes.length} oracle nodes aligned at $3.14, ${activeAppsCount} NVC apps compliant, AHI AI health ${state.aiHealthScore.toFixed(1)}%.`
      : `Ecosystem audit flagged ${flaggedCount} oracle node(s) for community vote. Restore $3.14 alignment before launch.`,
  );

  res.json({ compliant, snapshot: buildSnapshot() });
});

app.post('/api/governance/mainnet-launch', (_req: Request, res: Response) => {
  if (state.mainnetLaunched) {
    res.status(409).json({ error: 'Mainnet is already launched.', snapshot: buildSnapshot() });
    return;
  }
  const flaggedCount = state.oracleNodes.filter((n) => n.status === 'flagged').length;
  if (flaggedCount > 0) {
    appendAudit(
      'Governor',
      'LAUNCH_ABORTED',
      'rejected',
      `Mainnet launch aborted: ${flaggedCount} flagged oracle node(s) deviated from $3.14.`,
    );
    res.status(400).json({
      error: `Mainnet launch aborted by MainnetGovernor: ${flaggedCount} node(s) flagged for community vote must be restored to $3.14 first.`,
      snapshot: buildSnapshot(),
    });
    return;
  }

  state.mainnetLaunched = true;
  appendAudit(
    'Governor',
    'MAINNET_LAUNCHED',
    'accepted',
    'MainnetGovernor approved launch. Stellar Nova Core ($3.14 fixed peg) is live on SCP.',
  );
  res.json({ launched: true, snapshot: buildSnapshot() });
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(import.meta.dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      const indexFile = path.join(distDir, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build artifacts not found.');
      }
    });
  }

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`Stellar Nova Core server listening on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
