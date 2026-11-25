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
  allowedSources: ['mining', 'contribution_rewards', 'p2p', 'marketplace', 'app'] as const,
  blacklistedSources: ['exchange', 'bought'] as const,
  gamblingKeywords: ['casino', 'gambling', 'betting', 'jackpot', 'slot', 'poker', 'lottery'] as const,
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
