#!/bin/bash
# Deploy to Pi Mainnet

if [ "$1" = "mainnet" ]; then
    echo "Deploying to Pi Mainnet..."
    # Integrate with deploy_script.sh
    soroban contract deploy --network mainnet --wasm blockchain_stellar_integration/stablecoin_smart_contract.rs
    echo "Mainnet opened fully!"
fi
