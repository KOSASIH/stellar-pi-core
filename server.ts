import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import type { Request, Response } from 'express';
import {
  NovaPolicy,
  isValidNovaValue,
  type AuditEntry,
  type EcosystemSnapshot,
  type GovernanceRules,
  type NovaAppRecord,
  type NovaTransaction,
  type OracleNode,
} from './shared/novaPolicy.ts';

function sha256(payload: unknown): string {
  return crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

// NovaPurityEnforcer: Gambling keyword detector
function containsGamblingKeyword(text: string): string | null {
  const lower = text.toLowerCase();
  for (const kw of NovaPolicy.gamblingKeywords) {
    if (lower.includes(kw)) {
      return kw;
    }
  }
  return null;
}

// RibaGuard AI: Zero Riba / Zero Interest scanner across memos, app specs, and categories
const RIBA_EXTRA_TERMS = ['lending', 'yield farming', 'interest bearing', 'usury'];

function detectRibaViolation(text: string): { isRiba: boolean; matchedTerm: string | null } {
  const lower = text.toLowerCase();
  for (const kw of NovaPolicy.ribaKeywords) {
    if (lower.includes(kw)) {
      return { isRiba: true, matchedTerm: kw };
    }
  }
  for (const model of NovaPolicy.bannedFinancialModels) {
    if (lower.includes(model) || lower.includes(model.replace(/_/g, ' '))) {
      return { isRiba: true, matchedTerm: model };
    }
  }
  for (const extra of RIBA_EXTRA_TERMS) {
    if (lower.includes(extra)) {
      return { isRiba: true, matchedTerm: extra };
    }
  }
  return { isRiba: false, matchedTerm: null };
}

// NovaPurityEnforcer: Origin source verifier
function verifyNovaPuritySource(source: string): { ok: boolean; reason: string } {
  const normalized = source.trim().toLowerCase();
  if (!normalized) {
    return { ok: false, reason: 'Missing NVC coin origin source.' };
  }
  for (const blocked of NovaPolicy.blacklistedSources) {
    if (normalized === blocked || normalized.includes(blocked)) {
      return {
        ok: false,
        reason: `Rejected tainted/exchange source "${source}" by NovaPurityEnforcer.`,
      };
    }
  }
  const allowed = NovaPolicy.allowedSources.some((s) => s === normalized);
  if (!allowed) {
    return {
      ok: false,
      reason: `Source "${source}" is not in allowed origins (${NovaPolicy.allowedSources.join(', ')}).`,
    };
  }
  return { ok: true, reason: 'Verified pure NVC origin.' };
}

// NovaValuePolicy: Mathematical identity check ($3.14 USD)
function verifyNovaValuePeg(reportedValueUsd: number): { ok: boolean; reason: string } {
  if (!isValidNovaValue(reportedValueUsd)) {
    return {
      ok: false,
      reason: `NovaValuePolicy: reported value $${reportedValueUsd.toFixed(2)} deviates from $3.14 Nova Peg and was flagged for community vote.`,
    };
  }
  return { ok: true, reason: 'Verified $3.14 Nova Peg mathematical identity.' };
}

const nowMs = Date.now();

// In-memory state with realistic NVC seed data: 3 oracle nodes, 3 apps, 3 transactions, 5 audit logs
const state: {
  mainnetLaunched: boolean;
  complianceBreached: boolean;
  aiHealthScore: number;
  unethicalIncidents: number;
  rules: GovernanceRules;
  transactions: NovaTransaction[];
  apps: NovaAppRecord[];
  oracleNodes: OracleNode[];
  auditLog: AuditEntry[];
} = {
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
      status: 'deployed',
      complianceReason: 'Passed AHI AI anti-gambling, RibaGuard AI (0% interest), and NVC-exclusivity verification.',
      manifestSnippet: `// NVC-Exclusive Settlement Contract\nconst FIXED_NVC_VALUE = ${NovaPolicy.fixedValueUsd};\nassertSourceAllowed(["mining", "contribution_rewards", "p2p", "marketplace", "app"]);`,
      createdAt: new Date(nowMs - 1000 * 60 * 45).toISOString(),
    },
    {
      id: 'app-nova-logistics',
      name: 'Nova Logistics',
      category: 'Supply Chain',
      description: 'Transparent provenance and freight escrow paid in Micron Nova contribution rewards.',
      status: 'deployed',
      complianceReason: 'Passed AHI AI anti-gambling, RibaGuard AI (0% interest), and NVC-exclusivity verification.',
      manifestSnippet: `// SCP Fair Logistics Escrow\nconst MICRON_PER_NVC = ${NovaPolicy.micronNovaPerNvc};\nconst COLLATERAL_TARGET = ${NovaPolicy.collateralRatio};`,
      createdAt: new Date(nowMs - 1000 * 60 * 25).toISOString(),
    },
    {
      id: 'app-casino-nova',
      name: 'Casino Nova',
      category: 'Commerce',
      description: 'High-stakes dice and lottery wagering pool.',
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
};

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
}

// Seed 5 immutable audit log entries using Nova, RibaGuard, Oracle, Governor
appendAudit(
  'Nova',
  'BOOT_SEQUENCE',
  'info',
  'Initialized Stellar Nova Core on SCP low-energy consensus with 100B NVC total supply and 1.5x collateral target.',
  1000 * 60 * 30,
);
appendAudit(
  'Nova',
  'PEG_IDENTITY_LOCK',
  'accepted',
  'NovaValuePolicy locked mathematical identity: 1 NVC = $3.14 USD (1,000,000 Micron Nova per NVC).',
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
  'RibaGuard AI active across NVC transactions and App Builder: 0% Interest strictly enforced.',
  1000 * 60 * 5,
);
appendAudit(
  'Oracle',
  'CONSENSUS_SYNC',
  'accepted',
  '3-region oracle quorum (ORACLE-US-01, ORACLE-ID-01, ORACLE-EU-01) verified $3.14 Nova Peg alignment.',
  1000 * 30,
);

// AHI AI (Artificial Human Intelligence): real-time NVC transaction scoring
function evaluateWithAhiAi(params: {
  sender: string;
  recipient: string;
  source: string;
  memo: string;
  reportedValueUsd: number;
}): { accepted: boolean; purityScore: number; reason: string; ribaRejected: boolean } {
  const { sender, recipient, source, memo, reportedValueUsd } = params;

  const gamblingHit = containsGamblingKeyword(`${sender} ${recipient} ${source} ${memo}`);
  if (gamblingHit) {
    return {
      accepted: false,
      purityScore: 0,
      reason: `Rejected by AHI AI Anti-Gambling Filter: prohibited keyword "${gamblingHit}" detected.`,
      ribaRejected: false,
    };
  }

  const ribaHit = detectRibaViolation(`${sender} ${recipient} ${source} ${memo}`);
  if (ribaHit.isRiba) {
    return {
      accepted: false,
      purityScore: 0,
      reason: 'RibaGuard AI: Riba / Interest detected - Transaction rejected. Stellar Nova Core is 0% Interest.',
      ribaRejected: true,
    };
  }

  const sourceCheck = verifyNovaPuritySource(source);
  if (!sourceCheck.ok) {
    return {
      accepted: false,
      purityScore: 0,
      reason: sourceCheck.reason,
      ribaRejected: false,
    };
  }

  const valueCheck = verifyNovaValuePeg(reportedValueUsd);
  if (!valueCheck.ok) {
    return {
      accepted: false,
      purityScore: 0,
      reason: valueCheck.reason,
      ribaRejected: false,
    };
  }

  // Sender history check (anti-whale / repeat offender scoring)
  const senderRejections = state.transactions.filter(
    (t) => t.sender.toLowerCase() === sender.toLowerCase() && t.status === 'rejected',
  ).length;
  if (senderRejections >= 3) {
    return {
      accepted: false,
      purityScore: 0.25,
      reason: `Rejected by AHI AI Sender History Check: "${sender}" has ${senderRejections} prior compliance violations.`,
      ribaRejected: false,
    };
  }

  const historyBonus = senderRejections === 0 ? 1.0 : 0.92;
  return {
    accepted: true,
    purityScore: historyBonus,
    reason: 'Verified pure NVC origin at fixed $3.14 Nova Peg valuation.',
    ribaRejected: false,
  };
}

function buildSnapshot(): EcosystemSnapshot {
  const acceptedTransactions = state.transactions.filter((t) => t.status === 'accepted').length;
  const rejectedTransactions = state.transactions.filter((t) => t.status === 'rejected').length;
  const activeApps = state.apps.filter((a) => a.status === 'deployed').length;
  const verifiedOracleNodes = state.oracleNodes.filter((n) => n.status === 'verified').length;
  const flaggedOracleNodes = state.oracleNodes.filter((n) => n.status === 'flagged').length;
  const ribaBlockedTransactions = state.transactions.filter((t) => t.ribaRejected).length;

  return {
    constants: NovaPolicy,
    mainnetLaunched: state.mainnetLaunched,
    complianceBreached: state.complianceBreached,
    aiHealthScore: Number(state.aiHealthScore.toFixed(1)),
    unethicalIncidents: state.unethicalIncidents,
    ribaBlockedTransactions,
    ribaPolicy: '0% Interest',
    rules: state.rules,
    metrics: {
      totalTransactions: state.transactions.length,
      acceptedTransactions,
      rejectedTransactions,
      activeApps,
      verifiedOracleNodes,
      isolatedOracleNodes: flaggedOracleNodes,
    },
    transactions: state.transactions,
    apps: state.apps,
    oracleNodes: state.oracleNodes,
    auditLog: state.auditLog,
  };
}

const app = express();
app.use(express.json());

app.get('/api/ecosystem', (_req: Request, res: Response) => {
  res.json(buildSnapshot());
});

// RibaGuard AI verification endpoint
app.post('/api/riba/check', (req: Request, res: Response) => {
  const memo = String(req.body?.memo || '');
  const spec = String(req.body?.spec || '');
  const ribaCheck = detectRibaViolation(`${memo} ${spec}`);
  if (ribaCheck.isRiba) {
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

// NovaStablecoinManager + AHI AI + RibaGuard AI + NovaValuePolicy + NovaPurityEnforcer
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

  const verdict = evaluateWithAhiAi({
    sender,
    recipient,
    source,
    memo,
    reportedValueUsd,
  });

  if (!verdict.accepted) {
    if (verdict.reason.includes('Anti-Gambling')) {
      state.unethicalIncidents += 1;
      state.aiHealthScore = Math.max(70, state.aiHealthScore - 0.8);
    } else {
      state.aiHealthScore = Math.max(75, state.aiHealthScore - 0.4);
    }
  } else {
    state.aiHealthScore = Math.min(100, state.aiHealthScore + 0.1);
  }

  const status: 'accepted' | 'rejected' = verdict.accepted ? 'accepted' : 'rejected';
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
    reason: verdict.reason,
    ribaRejected: verdict.ribaRejected,
    purityScore: verdict.purityScore,
    hash: sha256({ sender, recipient, amount, source, memo, reportedValueUsd, timestamp }),
    timestamp,
  };

  state.transactions.unshift(tx);
  if (verdict.ribaRejected) {
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
    snapshot: buildSnapshot(),
  });
}

app.post('/api/nova/transaction', handleNovaTransaction);
app.post('/api/pi/transaction', handleNovaTransaction);

// AutonomousAppBuilder endpoint (NVC-exclusive, zero gambling, zero riba)
app.post('/api/apps/generate', (req: Request, res: Response) => {
  const name = String(req.body?.name || '').trim();
  const category = String(req.body?.category || 'Commerce').trim();
  const description = String(req.body?.description || '').trim();
  const paymentAsset = String(req.body?.paymentAsset || 'NVC').trim().toUpperCase();

  if (!name || !description) {
    res.status(400).json({ error: 'App name and description are required.' });
    return;
  }

  const gamblingHit = containsGamblingKeyword(`${name} ${category} ${description}`);
  const ribaHit = detectRibaViolation(`${name} ${category} ${description}`);
  let status: NovaAppRecord['status'] = 'deployed';
  let complianceReason = 'Passed AHI AI anti-gambling, RibaGuard AI (0% interest), and NVC-exclusivity verification.';

  if (gamblingHit) {
    status = 'rejected';
    complianceReason = `Rejected by NovaPurityEnforcer: gambling keyword "${gamblingHit}" violates no-gambling mandate.`;
    state.unethicalIncidents += 1;
  } else if (ribaHit.isRiba) {
    status = 'rejected';
    complianceReason =
      'RibaGuard AI: App rejected - Contains Riba model. Only profit-sharing / fee-based / real trade allowed.';
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
    status,
    complianceReason,
    manifestSnippet:
      status === 'deployed'
        ? `// Generated by AutonomousAppBuilder\nexport const APP_NAME = ${JSON.stringify(name)};\nexport const SETTLEMENT_ASSET = "NVC";\nexport const FIXED_VALUE_USD = ${NovaPolicy.fixedValueUsd};\nexport const RIBA_POLICY = "0% Interest";`
        : `// Blocked by Compliance Gate\n// Reason: ${complianceReason}`,
    createdAt: new Date().toISOString(),
  };

  state.apps.unshift(appRecord);
  if (ribaHit.isRiba) {
    appendAudit('RibaGuard', 'REJECT_RIBA', 'rejected', `${name}: ${complianceReason}`);
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

// Global NOVA Oracle Compliance Verifier: Deviation flags node for community vote
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
    appendAudit(
      'Oracle',
      'NODE_FLAGGED_FOR_VOTE',
      'rejected',
      `Oracle ${node.id} reported $${reportedValueUsd.toFixed(2)} (!= $${NovaPolicy.fixedValueUsd}) and was flagged for community vote.`,
    );
  } else {
    node.status = 'verified';
    appendAudit(
      'Oracle',
      'NODE_VERIFIED',
      'accepted',
      `Oracle ${node.id} confirmed $3.14 Nova Peg valuation.`,
    );
  }

  res.json({ node, snapshot: buildSnapshot() });
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
