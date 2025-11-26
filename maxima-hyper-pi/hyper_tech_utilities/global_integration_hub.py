import requests
import threading
import time

class GlobalIntegrationHub:
    def __init__(self):
        self.integrations = {'bank_api': 'https://api.bank.com', 'blockchain_api': 'https://api.blockchain.com'}
        self.running = True

    def integrate_api(self, name, url):
        try:
            response = requests.get(url, timeout=5)
            print(f"Integrated {name}: {response.status_code}")
        except Exception as e:
            print(f"Integration error for {name}: {e}")

    def global_aggregate(self):
        while self.running:
            for name, url in self.integrations.items():
                self.integrate_api(name, url)
            time.sleep(60)

    def start_hub(self):
        thread = threading.Thread(target=self.global_aggregate)
        thread.start()

    def stop(self):
        self.running = False

# Example usage
if __name__ == "__main__":
    hub = GlobalIntegrationHub()
    hub.start_hub()
    time.sleep(120)
    hub.stop()
