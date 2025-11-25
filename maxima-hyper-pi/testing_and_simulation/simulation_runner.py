import threading
import time
import random
import logging
from stellar_sdk import Server  # Stellar integration
import numpy as np

# Hyper-tech constants
STABLE_VALUE = 314159
STELLAR_SERVER_URL = "https://horizon.stellar.org"
EXCHANGE_SOURCES = ["exchange_wallet_1", "exchange_wallet_2"]
VALID_SOURCES = ["mining", "rewards", "p2p"]

# Setup logging
logging.basicConfig(filename='maxima_simulation.log', level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

class SimulationRunner:
    def __init__(self, num_agents=10, num_iot_devices=5):
        self.stellar_server = Server(STELLAR_SERVER_URL)
        self.agents = [f'agent_{i}' for i in range(num_agents)]
        self.iot_devices = [f'iot_{i}' for i in range(num_iot_devices)]
        self.simulated_transactions = []
        self.rejected_count = 0
        self.accepted_count = 0
        self.running = True
        self.threads = []

    def simulate_transaction(self, agent_id):
        while self.running:
            # Generate random transaction
            pi_coin_id = f'pi_sim_{random.randint(1000, 9999)}'
            amount = STABLE_VALUE if random.random() > 0.1 else random.randint(100000, 500000)  # Inject volatility
            source = random.choice(VALID_SOURCES + EXCHANGE_SOURCES)  # Include exchange for testing
            destination = random.choice(self.agents)

            # Simulate validation (integrate with coin_validation_engine.py)
            if amount != STABLE_VALUE or source in EXCHANGE_SOURCES:
                self.rejected_count += 1
                logging.warning(f"Simulated rejection: {pi_coin_id} from {source}")
                self.simulated_transactions.append({'id': pi_coin_id, 'status': 'rejected', 'reason': 'volatility/exchange'})
            else:
                self.accepted_count += 1
                logging.info(f"Simulated acceptance: {pi_coin_id} from {source}")
                self.simulated_transactions.append({'id': pi_coin_id, 'status': 'accepted', 'amount': amount})

            time.sleep(random.uniform(0.5, 2.0))  # Random delay

    def simulate_iot_mining(self, device_id):
        while self.running:
            # Simulate IoT mining (integrate with iot_integration_module.js)
            pi_mined = STABLE_VALUE
            energy = random.randint(50, 200)
            source = 'iot_mining' if random.random() > 0.2 else 'exchange'  # Inject rejection

            if source == 'exchange' or energy > 150:
                self.rejected_count += 1
                logging.warning(f"IoT rejection: {device_id} - {source}")
            else:
                self.accepted_count += 1
                logging.info(f"IoT acceptance: {device_id} mined {pi_mined}")

            time.sleep(random.uniform(1.0, 3.0))

    def simulate_ai_prediction(self):
        while self.running:
            # Simulate AI prediction (integrate with predictive_analytics_ai.py)
            health_score = random.uniform(0, 1)
            risk = 'high' if health_score < 0.5 else 'low'
            logging.info(f"Simulated AI prediction: Health {health_score}, Risk {risk}")
            time.sleep(10)  # Predict every 10 seconds

    def run_simulation(self, duration=60):
        # Start threads
        for agent in self.agents:
            t = threading.Thread(target=self.simulate_transaction, args=(agent,))
            self.threads.append(t)
            t.start()

        for device in self.iot_devices:
            t = threading.Thread(target=self.simulate_iot_mining, args=(device,))
            self.threads.append(t)
            t.start()

        ai_thread = threading.Thread(target=self.simulate_ai_prediction)
        self.threads.append(ai_thread)
        ai_thread.start()

        # Run for duration
        time.sleep(duration)
        self.stop_simulation()

    def stop_simulation(self):
        self.running = False
        for t in self.threads:
            t.join()
        self.export_results()

    def export_results(self):
        results = {
            'total_transactions': len(self.simulated_transactions),
            'accepted': self.accepted_count,
            'rejected': self.rejected_count,
            'transactions': self.simulated_transactions
        }
        with open('simulation_results.json', 'w') as f:
            import json
            json.dump(results, f, indent=4)
        logging.info(f"Simulation results exported: Accepted {self.accepted_count}, Rejected {self.rejected_count}")

    def get_stats(self):
        return {
            'accepted': self.accepted_count,
            'rejected': self.rejected_count,
            'total': len(self.simulated_transactions)
        }

# Example usage
if __name__ == "__main__":
    runner = SimulationRunner()
    try:
        runner.run_simulation(30)  # Run for 30 seconds
        print("Simulation completed. Check simulation_results.json")
    except KeyboardInterrupt:
        runner.stop_simulation()
        print("Simulation stopped.")
