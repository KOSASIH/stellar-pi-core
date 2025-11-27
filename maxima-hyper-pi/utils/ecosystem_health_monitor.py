import psutil
import numpy as np
import threading
import time
import logging
import requests
from config.environment_config import env_config

logging.basicConfig(filename='ecosystem_health_monitor.log', level=logging.INFO)

class EcosystemHealthMonitor:
    def __init__(self):
        self.health_metrics = {
            'cpu_usage': 0,
            'memory_usage': 0,
            'transaction_volume': 0,
            'compliance_rate': 0,
            'threat_level': 0
        }
        self.anomaly_detector = self.build_anomaly_detector()
        self.running = True
        self.threads = []

    def build_anomaly_detector(self):
        # Simple anomaly detector (in real impl, use ML model)
        return lambda metrics: np.std(list(metrics.values())) > 10  # Placeholder

    def update_metrics(self):
        # Update real-time metrics
        self.health_metrics['cpu_usage'] = psutil.cpu_percent()
        self.health_metrics['memory_usage'] = psutil.virtual_memory().percent
        self.health_metrics['transaction_volume'] = np.random.randint(100, 1000)  # Placeholder
        self.health_metrics['compliance_rate'] = np.random.uniform(0.9, 1.0)  # Placeholder
        self.health_metrics['threat_level'] = np.random.uniform(0, 0.1)  # Placeholder

    def detect_anomalies(self):
        # Detect anomalies in metrics
        if self.anomaly_detector(self.health_metrics):
            logging.warning("Anomaly detected in ecosystem health.")
            self.report_anomaly()

    def report_anomaly(self):
        # Report to global oversight
        oversight_apis = env_config.get('regulatory_oversight', []) + env_config.get('cybersecurity_oversight', [])
        for api in oversight_apis:
            try:
                response = requests.post(api, json={'anomaly': self.health_metrics}, timeout=10)
                if response.status_code == 200:
                    logging.info(f"Anomaly reported to {api}")
            except Exception as e:
                logging.error(f"Report error to {api}: {e}")

    def suggest_self_healing(self):
        # AI suggestions for health improvement
        if self.health_metrics['cpu_usage'] > 80:
            logging.info("Suggestion: Optimize CPU usage.")
        if self.health_metrics['threat_level'] > 0.05:
            logging.info("Suggestion: Enhance threat detection.")

    def monitor_loop(self):
        while self.running:
            self.update_metrics()
            self.detect_anomalies()
            self.suggest_self_healing()
            logging.info(f"Health Metrics: {self.health_metrics}")
            time.sleep(300)  # Monitor every 5 min

    def start_monitor(self):
        # Start threads
        monitor_thread = threading.Thread(target=self.monitor_loop)
        self.threads.append(monitor_thread)
        for t in self.threads:
            t.start()

    def stop(self):
        self.running = False
        for t in self.threads:
            t.join()

# Example usage
if __name__ == "__main__":
    monitor = EcosystemHealthMonitor()
    monitor.start_monitor()
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        monitor.stop()
        print("Ecosystem Health Monitor stopped.")
