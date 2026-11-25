# Stellar Nova Core — Ecosystem Console

> Born From a Supernova. Not a Coin to Trade. A Currency to Use.

Stellar Nova Core is a living, self-learning, self-healing, self-governing stablecoin ecosystem built on the **Stellar Consensus Protocol (SCP)**. It eliminates crypto volatility, exchange speculation, gambling, riba (interest/usury), whale domination, and wasteful Proof-of-Work mining.

## Rebrand Note

Formerly Stellar Pi Core (PI). Now fully independent as Stellar Nova Core (NVC). Same $3.14 peg, new galactic identity.

## Core Identity

- **Project Name**: Stellar Nova Core
- **Coin Name**: Nova Core Coin (`NVC`)
- **Fixed Peg**: `1 NVC = $3.14 USD` (a mathematical identity, `NVC = 3.14`, not a market price)
- **Total Supply**: `100,000,000,000 NVC` (100B NVC)
- **Total Network Value at Peg**: `$314 Billion`
- **Smallest Unit**: Micron Nova (`1 NVC = 1,000,000 µNVC`, e.g., `0.286624 NVC = 286,624 µNVC`)
- **Collateral Target**: `1.5x` collateral ratio (`$471B` real-economy Halal reserves) for long-term trust
- **Consensus & Mining**: Stellar Consensus Protocol (SCP), low energy, mobile phone mining with `1 Person = 1 KYC Account` anti-whale fair distribution
- **Auditability**: SHA-256 Immutable Audit Trail Logger

---

## Why Stellar Nova Core Cannot Be Copied

Code alone cannot replicate a trusted monetary network. Stellar Nova Core is protected by **6 Moats**:

1. **Moat 1 — Community**: Millions of KYC citizens mining fairly. Code can be copied in 1 minute, community cannot.
2. **Moat 2 — Trust**: Gambling-free, speculation-free, exchange-free. Clean currency.
3. **Moat 3 — Identity**: `$3.14 = NVC` is Nova Core's mathematical identity. Copying `$3.14` promotes us.
4. **Moat 4 — Fair Distribution**: 1 Person = 1 Account. Whales cannot buy dominance.
5. **Moat 5 — AHI AI**: AI trained on real citizen transaction data. No data, no AI.
6. **Moat 6 — Riba-Free**: 0% Interest — Trusted by 2B Muslims + Ethical Users worldwide. Competitors cannot copy this without destroying their own profit model based on interest.

---

## Why Nova Core Cannot Be Copied - Hyper-Intelligence Moat

Stellar Nova Core is governed by **NovaHyperMind** (`server/hypermind.ts`), a central intelligence orchestrating **7 Hyper-Intelligence Modules**:

1. **Oracle Predictive Shield (Anti-Manipulation)**: Monitors regional oracle nodes in real time, detects multi-node collusion drift before manipulation succeeds, freezes collusion patterns, and alerts the Governor.
2. **Anti-Whale & Anti-Sybil HyperGuard**: Caps single-wallet holdings at `0.01%` of total supply (`10,000,000 NVC`), catches split-transaction accumulation, and blocks Sybil multi-accounts via 1-KYC-1-Device binding.
3. **Anti-Scam & Anti-Rug HyperScanner**: Scans every App Builder specification for rug pulls, honeypots, guaranteed-profit traps, presale scams, and private-key stealers—rejecting malicious apps and permanently banning creators.
4. **Hyper-Compliance Engine (Riba + Gambling + Gharar + Halal)**: Extends RibaGuard AI (0% interest) with Gharar (excessive uncertainty like 100x leverage, futures, mystery-box gambling) and expanded Maysir (gambling) detection, returning both technical English and plain-language explanations.
5. **Self-Healing Network AI**: Automatically restores drifted or offline oracle nodes and promotes standby Citizen nodes in `<1s` to sustain `99.99%` network health.
6. **Predictive Governance AI**: Forecasts community vote outcomes using whale-proof `1 Person = 1 Vote + Reputation Score` rather than coin-weighted oligarchy.
7. **Hyper-Economic Stabilizer ($3.14 Guardian)**: Locks internal settlement at `$3.14`, flags non-compliant external prices for community vote, and prevents external market volatility from infecting the Nova Core economy.

> Competitors can copy code. They cannot copy 6 years of Pioneer data + HyperMind that learns from it every second. To copy Nova Core, you must copy its brain, its community, and its history. That is impossible.

---

## API Endpoints

- `GET /api/ecosystem` — Full ecosystem snapshot (including `hyperMindStatus`, `threatsBlocked`, `networkHealth`, `whaleProof`, `scamBlocked`, `stabilizerStatus`, `hyperModules`, `hyperMindLog`, `citizens`, `proposals`, `collateralReserves`)
- `GET /api/hyper/oracle-shield` — Oracle Predictive Shield status (`?simulate=true` tests collusion prediction & self-healing)
- `POST /api/hyper/whale-check` — Anti-Whale & Anti-Sybil HyperGuard check (`{ wallet, amount, deviceFingerprint? }`)
- `POST /api/hyper/compliance-check` — Hyper-Compliance & Anti-Scam HyperScanner check (`{ memo, spec }`)
- `POST /api/hyper/governance/predict` — Predictive Governance AI vote forecast (`{ proposal }`)
- `POST /api/hyper/self-heal` — Trigger Self-Healing Network AI restoration
- `POST /api/nova/transaction` — Submit and validate an NVC transaction through `NovaHyperMind`
- `POST /api/riba/check` — RibaGuard AI check for `{ memo, spec }`
- `POST /api/apps/generate` — Generate and deploy an NVC-exclusive, scam-free, gambling-free, riba-free app
- `POST /api/apps/:id/halt` — Halt or resume a deployed ecosystem app
- `POST /api/oracle/verify` — Verify or simulate value deviation on a regional oracle node
- `POST /api/citizens/register` — Onboard a 1-KYC Citizen with Anti-Sybil device binding
- `POST /api/citizens/mine` — Issue a low-energy Mobile SCP mining reward in NVC and Micron Nova (`µNVC`)
- `POST /api/governance/proposals` — Create a compliance-screened 1-Person = 1-Vote community proposal
- `POST /api/governance/proposals/:id/vote` — Cast a 1-KYC Citizen ballot (`yes` or `no`)
- `GET /api/collateral/proof` — Audited 1.5x real-economy Halal reserve proof breakdown
- `POST /api/marketplace/listings` — Publish a compliance-screened Real-Economy or Halal Mudarabah NVC listing
- `POST /api/marketplace/buy` — Settle a marketplace item using a verified 1-KYC Citizen NVC wallet
- `GET /api/audit/verify` — Cryptographically verify all SHA-256 audit log entries
- `POST /api/ecosystem/reset` — Reset persisted disk state (`.nova-data/ecosystem-state.json`) cleanly to baseline
- `POST /api/governance/audit` — Run `MainnetGovernor` ecosystem compliance audit
- `POST /api/governance/mainnet-launch` — Execute `MainnetGovernor` launch when all oracle nodes align at `$3.14`

---

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:3000` to access the Stellar Nova Core — Ecosystem Console.
