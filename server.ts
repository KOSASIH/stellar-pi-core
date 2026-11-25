import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import type { Request, Response } from 'express';
import {
  PiPolicy,
  type AuditEntry,
  type EcosystemSnapshot,
  type GovernanceRules,
  type OracleNode,
  type PiAppRecord,
  type PiTransaction,
} from './shared/piPolicy.ts';

function sha256(payload: unknown): string {
  return crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

// PiPurityEnforcer: Gambling keyword detector
function containsGamblingKeyword(text: string): string | null {
  const lower = text.toLowerCase();
  for (const kw of PiPolicy.gamblingKeywords) {
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
  for (const kw of PiPolicy.ribaKeywords) {
    if (lower.includes(kw)) {
      return { isRiba: true, matchedTerm: kw };
    }
  }
  for (const model of PiPolicy.bannedFinancialModels) {
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

// PiPurityEnforcer: Origin source verifier
function verifyPuritySource(source: string): { ok: boolean; reason: string } {
  const normalized = source.trim().toLowerCase();
  if (!normalized) {
    return { ok: false, reason: 'Missing PI coin origin source.' };
  }
  for (const blocked of PiPolicy.blacklistedSources) {
    if (normalized === blocked || normalized.includes(blocked)) {
      return {
        ok: false,
        reason: `Rejected tainted/exchange source "${source}" by PiPurityEnforcer.`,
      };
    }
  }
  const allowed = PiPolicy.allowedSources.some((s) => s === normalized);
  if (!allowed) {
    return {
      ok: false,
      reason: `Source "${source}" is not in allowed origins (${PiPolicy.allowedSources.join(', ')}).`,
    };
  }
  return { ok: true, reason: 'Verified pure PI origin.' };
}

// PiValuePolicy: Mathematical identity check ($3.14 USD)
function verifyPiValuePeg(reportedValueUsd: number): { ok: boolean; reason: string } {
  if (Math.abs(reportedValueUsd - PiPolicy.fixedValueUsd) > 1e-9) {
    return {
      ok: false,
      reason: `PiValuePolicy: reported value $${reportedValueUsd.toFixed(2)} deviates from $3.14 Pi Peg and was flagged for community vote.`,
    };
  }
  return { ok: true, reason: 'Verified $3.14 Pi Peg mathematical identity.' };
}

const nowMs = Date.now();

// In-memory state with realistic seed data: 3 oracle nodes, 3 apps, 3 transactions, 5 audit logs
const state: {
  mainnetLaunched: boolean;
  complianceBreached: boolean;
  aiHealthScore: number;
  unethicalIncidents: number;
  rules: GovernanceRules;
  transactions: PiTransaction[];
  apps: PiAppRecord[];
  oracleNodes: OracleNode[];
  auditLog: AuditEntry[];
} = {
  mainnetLaunched: false,
  complianceBreached: false,
  aiHealthScore: 99.4,
  unethicalIncidents: 0,
  rules: {
    piExclusivity: PiPolicy.piExclusivity,
    ethicalAi: PiPolicy.ethicalAi,
    founderAccountability: PiPolicy.founderAccountability,
    volatileRejection: 'Community Vote',
    noGambling: PiPolicy.noGambling,
    noRiba: '0% Interest - Strictly Forbidden',
    shariaCompliant: PiPolicy.shariaCompliant,
    evolutionThreshold: 10,
  },
  transactions: [
    {
      id: 'tx-pi-001',
      sender: 'PI-NODE-MINER-01',
      recipient: 'PI-MERCHANT-HUB-07',
      amount: 12.5,
      micronPi: 12_500_000,
      source: 'mining',
      memo: 'Mobile Pioneer KYC mining settlement',
      reportedValueUsd: PiPolicy.fixedValueUsd,
      status: 'accepted',
      reason: 'Verified pure PI origin at fixed $3.14 Pi Peg valuation.',
      purityScore: 1.0,
      hash: sha256({ id: 'tx-pi-001', amount: 12.5, source: 'mining' }),
      timestamp: new Date(nowMs - 1000 * 60 * 18).toISOString(),
    },
    {
      id: 'tx-pi-002',
      sender: 'PI-CONTRIBUTOR-44',
      recipient: 'PI-OPEN-MARKET-02',
      amount: 0.286624,
      micronPi: 286_624,
      source: 'contribution_rewards',
      memo: 'Micro-payment for SCP node uptime contribution',
      reportedValueUsd: PiPolicy.fixedValueUsd,
      status: 'accepted',
      reason: 'Verified pure PI origin at fixed $3.14 Pi Peg valuation.',
      purityScore: 1.0,
      hash: sha256({ id: 'tx-pi-002', amount: 0.286624, source: 'contribution_rewards' }),
      timestamp: new Date(nowMs - 1000 * 60 * 11).toISOString(),
    },
    {
      id: 'tx-pi-003',
      sender: 'exchange_wallet_1',
      recipient: 'PI-TREASURY-01',
      amount: 250,
      micronPi: 250_000_000,
      source: 'exchange',
      memo: 'External exchange liquidity bridge',
      reportedValueUsd: 3.12,
      status: 'rejected',
      reason: 'Rejected tainted/exchange source "exchange" by PiPurityEnforcer.',
      purityScore: 0,
      hash: sha256({ id: 'tx-pi-003', amount: 250, source: 'exchange' }),
      timestamp: new Date(nowMs - 1000 * 60 * 5).toISOString(),
    },
  ],
  apps: [
    {
      id: 'app-pi-marketplace',
      name: 'Pi Civic Marketplace',
      category: 'Commerce',
      description: 'Peer-to-peer local goods exchange settled exclusively in fixed-value $3.14 PI.',
      status: 'deployed',
      complianceReason: 'Passed AHI AI anti-gambling and PI-exclusivity verification.',
      manifestSnippet: `// PI-Exclusive Settlement Contract\nconst FIXED_PI_VALUE = ${PiPolicy.fixedValueUsd};\nassertSourceAllowed(["mining", "contribution_rewards", "p2p", "marketplace", "app"]);`,
      createdAt: new Date(nowMs - 1000 * 60 * 45).toISOString(),
    },
    {
      id: 'app-pi-energy-grid',
      name: 'Raspberry Pi Microgrid Ledger',
      category: 'Infrastructure',
      description: 'Autonomous solar microgrid metering paid in Micron Pi contribution rewards.',
      status: 'deployed',
      complianceReason: 'Passed AHI AI anti-gambling and PI-exclusivity verification.',
      manifestSnippet: `// PI-Exclusive IoT Metering\nconst MICRON_PER_PI = ${PiPolicy.micronPiPerPi};\nrequirePurityScore(1.0);`,
      createdAt: new Date(nowMs - 1000 * 60 * 25).toISOString(),
    },
    {
      id: 'app-pi-supply-verifier',
      name: 'Pi Fair Supply Verifier',
      category: 'Supply Chain',
      description: 'Transparent provenance tracking with anti-whale 1-KYC Pioneer escrow.',
      status: 'deployed',
      complianceReason: 'Passed AHI AI anti-gambling and PI-exclusivity verification.',
      manifestSnippet: `// SCP Fair Supply Escrow\nconst COLLATERAL_TARGET = ${PiPolicy.collateralRatio};\nassertAntiWhaleKyc(true);`,
      createdAt: new Date(nowMs - 1000 * 60 * 14).toISOString(),
    },
  ],
  oracleNodes: [
    {
      id: 'oracle-sg-01',
      region: 'Asia-Pacific (SG)',
      reportedValueUsd: PiPolicy.fixedValueUsd,
      status: 'verified',
      lastCheckedAt: new Date(nowMs - 1000 * 30).toISOString(),
    },
    {
      id: 'oracle-eu-02',
      region: 'Europe (EU)',
      reportedValueUsd: PiPolicy.fixedValueUsd,
      status: 'verified',
      lastCheckedAt: new Date(nowMs - 1000 * 30).toISOString(),
    },
    {
      id: 'oracle-us-03',
      region: 'North America (US)',
      reportedValueUsd: PiPolicy.fixedValueUsd,
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

// Seed 5 immutable audit log entries (oldest pushed first so newest sits at index 0)
appendAudit(
  'UltimateIntegrationCore',
  'BOOT_SEQUENCE',
  'info',
  'Initialized Stellar Pi Core on SCP low-energy consensus with 100B PI total supply and 1.5x collateral target.',
  1000 * 60 * 30,
);
appendAudit(
  'PiValuePolicy',
  'PEG_IDENTITY_LOCK',
  'accepted',
  'Locked mathematical peg identity: 1 PI = $3.14 USD (1,000,000 Micron Pi per PI).',
  1000 * 60 * 24,
);
appendAudit(
  'PiPurityEnforcer',
  'TX_ACCEPTED',
  'accepted',
  'tx-pi-001 & tx-pi-002 verified for pure mining/contribution_rewards origins.',
  1000 * 60 * 11,
);
appendAudit(
  'AHIAIFilter',
  'TX_REJECTED',
  'rejected',
  'tx-pi-003 rejected: tainted exchange source and $3.12 deviation flagged.',
  1000 * 60 * 5,
);
appendAudit(
  'GlobalPIOracle',
  'CONSENSUS_SYNC',
  'accepted',
  '3-region oracle quorum (SG, EU, US) verified $3.14 Pi Peg alignment.',
  1000 * 30,
);

// AHI AI (Artificial Human Intelligence): real-time transaction scoring across source, memo, value, and sender history
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
      reason: 'RibaGuard AI: Riba / Interest detected - Transaction rejected. Stellar Pi Core is 0% Interest.',
      ribaRejected: true,
    };
  }

  const sourceCheck = verifyPuritySource(source);
  if (!sourceCheck.ok) {
    return {
      accepted: false,
      purityScore: 0,
      reason: sourceCheck.reason,
      ribaRejected: false,
    };
  }

  const valueCheck = verifyPiValuePeg(reportedValueUsd);
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
    reason: `Verified pure PI origin at fixed $3.14 Pi Peg valuation.`,
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
    constants: PiPolicy,
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
      reason: 'RibaGuard AI: Riba / Interest detected - Transaction rejected. Stellar Pi Core is 0% Interest.',
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

app.get('/api/pi/status/:coinId', (req: Request, res: Response) => {
  const { coinId } = req.params;
  const isBlocked = PiPolicy.blacklistedSources.some((src) =>
    String(coinId).toLowerCase().includes(src),
  );
  if (isBlocked) {
    res.status(403).json({
      coinId,
      status: 'rejected',
      error: 'Pi Coin rejected: Exchange/third-party exposure',
    });
    return;
  }
  res.json({
    coinId,
    status: 'valid',
    value: PiPolicy.fixedValueUsd,
    symbol: PiPolicy.symbol,
  });
});

app.get('/api/bridge/status/:coinId', (req: Request, res: Response) => {
  const { coinId } = req.params;
  const isBlocked = PiPolicy.blacklistedSources.some((src) =>
    String(coinId).toLowerCase().includes(src),
  );
  res.json({
    coinId,
    bridgeStatus: isBlocked ? 'rejected' : 'bridged',
  });
});

// PIStablecoinManager + AHI AI + PiValuePolicy + PiPurityEnforcer
app.post('/api/pi/transaction', (req: Request, res: Response) => {
  const sender = String(req.body?.sender || 'PI-USER-LOCAL').trim();
  const recipient = String(req.body?.recipient || '').trim();
  const amount = Number(req.body?.amount);
  const source = String(req.body?.source || '').trim();
  const memo = String(req.body?.memo || '').trim();
  const reportedValueUsd =
    req.body?.reportedValueUsd !== undefined
      ? Number(req.body.reportedValueUsd)
      : PiPolicy.fixedValueUsd;

  if (!recipient || !Number.isFinite(amount) || amount <= 0) {
    res.status(400).json({ error: 'Valid recipient and positive PI amount are required.' });
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
  const tx: PiTransaction = {
    id: `tx-pi-${Date.now().toString(36)}`,
    sender,
    recipient,
    amount,
    micronPi: Math.round(amount * PiPolicy.micronPiPerPi),
    source,
    memo: memo || 'PI settlement',
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
      `${tx.id} (${tx.amount} PI / ${tx.micronPi.toLocaleString()} µπ): ${tx.reason}`,
    );
  } else {
    appendAudit(
      'PIStablecoinManager',
      status === 'accepted' ? 'TX_ACCEPTED' : 'TX_REJECTED',
      status,
      `${tx.id} (${tx.amount} PI / ${tx.micronPi.toLocaleString()} µπ): ${tx.reason}`,
    );
  }

  res.status(status === 'accepted' ? 201 : 403).json({
    transaction: tx,
    snapshot: buildSnapshot(),
  });
});

// AutonomousAppBuilder endpoint (PI-exclusive, zero gambling)
app.post('/api/apps/generate', (req: Request, res: Response) => {
  const name = String(req.body?.name || '').trim();
  const category = String(req.body?.category || 'Commerce').trim();
  const description = String(req.body?.description || '').trim();
  const paymentAsset = String(req.body?.paymentAsset || 'PI').trim().toUpperCase();

  if (!name || !description) {
    res.status(400).json({ error: 'App name and description are required.' });
    return;
  }

  const gamblingHit = containsGamblingKeyword(`${name} ${category} ${description}`);
  const ribaHit = detectRibaViolation(`${name} ${category} ${description}`);
  let status: PiAppRecord['status'] = 'deployed';
  let complianceReason = 'Passed AHI AI anti-gambling, RibaGuard AI (0% interest), and PI-exclusivity verification.';

  if (gamblingHit) {
    status = 'rejected';
    complianceReason = `Rejected by PiPurityEnforcer: gambling keyword "${gamblingHit}" violates no-gambling mandate.`;
    state.unethicalIncidents += 1;
  } else if (ribaHit.isRiba) {
    status = 'rejected';
    complianceReason =
      'RibaGuard AI: App rejected - Contains Riba model. Only profit-sharing / fee-based / real trade allowed.';
    state.unethicalIncidents += 1;
  } else if (paymentAsset !== 'PI') {
    status = 'rejected';
    complianceReason = `Rejected volatile asset "${paymentAsset}": all internal apps must settle exclusively in PI.`;
  }

  const appRecord: PiAppRecord = {
    id: `app-${Date.now().toString(36)}`,
    name,
    category,
    description,
    status,
    complianceReason,
    manifestSnippet:
      status === 'deployed'
        ? `// Generated by AutonomousAppBuilder\nexport const APP_NAME = ${JSON.stringify(name)};\nexport const SETTLEMENT_ASSET = "PI";\nexport const FIXED_VALUE_USD = ${PiPolicy.fixedValueUsd};\nexport const RIBA_POLICY = "0% Interest";`
        : `// Blocked by Compliance Gate\n// Reason: ${complianceReason}`,
    createdAt: new Date().toISOString(),
  };

  state.apps.unshift(appRecord);
  if (ribaHit.isRiba) {
    appendAudit('RibaGuard', 'REJECT_RIBA', 'rejected', `${name}: ${complianceReason}`);
  } else {
    appendAudit(
      'AutonomousAppBuilder',
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
    'HyperEcosystemMonitor',
    target.status === 'halted' ? 'APP_HALTED' : 'APP_RESUMED',
    'info',
    `App "${target.name}" transitioned to ${target.status}.`,
  );
  res.json({ app: target, snapshot: buildSnapshot() });
});

// GlobalPIOracleComplianceVerifier: Deviation flags node for community vote (democratic governance)
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

  if (Math.abs(reportedValueUsd - PiPolicy.fixedValueUsd) > 1e-9) {
    node.status = 'flagged';
    appendAudit(
      'GlobalPIOracle',
      'NODE_FLAGGED_FOR_VOTE',
      'rejected',
      `Oracle ${node.id} reported $${reportedValueUsd.toFixed(2)} (!= $${PiPolicy.fixedValueUsd}) and was flagged for community vote.`,
    );
  } else {
    node.status = 'verified';
    appendAudit(
      'GlobalPIOracle',
      'NODE_VERIFIED',
      'accepted',
      `Oracle ${node.id} confirmed $3.14 Pi Peg valuation.`,
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
    'MainnetGovernor',
    'ECOSYSTEM_AUDIT',
    compliant ? 'accepted' : 'rejected',
    compliant
      ? `Ecosystem audit passed: ${state.oracleNodes.length} oracle nodes aligned at $3.14, ${activeAppsCount} PI apps compliant, AHI AI health ${state.aiHealthScore.toFixed(1)}%.`
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
      'MainnetGovernor',
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
    'MainnetGovernor',
    'MAINNET_LAUNCHED',
    'accepted',
    'MainnetGovernor approved launch. Stellar Pi Core ($3.14 fixed peg) is live on SCP.',
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
    console.log(`Stellar Pi Core server listening on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
