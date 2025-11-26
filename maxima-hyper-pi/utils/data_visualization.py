import matplotlib.pyplot as plt
import numpy as np
import threading
import time
from collections import deque

class DataVisualization:
    def __init__(self):
        self.rejection_data = deque(maxlen=100)
        self.health_data = deque(maxlen=100)
        self.running = True

    def update_data(self, rejections, health):
        self.rejection_data.append(rejections)
        self.health_data.append(health)

    def visualize_realtime(self):
        while self.running:
            plt.figure(figsize=(10, 5))
            plt.subplot(1, 2, 1)
            plt.plot(list(self.rejection_data), label='Rejections')
            plt.title('Real-Time Rejections')
            plt.legend()

            plt.subplot(1, 2, 2)
            plt.plot(list(self.health_data), label='Health Score', color='green')
            plt.title('Ecosystem Health')
            plt.legend()

            plt.pause(1)
            plt.clf()

    def start_visualization(self):
        thread = threading.Thread(target=self.visualize_realtime)
        thread.start()

    def stop(self):
        self.running = False

# Example usage
if __name__ == "__main__":
    viz = DataVisualization()
    viz.start_visualization()
    for i in range(10):
        viz.update_data(np.random.randint(0, 10), np.random.uniform(0.5, 1.0))
        time.sleep(1)
    viz.stop()
