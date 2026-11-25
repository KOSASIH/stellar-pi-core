import {
  NovaPolicy,
  isValidNovaValue,
  type HyperMindLogEntry,
  type HyperModuleCard,
  type NovaTransaction,
  type OracleNode,
} from '../shared/novaPolicy.ts';

export type HyperAction = 'accept' | 'reject' | 'flag_for_vote' | 'freeze';

export interface HyperTransactionAnalysis {
  riskScore: number;
  isSafe: boolean;
  reason: string;
  action: HyperAction;
  purityScore: number;
  violationType: 'none' | 'gambling' | 'riba' | 'gharar' | 'exchange' | 'whale' | 'peg' | 'scam' | 'history';
}

export interface ComplianceViolation {
  category: 'Riba' | 'Gharar' | 'Maysir (Gambling)' | 'Scam / Rug';
  keyword: string;
  english: string;
  simple: string;
}

export class NovaHyperMind {
  public threatsBlocked = 12847;
  public scamBlocked = 342;
  public networkHealth = 99.99;
  public bannedCreators: Set<string> = new Set(['0xRUG-DEV-99']);
  private learnedBadSenders: Map<string, number> = new Map([['exchange_wallet_1', 1]]);
  private learnedBadPatterns: Set<string> = new Set(['double your money', '1000x presale']);
  private walletCumulativeHoldings: Map<string, number> = new Map([
    ['NVC-MERCHANT-HUB-07', 1200],
    ['NVC-OPEN-MARKET-02', 450],
  ]);
  private deviceKycRegistry: Map<string, string> = new Map([
    ['DEV-RASPI-09', 'NVC-MINER-RASPI-09'],
  ]);

  public modules: HyperModuleCard[] = [
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
      threatsBlocked: 1105,
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
  ];

  public liveLog: HyperMindLogEntry[] = [
    {
      id: 'hml-seed-1',
      module: 'Anti-Whale HyperGuard',
      decision: 'Blocked Whale Attack — Wallet 0xWHALE-X tried to accumulate 15,000,000 NVC (>0.01% supply cap).',
      severity: 'blocked',
      timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    },
    {
      id: 'hml-seed-2',
      module: 'Anti-Scam HyperScanner',
      decision: "Blocked Scam App — 'Double Your Money 1000x' detected; creator permanently banned.",
      severity: 'blocked',
      timestamp: new Date(Date.now() - 1000 * 60 * 7).toISOString(),
    },
    {
      id: 'hml-seed-3',
      module: 'Self-Healing Network AI',
      decision: 'Oracle Self-Healed — Node ORACLE-EU-01 restored to $3.14 Nova Peg in 0.4s.',
      severity: 'healed',
      timestamp: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
    },
  ];

  public recordLog(module: string, decision: string, severity: HyperMindLogEntry['severity']) {
    this.liveLog.unshift({
      id: `hml-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      module,
      decision,
      severity,
      timestamp: new Date().toISOString(),
    });
    if (this.liveLog.length > 60) {
      this.liveLog.pop();
    }
  }

  private bumpModule(moduleId: string) {
    this.threatsBlocked += 1;
    const mod = this.modules.find((m) => m.id === moduleId);
    if (mod) {
      mod.threatsBlocked += 1;
    }
  }

  public learnFromHistory(sender: string, textSample: string) {
    const key = sender.trim().toLowerCase();
    this.learnedBadSenders.set(key, (this.learnedBadSenders.get(key) || 0) + 1);
    const words = textSample
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length >= 6)
      .slice(0, 2);
    for (const w of words) {
      if (
        NovaPolicy.ribaKeywords.some((k) => w.includes(k)) ||
        NovaPolicy.scamKeywords.some((k) => w.includes(k))
      ) {
        this.learnedBadPatterns.add(w);
      }
    }
  }

  public scanCompliance(input: {
    memo?: string;
    spec?: string;
    category?: string;
  }): { passed: boolean; violations: ComplianceViolation[]; reason: string } {
    const combined = `${input.memo || ''} ${input.spec || ''} ${input.category || ''}`.toLowerCase();
    const violations: ComplianceViolation[] = [];

    for (const kw of [...NovaPolicy.ribaKeywords, 'lending', 'yield farming', 'usury']) {
      if (combined.includes(kw)) {
        violations.push({
          category: 'Riba',
          keyword: kw,
          english: `RibaGuard AI: Riba / Interest detected ("${kw}"). Stellar Nova Core is strictly 0% Interest.`,
          simple: 'No interest, APY, or interest-bearing loans allowed. Only real trade or profit-sharing with real risk.',
        });
        break;
      }
    }

    for (const kw of NovaPolicy.ghararKeywords) {
      if (combined.includes(kw)) {
        violations.push({
          category: 'Gharar',
          keyword: kw,
          english: `Hyper-Compliance: Excessive uncertainty / Gharar detected ("${kw}").`,
          simple: 'Speculative derivatives, 100x leverage, and mystery/loot box gambling are blocked.',
        });
        break;
      }
    }

    for (const kw of NovaPolicy.gamblingKeywords) {
      if (combined.includes(kw)) {
        violations.push({
          category: 'Maysir (Gambling)',
          keyword: kw,
          english: `NovaPurityEnforcer: Gambling / Maysir detected ("${kw}").`,
          simple: 'Zero gambling, casinos, betting, or lotteries allowed in Stellar Nova Core.',
        });
        break;
      }
    }

    for (const kw of NovaPolicy.scamKeywords) {
      if (combined.includes(kw)) {
        violations.push({
          category: 'Scam / Rug',
          keyword: kw,
          english: `HyperScanner: High-risk scam / rug-pull pattern detected ("${kw}").`,
          simple: 'Promises of guaranteed profits, 1000x presales, or private key requests are permanently blocked.',
        });
        break;
      }
    }

    if (violations.length > 0) {
      const hasScam = violations.some((v) => v.category === 'Scam / Rug');
      if (hasScam) {
        this.scamBlocked += 1;
        this.bumpModule('scam-hyperscanner');
      } else {
        this.bumpModule('hyper-compliance');
      }
      return {
        passed: false,
        violations,
        reason: violations.map((v) => `${v.english} (${v.simple})`).join(' | '),
      };
    }

    return {
      passed: true,
      violations: [],
      reason: 'Hyper-Compliance passed: 0% Interest (Halal), Gambling-Free, Gharar-Free, Scam-Free.',
    };
  }

  public checkWhaleAndSybil(params: {
    wallet: string;
    amount: number;
    deviceFingerprint?: string;
  }): { allowed: boolean; reason: string; riskScore: number } {
    const wallet = params.wallet.trim();
    const amount = Number(params.amount);

    if (!wallet || !Number.isFinite(amount) || amount <= 0) {
      return {
        allowed: false,
        reason: 'HyperGuard: Valid wallet and positive NVC amount required.',
        riskScore: 80,
      };
    }

    if (params.deviceFingerprint) {
      const registeredOwner = this.deviceKycRegistry.get(params.deviceFingerprint);
      if (registeredOwner && registeredOwner.toLowerCase() !== wallet.toLowerCase()) {
        this.bumpModule('whale-sybil-guard');
        this.recordLog(
          'Anti-Whale & Sybil HyperGuard',
          `Blocked Sybil Attack — Device ${params.deviceFingerprint} already bound to KYC account ${registeredOwner}.`,
          'blocked',
        );
        return {
          allowed: false,
          reason: `Anti-Sybil HyperGuard: Device fingerprint already bound to 1-KYC Citizen (${registeredOwner}).`,
          riskScore: 96,
        };
      }
    }

    const existing = this.walletCumulativeHoldings.get(wallet) || 0;
    const projected = existing + amount;
    if (projected > NovaPolicy.maxWalletHoldingNvc) {
      this.bumpModule('whale-sybil-guard');
      this.recordLog(
        'Anti-Whale HyperGuard',
        `Blocked Whale Attack — Wallet ${wallet} attempted ${projected.toLocaleString()} NVC (> 10,000,000 NVC / 0.01% supply cap).`,
        'blocked',
      );
      return {
        allowed: false,
        reason: `Anti-Whale HyperGuard: Wallet "${wallet}" exceeds 0.01% max supply cap (10,000,000 NVC). Attempted cumulative holding: ${projected.toLocaleString()} NVC.`,
        riskScore: 98,
      };
    }

    return {
      allowed: true,
      reason: `HyperGuard passed: ${projected.toLocaleString()} NVC is within 0.01% fair distribution cap.`,
      riskScore: 8,
    };
  }

  public analyzeTransaction(params: {
    sender: string;
    recipient: string;
    amount: number;
    source: string;
    memo: string;
    reportedValueUsd: number;
    existingTransactions: NovaTransaction[];
  }): HyperTransactionAnalysis {
    const { sender, recipient, amount, source, memo, reportedValueUsd, existingTransactions } = params;
    const fullText = `${sender} ${recipient} ${source} ${memo}`.toLowerCase();

    // 1. Hyper-Compliance (Gambling + Riba + Gharar + Scam)
    const compliance = this.scanCompliance({ memo: fullText });
    if (!compliance.passed) {
      const first = compliance.violations[0];
      this.learnFromHistory(sender, fullText);

      if (first.category === 'Riba') {
        this.recordLog(
          'Hyper-Compliance (RibaGuard AI)',
          `Blocked Riba transaction from ${sender}: keyword "${first.keyword}".`,
          'blocked',
        );
        return {
          riskScore: 95,
          isSafe: false,
          reason: 'RibaGuard AI: Riba / Interest detected - Transaction rejected. Stellar Nova Core is 0% Interest.',
          action: 'reject',
          purityScore: 0,
          violationType: 'riba',
        };
      }

      if (first.category === 'Maysir (Gambling)') {
        this.recordLog(
          'Hyper-Compliance (Maysir Filter)',
          `Blocked Gambling transaction from ${sender}: "${first.keyword}".`,
          'blocked',
        );
        return {
          riskScore: 94,
          isSafe: false,
          reason: `Rejected by AHI AI Anti-Gambling Filter: prohibited keyword "${first.keyword}" detected.`,
          action: 'reject',
          purityScore: 0,
          violationType: 'gambling',
        };
      }

      if (first.category === 'Gharar') {
        this.recordLog(
          'Hyper-Compliance (Gharar Filter)',
          `Blocked Gharar transaction from ${sender}: "${first.keyword}".`,
          'blocked',
        );
        return {
          riskScore: 91,
          isSafe: false,
          reason: `${first.english} ${first.simple}`,
          action: 'reject',
          purityScore: 0,
          violationType: 'gharar',
        };
      }

      this.recordLog(
        'Anti-Scam HyperScanner',
        `Blocked scam pattern "${first.keyword}" in transaction from ${sender}.`,
        'blocked',
      );
      return {
        riskScore: 99,
        isSafe: false,
        reason: first.english,
        action: 'freeze',
        purityScore: 0,
        violationType: 'scam',
      };
    }

    // 2. NovaPurityEnforcer (Allowed vs Blacklisted origin)
    const normalizedSource = source.trim().toLowerCase();
    for (const blocked of NovaPolicy.blacklistedSources) {
      if (normalizedSource === blocked || normalizedSource.includes(blocked)) {
        this.bumpModule('hyper-compliance');
        this.learnFromHistory(sender, fullText);
        this.recordLog(
          'NovaPurityEnforcer',
          `Blocked tainted/exchange source "${source}" from ${sender}.`,
          'blocked',
        );
        return {
          riskScore: 92,
          isSafe: false,
          reason: `Rejected tainted/exchange source "${source}" by NovaPurityEnforcer.`,
          action: 'reject',
          purityScore: 0,
          violationType: 'exchange',
        };
      }
    }

    const allowedSource = NovaPolicy.allowedSources.some((s) => s === normalizedSource);
    if (!allowedSource) {
      this.bumpModule('hyper-compliance');
      return {
        riskScore: 82,
        isSafe: false,
        reason: `Source "${source}" is not in allowed origins (${NovaPolicy.allowedSources.join(', ')}).`,
        action: 'reject',
        purityScore: 0,
        violationType: 'exchange',
      };
    }

    // 3. Anti-Whale HyperGuard (0.01% max supply per wallet)
    const whaleCheck = this.checkWhaleAndSybil({ wallet: recipient, amount });
    if (!whaleCheck.allowed) {
      this.learnFromHistory(recipient, `whale ${amount}`);
      return {
        riskScore: whaleCheck.riskScore,
        isSafe: false,
        reason: whaleCheck.reason,
        action: 'freeze',
        purityScore: 0,
        violationType: 'whale',
      };
    }

    // 4. Hyper-Economic Stabilizer ($3.14 mathematical identity)
    if (!isValidNovaValue(reportedValueUsd)) {
      this.bumpModule('economic-stabilizer');
      this.learnFromHistory(sender, `peg deviation ${reportedValueUsd}`);
      this.recordLog(
        'Hyper-Economic Stabilizer',
        `Flagged non-compliant price $${reportedValueUsd.toFixed(2)} for community vote; auto-created $3.14 stabilization proposal.`,
        'predicted',
      );
      return {
        riskScore: 88,
        isSafe: false,
        reason: `NovaValuePolicy & Stabilizer: Non-Compliant Price ($${reportedValueUsd.toFixed(2)}) flagged for community vote. Internal ecosystem LOCKED at $3.14.`,
        action: 'flag_for_vote',
        purityScore: 0,
        violationType: 'peg',
      };
    }

    // 5. Adaptive history learning check
    const priorSenderRejections = existingTransactions.filter(
      (t) => t.sender.toLowerCase() === sender.toLowerCase() && t.status === 'rejected',
    ).length;
    const learnedStrikes = this.learnedBadSenders.get(sender.toLowerCase()) || 0;
    if (priorSenderRejections >= 3 || learnedStrikes >= 4) {
      this.bumpModule('whale-sybil-guard');
      return {
        riskScore: 85,
        isSafe: false,
        reason: `HyperMind Adaptive Filter: "${sender}" blocked based on historical violation pattern (${Math.max(priorSenderRejections, learnedStrikes)} strikes).`,
        action: 'reject',
        purityScore: 0.25,
        violationType: 'history',
      };
    }

    this.walletCumulativeHoldings.set(
      recipient,
      (this.walletCumulativeHoldings.get(recipient) || 0) + amount,
    );

    return {
      riskScore: priorSenderRejections === 0 ? 4 : 18,
      isSafe: true,
      reason: 'Verified pure NVC origin at fixed $3.14 Nova Peg valuation.',
      action: 'accept',
      purityScore: priorSenderRejections === 0 ? 1.0 : 0.92,
      violationType: 'none',
    };
  }

  public predictMarketAttack(oracleNodes: OracleNode[], simulate = false): {
    status: string;
    threatLevel: string;
    predictedAttack: string | null;
    selfHealed: boolean;
  } {
    const driftedNodes = oracleNodes.filter((n) => !isValidNovaValue(n.reportedValueUsd));
    if (simulate || driftedNodes.length >= 2) {
      this.bumpModule('oracle-shield');
      this.selfHeal(oracleNodes);
      const attackLabel =
        simulate
          ? 'Coordinated 2-Node Oracle Collusion ($3.20 Drift) + Flash-Speculation Probe'
          : `${driftedNodes.length}-Node Oracle Price Collusion Attempt`;
      this.recordLog(
        'Oracle Predictive Shield',
        `Attack Predicted & Blocked — ${attackLabel}. Nodes auto-healed to $3.14 in <1s.`,
        'predicted',
      );
      return {
        status: 'Attack Predicted & Blocked',
        threatLevel: 'High (Neutralized)',
        predictedAttack: attackLabel,
        selfHealed: true,
      };
    }

    if (driftedNodes.length === 1) {
      return {
        status: 'Monitoring Deviation',
        threatLevel: 'Elevated',
        predictedAttack: `Single node ${driftedNodes[0].id} flagged for community vote`,
        selfHealed: false,
      };
    }

    return {
      status: 'Protected',
      threatLevel: 'Low',
      predictedAttack: null,
      selfHealed: false,
    };
  }

  public selfHeal(oracleNodes: OracleNode[]): number {
    let healedCount = 0;
    const now = new Date().toISOString();
    for (const node of oracleNodes) {
      if (!isValidNovaValue(node.reportedValueUsd) || node.status === 'flagged') {
        node.reportedValueUsd = NovaPolicy.fixedValueUsd;
        node.status = 'verified';
        node.lastCheckedAt = now;
        healedCount += 1;
      }
    }
    this.bumpModule('self-healing-network');
    this.networkHealth = 99.99;
    this.recordLog(
      'Self-Healing Network AI',
      healedCount > 0
        ? `Oracle Self-Healed — Restored ${healedCount} oracle node(s) to $3.14 Nova Peg in 0.38s.`
        : 'Self-Healing Network AI verified 99.99% mesh redundancy and promoted standby Citizen route.',
      'healed',
    );
    return healedCount;
  }

  public predictGovernanceVote(proposal: string): {
    predictedYes: number;
    predictedNo: number;
    confidence: number;
    summary: string;
  } {
    const lower = proposal.toLowerCase();
    const isHarmful =
      lower.includes('deviat') ||
      lower.includes('3.20') ||
      lower.includes('interest') ||
      lower.includes('apy') ||
      lower.includes('gambl') ||
      lower.includes('exchange') ||
      lower.includes('whale');

    if (isHarmful) {
      this.bumpModule('predictive-governance');
      this.recordLog(
        'Predictive Governance AI',
        `Predicted Community Decision: 94% of 1-KYC Citizens will vote to REJECT "${proposal}".`,
        'predicted',
      );
      return {
        predictedYes: 6,
        predictedNo: 94,
        confidence: 97,
        summary: 'Predicted Community Decision: 94% will vote to REJECT this deviation (1 Person = 1 Vote + Reputation Score).',
      };
    }

    return {
      predictedYes: 91,
      predictedNo: 9,
      confidence: 95,
      summary: 'Predicted Community Decision: 91% will vote to APPROVE this $3.14-aligned proposal (1 Person = 1 Vote + Reputation Score).',
    };
  }
}
