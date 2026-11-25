# Stellar Pi Core — Ecosystem Console

> **Not a Coin to Trade. A Currency to Use.**

Stellar Pi Core is a stablecoin-only, rule-governed digital currency platform built on the **Stellar Consensus Protocol (SCP)**. It eliminates crypto volatility, exchange speculation, gambling, whale domination, and wasteful Proof-of-Work mining.

## Core Identity

- **Name**: Stellar Pi Core
- **Currency**: Pi (`PI`)
- **Fixed Peg**: `1 PI = $3.14 USD` (a mathematical identity, $\pi \approx 3.14$, not a market price)
- **Total Supply**: `100,000,000,000 PI` (100B PI)
- **Total Network Value at Peg**: `$314 Billion`
- **Smallest Unit**: Micron Pi (`1 PI = 1,000,000 µπ`, e.g., `0.286624 PI = 286,624 µπ`)
- **Collateral Target**: `1.5x` collateral ratio for long-term trust
- **Consensus & Mining**: Stellar Consensus Protocol (SCP), low energy, mobile phone mining with `1 Person = 1 KYC Account` anti-whale fair distribution
- **Auditability**: SHA-256 Immutable Audit Trail Logger

---

## Why Stellar Pi Core Cannot Be Copied

Code alone does not create an unassailable monetary network. Stellar Pi Core is protected by five structural moats:

1. **Moat 1 — Community**: 60M+ KYC Pioneers mining for 6 years. Code can be copied in 1 minute, community cannot.
2. **Moat 2 — Trust**: Gambling-free, speculation-free, exchange-free. Clean currency.
3. **Moat 3 — Identity**: `$3.14` is Pi's mathematical identity. Copying `$3.14` promotes us.
4. **Moat 4 — Fair Distribution**: 1 Person = 1 Account. Whales cannot buy dominance.
5. **Moat 5 — AHI AI**: AI trained on real Pioneer transaction data. No data, no AI.

### Moat 6 - Riba-Free: The Ethical Moat

Stellar Pi Core is 0% Interest. No APY, no lending interest, no yield farming. This makes it trusted by 2 Billion Muslims and all ethical users worldwide. Competitors cannot copy this without destroying their own profit model based on interest.

---

## Architecture & Modules

- **Shared Policy (`shared/piPolicy.ts`)**: Defines `PiPolicy` constants (`fixedValueUsd: 3.14`, `totalSupply: 100000000000`, `collateralRatio: 1.5`, `micronPiPerPi: 1000000`, `noRiba`, `ribaPolicy`, `shariaCompliant`, `ribaKeywords`, `bannedFinancialModels`, allowed/blacklisted sources, gambling keywords) and `formatMicronPi` / `formatUsd` helpers.
- **PiValuePolicy (`server.ts`)**: Accepts `reportedValueUsd === 3.14`; deviations are flagged for community vote via democratic governance rather than arbitrary instant bans.
- **PiPurityEnforcer (`server.ts`)**: Rejects blacklisted sources (`exchange`, `bought`), gambling keywords (`casino`, `gambling`, `betting`, `jackpot`, `slot`, `poker`, `lottery`), and non-`PI` settlement assets.
- **RibaGuard AI (`server.ts`)**: Scans transaction memos, app specifications, and categories for Riba / interest / APY / yield farming models and enforces 0% interest across the ecosystem.
- **AHI AI Filter (`server.ts`)**: Evaluates every transaction across origin source, memo compliance, peg identity, and sender history while maintaining `aiHealthScore`.
- **Global PI Oracle & MainnetGovernor (`server.ts`)**: Tracks regional oracle nodes (`Asia-Pacific`, `Europe`, `North America`), flags deviations for community vote, audits ecosystem readiness, and gates Mainnet launch.
- **Ecosystem Console (`client/src/App.tsx`)**: React + TypeScript + Tailwind CSS dashboard featuring five live KPI cards, Stablecoin & AHI AI Filter, Autonomous App Builder, Oracle & Mainnet Governor, and SHA-256 Immutable Audit Trail.

---

## API Endpoints

- `GET /api/ecosystem` — Full ecosystem snapshot (constants, metrics, `ribaBlockedTransactions`, `ribaPolicy`, transactions, apps, oracle nodes, audit log)
- `POST /api/riba/check` — RibaGuard AI check for `{ memo, spec }` returning `{ isRiba, reason }`
- `POST /api/pi/transaction` — Submit and validate a PI transaction through AHI AI, `RibaGuard AI`, `PiValuePolicy`, and `PiPurityEnforcer`
- `POST /api/apps/generate` — Generate and deploy a PI-exclusive, gambling-free internal app
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

Open `http://localhost:3000` to access the Stellar Pi Core — Ecosystem Console.
