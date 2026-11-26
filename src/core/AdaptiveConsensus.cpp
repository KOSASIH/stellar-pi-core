#include "NovaTypes.hpp"

#include <algorithm>
#include <unordered_map>
#include <vector>

namespace novacore {

struct ValidatorQuarantine {
  std::string nodeId;
  std::uint64_t remainingBlocks = 0;
  std::string backupPromotedNodeId;
};

class AdaptiveConsensus {
 public:
  AdaptiveMode mode() const { return mode_; }
  int validatorRedundancy() const { return validatorRedundancy_; }
  int oracleCheckFreqSec() const { return oracleCheckFreqSec_; }
  int maxTxBatchSize() const { return maxTxBatchSize_; }
  int redundantCheckPercent() const { return redundantCheckPercent_; }
  std::uint64_t healthyStreakBlocks() const { return healthyStreakBlocks_; }
  double immutablePegUsd() const { return FIXED_PEG_USD; }
  double immutableRibaRate() const { return RIBA_INTEREST_RATE; }

  const std::vector<AdaptiveLogEntry>& adaptiveLog() const { return adaptiveLog_; }
  const std::vector<ValidatorQuarantine>& quarantinedValidators() const { return quarantined_; }

  void evaluateBlock(const NetworkTelemetry& telemetry, const std::string& timestamp) {
    // Decrement existing quarantine timers
    for (auto& q : quarantined_) {
      if (q.remainingBlocks > 0) --q.remainingBlocks;
    }

    const double tpsDropRatio =
        telemetry.baselineTps > 0.0
            ? (telemetry.baselineTps - telemetry.currentTps) / telemetry.baselineTps
            : 0.0;

    if (tpsDropRatio > 0.20 || telemetry.threatLevel >= 0.35 || telemetry.divergentOracleCount >= 2 ||
        telemetry.top10ControlRatio > MAX_TOP10_CONTROL) {
      healthyStreakBlocks_ = 0;
      if (mode_ != AdaptiveMode::Defensive) {
        logTransition(telemetry.blockHeight,
                      tpsDropRatio > 0.20 ? "TPS dropped >20%; tightening consensus defense"
                                          : "Threat/divergence spike detected; entering Defensive mode",
                      "AdaptiveMode", modeName(mode_), "Defensive", timestamp);
        mode_ = AdaptiveMode::Defensive;
      }
      if (validatorRedundancy_ != 5) {
        logTransition(telemetry.blockHeight, "Increase validator redundancy under load/threat",
                      "validatorRedundancy", std::to_string(validatorRedundancy_), "5", timestamp);
        validatorRedundancy_ = 5;
      }
      if (oracleCheckFreqSec_ != 2) {
        logTransition(telemetry.blockHeight, "Tighten Oracle check frequency",
                      "oracleCheckFreqSec", std::to_string(oracleCheckFreqSec_), "2", timestamp);
        oracleCheckFreqSec_ = 2;
      }
      if (maxTxBatchSize_ != 150) {
        logTransition(telemetry.blockHeight, "Lower max transaction batch size for safety",
                      "maxTxBatchSize", std::to_string(maxTxBatchSize_), "150", timestamp);
        maxTxBatchSize_ = 150;
      }
      redundantCheckPercent_ = 100;
      return;
    }

    healthyStreakBlocks_ += 1;

    if (healthyStreakBlocks_ >= 1000) {
      if (mode_ != AdaptiveMode::Eco) {
        logTransition(telemetry.blockHeight,
                      "Network healthy for 1000+ consecutive blocks; reducing redundant checks by 30%",
                      "AdaptiveMode", modeName(mode_), "Eco", timestamp);
        mode_ = AdaptiveMode::Eco;
      }
      if (redundantCheckPercent_ != 70) {
        logTransition(telemetry.blockHeight, "1000-block Eco efficiency savings (-30% redundant checks)",
                      "redundantCheckPercent", std::to_string(redundantCheckPercent_), "70", timestamp);
        redundantCheckPercent_ = 70;
      }
      validatorRedundancy_ = 3;
      oracleCheckFreqSec_ = 10;
      maxTxBatchSize_ = 500;
    } else if (mode_ != AdaptiveMode::Normal) {
      logTransition(telemetry.blockHeight, "Telemetry stabilized; restoring Normal SCP parameters",
                    "AdaptiveMode", modeName(mode_), "Normal", timestamp);
      mode_ = AdaptiveMode::Normal;
      validatorRedundancy_ = 3;
      oracleCheckFreqSec_ = 5;
      maxTxBatchSize_ = 350;
      redundantCheckPercent_ = 100;
    }
  }

  // Autonomous validator strike handler: 2x malicious pattern -> 100-block quarantine + backup Citizen promoted
  bool reportValidatorMaliciousPattern(const std::string& nodeId,
                                       const std::string& backupCitizenNodeId,
                                       std::uint64_t blockHeight,
                                       const std::string& timestamp) {
    const int strikes = ++maliciousStrikes_[nodeId];
    if (strikes >= 2) {
      quarantined_.push_back({nodeId, 100, backupCitizenNodeId});
      logTransition(blockHeight,
                    "Validator exhibited malicious pattern 2x: auto-quarantined 100 blocks & promoted " +
                        backupCitizenNodeId + " (no human admin needed)",
                    "quarantinedValidator", nodeId, backupCitizenNodeId, timestamp);
      return true;
    }
    return false;
  }

  static std::string modeName(AdaptiveMode m) {
    switch (m) {
      case AdaptiveMode::Normal: return "Normal";
      case AdaptiveMode::Defensive: return "Defensive";
      case AdaptiveMode::Eco: return "Eco";
    }
    return "Normal";
  }

 private:
  void logTransition(std::uint64_t blockHeight,
                     const std::string& reason,
                     const std::string& parameter,
                     const std::string& oldVal,
                     const std::string& newVal,
                     const std::string& timestamp) {
    adaptiveLog_.push_back({blockHeight, reason, parameter, oldVal, newVal, timestamp});
  }

  AdaptiveMode mode_ = AdaptiveMode::Normal;
  int validatorRedundancy_ = 3;
  int oracleCheckFreqSec_ = 5;
  int maxTxBatchSize_ = 350;
  int redundantCheckPercent_ = 100;
  std::uint64_t healthyStreakBlocks_ = 0;
  std::unordered_map<std::string, int> maliciousStrikes_;
  std::vector<ValidatorQuarantine> quarantined_;
  std::vector<AdaptiveLogEntry> adaptiveLog_;
};

} // namespace novacore
