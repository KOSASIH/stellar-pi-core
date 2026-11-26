#include "HyperMindOrchestrator.cpp"

#include <cassert>
#include <iostream>

int main() {
  using namespace novacore;

  HyperMindOrchestrator orchestrator;
  const std::string ts = "2026-11-26T00:30:00Z";

  // 1. Waste & Passive Stake Holding attacks yield 0 NVC
  WorkProof wasteProof{"wp-waste", WorkType::ENERGY_WASTE_MINING, "NODE-WASTE", 1000, "abc",
                       {"V1", "V2", "V3"}, 90.0, 250.0, true, ts};
  WorkProof stakeProof{"wp-stake", WorkType::PURE_STAKE_HOLDING, "NODE-STAKE", 1000, "def",
                       {"V1", "V2", "V3"}, 90.0, 0.01, false, ts};
  auto wasteAudit = orchestrator.ledger().mintFromWorkProof(wasteProof, 1.0, 1.0, 10.0, "r-waste", ts);
  auto stakeAudit = orchestrator.ledger().mintFromWorkProof(stakeProof, 1.0, 1.0, 10.0, "r-stake", ts);
  assert(!wasteAudit.accepted && wasteAudit.nvcMinted == 0.0);
  assert(!stakeAudit.accepted && stakeAudit.nvcMinted == 0.0);

  // 2. Small citizen earns MORE than wallet near 10M NVC cap for identical useful work
  WorkProof smallProof{"wp-small", WorkType::ORACLE_CHECK, "CITIZEN-SMALL", 400, "h1",
                       {"V1", "V2", "V3"}, 80.0, 0.04, false, ts};
  WorkProof whaleProof{"wp-whale", WorkType::ORACLE_CHECK, "CITIZEN-WHALE", 400, "h2",
                       {"V1", "V2", "V3"}, 80.0, 0.04, false, ts};
  auto smallReward = orchestrator.ledger().mintFromWorkProof(smallProof, 1.0, 1.0, 100.0, "r-small", ts);
  auto whaleReward = orchestrator.ledger().mintFromWorkProof(whaleProof, 1.0, 1.0, 9'500'000.0, "r-whale", ts);
  assert(smallReward.accepted && whaleReward.accepted);
  assert(smallReward.nvcMinted > whaleReward.nvcMinted);

  // 3. Quadratic Vote: 10M whale vs 10 NVC citizen with equal useful work have identical vote power
  CitizenVoteInput smallVoter{"CIT-1", true, 64.0, 95.0, 10.0};
  CitizenVoteInput whaleVoter{"CIT-2", true, 64.0, 95.0, 10'000'000.0};
  assert(QuadraticCitizenVote::computeVotingPower(smallVoter) ==
         QuadraticCitizenVote::computeVotingPower(whaleVoter));

  // 4. Constitutional Guard blocks Peg/Riba/Cap mutation
  auto badProp = QuadraticCitizenVote::validateProposalConstitutionality(
      "Change Peg to 3.20", "Remove Riba interest ban and raise wallet cap");
  assert(!badProp.allowed);

  // 5. Malicious validator 2x triggers 100-block auto-quarantine + backup Citizen promotion
  assert(!orchestrator.consensus().reportValidatorMaliciousPattern("ROGUE-VAL-1", "NVC-MINER-RASPI-09", 1043, ts));
  assert(orchestrator.consensus().reportValidatorMaliciousPattern("ROGUE-VAL-1", "NVC-MINER-RASPI-09", 1044, ts));
  assert(orchestrator.consensus().quarantinedValidators().size() == 1);
  assert(orchestrator.consensus().quarantinedValidators()[0].remainingBlocks == 100);

  // 6. AdaptiveConsensus enters Defensive mode on TPS drop & returns Eco after 1000 healthy blocks
  NetworkTelemetry dropTel;
  dropTel.blockHeight = 1045;
  dropTel.currentTps = 800.0; // >20% drop from 1200 TPS
  auto epochDrop = orchestrator.processBlockEpoch(dropTel, {smallProof}, 100.0, ts);
  assert(epochDrop.adaptiveMode == AdaptiveMode::Defensive);
  assert(epochDrop.validatorRedundancy == 5);
  assert(epochDrop.immutablePegUsd == FIXED_PEG_USD);
  assert(epochDrop.immutableRibaRate == RIBA_INTEREST_RATE);

  NetworkTelemetry healthyTel;
  for (int i = 0; i < 1000; ++i) {
    healthyTel.blockHeight = 1046 + i;
    orchestrator.consensus().evaluateBlock(healthyTel, ts);
  }
  assert(orchestrator.consensus().mode() == AdaptiveMode::Eco);
  assert(orchestrator.consensus().redundantCheckPercent() == 70);

  // 7. FailurePreventionEngine auto-fixes all 7 failure modes in a single epoch
  NetworkTelemetry stressTel;
  stressTel.blockHeight = 2046;
  stressTel.top10ControlRatio = 0.48;
  stressTel.energyRise24hRatio = 0.25;
  stressTel.giniCoefficient = 0.52;
  stressTel.divergentOracleCount = 2;
  stressTel.scamDetections = 1;
  stressTel.deadMoneySupplyRatio = 0.19;
  stressTel.slowSelfHealFailures = 2;
  auto stressReport = orchestrator.processBlockEpoch(stressTel, {wasteProof, smallProof}, 100.0, ts);
  assert(stressReport.failureAutoFixesTotal == 7);
  assert(stressReport.acceptedWorkProofs == 1);
  assert(stressReport.rejectedWorkProofs == 1);

  std::cout << "NovaHyperMind v3 C++ Orchestrator & Core checks passed (7/7 failure modes auto-fixed, quarantine verified).\n";
  return 0;
}
