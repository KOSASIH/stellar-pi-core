import {
  NovaPolicy,
  computePouwRewardNvc,
  isConstitutionalViolation,
  isValidNovaValue,
  nvcToUsd,
  type EcosystemSnapshot,
  type NovaAppRecord,
  type NovaTransaction,
  type UsefulWorkTask,
  type WorkProofRecord,
  type WorkProofType,
} from '../../../shared/novaPolicy.ts';

export type HyperAlertKey = 'whale' | 'scam' | 'oracle' | 'self-heal' | 'plutocracy' | 'waste';
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
    pouw: {
      totalUsefulWorkDone: 5,
      energyPerTxWh: 0.04,
      productiveValueRatio: 98.4,
      mintingPaused: false,
      workProofs: [
        {
          workProofId: 'WP-SCP-9010',
          workType: 'Validating Halal TX',
          nodeId: 'NVC-MINER-RASPI-09',
          durationMs: 380,
          resultHash: makeLocalHash('WP-SCP-9010'),
          verifierNodes: ['ORACLE-US-01', 'ORACLE-ID-01', 'ORACLE-EU-01'],
          usefulWorkScore: 94,
          wealthConcentrationFactor: 1.0001,
          rewardNvc: 0.939906,
          energyWh: 0.04,
          timestamp: iso(1000 * 60 * 32),
        },
        {
          workProofId: 'WP-ORC-9009',
          workType: 'Oracle Check',
          nodeId: 'NVC-CITIZEN-EU-21',
          durationMs: 290,
          resultHash: makeLocalHash('WP-ORC-9009'),
          verifierNodes: ['ORACLE-US-01', 'ORACLE-ID-01', 'NVC-MINER-RASPI-09'],
          usefulWorkScore: 88,
          wealthConcentrationFactor: 1.0001,
          rewardNvc: 0.879912,
          energyWh: 0.03,
          timestamp: iso(1000 * 60 * 24),
        },
        {
          workProofId: 'WP-SCN-9008',
          workType: 'HyperScanner Check',
          nodeId: 'NVC-CITIZEN-US-14',
          durationMs: 410,
          resultHash: makeLocalHash('WP-SCN-9008'),
          verifierNodes: ['ORACLE-EU-01', 'ORACLE-ID-01', 'NVC-CITIZEN-EU-21'],
          usefulWorkScore: 91,
          wealthConcentrationFactor: 1.0001,
          rewardNvc: 0.909909,
          energyWh: 0.04,
          timestamp: iso(1000 * 60 * 16),
        },
        {
          workProofId: 'WP-STR-9007',
          workType: 'Citizen Storage',
          nodeId: 'NVC-MINER-RASPI-09',
          durationMs: 650,
          resultHash: makeLocalHash('WP-STR-9007'),
          verifierNodes: ['ORACLE-US-01', 'NVC-CITIZEN-EU-21', 'NVC-CITIZEN-US-14'],
          usefulWorkScore: 85,
          wealthConcentrationFactor: 1.0001,
          rewardNvc: 0.849915,
          energyWh: 0.05,
          timestamp: iso(1000 * 60 * 9),
        },
        {
          workProofId: 'WP-HEAL-9006',
          workType: 'Self-Heal Task',
          nodeId: 'NVC-CITIZEN-EU-21',
          durationMs: 320,
          resultHash: makeLocalHash('WP-HEAL-9006'),
          verifierNodes: ['ORACLE-US-01', 'ORACLE-ID-01', 'ORACLE-EU-01'],
          usefulWorkScore: 96,
          wealthConcentrationFactor: 1.0001,
          rewardNvc: 0.959904,
          energyWh: 0.04,
          timestamp: iso(1000 * 60 * 4),
        },
      ],
      workMarketplace: [
        {
          id: 'TASK-ORC-01',
          workType: 'Oracle Check',
          requesterId: 'NVC-GOVERNOR-SCP',
          title: 'Regional $3.14 Oracle Quorum Audit Round',
          offeredRewardNvc: 0.85,
          status: 'open',
        },
        {
          id: 'TASK-SCN-02',
          workType: 'HyperScanner Check',
          requesterId: 'NVC-MERCHANT-HUB-07',
          title: 'Scan 24 New Marketplace Contracts for Zero Riba',
          offeredRewardNvc: 0.92,
          status: 'open',
        },
        {
          id: 'TASK-STR-03',
          workType: 'Citizen Storage',
          requesterId: 'NVC-CITIZEN-EU-21',
          title: 'Pin Encrypted Citizen KYC Proof Shards (3 Peers)',
          offeredRewardNvc: 0.78,
          status: 'open',
        },
        {
          id: 'TASK-VAL-04',
          workType: 'Validating Halal TX',
          requesterId: 'NVC-OPEN-MARKET-02',
          title: 'Verify Real-Economy Grain Escrow Batch',
          offeredRewardNvc: 0.88,
          status: 'open',
        },
      ],
    },
    antiPlutocracy: {
      giniCoefficient: 0.21,
      top10ControlPercent: 18.4,
      rewardFairnessScore: 98.8,
      constitutionalRulesLocked: true,
    },
    adaptiveConsensus: {
      mode: 'Normal',
      healthyStreakBlocks: 1042,
      validatorRedundancy: 3,
      oracleCheckFreqSec: 5,
      maxTxBatchSize: 350,
      quarantinedNodes: [],
      adaptiveLog: [
        {
          id: 'adp-seed-1',
          blockHeight: 1042,
          reason: 'Healthy 1000+ block streak verified; redundant verification balanced at 0.04 Wh/tx',
          parameter: 'AdaptiveMode',
          oldValue: 'Eco',
          newValue: 'Normal (3 Validators · 5s Oracle)',
          timestamp: iso(1000 * 60 * 10),
        },
        {
          id: 'adp-seed-2',
          blockHeight: 1018,
          reason: 'Validator threat probe intercepted; temporarily raised redundancy before restoring Normal',
          parameter: 'oracleCheckFreqSec',
          oldValue: '5s',
          newValue: '2s -> 5s (Self-Restored)',
          timestamp: iso(1000 * 60 * 28),
        },
      ],
    },
    failurePrevention: {
      totalAutoFixes: 7,
      checks: [
        {
          id: 'centralization-drift',
          name: 'a. Centralization Drift (>30% Top-10 Control)',
          status: 'GREEN / AUTO-FIXED',
          fixCount: 1,
          lastAction: 'Distributed SCP validation across Citizen nodes (Top 10 <= 18%).',
        },
        {
          id: 'energy-waste-drift',
          name: 'b. Energy Waste Drift (>10% Energy/Tx Rise)',
          status: 'GREEN / AUTO-FIXED',
          fixCount: 1,
          lastAction: 'Lightweight PoUW + SCP active at 0.04 Wh/tx.',
        },
        {
          id: 'wealth-concentration-drift',
          name: 'c. Wealth Concentration Drift (Gini > 0.35)',
          status: 'GREEN / AUTO-FIXED',
          fixCount: 1,
          lastAction: 'WealthConcentrationFactor active; small Citizen rewards boosted.',
        },
        {
          id: 'oracle-drift',
          name: 'd. Oracle Drift (2+ Oracles > 0.1% From $3.14)',
          status: 'GREEN / AUTO-FIXED',
          fixCount: 1,
          lastAction: 'Oracle Predictive Shield locked Peg at $3.14 USD.',
        },
        {
          id: 'scam-infiltration',
          name: 'e. Scam Infiltration (HyperScanner Trigger)',
          status: 'GREEN / AUTO-FIXED',
          fixCount: 1,
          lastAction: 'Auto-banned rogue creator & froze scam spec (0 Scams Passed).',
        },
        {
          id: 'dead-money',
          name: 'f. Dead Money (>10% Inactive 90d Supply)',
          status: 'GREEN / AUTO-FIXED',
          fixCount: 1,
          lastAction: 'Circular useful-work velocity verified (Productive Value > 95%).',
        },
        {
          id: 'self-heal-failure',
          name: 'g. Self-Heal Failure (Slow Promotion >= 2x)',
          status: 'GREEN / AUTO-FIXED',
          fixCount: 1,
          lastAction: 'Standby Citizen failover slots armed (<1s auto-promotion).',
        },
      ],
    },
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

export function applyLocalCitizenRegisterFallback(
  prev: EcosystemSnapshot,
  params: { displayName: string; region: string; deviceFingerprint: string },
): { ok: boolean; citizen?: EcosystemSnapshot['citizens'][number]; snapshot: EcosystemSnapshot; error?: string } {
  const cleanName = params.displayName.trim();
  const cleanDevice = params.deviceFingerprint.trim();
  const cleanRegion = params.region.trim() || 'Global';
  if (!cleanName || !cleanDevice) {
    return { ok: false, snapshot: prev, error: 'Citizen display name and device fingerprint are required.' };
  }
  const existing = prev.citizens.find(
    (c) => c.deviceFingerprint.toLowerCase() === cleanDevice.toLowerCase(),
  );
  if (existing) {
    const timestamp = new Date().toISOString();
    return {
      ok: false,
      error: `Anti-Sybil HyperGuard: Device "${cleanDevice}" is already verified for 1-KYC Citizen ${existing.id}. 1 Person = 1 Account strictly enforced.`,
      snapshot: {
        ...prev,
        threatsBlocked: prev.threatsBlocked + 1,
        hyperModules: prev.hyperModules.map((m) =>
          m.id === 'whale-sybil-guard' ? { ...m, threatsBlocked: m.threatsBlocked + 1 } : m,
        ),
        auditLog: [
          {
            id: `aud-sybil-${Date.now()}`,
            module: 'HyperGuard',
            action: 'SYBIL_DUPLICATE_BLOCKED',
            verdict: 'rejected' as const,
            detail: `Blocked duplicate device registration (${cleanDevice}) already bound to ${existing.id}.`,
            hash: makeLocalHash(`sybil-${cleanDevice}-${timestamp}`),
            timestamp,
          },
          ...prev.auditLog,
        ].slice(0, 100),
      },
    };
  }

  const timestamp = new Date().toISOString();
  const citizenId = `NVC-CITIZEN-${(prev.citizens.length + 10).toString().padStart(2, '0')}`;
  const citizen = {
    id: citizenId,
    displayName: cleanName,
    region: cleanRegion,
    deviceFingerprint: cleanDevice,
    kycVerified: true,
    reputationScore: 92,
    balanceNvc: 1.0,
    minedTotalNvc: 1.0,
    miningSessions: 1,
    lastMinedAt: timestamp,
  };
  const citizens = [citizen, ...prev.citizens];
  return {
    ok: true,
    citizen,
    snapshot: {
      ...prev,
      citizens,
      metrics: { ...prev.metrics, verifiedCitizens: citizens.length },
      auditLog: [
        {
          id: `aud-cit-${Date.now()}`,
          module: 'Citizens',
          action: 'KYC_CITIZEN_VERIFIED',
          verdict: 'accepted' as const,
          detail: `Verified 1-KYC Citizen ${citizen.id} (${citizen.displayName}) bound to ${citizen.deviceFingerprint}.`,
          hash: makeLocalHash(`cit-${citizen.id}-${timestamp}`),
          timestamp,
        },
        ...prev.auditLog,
      ].slice(0, 100),
    },
  };
}

export function applyLocalProposalFallback(
  prev: EcosystemSnapshot,
  params: { title: string; description: string; proposer: string },
): { ok: boolean; proposal?: EcosystemSnapshot['proposals'][number]; snapshot: EcosystemSnapshot; error?: string } {
  const constitutional = isConstitutionalViolation(params.title, params.description);
  if (constitutional.violated) {
    return { ok: false, snapshot: prev, error: constitutional.reason };
  }
  const scan = preScreenCompliance(`${params.title} ${params.description}`);
  if (!scan.passed) {
    return { ok: false, snapshot: prev, error: scan.message };
  }
  const timestamp = new Date().toISOString();
  const proposal = {
    id: `prop-nvc-${Date.now().toString(36)}`,
    title: params.title.trim(),
    description: params.description.trim(),
    proposer: params.proposer,
    category: 'Real Economy' as const,
    status: 'open' as const,
    yesVotes: 1,
    noVotes: 0,
    voters: [params.proposer],
    aiForecast: '91% projected APPROVE (aligned with $3.14 peg & zero-interest rules)',
    createdAt: timestamp,
  };
  const proposals = [proposal, ...prev.proposals];
  return {
    ok: true,
    proposal,
    snapshot: {
      ...prev,
      proposals,
      metrics: {
        ...prev.metrics,
        openProposals: proposals.filter((p) => p.status === 'open').length,
      },
      auditLog: [
        {
          id: `aud-prop-${Date.now()}`,
          module: 'Governance',
          action: 'PROPOSAL_CREATED',
          verdict: 'accepted' as const,
          detail: `Citizen ${params.proposer} opened ballot "${proposal.title}".`,
          hash: makeLocalHash(`prop-${proposal.id}-${timestamp}`),
          timestamp,
        },
        ...prev.auditLog,
      ].slice(0, 100),
    },
  };
}

export function applyLocalVoteFallback(
  prev: EcosystemSnapshot,
  params: { proposalId: string; citizenId: string; vote: 'yes' | 'no' },
): { ok: boolean; proposal?: EcosystemSnapshot['proposals'][number]; snapshot: EcosystemSnapshot; error?: string } {
  const target = prev.proposals.find((p) => p.id === params.proposalId);
  if (!target) return { ok: false, snapshot: prev, error: 'Proposal not found.' };
  if (target.voters.includes(params.citizenId)) {
    return { ok: false, snapshot: prev, error: `1 Person = 1 Vote: ${params.citizenId} already voted on this ballot.` };
  }
  const yesVotes = target.yesVotes + (params.vote === 'yes' ? 1 : 0);
  const noVotes = target.noVotes + (params.vote === 'no' ? 1 : 0);
  const status: 'open' | 'passed' | 'rejected' =
    yesVotes >= 3 ? 'passed' : noVotes >= 3 ? 'rejected' : 'open';
  const updatedProposal = {
    ...target,
    yesVotes,
    noVotes,
    status,
    voters: [...target.voters, params.citizenId],
  };
  const proposals = prev.proposals.map((p) => (p.id === params.proposalId ? updatedProposal : p));
  return {
    ok: true,
    proposal: updatedProposal,
    snapshot: {
      ...prev,
      proposals,
      metrics: {
        ...prev.metrics,
        openProposals: proposals.filter((p) => p.status === 'open').length,
      },
    },
  };
}

export function applyLocalMarketplaceListingFallback(
  prev: EcosystemSnapshot,
  params: {
    title: string;
    description: string;
    category: EcosystemSnapshot['marketplaceListings'][number]['category'];
    settlementModel: EcosystemSnapshot['marketplaceListings'][number]['settlementModel'];
    priceNvc: number;
    merchantId: string;
    merchantName: string;
  },
): { ok: boolean; listing?: EcosystemSnapshot['marketplaceListings'][number]; snapshot: EcosystemSnapshot; error?: string } {
  const scan = preScreenCompliance(`${params.title} ${params.description}`);
  if (!scan.passed) {
    return {
      ok: false,
      error: scan.message,
      snapshot: {
        ...prev,
        threatsBlocked: prev.threatsBlocked + 1,
        ribaBlockedTransactions:
          scan.category === 'Riba' ? prev.ribaBlockedTransactions + 1 : prev.ribaBlockedTransactions,
      },
    };
  }
  const listing: EcosystemSnapshot['marketplaceListings'][number] = {
    id: `mkt-${Date.now().toString(36)}`,
    title: params.title.trim(),
    merchantId: params.merchantId,
    merchantName: params.merchantName,
    category: params.category,
    priceNvc: params.priceNvc,
    description: params.description.trim(),
    settlementModel: params.settlementModel,
    stock: 20,
    soldCount: 0,
    halalVerified: true,
    createdAt: new Date().toISOString(),
  };
  return {
    ok: true,
    listing,
    snapshot: {
      ...prev,
      marketplaceListings: [listing, ...prev.marketplaceListings],
    },
  };
}

export function applyLocalMarketplaceBuyFallback(
  prev: EcosystemSnapshot,
  params: { listingId: string; buyerId: string },
): { ok: boolean; order?: EcosystemSnapshot['marketplaceOrders'][number]; snapshot: EcosystemSnapshot; error?: string } {
  const listing = prev.marketplaceListings.find((l) => l.id === params.listingId);
  const buyer = prev.citizens.find((c) => c.id === params.buyerId);
  if (!listing || listing.stock < 1) {
    return { ok: false, snapshot: prev, error: 'Listing unavailable or out of stock.' };
  }
  if (!buyer || buyer.balanceNvc < listing.priceNvc) {
    return {
      ok: false,
      snapshot: prev,
      error: `Insufficient balance (${buyer?.balanceNvc.toFixed(2) ?? '0'} NVC) for ${listing.priceNvc} NVC item.`,
    };
  }
  const timestamp = new Date().toISOString();
  const txId = `tx-mkt-${Date.now().toString(36)}`;
  const order: EcosystemSnapshot['marketplaceOrders'][number] = {
    id: `ord-${Date.now().toString(36)}`,
    listingId: listing.id,
    listingTitle: listing.title,
    buyerId: buyer.id,
    merchantId: listing.merchantId,
    amountNvc: listing.priceNvc,
    micronNova: Math.round(listing.priceNvc * NovaPolicy.micronNovaPerNvc),
    usdEquivalent: nvcToUsd(listing.priceNvc),
    txId,
    hash: makeLocalHash(`ord-${txId}-${timestamp}`),
    timestamp,
  };
  const tx: NovaTransaction = {
    id: txId,
    sender: buyer.id,
    recipient: listing.merchantId,
    amount: listing.priceNvc,
    micronNova: order.micronNova,
    source: 'marketplace',
    memo: `Real-economy purchase: ${listing.title}`,
    reportedValueUsd: NovaPolicy.fixedValueUsd,
    status: 'accepted',
    reason: 'Settled via Halal Real-Economy Marketplace at $3.14 fixed peg.',
    riskScore: 3,
    purityScore: 1,
    hash: order.hash,
    timestamp,
  };
  const transactions = [tx, ...prev.transactions];
  return {
    ok: true,
    order,
    snapshot: {
      ...prev,
      citizens: prev.citizens.map((c) =>
        c.id === buyer.id
          ? { ...c, balanceNvc: Number((c.balanceNvc - listing.priceNvc).toFixed(6)) }
          : c.id === listing.merchantId
            ? { ...c, balanceNvc: Number((c.balanceNvc + listing.priceNvc).toFixed(6)) }
            : c,
      ),
      marketplaceListings: prev.marketplaceListings.map((l) =>
        l.id === listing.id ? { ...l, stock: l.stock - 1, soldCount: l.soldCount + 1 } : l,
      ),
      marketplaceOrders: [order, ...prev.marketplaceOrders],
      transactions,
      metrics: {
        ...prev.metrics,
        totalTransactions: transactions.length,
        acceptedTransactions: transactions.filter((t) => t.status === 'accepted').length,
        marketplaceVolumeNvc: Number((prev.metrics.marketplaceVolumeNvc + listing.priceNvc).toFixed(4)),
      },
    },
  };
}

export function applyLocalMudarabahFallback(
  prev: EcosystemSnapshot,
  params: { netProfitNvc: number; partnerSharePercent: number; note: string },
): { ok: boolean; distributableNvc?: number; recipientCount?: number; snapshot: EcosystemSnapshot; error?: string } {
  const scan = preScreenCompliance(params.note);
  if (!scan.passed) {
    return {
      ok: false,
      error: scan.message,
      snapshot: {
        ...prev,
        threatsBlocked: prev.threatsBlocked + 1,
        ribaBlockedTransactions:
          scan.category === 'Riba' ? prev.ribaBlockedTransactions + 1 : prev.ribaBlockedTransactions,
      },
    };
  }
  const distributable = Number(((params.netProfitNvc * params.partnerSharePercent) / 100).toFixed(6));
  const perCitizen = Number((distributable / Math.max(1, prev.citizens.length)).toFixed(6));
  return {
    ok: true,
    distributableNvc: distributable,
    recipientCount: prev.citizens.length,
    snapshot: {
      ...prev,
      citizens: prev.citizens.map((c) => ({
        ...c,
        balanceNvc: Number((c.balanceNvc + perCitizen).toFixed(6)),
      })),
      metrics: {
        ...prev.metrics,
        mudarabahDistributedNvc: Number((prev.metrics.mudarabahDistributedNvc + distributable).toFixed(4)),
      },
    },
  };
}

export function applyLocalSealBlockFallback(
  prev: EcosystemSnapshot,
): { block: EcosystemSnapshot['scpBlocks'][number]; snapshot: EcosystemSnapshot } {
  const latest = prev.scpBlocks[0];
  const nextHeight = (latest?.height ?? 1042) + 1;
  const accepted = prev.transactions.filter((t) => t.status === 'accepted').slice(0, 6);
  const totalNvc = Number(accepted.reduce((acc, t) => acc + t.amount, 0).toFixed(6));
  const timestamp = new Date().toISOString();
  const block: EcosystemSnapshot['scpBlocks'][number] = {
    height: nextHeight,
    hash: makeLocalHash(`scp-block-${nextHeight}-${timestamp}`),
    previousHash: latest?.hash || makeLocalHash('scp-genesis'),
    txIds: accepted.map((t) => t.id),
    txCount: accepted.length,
    totalNvc,
    totalMicronNova: Math.round(totalNvc * NovaPolicy.micronNovaPerNvc),
    quorum: `${prev.metrics.verifiedOracleNodes}/${prev.oracleNodes.length} SCP Validators`,
    energyWh: 0.04,
    sealedAt: timestamp,
  };
  return {
    block,
    snapshot: {
      ...prev,
      scpBlocks: [block, ...prev.scpBlocks].slice(0, 25),
      metrics: {
        ...prev.metrics,
        latestBlockHeight: nextHeight,
      },
    },
  };
}

export interface ProvenanceInspection {
  queryId: string;
  entityType: 'transaction' | 'citizen' | 'coin';
  status: 'valid' | 'rejected';
  purityScore: number;
  riskScore: number;
  reason: string;
  holdingNvc: number;
  capPercent: number;
  blockHeight?: number;
  sha256: string;
  transaction?: NovaTransaction;
}

export function buildLocalProvenanceReport(
  snapshot: EcosystemSnapshot,
  rawQuery: string,
): ProvenanceInspection {
  const query = rawQuery.trim() || 'NVC-MINER-RASPI-09';
  const matchedTx = snapshot.transactions.find(
    (t) => t.id.toLowerCase() === query.toLowerCase(),
  );
  if (matchedTx) {
    return {
      queryId: matchedTx.id,
      entityType: 'transaction',
      status: matchedTx.status === 'accepted' ? 'valid' : 'rejected',
      purityScore: matchedTx.purityScore,
      riskScore: matchedTx.riskScore ?? (matchedTx.status === 'accepted' ? 4 : 92),
      reason: matchedTx.reason,
      holdingNvc: matchedTx.amount,
      capPercent: (matchedTx.amount / NovaPolicy.maxWalletHoldingNvc) * 100,
      blockHeight: snapshot.scpBlocks.find((b) => b.txIds.includes(matchedTx.id))?.height ?? snapshot.metrics.latestBlockHeight,
      sha256: matchedTx.hash,
      transaction: matchedTx,
    };
  }
  const matchedCitizen = snapshot.citizens.find(
    (c) => c.id.toLowerCase() === query.toLowerCase(),
  );
  if (matchedCitizen) {
    return {
      queryId: matchedCitizen.id,
      entityType: 'citizen',
      status: 'valid',
      purityScore: 1,
      riskScore: 3,
      reason: `Verified 1-KYC Citizen (${matchedCitizen.displayName}) bound to ${matchedCitizen.deviceFingerprint} at fixed $3.14 Nova Peg.`,
      holdingNvc: matchedCitizen.balanceNvc,
      capPercent: (matchedCitizen.balanceNvc / NovaPolicy.maxWalletHoldingNvc) * 100,
      blockHeight: snapshot.metrics.latestBlockHeight,
      sha256: makeLocalHash(matchedCitizen.id),
    };
  }
  const isTainted = NovaPolicy.blacklistedSources.some((src) => query.toLowerCase().includes(src));
  return {
    queryId: query,
    entityType: 'coin',
    status: isTainted ? 'rejected' : 'valid',
    purityScore: isTainted ? 0 : 1,
    riskScore: isTainted ? 94 : 5,
    reason: isTainted
      ? 'Nova Core Coin rejected: Exchange/third-party exposure detected by NovaPurityEnforcer.'
      : 'Pure NVC mathematical identity verified: 1 NVC = $3.14 USD · 0% Interest · Riba-Free.',
    holdingNvc: isTainted ? 0 : 1,
    capPercent: 0,
    blockHeight: snapshot.metrics.latestBlockHeight,
    sha256: makeLocalHash(query),
  };
}

export function applyLocalClaimWorkTaskFallback(
  prev: EcosystemSnapshot,
  params: { taskId: string; citizenId: string },
): { ok: boolean; rewardNvc?: number; workProofId?: string; snapshot: EcosystemSnapshot; error?: string } {
  const pouw = prev.pouw;
  const task = pouw?.workMarketplace.find((t) => t.id === params.taskId && t.status === 'open');
  const citizen = prev.citizens.find((c) => c.id === params.citizenId && c.kycVerified);
  if (!pouw || !task) return { ok: false, snapshot: prev, error: 'Useful work task unavailable.' };
  if (!citizen) return { ok: false, snapshot: prev, error: '1-KYC Citizen node required.' };

  const workScore = Math.round(task.offeredRewardNvc * 100);
  const calc = computePouwRewardNvc({
    usefulWorkScore: workScore,
    uptimeRatio: 0.99,
    purityScore: 1,
    walletHoldingNvc: citizen.balanceNvc,
  });
  const timestamp = new Date().toISOString();
  const wpId = `WP-${Date.now().toString(36).toUpperCase()}`;
  const proof: WorkProofRecord = {
    workProofId: wpId,
    workType: task.workType,
    nodeId: citizen.id,
    durationMs: 280,
    resultHash: makeLocalHash(`wp-${wpId}-${citizen.id}-${timestamp}`),
    verifierNodes: ['ORACLE-US-01', 'ORACLE-ID-01', 'ORACLE-EU-01'],
    usefulWorkScore: workScore,
    wealthConcentrationFactor: calc.wealthConcentrationFactor,
    rewardNvc: calc.rewardNvc,
    energyWh: 0.03,
    timestamp,
  };

  return {
    ok: true,
    rewardNvc: calc.rewardNvc,
    workProofId: wpId,
    snapshot: {
      ...prev,
      citizens: prev.citizens.map((c) =>
        c.id === citizen.id
          ? {
              ...c,
              balanceNvc: Number((c.balanceNvc + calc.rewardNvc).toFixed(6)),
              minedTotalNvc: Number((c.minedTotalNvc + calc.rewardNvc).toFixed(6)),
              miningSessions: c.miningSessions + 1,
            }
          : c,
      ),
      pouw: {
        ...pouw,
        totalUsefulWorkDone: pouw.totalUsefulWorkDone + 1,
        workProofs: [proof, ...pouw.workProofs].slice(0, 10),
        workMarketplace: pouw.workMarketplace.map((t) =>
          t.id === task.id
            ? { ...t, status: 'completed' as const, completedBy: citizen.id, workProofId: wpId }
            : t,
        ),
      },
    },
  };
}

export function applyLocalCreateWorkTaskFallback(
  prev: EcosystemSnapshot,
  params: { title: string; workType: WorkProofType; requesterId: string; offeredRewardNvc: number },
): { ok: boolean; task?: UsefulWorkTask; snapshot: EcosystemSnapshot; error?: string } {
  const cleanTitle = params.title.trim();
  const scan = preScreenCompliance(cleanTitle);
  if (!cleanTitle || !Number.isFinite(params.offeredRewardNvc) || params.offeredRewardNvc <= 0) {
    return { ok: false, snapshot: prev, error: 'Provide a valid UsefulWork task title and positive NVC reward.' };
  }
  if (!scan.passed) {
    return { ok: false, snapshot: prev, error: scan.message };
  }
  const task: UsefulWorkTask = {
    id: `TASK-${Date.now().toString(36).toUpperCase().slice(-5)}`,
    workType: params.workType,
    requesterId: params.requesterId,
    title: cleanTitle,
    offeredRewardNvc: Number(params.offeredRewardNvc.toFixed(4)),
    status: 'open',
  };
  const pouw = prev.pouw ?? createLocalFallbackSnapshot().pouw!;
  return {
    ok: true,
    task,
    snapshot: {
      ...prev,
      pouw: {
        ...pouw,
        workMarketplace: [task, ...pouw.workMarketplace].slice(0, 24),
      },
    },
  };
}

export function applyLocalAdaptiveConsensusFallback(
  prev: EcosystemSnapshot,
  scenario: 'tps-drop' | 'malicious-node' | 'healthy-1000' | 'restore-normal',
): EcosystemSnapshot {
  const adaptive = prev.adaptiveConsensus ?? createLocalFallbackSnapshot().adaptiveConsensus!;
  const timestamp = new Date().toISOString();
  const nextHeight = (prev.metrics.latestBlockHeight || 1042) + 1;
  const oldMode = adaptive.mode;

  if (scenario === 'tps-drop') {
    return {
      ...prev,
      adaptiveConsensus: {
        ...adaptive,
        mode: 'Defensive',
        healthyStreakBlocks: 0,
        validatorRedundancy: 5,
        oracleCheckFreqSec: 2,
        maxTxBatchSize: 150,
        adaptiveLog: [
          {
            id: `adp-${Date.now()}`,
            blockHeight: nextHeight,
            reason: 'TPS dropped >20% (1200 -> 820 TPS); raised redundancy to 5 & tightened oracle checks to 2s',
            parameter: 'AdaptiveMode',
            oldValue: oldMode,
            newValue: 'Defensive (5 Validators · 2s Oracle)',
            timestamp,
          },
          ...adaptive.adaptiveLog,
        ].slice(0, 20),
      },
    };
  }
  if (scenario === 'malicious-node') {
    const rogue = 'VAL-EXT-ROGUE-07';
    return {
      ...prev,
      adaptiveConsensus: {
        ...adaptive,
        mode: 'Defensive',
        healthyStreakBlocks: 0,
        validatorRedundancy: 5,
        oracleCheckFreqSec: 2,
        maxTxBatchSize: 150,
        quarantinedNodes: adaptive.quarantinedNodes.includes(rogue)
          ? adaptive.quarantinedNodes
          : [rogue, ...adaptive.quarantinedNodes],
        adaptiveLog: [
          {
            id: `adp-${Date.now()}`,
            blockHeight: nextHeight,
            reason: `Validator ${rogue} detected 2x: auto-quarantined 100 blocks & promoted Citizen NVC-MINER-RASPI-09`,
            parameter: 'ValidatorQuarantine',
            oldValue: rogue,
            newValue: 'Quarantined 100 blk -> Backup Citizen Promoted',
            timestamp,
          },
          ...adaptive.adaptiveLog,
        ].slice(0, 20),
      },
    };
  }
  if (scenario === 'healthy-1000') {
    return {
      ...prev,
      pouw: prev.pouw ? { ...prev.pouw, energyPerTxWh: 0.03 } : prev.pouw,
      adaptiveConsensus: {
        ...adaptive,
        mode: 'Eco',
        healthyStreakBlocks: Math.max(1000, adaptive.healthyStreakBlocks + 1000),
        validatorRedundancy: 3,
        oracleCheckFreqSec: 10,
        maxTxBatchSize: 500,
        quarantinedNodes: [],
        adaptiveLog: [
          {
            id: `adp-${Date.now()}`,
            blockHeight: nextHeight,
            reason: '1000+ consecutive healthy blocks verified; entered Eco mode (-30% redundant checks)',
            parameter: 'AdaptiveMode',
            oldValue: oldMode,
            newValue: 'Eco (-30% Redundancy · 0.03 Wh/tx)',
            timestamp,
          },
          ...adaptive.adaptiveLog,
        ].slice(0, 20),
      },
    };
  }
  return {
    ...prev,
    pouw: prev.pouw ? { ...prev.pouw, energyPerTxWh: 0.04 } : prev.pouw,
    adaptiveConsensus: {
      ...adaptive,
      mode: 'Normal',
      validatorRedundancy: 3,
      oracleCheckFreqSec: 5,
      maxTxBatchSize: 350,
      quarantinedNodes: [],
      adaptiveLog: [
        {
          id: `adp-${Date.now()}`,
          blockHeight: nextHeight,
          reason: 'Consensus telemetry stabilized; restored balanced Normal SCP parameters',
          parameter: 'AdaptiveMode',
          oldValue: oldMode,
          newValue: 'Normal (3 Validators · 5s Oracle)',
          timestamp,
        },
        ...adaptive.adaptiveLog,
      ].slice(0, 20),
    },
  };
}



