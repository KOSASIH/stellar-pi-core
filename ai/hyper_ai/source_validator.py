import joblib
import numpy as np
import yaml
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

# Load configuration
with open('../../config/config.yaml') as f:
    config = yaml.safe_load(f)

class SourceValidator:
    """
    GodHead Nexus Hyper AI: Validates transaction sources using ML.
    Rejects invalid sources (e.g., exchanges) and enforces Pi Coin stability.
    """
    
    def __init__(self):
        self.model_path = config['ai']['model_path']
        self.threshold = config['ai']['hyper_ai_threshold']
        self.valid_sources = config['pi_coin']['valid_sources']
        self.model = self.load_or_train_model()
    
    def load_or_train_model(self):
        """
        Load pre-trained model or train a new one if not exists.
        """
        try:
            model = joblib.load(self.model_path)
            print("GodHead Nexus: Hyper AI model loaded from disk.")
            return model
        except FileNotFoundError:
            print("GodHead Nexus: No model found. Training new model...")
            return self.train_initial_model()
    
    def train_initial_model(self):
        """
        Train model with sample data (replace with real Pi Network data for production).
        Features: [amount, timestamp, source_hash]
        Labels: 1 (valid), 0 (invalid)
        """
        # Sample training data (expand with real data from Pi API)
        features = np.array([
            [100, 1640995200, hash("mining") % 1000],  # Valid: mining
            [500, 1640995300, hash("rewards") % 1000],  # Valid: rewards
            [1000, 1640995400, hash("p2p") % 1000],     # Valid: P2P
            [2000, 1640995500, hash("exchange") % 1000], # Invalid: exchange
            [300, 1640995600, hash("third_party") % 1000] # Invalid: third-party
        ])
        labels = np.array([1, 1, 1, 0, 0])  # 1=valid, 0=invalid
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(features, labels, test_size=0.2, random_state=42)
        
        # Train RandomForest
        model = RandomForestClassifier(n_estimators=100, random_state=42)
        model.fit(X_train, y_train)
        
        # Evaluate
        predictions = model.predict(X_test)
        accuracy = accuracy_score(y_test, predictions)
        print(f"GodHead Nexus: Model trained with accuracy: {accuracy:.2f}")
        
        # Save model
        joblib.dump(model, self.model_path)
        return model
    
    def validate(self, transaction_data: dict) -> bool:
        """
        Validate transaction source using ML prediction.
        transaction_data: {'amount': int, 'timestamp': int, 'source': str}
        Returns True if valid (confidence >= threshold).
        """
        # Extract features
        source_hash = hash(transaction_data['source']) % 1000
        features = np.array([transaction_data['amount'], transaction_data['timestamp'], source_hash])
        
        # Predict probability
        prob_valid = self.model.predict_proba([features])[0][1]  # Prob of class 1 (valid)
        
        # Check against threshold
        is_valid = prob_valid >= self.threshold
        print(f"GodHead Nexus: Source '{transaction_data['source']}' validated with confidence {prob_valid:.2f} -> {'Valid' if is_valid else 'Invalid'}")
        
        return is_valid
    
    def predict_source(self, transaction_data: dict) -> str:
        """
        Predict and return source status.
        """
        if self.validate(transaction_data):
            return "Valid (GodHead Nexus Approved)"
        else:
            return "Invalid (Rejected - Exchange or Third-Party)"
    
    def retrain_model(self, new_features: np.ndarray, new_labels: np.ndarray):
        """
        Retrain model with new data for continuous learning.
        """
        self.model.fit(new_features, new_labels)
        joblib.dump(self.model, self.model_path)
        print("GodHead Nexus: Model retrained and updated.")

# Example usage (run this file directly for training/test)
if __name__ == "__main__":
    validator = SourceValidator()
    
    # Test predictions
    test_transactions = [
        {'amount': 150, 'timestamp': 1640995700, 'source': 'mining'},
        {'amount': 2500, 'timestamp': 1640995800, 'source': 'exchange'},
        {'amount': 400, 'timestamp': 1640995900, 'source': 'p2p'}
    ]
    
    for tx in test_transactions:
        result = validator.predict_source(tx)
        print(f"Transaction: {tx} -> {result}")
    
    # Optional: Retrain with new data
    # new_features = np.array([[600, 1640996000, hash("rewards") % 1000]])
    # new_labels = np.array([1])
    # validator.retrain_model(new_features, new_labels)
