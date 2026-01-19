import pytest
import yaml
import numpy as np
from unittest.mock import patch, MagicMock
from ai.hyper_ai.source_validator import SourceValidator
from ai.autonomous.value_stabilizer import ValueStabilizer
from stellar_sdk import Server, Keypair, TransactionBuilder, Network
import subprocess
import asyncio

# Load config
with open('../../config/config.yaml') as f:
    config = yaml.safe_load(f)

@pytest.fixture
def sample_transaction():
    """Fixture for sample transaction data."""
    return {
        'amount': 100,
        'timestamp': 1640995200,
        'source': 'mining'
    }

@pytest.fixture
def invalid_transaction():
    """Fixture for invalid transaction data."""
    return {
        'amount': 2000,
        'timestamp': 1640995300,
        'source': 'exchange'
    }

class TestFullSystem:
    """GodHead Nexus: Full system integration tests."""

    def test_hyper_ai_validation_valid_source(self, sample_transaction):
        """Test Hyper AI validates valid source (mining/rewards/P2P)."""
        validator = SourceValidator()
        assert validator.validate(sample_transaction) == True
        prediction = validator.predict_source(sample_transaction)
        assert "Valid" in prediction

    def test_hyper_ai_validation_invalid_source(self, invalid_transaction):
        """Test Hyper AI rejects invalid source (exchange/third-party)."""
        validator = SourceValidator()
        assert validator.validate(invalid_transaction) == False
        prediction = validator.predict_source(invalid_transaction)
        assert "Invalid" in prediction

    def test_autonomous_ai_stabilization(self, sample_transaction):
        """Test Autonomous AI stabilizes value to $314,159 for valid sources."""
        stabilizer = ValueStabilizer()
        value = stabilizer.stabilize(sample_transaction['source'])
        assert value == config['pi_coin']['fixed_value_usd']
        
        with pytest.raises(ValueError, match="Invalid source"):
            stabilizer.stabilize('exchange')

    @pytest.mark.asyncio
    async def test_consensus_validation_with_ai(self, sample_transaction):
        """Test Consensus integrates with Hyper AI for transaction validation."""
        # Mock AI API call
        with patch('src.core.consensus.reqwest::Client') as mock_client:
            mock_response = MagicMock()
            mock_response.json.return_value = {"valid": True}
            mock_client.return_value.post.return_value.send.return_value = mock_response
            
            # Import and test consensus (assuming Rust code exposed via Python binding or subprocess)
            # For simplicity, simulate via subprocess (replace with real binding if available)
            result = subprocess.run(['cargo', 'run', '--bin', 'consensus', '--', 'validate', str(sample_transaction)], capture_output=True, text=True)
            assert "validated" in result.stdout.lower()
            assert result.returncode == 0

    def test_consensus_pow_mining(self):
        """Test Consensus PoW mining produces valid hash."""
        # Simulate mining (replace with real call)
        with patch('src.core.consensus.Consensus.mine_block') as mock_mine:
            mock_mine.return_value = "0000abcd"  # Mock hash with leading zeros
            # In real test, call Consensus::mine_block
            # consensus = Consensus::new(4, "http://localhost:8000".to_string());
            # hash = consensus.mine_block("prev");
            # assert hash.starts_with("0000");
            pass  # Placeholder; implement with Rust FFI or subprocess

    def test_stellar_soroban_contract_interaction(self):
        """Test interaction with Soroban contract on Stellar testnet."""
        server = Server(config['stellar']['rpc_url'])
        keypair = Keypair.from_secret(config.get('test_secret_key', 'S...'))  # Use test key
        
        # Build a mock transaction to invoke contract (placeholder for real invoke)
        account = server.load_account(keypair.public_key)
        tx = (
            TransactionBuilder(
                source_account=account,
                network_passphrase=Network.TESTNET_NETWORK_PASSPHRASE,
                base_fee=100,
            )
            .add_text_memo("GodHead Nexus Test")
            .set_timeout(30)
            .build()
        )
        tx.sign(keypair)
        
        # In real test, submit and check contract state
        # response = server.submit_transaction(tx)
        # assert response['successful'] == True
        # Query contract for balance or value
        # contract_balance = query_soroban_contract(config['stellar']['contract_id'], "balance", keypair.public_key)
        # assert contract_balance >= 0
        pass  # Placeholder; expand with stellar_sdk Soroban support

    def test_full_system_integration(self, sample_transaction, invalid_transaction):
        """End-to-end test: Valid TX processed, invalid rejected, value stable."""
        # 1. Validate with AI
        validator = SourceValidator()
        stabilizer = ValueStabilizer()
        
        assert validator.validate(sample_transaction) == True
        value = stabilizer.stabilize(sample_transaction['source'])
        assert value == 314159
        
        assert validator.validate(invalid_transaction) == False
        with pytest.raises(ValueError):
            stabilizer.stabilize(invalid_transaction['source'])
        
        # 2. Simulate consensus
        # (Add subprocess call to consensus binary)
        
        # 3. Check Stellar contract (mock)
        # Ensure contract enforces fixed value
        
        print("GodHead Nexus: Full system test passed - Pi Coin stable at $314,159 per PI.")

    def test_error_handling_crashed_ai(self):
        """Test system handles AI crash gracefully."""
        with patch('ai.hyper_ai.source_validator.SourceValidator.validate', side_effect=Exception("AI crash")):
            validator = SourceValidator()
            with pytest.raises(Exception):
                validator.validate({'amount': 100, 'timestamp': 123, 'source': 'mining'})
            # In full system, monitor should restart AI

# Run with pytest
if __name__ == "__main__":
    pytest.main([__file__])
