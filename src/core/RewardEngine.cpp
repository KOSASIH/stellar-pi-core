#include "ProofOfUsefulWork.cpp"

#include <algorithm>
#include <cmath>
#include <vector>

namespace novacore {

class RewardEngine {
 public:
  explicit RewardEngine(const ProofOfUsefulWork& pouw) : pouw_(pouw) {}

  // WealthConcentrationFactor grows steeply as wallet holding approaches 10M NVC cap,
  // guaranteeing that wealthier nodes receive strictly LOWER reward multipliers.
  static double computeWealthConcentrationFactor(double holdingNvc) {
    const double clamped = std::max(0.0, std::min(MAX_WALLET_CAP_NVC, holdingNvc));
    const double ratio = clamped / MAX_WALLET_CAP_NVC; // 0.0 .. 1.0
    return 1.0 + 19.0 * std::pow(ratio, 1.25);         // 1.0x at 0 NVC -> 20.0x divisor at 10M NVC
  }

  RewardAuditRecord computeAndAuditReward(const WorkProof& proof,
                                          double uptimeRatio,
                                          double purityScore,
                                          double currentWalletHoldingNvc,
                                          const std::string& rewardId,
                                          const std::string& timestamp) {
    if (currentWalletHoldingNvc >= MAX_WALLET_CAP_NVC) {
      RewardAuditRecord blocked{
          rewardId,
          proof.workProofId,
          proof.nodeId,
          currentWalletHoldingNvc,
          computeWealthConcentrationFactor(currentWalletHoldingNvc),
          0.0,
          0.0,
          false,
          "Reward Blocked: Node reached 0.01% max wallet cap (10,000,000 NVC).",
          timestamp,
      };
      auditTrail_.push_back(blocked);
      return blocked;
    }

    const UsefulWorkValidationResult validation = pouw_.validateWork(proof, purityScore);
    if (!validation.accepted) {
      RewardAuditRecord rejected{
          rewardId,
          proof.workProofId,
          proof.nodeId,
          currentWalletHoldingNvc,
          computeWealthConcentrationFactor(currentWalletHoldingNvc),
          0.0,
          0.0,
          false,
          validation.reason,
          timestamp,
      };
      auditTrail_.push_back(rejected);
      return rejected;
    }

    const double clampedUptime = std::max(0.0, std::min(1.0, uptimeRatio));
    const double wealthFactor = computeWealthConcentrationFactor(currentWalletHoldingNvc);

    // Core PoUW Formula:
    // Reward = (UsefulWorkScore * Uptime * PurityScore) / WealthConcentrationFactor
    const double rawReward = (validation.verifiedScore * clampedUptime * purityScore) / wealthFactor;
    const double scaledNvc = std::round((rawReward / 100.0) * 1'000'000.0) / 1'000'000.0;
    const double allowedDelta = std::max(0.0, MAX_WALLET_CAP_NVC - currentWalletHoldingNvc);
    const double finalNvc = std::min(scaledNvc, allowedDelta);

    RewardAuditRecord record{
        rewardId,
        proof.workProofId,
        proof.nodeId,
        currentWalletHoldingNvc,
        wealthFactor,
        1.0 / wealthFactor,
        finalNvc,
        finalNvc > 0.0,
        "Auditable PoUW Mint: " + validation.reason,
        timestamp,
    };
    auditTrail_.push_back(record);
    return record;
  }

  const std::vector<RewardAuditRecord>& auditTrail() const { return auditTrail_; }

 private:
  const ProofOfUsefulWork& pouw_;
  std::vector<RewardAuditRecord> auditTrail_;
};

} // namespace novacore
