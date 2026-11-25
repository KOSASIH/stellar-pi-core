export const NovaPolicy = {
  name: 'Stellar Nova Core',
  coinName: 'Nova Core Coin',
  symbol: 'NVC',
  tagline: 'Born From a Supernova. Not a Coin to Trade. A Currency to Use.',
  fixedValueUsd: 3.14,
  totalSupply: 100_000_000_000,
  networkValueAtPegUsd: 314_000_000_000,
  collateralRatio: 1.5,
  micronNovaPerNvc: 1_000_000,
  maxWalletHoldingNvc: 10_000_000, // 0.01% of 100B NVC total supply
  transactionFeeUsd: 0.001,
  blockTimeSec: 5,
  consensus: 'Stellar Consensus Protocol (SCP)',
  novaExclusivity: 'NVC Only',
  noGambling: 'Strictly Enforced',
  ethicalAi: 'AHI AI Active',
  founderAccountability: 'Community Governed',
  noRiba: 'Strictly Forbidden - Zero Interest',
  ribaPolicy: '0% Interest - No Lending With Interest - No Staking Yield - No APY',
  shariaCompliant: 'Halal - Riba-Free - Gharar-Free',
  allowedSources: ['mining', 'contribution_rewards', 'p2p', 'marketplace', 'app'] as const,
  blacklistedSources: ['exchange', 'bought'] as const,
  gamblingKeywords: [
    'bet',
    'casino',
    'gambling',
    'betting',
    'jackpot',
    'slot',
    'poker',
    'lottery',
    'prediction market gambling',
  ] as const,
  ribaKeywords: [
    'interest',
    'riba',
    'apy',
    'apr',
    'yield',
    'staking reward',
    'lending interest',
    'bunga',
    'loan interest',
    'fixed return',
    'profit sharing interest',
    'deposit interest',
    'borrow interest',
    'leverage',
    'margin interest',
    'rentenir',
  ] as const,
  ghararKeywords: [
    'leverage 100x',
    'futures',
    'options gambling',
    'mystery box',
    'loot box gambling',
  ] as const,
  scamKeywords: [
    'guaranteed profit',
    'double your money',
    '1000x',
    'presale',
    'pump',
    'rug',
    'honeypot',
    'private key',
    'seed phrase',
  ] as const,
  bannedFinancialModels: [
    'lending_with_interest',
    'staking_apy',
    'yield_farming',
    'leveraged_trading',
    'interest_bearing_savings',
  ] as const,
} as const;

export function formatMicronNova(nvcAmount: number): string {
  const micron = Math.round(nvcAmount * NovaPolicy.micronNovaPerNvc);
  return `${micron.toLocaleString()} µNVC`;
}

export function nvcToUsd(nvcAmount: number): number {
  return nvcAmount * NovaPolicy.fixedValueUsd;
}

export function isValidNovaValue(value: number): boolean {
  return Number.isFinite(value) && Math.abs(value - NovaPolicy.fixedValueUsd) < 1e-9;
}

export function formatUsd(amount: number): string {
  return `$${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export interface NovaTransaction {
  id: string;
  sender: string;
  recipient: string;
  amount: number;
  micronNova: number;
  source: string;
  memo: string;
  reportedValueUsd: number;
  status: 'accepted' | 'rejected';
  reason: string;
  ribaRejected?: boolean;
  gamblingRejected?: boolean;
  exchangeRejected?: boolean;
  riskScore?: number;
  purityScore: number;
  hash: string;
  timestamp: string;
}

export interface NovaAppRecord {
  id: string;
  name: string;
  category: string;
  description: string;
  creator?: string;
  status: 'deployed' | 'rejected' | 'halted';
  complianceReason: string;
  manifestSnippet: string;
  createdAt: string;
}

export interface OracleNode {
  id: string;
  region: string;
  reportedValueUsd: number;
  status: 'verified' | 'flagged';
  lastCheckedAt: string;
}

export interface GovernanceRules {
  novaExclusivity: string;
  ethicalAi: string;
  founderAccountability: string;
  volatileRejection: string;
  noGambling: string;
  noRiba: string;
  shariaCompliant: string;
  evolutionThreshold: number;
}

export interface AuditEntry {
  id: string;
  module: string;
  action: string;
  verdict: 'accepted' | 'rejected' | 'info';
  detail: string;
  hash: string;
  timestamp: string;
}

export interface HyperModuleCard {
  id: string;
  name: string;
  status: 'Active';
  threatsBlocked: number;
  health: number;
  description: string;
}

export interface HyperMindLogEntry {
  id: string;
  module: string;
  decision: string;
  severity: 'blocked' | 'healed' | 'predicted' | 'info';
  timestamp: string;
}

export interface CitizenAccount {
  id: string;
  displayName: string;
  region: string;
  deviceFingerprint: string;
  kycVerified: boolean;
  reputationScore: number;
  balanceNvc: number;
  minedTotalNvc: number;
  miningSessions: number;
  lastMinedAt: string;
}

export interface GovernanceProposal {
  id: string;
  title: string;
  description: string;
  proposer: string;
  category: 'Oracle Alignment' | 'Compliance Policy' | 'Real Economy' | 'Protocol Upgrade';
  status: 'open' | 'passed' | 'rejected';
  yesVotes: number;
  noVotes: number;
  voters: string[];
  aiForecast: string;
  createdAt: string;
}

export interface CollateralReserveItem {
  id: string;
  assetClass: string;
  custodyType: string;
  backingUsd: number;
  sharePercent: number;
  halalCertified: boolean;
  lastAuditedAt: string;
}

export interface MarketplaceListing {
  id: string;
  title: string;
  merchantId: string;
  merchantName: string;
  category: 'Physical Goods' | 'Clean Energy' | 'Logistics' | 'Halal Mudarabah';
  priceNvc: number;
  description: string;
  settlementModel: 'Direct Real Trade' | 'Fee-Based Service' | 'Mudarabah Profit-Share (0% Interest)';
  stock: number;
  soldCount: number;
  halalVerified: boolean;
  createdAt: string;
}

export interface MarketplaceOrder {
  id: string;
  listingId: string;
  listingTitle: string;
  buyerId: string;
  merchantId: string;
  amountNvc: number;
  micronNova: number;
  usdEquivalent: number;
  txId: string;
  hash: string;
  timestamp: string;
}

export interface ScpBlock {
  height: number;
  hash: string;
  previousHash: string;
  txIds: string[];
  txCount: number;
  totalNvc: number;
  totalMicronNova: number;
  quorum: string;
  energyWh: number;
  sealedAt: string;
}

export interface EcosystemSnapshot {
  constants: typeof NovaPolicy;
  mainnetLaunched: boolean;
  complianceBreached: boolean;
  aiHealthScore: number;
  unethicalIncidents: number;
  hyperMindStatus: 'Active';
  threatsBlocked: number;
  networkHealth: number;
  whaleProof: boolean;
  scamBlocked: number;
  ribaBlockedTransactions: number;
  gamblingBlocked: number;
  exchangeBlocked: number;
  stabilizerStatus: string;
  ribaPolicy: string;
  rules: GovernanceRules;
  metrics: {
    totalTransactions: number;
    acceptedTransactions: number;
    rejectedTransactions: number;
    activeApps: number;
    verifiedOracleNodes: number;
    isolatedOracleNodes: number;
    verifiedCitizens: number;
    openProposals: number;
    collateralRatioActual: number;
    marketplaceVolumeNvc: number;
    latestBlockHeight: number;
    mudarabahDistributedNvc: number;
  };
  transactions: NovaTransaction[];
  apps: NovaAppRecord[];
  oracleNodes: OracleNode[];
  auditLog: AuditEntry[];
  hyperModules: HyperModuleCard[];
  hyperMindLog: HyperMindLogEntry[];
  bannedCreators: string[];
  citizens: CitizenAccount[];
  proposals: GovernanceProposal[];
  collateralReserves: CollateralReserveItem[];
  marketplaceListings: MarketplaceListing[];
  marketplaceOrders: MarketplaceOrder[];
  scpBlocks: ScpBlock[];
}

