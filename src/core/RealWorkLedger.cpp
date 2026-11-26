#include "RewardEngine.cpp"

#include <string>
#include <vector>

namespace novacore {

struct UsefulWorkTask {
  std::string taskId;
  WorkType workType;
  std::string requesterCitizenId;
  double offeredRewardNvc = 0.0;
  std::string description;
  bool claimed = false;
  std::string assignedNodeId;
  std::string completedWorkProofId;
};

struct RealWorkLedgerEntry {
  WorkProof proof;
  double rewardNvc = 0.0;
};

class RealWorkLedger {
 public:
  explicit RealWorkLedger(RewardEngine& rewardEngine) : rewardEngine_(rewardEngine) {}

  double productiveValueRatio() const {
    if (totalNvcCirculating_ <= 0.0) return 1.0;
    return nvcBackedByUsefulWork_ / totalNvcCirculating_;
  }

  bool nonEssentialMintingPaused() const { return nonEssentialMintingPaused_; }
  double totalNvcCirculating() const { return totalNvcCirculating_; }
  double nvcBackedByUsefulWork() const { return nvcBackedByUsefulWork_; }
  const std::vector<RealWorkLedgerEntry>& ledger() const { return entries_; }
  const std::vector<UsefulWorkTask>& marketplace() const { return marketplace_; }

  void registerLegacyOrExternalMint(double nvcAmount) {
    if (nvcAmount > 0.0) {
      totalNvcCirculating_ += nvcAmount;
      evaluateProductiveRatio();
    }
  }

  // Enforces: No WorkProof = No Mint. Zero exceptions.
  RewardAuditRecord mintFromWorkProof(const WorkProof& proof,
                                      double uptimeRatio,
                                      double purityScore,
                                      double currentWalletHoldingNvc,
                                      const std::string& rewardId,
                                      const std::string& timestamp) {
    if (proof.workProofId.empty()) {
      return {
          rewardId, "", proof.nodeId, currentWalletHoldingNvc, 1.0, 0.0, 0.0, false,
          "No WorkProof = No Mint. Missing WorkProofID.", timestamp,
      };
    }

    RewardAuditRecord audit = rewardEngine_.computeAndAuditReward(
        proof, uptimeRatio, purityScore, currentWalletHoldingNvc, rewardId, timestamp);

    if (audit.accepted && audit.nvcMinted > 0.0) {
      nvcBackedByUsefulWork_ += audit.nvcMinted;
      totalNvcCirculating_ += audit.nvcMinted;
      entries_.push_back({proof, audit.nvcMinted});
    }
    evaluateProductiveRatio();
    return audit;
  }

  void postUsefulWorkTask(const UsefulWorkTask& task) {
    if (isUsefulWorkType(task.workType) && task.offeredRewardNvc > 0.0) {
      marketplace_.push_back(task);
    }
  }

  bool claimAndCompleteTask(const std::string& taskId,
                            const std::string& citizenNodeId,
                            const WorkProof& proof,
                            double uptimeRatio,
                            double purityScore,
                            double currentWalletHoldingNvc,
                            const std::string& timestamp) {
    for (auto& task : marketplace_) {
      if (task.taskId == taskId && !task.claimed) {
        RewardAuditRecord res = mintFromWorkProof(
            proof, uptimeRatio, purityScore, currentWalletHoldingNvc, "rew-" + taskId, timestamp);
        if (!res.accepted) return false;
        task.claimed = true;
        task.assignedNodeId = citizenNodeId;
        task.completedWorkProofId = proof.workProofId;
        return true;
      }
    }
    return false;
  }

 private:
  void evaluateProductiveRatio() {
    nonEssentialMintingPaused_ = productiveValueRatio() < MIN_PRODUCTIVE_VALUE_RATIO;
  }

  RewardEngine& rewardEngine_;
  double nvcBackedByUsefulWork_ = 980.0;
  double totalNvcCirculating_ = 1000.0; // 98.0% baseline Productive Value Ratio
  bool nonEssentialMintingPaused_ = false;
  std::vector<RealWorkLedgerEntry> entries_;
  std::vector<UsefulWorkTask> marketplace_;
};

} // namespace novacore
