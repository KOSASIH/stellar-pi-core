export const PI_CONSTANTS = {
  symbol: 'PI',
  totalSupply: 100_000_000_000,
  fixedValueUsd: 3.14,
  transactionFeeUsd: 0.001,
  blockTimeSec: 5,
  collateralRatio: 1.5,
  allowedSources: ['mining', 'rewards', 'contribution_rewards', 'p2p', 'marketplace', 'app'] as const,
  blacklistedSources: ['exchange', 'exchange_wallet_1', 'exchange_wallet_2', 'bought', 'entered', 'unclear'] as const,
  gamblingKeywords: [
    'gambling',
    'casino',
    'bet',
    'lottery',
    'poker',
    'slot',
    'jackpot',
    'dice',
    'roulette',
    'blackjack',
  ] as const,
} as const;

export interface PiTransaction {
  id: string;
  sender: string;
  recipient: string;
  amount: number;
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
  status: 'verified' | 'isolated';
  lastCheckedAt: string;
}

export interface GovernanceRules {
  piExclusivity: 'mandatory';
  ethicalAi: 'bias_free' | 'hyper_transparent';
  founderAccountability: 'zero_tolerance';
  volatileRejection: 'auto_halt';
  noGambling: 'absolute' | 'eternal_ban';
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
  constants: typeof PI_CONSTANTS;
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
