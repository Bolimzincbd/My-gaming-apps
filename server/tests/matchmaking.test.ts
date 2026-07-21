import { describe, expect, it } from "vitest";
import { calculateMatchScore, rankCandidates, type MatchmakingUser } from "../src/utils/matchmaking";
import { MLBB_GAME } from "../src/utils/mlbb";

const currentUser: MatchmakingUser = {
  username: "GoldLanePilot",
  preferredGames: [MLBB_GAME],
  preferredModes: ["Ranked"],
  gameRanks: [{ game: MLBB_GAME, rank: "Mythic", rankValue: 7 }],
  region: "Cambodia",
  languages: ["English", "Khmer"],
  playstyle: "Objective-focused",
  mlbbRole: "Marksman",
  mlbbLane: "Gold Lane",
  availability: "Weekday evenings",
  trustScore: 82,
  lastActive: new Date()
};

describe("MLBB matchmaking scoring", () => {
  it("rejects candidates who do not play Mobile Legends: Bang Bang", () => {
    const candidate: MatchmakingUser = {
      username: "DifferentGame",
      preferredGames: ["Valorant"],
      preferredModes: ["Competitive"],
      gameRanks: [{ game: "Valorant", rank: "Gold", rankValue: 5 }],
      region: "Cambodia",
      languages: ["English"],
      playstyle: "Strategic",
      mlbbRole: "Mage",
      mlbbLane: "Mid Lane",
      availability: "Flexible",
      trustScore: 70,
      lastActive: new Date()
    };

    expect(calculateMatchScore(currentUser, candidate, { game: MLBB_GAME })).toBeNull();
  });

  it("ranks close-rank same-lane trusted MLBB players above weaker fits", () => {
    const highFit: MatchmakingUser = {
      username: "RoamCaptain",
      preferredGames: [MLBB_GAME],
      preferredModes: ["Ranked"],
      gameRanks: [{ game: MLBB_GAME, rank: "Mythic", rankValue: 7 }],
      region: "Cambodia",
      languages: ["English", "Khmer"],
      playstyle: "Shot-caller",
      mlbbRole: "Tank",
      mlbbLane: "Roam",
      availability: "Weekday evenings",
      trustScore: 88,
      lastActive: new Date()
    };

    const lowerFit: MatchmakingUser = {
      username: "FarAwayJungle",
      preferredGames: [MLBB_GAME],
      preferredModes: ["Classic"],
      gameRanks: [{ game: MLBB_GAME, rank: "Grandmaster", rankValue: 4 }],
      region: "NA",
      languages: ["Spanish"],
      playstyle: "Supportive",
      mlbbRole: "Assassin",
      mlbbLane: "Jungle",
      availability: "Late night",
      trustScore: 45,
      lastActive: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8)
    };

    const ranked = rankCandidates(currentUser, [lowerFit, highFit], {
      game: MLBB_GAME,
      mlbbRole: "Tank",
      mlbbLane: "Roam",
      language: "Khmer",
      region: "Cambodia",
      mode: "Ranked",
      availability: "Weekday evenings"
    });
    expect(ranked[0].candidate.username).toBe("RoamCaptain");
    expect(ranked[0].scoreBreakdown.total).toBeGreaterThan(ranked[1].scoreBreakdown.total);
    expect(ranked[0].scoreBreakdown.tags).toContain("Role fit");
    expect(ranked[0].scoreBreakdown.tags).toContain("Lane match");
  });
});
