import psutil
import threading
import time

class HyperPerformanceAnalyzer:
    def __init__(self):
        self.metrics = {}
        self.running = True

    def analyze_performance(self):
        cpu = psutil.cpu_percent()
        memory = psutil.virtual_memory().percent
        self.metrics = {'cpu': cpu, 'memory': memory}
        print(f"Performance: CPU {cpu}%, Memory {memory}%")

    def predictive_optimize(self):
        if self.metrics.get('cpu', 0) > 80:
            print("Predictive optimization: Reduce load.")

    def run_analysis(self):
        while self.running:
            self.analyze_performance()
            self.predictive_optimize()
            time.sleep(10)

    def start_analyzer(self):
        thread = threading.Thread(target=self.run_analysis)
        thread.start()

    def stop(self):
        self.running = False

# Example usage
if __name__ == "__main__":
    analyzer = HyperPerformanceAnalyzer()
    analyzer.start_analyzer()
    time.sleep(30)
    analyzer.stop()
