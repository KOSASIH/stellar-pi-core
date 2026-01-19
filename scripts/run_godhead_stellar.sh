#!/bin/bash

# GodHead Nexus: Run Stellar Pi Blockchain System
# This script deploys Soroban contract, starts AI modules, and runs consensus for live Pi Coin stability at $314,159 per PI.

set -e  # Exit on error

# Configuration
NETWORK="testnet"  # Change to "mainnet" for live deployment
SECRET_KEY="<your-secret-key>"  # Replace with your Stellar secret key
RPC_URL="https://soroban-testnet.stellar.org"  # Update for mainnet if needed
CONFIG_FILE="../../config/config.yaml"
AI_API_PORT=8000
LOG_FILE="godhead_nexus.log"

# Logging function
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') [GodHead Nexus]: $1" | tee -a $LOG_FILE
}

# Check dependencies
check_deps() {
    log "Checking dependencies..."
    command -v soroban >/dev/null 2>&1 || { log "Soroban CLI not found. Install with 'cargo install soroban-cli'."; exit 1; }
    command -v python3 >/dev/null 2>&1 || { log "Python3 not found."; exit 1; }
    command -v cargo >/dev/null 2>&1 || { log "Cargo not found."; exit 1; }
    command -v jq >/dev/null 2>&1 || { log "jq not found. Install it."; exit 1; }
    log "Dependencies OK."
}

# Deploy Soroban contract
deploy_contract() {
    log "Deploying PiStableCoin contract on Stellar $NETWORK..."
    cd ../contracts
    soroban contract build --package pi_stable_coin
    CONTRACT_ID=$(soroban contract deploy --network $NETWORK --source $SECRET_KEY --wasm target/wasm32-unknown-unknown/release/pi_stable_coin.wasm | jq -r '.contractId')
    if [ -z "$CONTRACT_ID" ]; then
        log "Deployment failed."; exit 1;
    fi
    log "Contract deployed with ID: $CONTRACT_ID"
    
    # Update config.yaml with contract ID
    sed -i "s/contract_id: .*/contract_id: \"$CONTRACT_ID\"/" $CONFIG_FILE
    cd ../scripts
}

# Start Hyper AI API
start_ai() {
    log "Starting Hyper AI API on port $AI_API_PORT..."
    cd ../ai/hyper_ai
    python3 -c "
import uvicorn
from fastapi import FastAPI
from source_validator import SourceValidator

app = FastAPI()
validator = SourceValidator()

@app.post('/validate')
async def validate_source(data: dict):
    is_valid = validator.validate(data)
    return {'valid': is_valid}

uvicorn.run(app, host='0.0.0.0', port=$AI_API_PORT)
" &
    AI_PID=$!
    log "Hyper AI API started (PID: $AI_PID)"
    cd ../../scripts
}

# Start Autonomous AI
start_autonomous_ai() {
    log "Starting Autonomous AI for value stabilization..."
    cd ../ai/autonomous
    python3 value_stabilizer.py &
    AUTONOMOUS_PID=$!
    log "Autonomous AI started (PID: $AUTONOMOUS_PID)"
    cd ../../scripts
}

# Run Consensus Core
run_consensus() {
    log "Running Consensus Core with PoW and AI integration..."
    cd ../src
    cargo run --bin consensus &
    CONSENSUS_PID=$!
    log "Consensus Core started (PID: $CONSENSUS_PID)"
    cd ../scripts
}

# Monitor and stabilize
monitor_system() {
    log "GodHead Nexus: System live. Monitoring Pi Coin at fixed $314,159 per PI..."
    while true; do
        # Check if processes are running
        if ! kill -0 $AI_PID 2>/dev/null; then log "Hyper AI crashed. Restarting..."; start_ai; fi
        if ! kill -0 $AUTONOMOUS_PID 2>/dev/null; then log "Autonomous AI crashed. Restarting..."; start_autonomous_ai; fi
        if ! kill -0 $CONSENSUS_PID 2>/dev/null; then log "Consensus crashed. Restarting..."; run_consensus; fi
        
        # Placeholder: Query Stellar for Pi Coin value stability
        # In production, add API calls to check contract state
        sleep 60  # Monitor every minute
    done
}

# Cleanup on exit
cleanup() {
    log "Shutting down GodHead Nexus..."
    kill $AI_PID $AUTONOMOUS_PID $CONSENSUS_PID 2>/dev/null
    exit 0
}
trap cleanup SIGINT SIGTERM

# Main execution
main() {
    check_deps
    deploy_contract
    start_ai
    start_autonomous_ai
    run_consensus
    monitor_system
}

main
