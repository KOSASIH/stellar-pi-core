import {
  NovaPolicy,
  isValidNovaValue,
  nvcToUsd,
  type EcosystemSnapshot,
  type NovaAppRecord,
  type NovaTransaction,
} from '../../../shared/novaPolicy.ts';

export type HyperAlertKey = 'whale' | 'scam' | 'oracle' | 'self-heal';
export type HyperAlertColor = 'red' | 'orange' | 'blue' | 'green';

export interface HyperAlertItem {
  key: HyperAlertKey;
  color: HyperAlertColor;
  text: string;
  count: number;
}

export function makeLocalHash(seed: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x9e3779b9;
  for (let i = 0; i < seed.length; i += 1) {
    const ch = seed.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 0x01000193) >>> 0;
    h2 = Math.imul(h2 ^ ch, 0x85ebca6b) >>> 0;
  }
  return `${h1.toString(16).padStart(8, '0')}${h2.toString(16).padStart(8, '0')}`
    .repeat(4)
    .slice(0, 64);
}

export async function safeFetchJson<T>(
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
        error: 'Live backend endpoint unavailable; local simulation mode active.',
      };
    }
    const parsed = JSON.parse(trimmed) as T;
    return { ok: res.ok, status: res.status, data: parsed };
  } catch {
    return {
      ok: false,
      status: 0,
      data: null,
      error: 'Unable to reach backend endpoint; local simulation mode active.',
    };
  }
}

export function preScreenCompliance(inputText: string): {
  passed: boolean;
  category?: 'Riba' | 'Maysir (Gambling)' | 'Gharar' | 'Scam / Rug';
  keyword?: string;
  message: string;
} {
  const cleaned = inputText
    .toLowerCase()
    .replace(/\b(0%|zero|no)\s+interest\b/g, 'halal_compliant')
    .replace(/\binterest[-\s]?free\b/g, 'halal_compliant')
    .replace(/\briba[-\s]?free\b/g, 'halal_compliant')
    .replace(/\b(no|zero)[-\s]+gambling\b/g, 'halal_compliant')
    .replace(/\bgambling[-\s]?free\b/g, 'halal_compliant');

  for (const kw of [...NovaPolicy.ribaKeywords, 'lending', 'yield farming', 'usury']) {
    const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (new RegExp(`\\b${escaped}\\b`, 'i').test(cleaned)) {
      return {
        passed: false,
        category: 'Riba',
        keyword: kw,
        message: `RibaGuard AI Alert: Prohibited Riba/Interest term "${kw}" detected (0% Interest strictly enforced).`,
      };
    }
  }
  for (const kw of NovaPolicy.gamblingKeywords) {
    if (kw === 'slot') {
      if (/\bslots?\b/.test(cleaned) && !/\b(freight|delivery|time|pickup|shipping|logistics)\s+slot\b/.test(cleaned)) {
        return {
          passed: false,
          category: 'Maysir (Gambling)',
          keyword: kw,
          message: 'NovaPurityEnforcer Alert: Gambling term "slot" prohibited.',
        };
      }
      continue;
    }
    const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (new RegExp(`\\b${escaped}\\b`, 'i').test(cleaned)) {
      return {
        passed: false,
        category: 'Maysir (Gambling)',
        keyword: kw,
        message: `NovaPurityEnforcer Alert: Gambling keyword "${kw}" prohibited.`,
      };
    }
  }
  for (const kw of NovaPolicy.ghararKeywords) {
    const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (new RegExp(`\\b${escaped}\\b`, 'i').test(cleaned)) {
      return {
        passed: false,
        category: 'Gharar',
        keyword: kw,
        message: `Hyper-Compliance Alert: Excessive uncertainty (Gharar) "${kw}" prohibited.`,
      };
    }
  }
  for (const kw of NovaPolicy.scamKeywords) {
    if (kw === 'pump') {
      if (/\bpump\s*(and|&|n)?\s*dump\b|\b(price|token|coin|crypto)\s+pump\b/.test(cleaned)) {
        return {
          passed: false,
          category: 'Scam / Rug',
          keyword: kw,
          message: 'HyperScanner Alert: Pump-and-dump scam pattern blocked.',
        };
      }
      continue;
    }
    if (kw === 'rug') {
      if (/\brug\s*pull\b|\brugpull\b/.test(cleaned)) {
        return {
          passed: false,
          category: 'Scam / Rug',
          keyword: kw,
          message: 'HyperScanner Alert: Rug-pull pattern blocked.',
        };
      }
      continue;
    }
    const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (new RegExp(`\\b${escaped}\\b`, 'i').test(cleaned)) {
      return {
        passed: false,
        category: 'Scam / Rug',
        keyword: kw,
        message: `HyperScanner Alert: Scam keyword "${kw}" blocked.`,
      };
    }
  }
  return {
    passed: true,
    message: 'Pre-scan clear: 0% Interest Halal, Gambling-Free, Scam-Free, Peg Locked at $3.14.',
  };
}

export function createLocalFallbackSnapshot(): EcosystemSnapshot {
  const nowMs = Date.now();
  const iso = (offsetMs: number) => new Date(nowMs - offsetMs).toISOString();

  return {
    constants: NovaPolicy,
    mainnetLaunched: false,
    complianceBreached: false,
    aiHealthScore: 99.4,
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
      volatileRejection: 'Community Vote',
      noGambling: NovaPolicy.noGambling,
      noRiba: '0% Interest',
      shariaCompliant: NovaPolicy.shariaCompliant,
      evolutionThreshold: 10,
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
        sender: 'NVC-MINER-RASPI-01',
        recipient: 'NVC-MERCHANT-HUB-07',
        amount: 25,
        micronNova: 25_000_000,
        source: 'mining',
        memo: 'Mobile citizen KYC mining settlement',
        reportedValueUsd: 3.14,
        status: 'accepted',
        reason: 'Verified pure NVC origin at fixed $3.14 Nova Peg valuation.',
        ribaRejected: false,
        gamblingRejected: false,
        exchangeRejected: false,
        riskScore: 4,
        purityScore: 1,
        hash: makeLocalHash('tx-nvc-001'),
        timestamp: iso(1000 * 60 * 18),
      },
      {
        id: 'tx-nvc-002',
        sender: 'NVC-CONTRIBUTOR-44',
        recipient: 'NVC-OPEN-MARKET-02',
        amount: 0.286624,
        micronNova: 286_624,
        source: 'contribution_rewards',
        memo: 'Micro-payment for SCP node uptime contribution',
        reportedValueUsd: 3.14,
        status: 'accepted',
        reason: 'Verified pure NVC origin at fixed $3.14 Nova Peg valuation.',
        ribaRejected: false,
        gamblingRejected: false,
        exchangeRejected: false,
        riskScore: 3,
        purityScore: 1,
        hash: makeLocalHash('tx-nvc-002'),
        timestamp: iso(1000 * 60 * 11),
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
        hash: makeLocalHash('tx-nvc-003'),
        timestamp: iso(1000 * 60 * 5),
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
        manifestSnippet: '// NVC-Exclusive Settlement Contract\nconst FIXED_NVC_VALUE = 3.14;\nassertSourceAllowed(["mining", "contribution_rewards", "p2p", "marketplace", "app"]);',
        createdAt: iso(1000 * 60 * 45),
      },
      {
        id: 'app-nova-logistics',
        name: 'Nova Logistics',
        category: 'Supply Chain',
        description: 'Transparent provenance and freight escrow paid in Micron Nova contribution rewards.',
        creator: 'NVC-BUILDER-02',
        status: 'deployed',
        complianceReason: 'Passed AHI AI, HyperScanner (0 Scams), RibaGuard AI (0% interest), and NVC-exclusivity verification.',
        manifestSnippet: '// SCP Fair Logistics Escrow\nconst MICRON_PER_NVC = 1000000;\nconst COLLATERAL_TARGET = 1.5;',
        createdAt: iso(1000 * 60 * 25),
      },
      {
        id: 'app-casino-nova',
        name: 'Casino Nova',
        category: 'Commerce',
        description: 'High-stakes dice and lottery wagering pool.',
        creator: 'NVC-ROGUE-03',
        status: 'rejected',
        complianceReason: 'Rejected by NovaPurityEnforcer: gambling keyword "casino" violates no-gambling mandate.',
        manifestSnippet: '// Blocked by Compliance Gate\n// Reason: Gambling applications are strictly prohibited in Stellar Nova Core.',
        createdAt: iso(1000 * 60 * 14),
      },
    ],
    oracleNodes: [
      { id: 'ORACLE-US-01', region: 'North America (US)', reportedValueUsd: 3.14, status: 'verified', lastCheckedAt: iso(30_000) },
      { id: 'ORACLE-ID-01', region: 'Asia-Pacific (ID)', reportedValueUsd: 3.14, status: 'verified', lastCheckedAt: iso(30_000) },
      { id: 'ORACLE-EU-01', region: 'Europe (EU)', reportedValueUsd: 3.14, status: 'verified', lastCheckedAt: iso(30_000) },
    ],
    auditLog: [
      {
        id: 'aud-seed-oracle',
        module: 'Oracle',
        action: 'CONSENSUS_SYNC',
        verdict: 'accepted',
        detail: 'Oracle Predictive Shield verified 3-region quorum (ORACLE-US-01, ORACLE-ID-01, ORACLE-EU-01) at $3.14.',
        hash: makeLocalHash('aud-seed-oracle'),
        timestamp: iso(30_000),
      },
      {
        id: 'aud-seed-riba',
        module: 'RibaGuard',
        action: 'POLICY_ARMED',
        verdict: 'info',
        detail: 'Hyper-Compliance & RibaGuard AI active: 0% Interest, Gambling-Free, Gharar-Free, Scam-Free.',
        hash: makeLocalHash('aud-seed-riba'),
        timestamp: iso(1000 * 60 * 5),
      },
      {
        id: 'aud-seed-peg',
        module: 'Nova',
        action: 'PEG_IDENTITY_LOCK',
        verdict: 'accepted',
        detail: 'NovaValuePolicy & Stabilizer locked mathematical identity: 1 NVC = $3.14 USD (1,000,000 Micron Nova per NVC).',
        hash: makeLocalHash('aud-seed-peg'),
        timestamp: iso(1000 * 60 * 24),
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
        timestamp: iso(1000 * 60 * 12),
      },
      {
        id: 'hml-seed-2',
        module: 'Anti-Scam HyperScanner',
        decision: "Blocked Scam App — 'Double Your Money 1000x' detected; creator permanently banned.",
        severity: 'blocked',
        timestamp: iso(1000 * 60 * 7),
      },
      {
        id: 'hml-seed-3',
        module: 'Self-Healing Network AI',
        decision: 'Oracle Self-Healed — Node ORACLE-EU-01 restored to $3.14 Nova Peg in 0.4s.',
        severity: 'healed',
        timestamp: iso(1000 * 60 * 3),
      },
    ],
    bannedCreators: ['0xRUG-DEV-99'],
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
        lastMinedAt: iso(1000 * 60 * 14),
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
        lastMinedAt: iso(1000 * 60 * 29),
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
        lastMinedAt: iso(1000 * 60 * 41),
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
        createdAt: iso(1000 * 60 * 35),
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
        createdAt: iso(1000 * 60 * 22),
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
        lastAuditedAt: iso(1000 * 60 * 60),
      },
      {
        id: 'res-green-infra',
        assetClass: 'Solar & Desalination Infrastructure Receivables',
        custodyType: 'Real-Economy Asset Trust',
        backingUsd: 141_300_000_000,
        sharePercent: 30,
        halalCertified: true,
        lastAuditedAt: iso(1000 * 60 * 60),
      },
      {
        id: 'res-trade-escrow',
        assetClass: 'Verified Supply-Chain Inventory Bills',
        custodyType: '0% Interest Trade Murabaha Pool',
        backingUsd: 94_200_000_000,
        sharePercent: 20,
        halalCertified: true,
        lastAuditedAt: iso(1000 * 60 * 60),
      },
      {
        id: 'res-liquidity-buffer',
        assetClass: 'Instant USD Settlement Cash Treasury',
        custodyType: 'Ring-Fenced Tier-1 Custody',
        backingUsd: 47_100_000_000,
        sharePercent: 10,
        halalCertified: true,
        lastAuditedAt: iso(1000 * 60 * 60),
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
        createdAt: iso(1000 * 60 * 50),
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
        createdAt: iso(1000 * 60 * 38),
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
        createdAt: iso(1000 * 60 * 24),
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
        createdAt: iso(1000 * 60 * 15),
      },
    ],
    marketplaceOrders: [],
    scpBlocks: [
      {
        height: 1042,
        hash: makeLocalHash('scp-block-1042'),
        previousHash: makeLocalHash('scp-block-1041'),
        txIds: ['tx-nvc-001', 'tx-nvc-002'],
        txCount: 2,
        totalNvc: 25.286624,
        totalMicronNova: 25_286_624,
        quorum: '3/3 SCP Validators',
        energyWh: 0.04,
        sealedAt: iso(1000 * 60 * 10),
      },
    ],
  };
}

export function applyLocalTransactionFallback(
  prev: EcosystemSnapshot,
  params: {
    sender: string;
    recipient: string;
    amount: number;
    source: string;
    memo: string;
    reportedValueUsd: number;
  },
): { snapshot: EcosystemSnapshot; tx: NovaTransaction } {
  const timestamp = new Date().toISOString();
  const scan = preScreenCompliance(`${params.sender} ${params.recipient} ${params.source} ${params.memo}`);
  const isExchange = NovaPolicy.blacklistedSources.some((b) => params.source.toLowerCase().includes(b));
  const isAllowedSrc = NovaPolicy.allowedSources.some((s) => s === params.source.toLowerCase());
  const isWhale = params.amount > NovaPolicy.maxWalletHoldingNvc;
  const isPegOk = isValidNovaValue(params.reportedValueUsd);

  let status: 'accepted' | 'rejected' = 'accepted';
  let reason = 'Verified pure NVC origin at fixed $3.14 Nova Peg valuation.';
  if (!scan.passed) {
    status = 'rejected';
    reason = scan.message;
  } else if (isExchange || !isAllowedSrc) {
    status = 'rejected';
    reason = `Rejected tainted/unapproved source "${params.source}" by NovaPurityEnforcer.`;
  } else if (isWhale) {
    status = 'rejected';
    reason = `Anti-Whale HyperGuard: ${params.amount.toLocaleString()} NVC exceeds 10,000,000 NVC cap.`;
  } else if (!isPegOk) {
    status = 'rejected';
    reason = `Non-Compliant Price ($${params.reportedValueUsd.toFixed(2)}) flagged. Internal settlement locked at $3.14.`;
  }

  const tx: NovaTransaction = {
    id: `tx-nvc-${Date.now().toString(36)}`,
    sender: params.sender,
    recipient: params.recipient,
    amount: params.amount,
    micronNova: Math.round(params.amount * NovaPolicy.micronNovaPerNvc),
    source: params.source,
    memo: params.memo,
    reportedValueUsd: params.reportedValueUsd,
    status,
    reason,
    ribaRejected: scan.category === 'Riba',
    gamblingRejected: scan.category === 'Maysir (Gambling)',
    exchangeRejected: isExchange,
    riskScore: status === 'accepted' ? 4 : 92,
    purityScore: status === 'accepted' ? 1 : 0,
    hash: makeLocalHash(`tx-${timestamp}-${params.sender}-${params.amount}`),
    timestamp,
  };

  const transactions = [tx, ...prev.transactions];
  const acceptedTransactions = transactions.filter((t) => t.status === 'accepted').length;
  const rejectedTransactions = transactions.filter((t) => t.status === 'rejected').length;

  let citizens = prev.citizens;
  if (status === 'accepted' && params.source === 'p2p') {
    const senderCit = citizens.find((c) => c.id === params.sender);
    const recipCit = citizens.find((c) => c.id === params.recipient);
    if (senderCit && recipCit && senderCit.balanceNvc >= params.amount) {
      citizens = citizens.map((c) =>
        c.id === params.sender
          ? { ...c, balanceNvc: Number((c.balanceNvc - params.amount).toFixed(6)) }
          : c.id === params.recipient
            ? { ...c, balanceNvc: Number((c.balanceNvc + params.amount).toFixed(6)) }
            : c,
      );
    }
  }

  return {
    tx,
    snapshot: {
      ...prev,
      threatsBlocked: status === 'rejected' ? prev.threatsBlocked + 1 : prev.threatsBlocked,
      ribaBlockedTransactions: tx.ribaRejected ? prev.ribaBlockedTransactions + 1 : prev.ribaBlockedTransactions,
      gamblingBlocked: tx.gamblingRejected ? prev.gamblingBlocked + 1 : prev.gamblingBlocked,
      exchangeBlocked: tx.exchangeRejected ? prev.exchangeBlocked + 1 : prev.exchangeBlocked,
      citizens,
      transactions,
      metrics: {
        ...prev.metrics,
        totalTransactions: transactions.length,
        acceptedTransactions,
        rejectedTransactions,
      },
      auditLog: [
        {
          id: `aud-tx-${Date.now()}`,
          module: status === 'accepted' ? 'Nova' : 'RibaGuard',
          action: status === 'accepted' ? 'TX_ACCEPTED' : 'TX_REJECTED',
          verdict: status,
          detail: `${tx.id} (${tx.amount} NVC = $${nvcToUsd(tx.amount).toFixed(2)}): ${reason}`,
          hash: makeLocalHash(`aud-${tx.id}`),
          timestamp,
        },
        ...prev.auditLog,
      ].slice(0, 100),
    },
  };
}

export function applyLocalAppFallback(
  prev: EcosystemSnapshot,
  params: { name: string; category: string; description: string; paymentAsset: string },
): { snapshot: EcosystemSnapshot; app: NovaAppRecord } {
  const timestamp = new Date().toISOString();
  const scan = preScreenCompliance(`${params.name} ${params.category} ${params.description}`);
  const validAsset = params.paymentAsset.toUpperCase() === 'NVC';
  const status: NovaAppRecord['status'] = scan.passed && validAsset ? 'deployed' : 'rejected';
  const complianceReason = !scan.passed
    ? scan.message
    : !validAsset
      ? `Rejected volatile asset "${params.paymentAsset}": all internal apps must settle exclusively in NVC.`
      : 'Passed AHI AI, HyperScanner (0 Scams), RibaGuard AI (0% interest), and NVC-exclusivity verification.';

  const appRecord: NovaAppRecord = {
    id: `app-${Date.now().toString(36)}`,
    name: params.name,
    category: params.category,
    description: params.description,
    creator: 'NVC-BUILDER-LOCAL',
    status,
    complianceReason,
    manifestSnippet:
      status === 'deployed'
        ? `// Generated by AutonomousAppBuilder\nexport const APP_NAME = ${JSON.stringify(params.name)};\nexport const SETTLEMENT_ASSET = "NVC";\nexport const FIXED_VALUE_USD = 3.14;`
        : `// Blocked by Compliance Gate\n// Reason: ${complianceReason}`,
    createdAt: timestamp,
  };

  const apps = [appRecord, ...prev.apps];
  return {
    app: appRecord,
    snapshot: {
      ...prev,
      apps,
      threatsBlocked: status === 'rejected' ? prev.threatsBlocked + 1 : prev.threatsBlocked,
      scamBlocked: scan.category === 'Scam / Rug' ? prev.scamBlocked + 1 : prev.scamBlocked,
      metrics: {
        ...prev.metrics,
        activeApps: apps.filter((a) => a.status === 'deployed').length,
      },
    },
  };
}
