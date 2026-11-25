import fs from 'node:fs';
import path from 'node:path';
import type {
  AuditEntry,
  CitizenAccount,
  CollateralReserveItem,
  GovernanceProposal,
  GovernanceRules,
  HyperMindLogEntry,
  HyperModuleCard,
  MarketplaceListing,
  MarketplaceOrder,
  NovaAppRecord,
  NovaTransaction,
  OracleNode,
} from '../shared/novaPolicy.ts';

export interface PersistedEcosystemData {
  version: number;
  savedAt: string;
  state: {
    mainnetLaunched: boolean;
    complianceBreached: boolean;
    aiHealthScore: number;
    unethicalIncidents: number;
    rules: GovernanceRules;
    transactions: NovaTransaction[];
    apps: NovaAppRecord[];
    oracleNodes: OracleNode[];
    auditLog: AuditEntry[];
    citizens: CitizenAccount[];
    proposals: GovernanceProposal[];
    collateralReserves: CollateralReserveItem[];
    marketplaceListings: MarketplaceListing[];
    marketplaceOrders: MarketplaceOrder[];
  };
  hyperMind: {
    threatsBlocked: number;
    scamBlocked: number;
    networkHealth: number;
    bannedCreators: string[];
    modules: HyperModuleCard[];
    liveLog: HyperMindLogEntry[];
  };
}

const DATA_DIR = path.resolve(process.cwd(), '.nova-data');
const STATE_FILE = path.join(DATA_DIR, 'ecosystem-state.json');

export function loadPersistedData(): PersistedEcosystemData | null {
  try {
    if (!fs.existsSync(STATE_FILE)) return null;
    const raw = fs.readFileSync(STATE_FILE, 'utf8');
    const parsed = JSON.parse(raw) as PersistedEcosystemData;
    if (!parsed || parsed.version !== 1 || !parsed.state || !parsed.hyperMind) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function savePersistedData(data: Omit<PersistedEcosystemData, 'version' | 'savedAt'>): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const payload: PersistedEcosystemData = {
      version: 1,
      savedAt: new Date().toISOString(),
      ...data,
    };
    const tmpFile = `${STATE_FILE}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify(payload, null, 2), 'utf8');
    fs.renameSync(tmpFile, STATE_FILE);
  } catch (err) {
    console.warn('Warning: could not persist Nova Core state:', err);
  }
}

export function clearPersistedData(): void {
  try {
    if (fs.existsSync(STATE_FILE)) {
      fs.unlinkSync(STATE_FILE);
    }
  } catch (err) {
    console.warn('Warning: could not clear Nova Core persisted state:', err);
  }
}
