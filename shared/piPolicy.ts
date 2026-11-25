export const PiPolicy = {
  name: 'Stellar Pi Core',
  tagline: 'Not a Coin to Trade. A Currency to Use.',
  symbol: 'PI',
  fixedValueUsd: 3.14,
  totalSupply: 100_000_000_000,
  networkValueAtPegUsd: 314_000_000_000,
  collateralRatio: 1.5,
  micronPiPerPi: 1_000_000,
  transactionFeeUsd: 0.001,
  blockTimeSec: 5,
  consensus: 'Stellar Consensus Protocol (SCP)',
  piExclusivity: 'PI Only',
  noGambling: 'Strictly Enforced',
  ethicalAi: 'AHI AI Active',
  founderAccountability: 'Community Governed',
  noRiba: 'Strictly Forbidden - Zero Interest',
  ribaPolicy: '0% Interest - No Lending With Interest - No Staking Yield - No APY',
  shariaCompliant: 'Halal - Riba-Free - Gharar-Free',
  allowedSources: ['mining', 'contribution_rewards', 'p2p', 'marketplace', 'app'] as const,
  blacklistedSources: ['exchange', 'bought'] as const,
  gamblingKeywords: ['casino', 'gambling', 'betting', 'jackpot', 'slot', 'poker', 'lottery'] as const,
  ribaKeywords: [
    'interest',
    'riba',
    'apy',
    'apr',
    'yield',
    'staking reward',
    'lending interest',
    'loan interest',
    'fixed return',
    'profit sharing interest',
    'deposit interest',
    'borrow interest',
    'leverage',
    'margin interest',
    'bunga',
    'rentenir',
  ] as const,
  bannedFinancialModels: [
    'lending_with_interest',
    'staking_apy',
    'yield_farming',
    'leveraged_trading',
    'interest_bearing_savings',
  ] as const,
} as const;

export const PI_CONSTANTS = PiPolicy;

export function formatMicronPi(piAmount: number): string {
  const micron = Math.round(piAmount * PiPolicy.micronPiPerPi);
  return `${micron.toLocaleString()} µπ`;
}

export function formatUsd(amount: number): string {
  return `$${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export interface PiTransaction {
  id: string;
  sender: string;
  recipient: string;
  amount: number;
  micronPi: number;
  source: string;
  memo: string;
  reportedValueUsd: number;
  status: 'accepted' | 'rejected';
  reason: string;
  ribaRejected?: boolean;
  purityScore: number;
  hash: string;
  timestamp: string;
}

export interface PiAppRecord {
  id: string;
  name: string;
  category: string;
  description: string;
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
  piExclusivity: string;
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

export interface EcosystemSnapshot {
  constants: typeof PiPolicy;
  mainnetLaunched: boolean;
  complianceBreached: boolean;
  aiHealthScore: number;
  unethicalIncidents: number;
  ribaBlockedTransactions: number;
  ribaPolicy: string;
  rules: GovernanceRules;
  metrics: {
    totalTransactions: number;
    acceptedTransactions: number;
    rejectedTransactions: number;
    activeApps: number;
    verifiedOracleNodes: number;
    isolatedOracleNodes: number;
  };
  transactions: PiTransaction[];
  apps: PiAppRecord[];
  oracleNodes: OracleNode[];
  auditLog: AuditEntry[];
}
