import pytest
import numpy as np
from unittest.mock import Mock, patch
from stellar_sdk import Server  # Stellar integration
from autonomous_ai_engine import MaximaAutonomousAI  # Import from ai_autonomous_core
from coin_validation_engine import CoinValidationEngine  # Import from stablecoin_enforcement_system
from rejection_algorithm import RejectionAlgorithm  # Import from stablecoin_enforcement_system

# Hyper-tech constants
STABLE_VALUE = 314159
EXCHANGE_SOURCES = ["exchange_wallet_1", "exchange_wallet_2"]

@pytest.fixture
def mock_stellar_server():
    server = Mock(spec=Server)
    server.transactions.return_value.limit.return_value.call.return_value = {
        '_embedded': {
            'records': [
                {'id': 'pi_123', 'source_account': 'mining_wallet', 'amount': str(STABLE_VALUE)},
                {'id': 'pi_456', 'source_account': 'exchange_wallet_1', 'amount': str(STABLE_VALUE)}
            ]
        }
    }
    return server

@pytest.fixture
def ai_engine():
    return MaximaAutonomousAI()

@pytest.fixture
def validation_engine():
    return CoinValidationEngine()

@pytest.fixture
def rejection_algorithm():
    return RejectionAlgorithm()

def test_ai_volatility_detection(ai_engine):
    # Test AI detects volatility
    transaction_data = [STABLE_VALUE, STABLE_VALUE + 1000]  # Inject volatility
    assert ai_engine.detect_volatility('pi_test', transaction_data) == True
    # Test stable transaction
    stable_data = [STABLE_VALUE, STABLE_VALUE]
    assert ai_engine.detect_volatility('pi_test', stable_data) == False

def test_coin_validation_accepts_valid(validation_engine):
    # Test accepts valid Pi Coin
    result = validation_engine.validate_coin('pi_valid', STABLE_VALUE, 'mining', {'tx': 'valid'})
    assert result == True

def test_coin_validation_rejects_exchange(validation_engine):
    # Test rejects exchange-tainted Pi Coin
    result = validation_engine.validate_coin('pi_exchange', STABLE_VALUE, 'exchange', {'tx': 'invalid'})
    assert result == False

def test_rejection_algorithm_traces_exchange(rejection_algorithm, mock_stellar_server):
    with patch.object(rejection_algorithm, 'stellar_server', mock_stellar_server):
        rejection_algorithm.build_transaction_graph(mock_stellar_server.transactions().limit().call()['_embedded']['records'])
        assert rejection_algorithm.trace_coin_exposure('pi_456') == True  # From exchange
        assert rejection_algorithm.trace_coin_exposure('pi_123') == False  # From mining

def test_rejection_algorithm_ml_anomaly(rejection_algorithm):
    # Test ML detects anomalies
    features = np.array([[STABLE_VALUE, 1000, 10], [STABLE_VALUE + 50000, 2000, 20]])  # Anomalous
    anomalies = rejection_algorithm.ml_anomaly_detection(features)
    assert len(anomalies) > 0  # Should detect anomaly

def test_enforce_stablecoin_rejection(ai_engine, mock_stellar_server):
    with patch.object(ai_engine, 'stellar_server', mock_stellar_server):
        # Test rejects exchange transaction
        result = ai_engine.enforce_stablecoin('pi_456', 'exchange')
        assert result == False
        # Test accepts mining transaction
        result = ai_engine.enforce_stablecoin('pi_123', 'mining')
        assert result == True

def test_full_integration_rejection(validation_engine, rejection_algorithm, mock_stellar_server):
    with patch.object(validation_engine, 'stellar_server', mock_stellar_server), \
         patch.object(rejection_algorithm, 'stellar_server', mock_stellar_server):
        # Simulate full rejection flow
        validation_engine.analyze_and_reject()
        rejection_algorithm.analyze_and_reject()
        assert validation_engine.cache.get('pi_456', {}).get('status') == 'rejected'
        assert rejection_algorithm.rejected_coins == {'pi_456'}

# Run tests with pytest
if __name__ == "__main__":
    pytest.main([__file__, "-v"])
