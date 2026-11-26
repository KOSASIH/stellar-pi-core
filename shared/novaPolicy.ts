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

export type WorkProofType =
  | 'Validating Halal TX'
  | 'Oracle Check'
  | 'HyperScanner Check'
  | 'Citizen Storage'
  | 'Self-Heal Task';

export interface WorkProofRecord {
  workProofId: string;
  workType: WorkProofType;
  nodeId: string;
  durationMs: number;
  resultHash: string;
  verifierNodes: string[];
  usefulWorkScore: number;
  wealthConcentrationFactor: number;
  rewardNvc: number;
  energyWh: number;
  timestamp: string;
}

export interface UsefulWorkTask {
  id: string;
  workType: WorkProofType;
  requesterId: string;
  title: string;
  offeredRewardNvc: number;
  status: 'open' | 'completed';
  completedBy?: string;
  workProofId?: string;
}

export interface AdaptiveLogItem {
  id: string;
  blockHeight: number;
  reason: string;
  parameter: string;
  oldValue: string;
  newValue: string;
  timestamp: string;
}

export interface FailureModeStatus {
  id: string;
  name: string;
  status: 'GREEN / AUTO-FIXED';
  fixCount: number;
  lastAction: string;
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
  pouw?: {
    totalUsefulWorkDone: number;
    energyPerTxWh: number;
    productiveValueRatio: number;
    mintingPaused: boolean;
    workProofs: WorkProofRecord[];
    workMarketplace: UsefulWorkTask[];
  };
  antiPlutocracy?: {
    giniCoefficient: number;
    top10ControlPercent: number;
    rewardFairnessScore: number;
    constitutionalRulesLocked: boolean;
  };
  adaptiveConsensus?: {
    mode: 'Normal' | 'Defensive' | 'Eco';
    healthyStreakBlocks: number;
    validatorRedundancy: number;
    oracleCheckFreqSec: number;
    maxTxBatchSize: number;
    quarantinedNodes: string[];
    adaptiveLog: AdaptiveLogItem[];
  };
  failurePrevention?: {
    totalAutoFixes: number;
    checks: FailureModeStatus[];
  };
}

// NovaHyperMind v2 Core Math Helpers (Mirrors C++ core engines in src/core/)
export function computeWealthConcentrationFactor(walletHoldingNvc: number): number {
  const clamped = Math.max(0, Math.min(NovaPolicy.maxWalletHoldingNvc, walletHoldingNvc));
  const ratio = clamped / NovaPolicy.maxWalletHoldingNvc;
  return Number((1 + 19 * Math.pow(ratio, 1.25)).toFixed(4));
}

export function computePouwRewardNvc(params: {
  usefulWorkScore: number;
  uptimeRatio: number;
  purityScore: number;
  walletHoldingNvc: number;
}): { rewardNvc: number; wealthConcentrationFactor: number; multiplier: number } {
  const wealthFactor = computeWealthConcentrationFactor(params.walletHoldingNvc);
  if (params.walletHoldingNvc >= NovaPolicy.maxWalletHoldingNvc) {
    return { rewardNvc: 0, wealthConcentrationFactor: wealthFactor, multiplier: 0 };
  }
  const raw =
    (Math.max(0, params.usefulWorkScore) *
      Math.max(0, Math.min(1, params.uptimeRatio)) *
      Math.max(0, Math.min(1, params.purityScore))) /
    wealthFactor;
  const scaled = Math.round((raw / 100) * 1_000_000) / 1_000_000;
  const maxRemaining = Math.max(0, NovaPolicy.maxWalletHoldingNvc - params.walletHoldingNvc);
  return {
    rewardNvc: Math.min(scaled, maxRemaining),
    wealthConcentrationFactor: wealthFactor,
    multiplier: Number((1 / wealthFactor).toFixed(4)),
  };
}

export function computeQuadraticVotingPower(params: {
  usefulWorkScore: number;
  reputationScore: number;
  hasKyc: boolean;
}): number {
  if (!params.hasKyc || params.usefulWorkScore <= 0 || params.reputationScore <= 0) {
    return 0;
  }
  return Number(Math.sqrt(params.usefulWorkScore * params.reputationScore * 1).toFixed(2));
}

export function isConstitutionalViolation(title: string, description: string): {
  violated: boolean;
  reason: string;
} {
  const text = `${title} ${description}`.toLowerCase();
  const touchesPeg =
    (text.includes('peg') || text.includes('3.14') || text.includes('3.20')) &&
    (text.includes('change') ||
      text.includes('remove') ||
      text.includes('float') ||
      text.includes('depeg') ||
      text.includes('slippage') ||
      text.includes('3.20'));

  const touchesRiba =
    (text.includes('interest') || text.includes('riba') || text.includes('apy') || text.includes('apr')) &&
    !text.includes('0% interest') &&
    !text.includes('zero interest') &&
    !text.includes('riba-free');

  const touchesCap =
    (text.includes('wallet cap') ||
      text.includes('10m') ||
      text.includes('10,000,000') ||
      text.includes('0.01%')) &&
    (text.includes('raise') || text.includes('remove') || text.includes('unlimited') || text.includes('bypass'));

  if (touchesPeg || touchesRiba || touchesCap) {
    return {
      violated: true,
      reason:
        'Constitutional Rule Auto-Reject: Fixed Peg $3.14, RibaGuard 0% Interest, and Max Wallet Cap 0.01% (10M NVC) are non-votable immutable protocol laws.',
    };
  }
  return { violated: false, reason: 'Constitutional Rules preserved.' };
}

export function computeGiniCoefficient(values: number[]): number {
  const clean = values.filter((v) => Number.isFinite(v) && v >= 0).sort((a, b) => a - b);
  const n = clean.length;
  if (n <= 1) return 0;
  const total = clean.reduce((sum, v) => sum + v, 0);
  if (total <= 0) return 0;
  let weightedSum = 0;
  for (let i = 0; i < n; i += 1) {
    weightedSum += (2 * (i + 1) - n - 1) * clean[i];
  }
  const gini = weightedSum / (n * total);
  return Number(Math.max(0, Math.min(1, gini)).toFixed(2));
}



