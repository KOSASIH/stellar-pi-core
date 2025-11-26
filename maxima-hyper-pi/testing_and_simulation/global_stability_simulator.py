import numpy as np
import threading
import time
import logging

logging.basicConfig(filename='global_stability_simulation.log', level=logging.INFO)

class GlobalStabilitySimulator:
    def __init__(self):
        self.scenarios = ['global_crisis', 'compliance_test']
        self.running = True

    def simulate_scenario(self, scenario):
        if scenario == 'global_crisis':
            stability = np.random.uniform(0.8, 1.0)
            logging.info(f"Simulated crisis stability: {stability}")
        elif scenario == 'compliance_test':
            compliant = np.random.rand() > 0.5
            logging.info(f"Compliance test: {compliant}")

    def run_simulation(self):
        while self.running:
            for scenario in self.scenarios:
                self.simulate_scenario(scenario)
            time.sleep(3600)

    def start_simulator(self):
        thread = threading.Thread(target=self.run_simulation)
        thread.start()

    def stop(self):
        self.running = False

# Example usage
if __name__ == "__main__":
    simulator = GlobalStabilitySimulator()
    simulator.start_simulator()
    time.sleep(7200)
    simulator.stop()
