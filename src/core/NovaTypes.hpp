#pragma once

#include <cmath>
#include <cstdint>
#include <string>
#include <vector>

namespace novacore {

// Immutable Constitutional Rules — NEVER modifiable by governance or consensus
constexpr double FIXED_PEG_USD = 3.14;
constexpr double RIBA_INTEREST_RATE = 0.0;
constexpr double MAX_WALLET_CAP_NVC = 10'000'000.0; // 0.01% of 100B NVC
constexpr double TOTAL_SUPPLY_NVC = 100'000'000'000.0;
constexpr double MIN_PRODUCTIVE_VALUE_RATIO = 0.95;
constexpr double MAX_GINI_THRESHOLD = 0.35;
constexpr double MAX_TOP10_CONTROL = 0.30;
constexpr double MAX_ORACLE_DIVERGENCE_RATIO = 0.001; // 0.1%
constexpr std::size_t MIN_WORK_VERIFIERS = 3;

enum class WorkType {
  VALIDATING_HALAL_TX,
  ORACLE_CHECK,
  HYPERSCANNER_CHECK,
  CITIZEN_STORAGE,
  SELF_HEAL_TASK,
  ENERGY_WASTE_MINING, // Strictly banned: yields 0 reward
  PURE_STAKE_HOLDING   // Strictly banned: yields 0 reward
};

enum class AdaptiveMode {
  Normal,
  Defensive,
  Eco
};

struct WorkProof {
  std::string workProofId;
  WorkType workType;
  std::string nodeId;
  std::uint64_t durationMs = 0;
  std::string resultHash;
  std::vector<std::string> verifierNodes;
  double usefulWorkScore = 0.0;
  double energyWh = 0.0;
  bool energyWasteDetected = false;
  std::string timestamp;
};

struct RewardAuditRecord {
  std::string rewardId;
  std::string workProofId;
  std::string nodeId;
  double walletHoldingNvc = 0.0;
  double wealthConcentrationFactor = 1.0;
  double multiplier = 1.0;
  double nvcMinted = 0.0;
  bool accepted = false;
  std::string reason;
  std::string timestamp;
};

struct AdaptiveLogEntry {
  std::uint64_t blockHeight = 0;
  std::string reason;
  std::string parameter;
  std::string oldValue;
  std::string newValue;
  std::string timestamp;
};

struct FailureModeStatus {
  std::string id;
  std::string name;
  bool detected = false;
  bool autoFixed = true;
  std::uint64_t fixCount = 0;
  std::string lastAction;
};

struct NetworkTelemetry {
  std::uint64_t blockHeight = 0;
  double baselineTps = 1200.0;
  double currentTps = 1200.0;
  double latencyMs = 42.0;
  double threatLevel = 0.05; // 0.0 - 1.0
  double nodeHealth = 0.9999;
  double oracleDivergenceRatio = 0.0;
  std::size_t divergentOracleCount = 0;
  double top10ControlRatio = 0.14;
  double energyPerTxWh = 0.04;
  double energyRise24hRatio = 0.0;
  double giniCoefficient = 0.21;
  std::size_t scamDetections = 0;
  double deadMoneySupplyRatio = 0.02;
  std::size_t slowSelfHealFailures = 0;
};

inline std::string workTypeToString(WorkType t) {
  switch (t) {
    case WorkType::VALIDATING_HALAL_TX: return "Validating Halal TX";
    case WorkType::ORACLE_CHECK: return "Oracle Peg Check";
    case WorkType::HYPERSCANNER_CHECK: return "HyperScanner Sweep";
    case WorkType::CITIZEN_STORAGE: return "Citizen Node Storage";
    case WorkType::SELF_HEAL_TASK: return "Self-Heal Recovery";
    case WorkType::ENERGY_WASTE_MINING: return "Energy Waste Mining (BANNED)";
    case WorkType::PURE_STAKE_HOLDING: return "Pure Stake Holding (BANNED)";
  }
  return "Unknown";
}

inline bool isUsefulWorkType(WorkType t) {
  return t != WorkType::ENERGY_WASTE_MINING && t != WorkType::PURE_STAKE_HOLDING;
}

} // namespace novacore
