# Stellar Nova Core — Ecosystem Console

> Born From a Supernova. Not a Coin to Trade. A Currency to Use.

Stellar Nova Core is a stablecoin-only, rule-governed digital currency platform built on the **Stellar Consensus Protocol (SCP)**. It eliminates crypto volatility, exchange speculation, gambling, riba (interest/usury), whale domination, and wasteful Proof-of-Work mining.

## Rebrand Note

Formerly Stellar Pi Core (PI). Now fully independent as Stellar Nova Core (NVC). Same $3.14 peg, new galactic identity.

## Core Identity

- **Project Name**: Stellar Nova Core
- **Coin Name**: Nova Core Coin (`NVC`)
- **Fixed Peg**: `1 NVC = $3.14 USD` (a mathematical identity, `NVC = 3.14`, not a market price)
- **Total Supply**: `100,000,000,000 NVC` (100B NVC)
- **Total Network Value at Peg**: `$314 Billion`
- **Smallest Unit**: Micron Nova (`1 NVC = 1,000,000 µNVC`, e.g., `0.286624 NVC = 286,624 µNVC`)
- **Collateral Target**: `1.5x` collateral ratio for long-term trust
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

## Architecture & Modules

- **Shared Policy (`shared/novaPolicy.ts`)**: Defines `NovaPolicy` constants (`fixedValueUsd: 3.14`, `totalSupply: 100000000000`, `collateralRatio: 1.5`, `micronNovaPerNvc: 1000000`, `noRiba`, `noGambling`, `ethicalAi`, `allowedSources`, `blacklistedSources`, `gamblingKeywords`, `ribaKeywords`) and `formatMicronNova`, `nvcToUsd`, `isValidNovaValue`, `formatUsd` helpers.
- **NovaValuePolicy (`server.ts`)**: Accepts `reportedValueUsd === 3.14`; deviations are flagged for community vote via democratic governance rather than arbitrary instant bans.
- **NovaPurityEnforcer (`server.ts`)**: Rejects blacklisted sources (`exchange`, `bought`), gambling keywords (`casino`, `gambling`, `betting`, `jackpot`, `slot`, `poker`, `lottery`), and non-`NVC` settlement assets.
- **RibaGuard AI (`server.ts`)**: Scans transaction memos, app specifications, and categories for Riba / interest / APY / yield farming models and enforces 0% interest across the ecosystem.
- **AHI AI Filter (`server.ts`)**: Evaluates every NVC transaction across origin source, memo compliance, peg identity, and sender history while maintaining `aiHealthScore`.
- **Global NOVA Oracle & MainnetGovernor (`server.ts`)**: Tracks regional oracle nodes (`ORACLE-US-01`, `ORACLE-ID-01`, `ORACLE-EU-01`), flags deviations for community vote, audits ecosystem readiness, and gates Mainnet launch.
- **Ecosystem Console (`client/src/App.tsx`)**: React + TypeScript + Tailwind CSS dashboard featuring five live KPI cards, Stablecoin & AHI AI Filter, Autonomous App Builder, Oracle & Mainnet Governor, and SHA-256 Immutable Audit Trail.

---

## API Endpoints

- `GET /api/ecosystem` — Full ecosystem snapshot (constants, metrics, `ribaBlockedTransactions`, `ribaPolicy`, transactions, apps, oracle nodes, audit log)
- `POST /api/nova/transaction` — Submit and validate an NVC transaction through AHI AI, `RibaGuard AI`, `NovaValuePolicy`, and `NovaPurityEnforcer`
- `POST /api/riba/check` — RibaGuard AI check for `{ memo, spec }` returning `{ isRiba, reason }`
- `POST /api/apps/generate` — Generate and deploy an NVC-exclusive, gambling-free, riba-free internal app
- `POST /api/apps/:id/halt` — Halt or resume a deployed ecosystem app
- `POST /api/oracle/verify` — Verify or simulate value deviation on a regional oracle node
- `POST /api/governance/audit` — Run `MainnetGovernor` ecosystem compliance audit
- `POST /api/governance/mainnet-launch` — Execute `MainnetGovernor` launch when all oracle nodes align at `$3.14`

---

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:3000` to access the Stellar Nova Core — Ecosystem Console.
