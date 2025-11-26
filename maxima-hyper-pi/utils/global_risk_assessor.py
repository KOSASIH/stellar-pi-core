import numpy as np
import threading
import time
import logging

logging.basicConfig(filename='global_risk_assessment.log', level=logging.INFO)

class GlobalRiskAssessor:
    def __init__(self):
        self.risks = ['volatility', 'cyber_attack']
        self.running = True

    def assess_risk(self, risk_type):
        level = np.random.uniform(0, 1)
        if level > 0.7:
            logging.warning(f"High risk: {risk_type} at {level}")
        else:
            logging.info(f"Low risk: {risk_type} at {level}")

    def run_assessment(self):
        while self.running:
            for risk in self.risks:
                self.assess_risk(risk)
            time.sleep(1800)

    def start_assessor(self):
        thread = threading.Thread(target=self.run_assessment)
        thread.start()

    def stop(self):
        self.running = False

# Example usage
if __name__ == "__main__":
    assessor = GlobalRiskAssessor()
    assessor.start_assessor()
    time.sleep(3600)
    assessor.stop()
