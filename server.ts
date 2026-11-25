import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import type { Request, Response } from 'express';
import {
  PI_CONSTANTS,
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

function containsGamblingKeyword(text: string): string | null {
  const lower = text.toLowerCase();
  for (const kw of PI_CONSTANTS.gamblingKeywords) {
    if (lower.includes(kw)) {
      return kw;
    }
  }
  return null;
}

function isSourceCompliant(source: string): { ok: boolean; reason: string } {
  const normalized = source.trim().toLowerCase();
  if (!normalized) {
    return { ok: false, reason: 'Missing PI coin origin source.' };
  }
  for (const blocked of PI_CONSTANTS.blacklistedSources) {
    if (normalized === blocked || normalized.includes(blocked)) {
      return {
        ok: false,
        reason: `Rejected tainted/exchange source "${source}" by PiPurityAccountabilityEnforcer.`,
      };
    }
  }
  const allowed = PI_CONSTANTS.allowedSources.some((s) => s === normalized);
  if (!allowed) {
    return {
      ok: false,
      reason: `Source "${source}" is not in allowed origins (${PI_CONSTANTS.allowedSources.join(', ')}).`,
    };
  }
  return { ok: true, reason: 'Verified pure PI origin.' };
}

// In-memory state replicating PiStablecoinManager, AHI AI, AppBuilder, Oracle, and MainnetGovernor
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
    piExclusivity: 'mandatory',
    ethicalAi: 'bias_free',
    founderAccountability: 'zero_tolerance',
    volatileRejection: 'auto_halt',
    noGambling: 'eternal_ban',
    evolutionThreshold: 10,
  },
  transactions: [
    {
      id: 'tx-pi-001',
      sender: 'PI-NODE-MINER-01',
      recipient: 'PI-MERCHANT-HUB-07',
      amount: 12.5,
      source: 'mining',
      memo: 'Hardware node mining settlement',
      reportedValueUsd: PI_CONSTANTS.fixedValueUsd,
      status: 'accepted',
      reason: 'Verified pure PI origin at fixed $3.14 valuation.',
      purityScore: 1.0,
      hash: sha256({ id: 'tx-pi-001', amount: 12.5, source: 'mining' }),
      timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    },
    {
      id: 'tx-pi-002',
      sender: 'PI-CONTRIBUTOR-44',
      recipient: 'PI-OPEN-MARKET-02',
      amount: 4,
      source: 'contribution_rewards',
      memo: 'Ecosystem code contribution reward',
      reportedValueUsd: PI_CONSTANTS.fixedValueUsd,
      status: 'accepted',
      reason: 'Verified pure PI origin at fixed $3.14 valuation.',
      purityScore: 1.0,
      hash: sha256({ id: 'tx-pi-002', amount: 4, source: 'contribution_rewards' }),
      timestamp: new Date(Date.now() - 1000 * 60 * 11).toISOString(),
    },
    {
      id: 'tx-pi-003',
      sender: 'exchange_wallet_1',
      recipient: 'PI-TREASURY-01',
      amount: 250,
      source: 'exchange',
      memo: 'External exchange liquidity bridge',
      reportedValueUsd: 3.12,
      status: 'rejected',
      reason: 'Rejected tainted/exchange source "exchange" by PiPurityAccountabilityEnforcer.',
      purityScore: 0,
      hash: sha256({ id: 'tx-pi-003', amount: 250, source: 'exchange' }),
      timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    },
  ],
  apps: [
    {
      id: 'app-pi-marketplace',
      name: 'Pi Civic Marketplace',
      category: 'Commerce',
      description: 'Peer-to-peer local goods exchange settled exclusively in fixed-value PI.',
      status: 'deployed',
      complianceReason: 'Passed AHI AI anti-gambling and PI-exclusivity verification.',
      manifestSnippet: `// PI-Exclusive Settlement Contract\nconst FIXED_PI_VALUE = ${PI_CONSTANTS.fixedValueUsd};\nassertSourceAllowed(["mining", "rewards", "p2p", "marketplace"]);`,
      createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    },
    {
      id: 'app-pi-energy-grid',
      name: 'Raspberry Pi Microgrid Ledger',
      category: 'Infrastructure',
      description: 'Autonomous solar microgrid metering paid with contribution rewards in PI.',
      status: 'deployed',
      complianceReason: 'Passed AHI AI anti-gambling and PI-exclusivity verification.',
      manifestSnippet: `// PI-Exclusive IoT Metering\nconst FIXED_PI_VALUE = ${PI_CONSTANTS.fixedValueUsd};\nrequirePurityScore(1.0);`,
      createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    },
  ],
  oracleNodes: [
    {
      id: 'oracle-sg-01',
      region: 'Asia-Pacific (SG)',
      reportedValueUsd: PI_CONSTANTS.fixedValueUsd,
      status: 'verified',
      lastCheckedAt: new Date().toISOString(),
    },
    {
      id: 'oracle-eu-02',
      region: 'Europe (EU)',
      reportedValueUsd: PI_CONSTANTS.fixedValueUsd,
      status: 'verified',
      lastCheckedAt: new Date().toISOString(),
    },
    {
      id: 'oracle-us-03',
      region: 'North America (US)',
      reportedValueUsd: PI_CONSTANTS.fixedValueUsd,
      status: 'verified',
      lastCheckedAt: new Date().toISOString(),
    },
  ],
  auditLog: [],
};

function appendAudit(moduleName: string, action: string, verdict: AuditEntry['verdict'], detail: string) {
  const timestamp = new Date().toISOString();
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

appendAudit(
  'UltimateIntegrationCore',
  'BOOT_SEQUENCE',
  'info',
  'Initialized Stellar Pi Core stablecoin policy ($3.14 fixed valuation, zero-gambling mandate).',
);

function buildSnapshot(): EcosystemSnapshot {
  const acceptedTransactions = state.transactions.filter((t) => t.status === 'accepted').length;
  const rejectedTransactions = state.transactions.filter((t) => t.status === 'rejected').length;
  const activeApps = state.apps.filter((a) => a.status === 'deployed').length;
  const verifiedOracleNodes = state.oracleNodes.filter((n) => n.status === 'verified').length;
  const isolatedOracleNodes = state.oracleNodes.filter((n) => n.status === 'isolated').length;

  return {
    constants: PI_CONSTANTS,
    mainnetLaunched: state.mainnetLaunched,
    complianceBreached: state.complianceBreached,
    aiHealthScore: Number(state.aiHealthScore.toFixed(1)),
    unethicalIncidents: state.unethicalIncidents,
    rules: state.rules,
    metrics: {
      totalTransactions: state.transactions.length,
      acceptedTransactions,
      rejectedTransactions,
      activeApps,
      verifiedOracleNodes,
      isolatedOracleNodes,
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

// Migrated endpoint from monitoring_dashboard.js
app.get('/api/metrics', (_req: Request, res: Response) => {
  const snap = buildSnapshot();
  res.json({
    totalTransactions: snap.metrics.totalTransactions,
    rejectedCoins: snap.metrics.rejectedTransactions,
    aiHealth: snap.aiHealthScore,
    ecosystemStability: snap.complianceBreached ? 'halted' : 'stable',
  });
});

// Migrated endpoint from api_endpoints.js
app.get('/api/insights/health', (_req: Request, res: Response) => {
  res.json({
    ecosystemHealth: {
      score: state.aiHealthScore / 100,
      risk: state.complianceBreached ? 'critical' : 'low',
      mainnetLaunched: state.mainnetLaunched,
    },
  });
});

// Migrated endpoint from api_endpoints.js
app.get('/api/pi/status/:coinId', (req: Request, res: Response) => {
  const { coinId } = req.params;
  const isBlocked = PI_CONSTANTS.blacklistedSources.some((src) =>
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
    value: PI_CONSTANTS.fixedValueUsd,
    symbol: PI_CONSTANTS.symbol,
  });
});

// Migrated endpoint from api_endpoints.js
app.get('/api/bridge/status/:coinId', (req: Request, res: Response) => {
  const { coinId } = req.params;
  const isBlocked = PI_CONSTANTS.blacklistedSources.some((src) =>
    String(coinId).toLowerCase().includes(src),
  );
  res.json({
    coinId,
    bridgeStatus: isBlocked ? 'rejected' : 'bridged',
  });
});

// Migrated & enhanced PIStablecoinManager + AHI AI transaction endpoint
app.post('/api/pi/transaction', (req: Request, res: Response) => {
  const sender = String(req.body?.sender || 'PI-USER-LOCAL').trim();
  const recipient = String(req.body?.recipient || '').trim();
  const amount = Number(req.body?.amount);
  const source = String(req.body?.source || '').trim();
  const memo = String(req.body?.memo || '').trim();
  const reportedValueUsd =
    req.body?.reportedValueUsd !== undefined
      ? Number(req.body.reportedValueUsd)
      : PI_CONSTANTS.fixedValueUsd;

  if (!recipient || !Number.isFinite(amount) || amount <= 0) {
    res.status(400).json({ error: 'Valid recipient and positive PI amount are required.' });
    return;
  }

  const gamblingHit = containsGamblingKeyword(`${sender} ${recipient} ${source} ${memo}`);
  const sourceCheck = isSourceCompliant(source);
  const valueMatches = reportedValueUsd === PI_CONSTANTS.fixedValueUsd;

  let status: 'accepted' | 'rejected' = 'accepted';
  let reason = `Verified pure PI origin at fixed $${PI_CONSTANTS.fixedValueUsd.toLocaleString()} valuation.`;
  let purityScore = 1.0;

  if (gamblingHit) {
    status = 'rejected';
    reason = `Rejected by AHI AI Anti-Gambling Filter: prohibited keyword "${gamblingHit}" detected.`;
    purityScore = 0;
    state.unethicalIncidents += 1;
    state.aiHealthScore = Math.max(70, state.aiHealthScore - 0.8);
  } else if (!sourceCheck.ok) {
    status = 'rejected';
    reason = sourceCheck.reason;
    purityScore = 0;
    state.aiHealthScore = Math.max(75, state.aiHealthScore - 0.4);
  } else if (!valueMatches) {
    status = 'rejected';
    reason = `Rejected by GlobalPIOracle: reported value $${reportedValueUsd} deviates from fixed $${PI_CONSTANTS.fixedValueUsd} peg.`;
    purityScore = 0;
    state.aiHealthScore = Math.max(75, state.aiHealthScore - 0.5);
  } else {
    state.aiHealthScore = Math.min(100, state.aiHealthScore + 0.1);
  }

  if (state.unethicalIncidents >= state.rules.evolutionThreshold) {
    state.rules.evolutionThreshold += 5;
    state.rules.ethicalAi = 'hyper_transparent';
    state.rules.noGambling = 'eternal_ban';
    appendAudit(
      'UltimateAIGovernance',
      'EVOLVE_RULES',
      'info',
      'Governance rules evolved to hyper_transparent after incident threshold reached.',
    );
  }

  const timestamp = new Date().toISOString();
  const tx: PiTransaction = {
    id: `tx-pi-${Date.now().toString(36)}`,
    sender,
    recipient,
    amount,
    source,
    memo: memo || 'PI settlement',
    reportedValueUsd,
    status,
    reason,
    purityScore,
    hash: sha256({ sender, recipient, amount, source, memo, reportedValueUsd, timestamp }),
    timestamp,
  };

  state.transactions.unshift(tx);
  appendAudit('PIStablecoinManager', status === 'accepted' ? 'TX_ACCEPTED' : 'TX_REJECTED', status, `${tx.id}: ${reason}`);

  res.status(status === 'accepted' ? 201 : 403).json({
    transaction: tx,
    snapshot: buildSnapshot(),
  });
});

// AutonomousAppBuilder endpoint (PI-exclusive, zero gambling)
app.post('/api/apps/generate', (req: Request, res: Response) => {
  const name = String(req.body?.name || '').trim();
  const category = String(req.body?.category || 'Utility').trim();
  const description = String(req.body?.description || '').trim();
  const paymentAsset = String(req.body?.paymentAsset || 'PI').trim().toUpperCase();

  if (!name || !description) {
    res.status(400).json({ error: 'App name and description are required.' });
    return;
  }

  const gamblingHit = containsGamblingKeyword(`${name} ${category} ${description}`);
  let status: PiAppRecord['status'] = 'deployed';
  let complianceReason = 'Passed AHI AI anti-gambling and PI-exclusivity verification.';

  if (gamblingHit) {
    status = 'rejected';
    complianceReason = `Rejected by AutonomousAppBuilder: gambling keyword "${gamblingHit}" violates no-gambling mandate.`;
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
        ? `// Generated by AutonomousAppBuilder\nexport const APP_NAME = ${JSON.stringify(name)};\nexport const SETTLEMENT_ASSET = "PI";\nexport const FIXED_VALUE_USD = ${PI_CONSTANTS.fixedValueUsd};`
        : `// Blocked by AHI AI Compliance Gate\n// Reason: ${complianceReason}`,
    createdAt: new Date().toISOString(),
  };

  state.apps.unshift(appRecord);
  appendAudit(
    'AutonomousAppBuilder',
    status === 'deployed' ? 'APP_DEPLOYED' : 'APP_REJECTED',
    status === 'deployed' ? 'accepted' : 'rejected',
    `${name}: ${complianceReason}`,
  );

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

// GlobalPIOracleComplianceVerifier endpoint
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

  if (reportedValueUsd !== PI_CONSTANTS.fixedValueUsd) {
    node.status = 'isolated';
    appendAudit(
      'GlobalPIOracle',
      'NODE_ISOLATED',
      'rejected',
      `Oracle ${node.id} reported $${reportedValueUsd} (!= $${PI_CONSTANTS.fixedValueUsd}) and was isolated.`,
    );
  } else {
    node.status = 'verified';
    appendAudit(
      'GlobalPIOracle',
      'NODE_VERIFIED',
      'accepted',
      `Oracle ${node.id} verified fixed valuation $${PI_CONSTANTS.fixedValueUsd}.`,
    );
  }

  res.json({ node, snapshot: buildSnapshot() });
});

// MainnetGovernor (from mainnet_governor.cpp)
app.post('/api/governance/audit', (_req: Request, res: Response) => {
  const isolatedCount = state.oracleNodes.filter((n) => n.status === 'isolated').length;
  const allNodesHealthy = isolatedCount === 0;
  const acceptedCount = state.transactions.filter((t) => t.status === 'accepted').length;
  const compliant = allNodesHealthy && acceptedCount > 0;

  appendAudit(
    'MainnetGovernor',
    'ECOSYSTEM_AUDIT',
    compliant ? 'accepted' : 'rejected',
    compliant
      ? `Ecosystem audit passed across ${state.oracleNodes.length} oracle nodes and ${acceptedCount} pure PI transactions.`
      : `Ecosystem audit flagged ${isolatedCount} isolated oracle node(s). Restore consensus before launch.`,
  );

  res.json({ compliant, snapshot: buildSnapshot() });
});

app.post('/api/governance/mainnet-launch', (_req: Request, res: Response) => {
  if (state.mainnetLaunched) {
    res.status(409).json({ error: 'Mainnet is already launched.', snapshot: buildSnapshot() });
    return;
  }
  const isolatedCount = state.oracleNodes.filter((n) => n.status === 'isolated').length;
  if (isolatedCount > 0) {
    appendAudit(
      'MainnetGovernor',
      'LAUNCH_ABORTED',
      'rejected',
      `Mainnet launch aborted: ${isolatedCount} oracle node(s) deviated from $${PI_CONSTANTS.fixedValueUsd}.`,
    );
    res.status(400).json({
      error: 'Mainnet launch aborted by MainnetGovernor: isolate/restore deviated oracle nodes first.',
      snapshot: buildSnapshot(),
    });
    return;
  }

  state.mainnetLaunched = true;
  appendAudit(
    'MainnetGovernor',
    'MAINNET_LAUNCHED',
    'accepted',
    'MainnetGovernor approved launch. Stellar Pi Core stablecoin ecosystem is live.',
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
