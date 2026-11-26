#include "NovaTypes.hpp"

#include <algorithm>
#include <cctype>
#include <cmath>
#include <string>

namespace novacore {

struct ConstitutionalCheckResult {
  bool allowed = true;
  std::string reason;
};

struct CitizenVoteInput {
  std::string citizenId;
  bool hasSingleKyc = false;
  double usefulWorkScore = 0.0;
  double citizenReputation = 0.0; // 0 .. 100
  double nvcBalanceIgnored = 0.0; // Explicitly ignored so wealth NEVER buys votes
};

class QuadraticCitizenVote {
 public:
  // Anti-Plutocracy Formula:
  // VotingPower = sqrt(UsefulWorkScore * CitizenReputation * 1-KYC Proof)
  static double computeVotingPower(const CitizenVoteInput& voter) {
    if (!voter.hasSingleKyc || voter.usefulWorkScore <= 0.0 || voter.citizenReputation <= 0.0) {
      return 0.0;
    }
    const double kycProof = 1.0;
    (void)voter.nvcBalanceIgnored; // Wealth NEVER influences voting weight
    return std::sqrt(voter.usefulWorkScore * voter.citizenReputation * kycProof);
  }

  static ConstitutionalCheckResult validateProposalConstitutionality(const std::string& title,
                                                                     const std::string& description) {
    std::string combined = title + " " + description;
    std::transform(combined.begin(), combined.end(), combined.begin(),
                   [](unsigned char c) { return static_cast<char>(std::tolower(c)); });

    const bool touchesPeg =
        (combined.find("peg") != std::string::npos || combined.find("3.14") != std::string::npos ||
         combined.find("3.20") != std::string::npos) &&
        (combined.find("change") != std::string::npos || combined.find("remove") != std::string::npos ||
         combined.find("float") != std::string::npos || combined.find("depeg") != std::string::npos ||
         combined.find("slippage") != std::string::npos || combined.find("3.20") != std::string::npos);

    const bool touchesRiba =
        (combined.find("interest") != std::string::npos || combined.find("riba") != std::string::npos ||
         combined.find("apy") != std::string::npos || combined.find("apr") != std::string::npos) &&
        combined.find("0% interest") == std::string::npos &&
        combined.find("zero interest") == std::string::npos &&
        combined.find("riba-free") == std::string::npos;

    const bool touchesCap =
        (combined.find("wallet cap") != std::string::npos ||
         combined.find("10m") != std::string::npos ||
         combined.find("10,000,000") != std::string::npos ||
         combined.find("0.01%") != std::string::npos) &&
        (combined.find("raise") != std::string::npos || combined.find("remove") != std::string::npos ||
         combined.find("unlimited") != std::string::npos || combined.find("whale") != std::string::npos);

    if (touchesPeg || touchesRiba || touchesCap) {
      return {
          false,
          "Constitutional Rule Violation: Proposals altering Fixed Peg $3.14, RibaGuard 0% Interest, or 0.01% Max Wallet Cap (10M NVC) are AUTO-REJECTED at protocol level.",
      };
    }

    return {
        true,
        "Constitutional Check Passed: Immutable Peg $3.14, RibaGuard 0%, and 10M Max Cap preserved.",
    };
  }
};

} // namespace novacore
