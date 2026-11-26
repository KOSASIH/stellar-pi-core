#include "NovaTypes.hpp"

#include <algorithm>
#include <unordered_set>

namespace novacore {

struct UsefulWorkValidationResult {
  bool accepted = false;
  double verifiedScore = 0.0;
  std::string reason;
};

class ProofOfUsefulWork {
 public:
  UsefulWorkValidationResult validateWork(const WorkProof& proof, double purityScore) const {
    if (!isUsefulWorkType(proof.workType)) {
      return {
          false,
          0.0,
          "PoUW Rejected: Non-productive work type (" + workTypeToString(proof.workType) +
              ") yields 0 NVC. Burning electricity or pure holding is forbidden.",
      };
    }

    if (proof.energyWasteDetected || proof.energyWh > 5.0) {
      return {
          false,
          0.0,
          "PoUW Rejected: Excessive energy waste detected (" + std::to_string(proof.energyWh) +
              " Wh). Only lightweight useful work is permitted.",
      };
    }

    if (proof.workProofId.empty() || proof.nodeId.empty() || proof.resultHash.empty() ||
        proof.durationMs == 0) {
      return {false, 0.0, "PoUW Rejected: Incomplete WorkProofID metadata or empty result hash."};
    }

    std::unordered_set<std::string> distinctVerifiers;
    for (const auto& v : proof.verifierNodes) {
      if (!v.empty() && v != proof.nodeId) {
        distinctVerifiers.insert(v);
      }
    }
    if (distinctVerifiers.size() < MIN_WORK_VERIFIERS) {
      return {
          false,
          0.0,
          "PoUW Rejected: At least 3 distinct verifier nodes required to attest Useful Work.",
      };
    }

    if (purityScore <= 0.0 || purityScore > 1.0) {
      return {false, 0.0, "PoUW Rejected: PurityScore must be in (0.0, 1.0]."};
    }

    const double clampedScore = std::max(0.0, std::min(100.0, proof.usefulWorkScore));
    if (clampedScore <= 0.0) {
      return {false, 0.0, "PoUW Rejected: UsefulWorkScore must be positive."};
    }

    return {
        true,
        clampedScore,
        "PoUW Verified: " + workTypeToString(proof.workType) + " attested by " +
            std::to_string(distinctVerifiers.size()) + " peer nodes.",
    };
  }
};

} // namespace novacore
