> ⚠️ Independent Simulation Project - Not affiliated with Pi Core Team. Pi Stablecoin is a research concept, not an official asset.

# Stellar Pi Core - Pi Stablecoin Simulation

This repository is a research fork of Stellar Core, modified to simulate how Pi could work as a stablecoin with transparent, rule-based governance.

This is NOT Pi Network mainnet. This is a simulation for developers and researchers.

**Simulation Value:** $314.159 (fixed for testing only, NOT a market price)

## What This Project Simulates

- **Pi Stablecoin Value:** A fixed-value model where all nodes in the simulation agree on one value, instead of market speculation.
- **Pi-Only Ecosystem:** Apps in this simulation only accept Pi from allowed sources: mining, contribution rewards, and P2P.
- **Oracle Network:** 3-region oracle simulation (Asia-Pacific, Europe, North America) to check value consistency.
- **Transaction Validator:** Validates transactions based on ecosystem rules.
- **Ecosystem Console:** Web dashboard to monitor nodes, apps, and oracle health.

## Features (v0.1.0)

- Pi Stablecoin Manager for simulated transactions
- Transaction Validator (`transaction_validator.cpp`)
- Value Synchronizer (`value_synchronizer.cpp`)
- Oracle Health Monitor
- Ecosystem Console Dashboard

## Installation

1. Clone the repo:
   `git clone https://github.com/KOSASIH/stellar-pi-core.git`
2. Install dependencies:
   `pip install -r requirements.txt`
3. Run deployment (simulation):
   `python src/hyper_core/ultimate_deployment_script.py`

## Compliance Rules in Simulation

- Stablecoin-Only: Only Pi from allowed sources
- No Gambling: Gambling apps are rejected in simulation
- Transparent Governance: Rules are open-source and auditable

## Roadmap

- **v0.1.0 (Done):** First simulation release
- **v0.2.0 (Next):** Change Value Synchronizer from "force agreement" to "voting agreement"
- **v0.3.0:** Change permanent ban to freeze + appeal system

## Disclaimer

This is a simulation. Do not use on mainnet with real assets. This is not financial advice.
