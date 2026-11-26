#include "AdaptiveConsensus.cpp"
#include "FailurePreventionEngine.cpp"
#include "QuadraticCitizenVote.cpp"
#include "RealWorkLedger.cpp"

#include <string>
#include <vector>

namespace novacore {

struct BlockEpochReport {
  std::uint64_t blockHeight = 0;
  AdaptiveMode adaptiveMode = AdaptiveMode::Normal;
  int validatorRedundancy = 3;
  int oracleCheckFreqSec = 5;
  int maxTxBatchSize = 350;
  double productiveValueRatio = 1.0;
  bool nonEssentialMintingPaused = false;
  std::uint64_t failureAutoFixesTotal = 0;
  std::size_t acceptedWorkProofs = 0;
  std::size_t rejectedWorkProofs = 0;
  double immutablePegUsd = FIXED_PEG_USD;
  double immutableRibaRate = RIBA_INTEREST_RATE;
};

class HyperMindOrchestrator {
 public:
  HyperMindOrchestrator() : rewardEngine_(pouw_), ledger_(rewardEngine_) {}

  ProofOfUsefulWork& pouw() { return pouw_; }
  RewardEngine& rewardEngine() { return rewardEngine_; }
  RealWorkLedger& ledger() { return ledger_; }
  AdaptiveConsensus& consensus() { return consensus_; }
  FailurePreventionEngine& failureEngine() { return failureEngine_; }

  BlockEpochReport processBlockEpoch(NetworkTelemetry& telemetry,
                                     const std::vector<WorkProof>& candidateProofs,
                                     double walletHoldingNvc,
                                     const std::string& timestamp) {
    // 1. Run all 7 autonomous failure mode checks and auto-fix any drift
    failureEngine_.runBlockAudit(telemetry);

    // 2. Run AdaptiveConsensus telemetry check (Defensive / Normal / Eco)
    consensus_.evaluateBlock(telemetry, timestamp);

    // 3. Process WorkProofs strictly through RealWorkLedger (No WorkProof = No Mint)
    std::size_t accepted = 0;
    std::size_t rejected = 0;
    for (std::size_t i = 0; i < candidateProofs.size(); ++i) {
      const auto& wp = candidateProofs[i];
      // Circuit breaker: if Productive Value Ratio < 95%, pause non-essential minting
      if (ledger_.nonEssentialMintingPaused() &&
          wp.workType != WorkType::SELF_HEAL_TASK &&
          wp.workType != WorkType::ORACLE_CHECK) {
        ++rejected;
        continue;
      }
      const std::string rewardId =
          "rew-" + std::to_string(telemetry.blockHeight) + "-" + std::to_string(i);
      const RewardAuditRecord rec =
          ledger_.mintFromWorkProof(wp, 0.99, 1.0, walletHoldingNvc, rewardId, timestamp);
      if (rec.accepted) {
        ++accepted;
      } else {
        ++rejected;
      }
    }

    return {
        telemetry.blockHeight,
        consensus_.mode(),
        consensus_.validatorRedundancy(),
        consensus_.oracleCheckFreqSec(),
        consensus_.maxTxBatchSize(),
        ledger_.productiveValueRatio(),
        ledger_.nonEssentialMintingPaused(),
        failureEngine_.totalAutoFixes(),
        accepted,
        rejected,
        FIXED_PEG_USD,
        RIBA_INTEREST_RATE,
    };
  }

 private:
  ProofOfUsefulWork pouw_;
  RewardEngine rewardEngine_;
  RealWorkLedger ledger_;
  AdaptiveConsensus consensus_;
  FailurePreventionEngine failureEngine_;
};

} // namespace novacore
