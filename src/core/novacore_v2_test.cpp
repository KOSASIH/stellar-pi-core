#include "AdaptiveConsensus.cpp"
#include "FailurePreventionEngine.cpp"
#include "QuadraticCitizenVote.cpp"
#include "RealWorkLedger.cpp"

#include <cassert>
#include <iostream>

int main() {
  using namespace novacore;

  ProofOfUsefulWork pouw;
  RewardEngine rewardEngine(pouw);
  RealWorkLedger ledger(rewardEngine);
  AdaptiveConsensus consensus;
  FailurePreventionEngine failureEngine;

  const std::string ts = "2026-11-26T00:00:00Z";

  // 1. Waste attack yields 0 NVC
  WorkProof wasteProof{"wp-waste", WorkType::ENERGY_WASTE_MINING, "NODE-WASTE", 1000, "abc",
                       {"V1", "V2", "V3"}, 90.0, 250.0, true, ts};
  auto wasteAudit = ledger.mintFromWorkProof(wasteProof, 1.0, 1.0, 10.0, "r-waste", ts);
  assert(!wasteAudit.accepted && wasteAudit.nvcMinted == 0.0);

  // 2. Small citizen earns MORE than wallet near 10M NVC cap for identical useful work
  WorkProof smallProof{"wp-small", WorkType::ORACLE_CHECK, "CITIZEN-SMALL", 400, "h1",
                       {"V1", "V2", "V3"}, 80.0, 0.04, false, ts};
  WorkProof whaleProof{"wp-whale", WorkType::ORACLE_CHECK, "CITIZEN-WHALE", 400, "h2",
                       {"V1", "V2", "V3"}, 80.0, 0.04, false, ts};
  auto smallReward = ledger.mintFromWorkProof(smallProof, 1.0, 1.0, 100.0, "r-small", ts);
  auto whaleReward = ledger.mintFromWorkProof(whaleProof, 1.0, 1.0, 9'500'000.0, "r-whale", ts);
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

  // 5. AdaptiveConsensus enters Defensive mode on TPS drop & returns Eco after 1000 healthy blocks
  NetworkTelemetry dropTel;
  dropTel.blockHeight = 1043;
  dropTel.currentTps = 800.0; // >20% drop from 1200 TPS
  consensus.evaluateBlock(dropTel, ts);
  assert(consensus.mode() == AdaptiveMode::Defensive);

  NetworkTelemetry healthyTel;
  for (int i = 0; i < 1000; ++i) {
    healthyTel.blockHeight = 1044 + i;
    consensus.evaluateBlock(healthyTel, ts);
  }
  assert(consensus.mode() == AdaptiveMode::Eco);
  assert(consensus.redundantCheckPercent() == 70);

  // 6. FailurePreventionEngine auto-fixes all 7 failure modes
  NetworkTelemetry stressTel;
  stressTel.top10ControlRatio = 0.48;
  stressTel.energyRise24hRatio = 0.25;
  stressTel.giniCoefficient = 0.52;
  stressTel.divergentOracleCount = 2;
  stressTel.scamDetections = 1;
  stressTel.deadMoneySupplyRatio = 0.19;
  stressTel.slowSelfHealFailures = 2;
  failureEngine.runBlockAudit(stressTel);
  assert(failureEngine.totalAutoFixes() == 7);

  std::cout << "NovaHyperMind v2 C++ Core checks passed (7/7 failure modes auto-fixed).\n";
  return 0;
}
