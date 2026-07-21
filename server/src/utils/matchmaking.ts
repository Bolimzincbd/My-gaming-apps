export interface RankedGame {
  game: string;
  rank: string;
  rankValue: number;
}

export interface MatchmakingUser {
  _id?: string;
  username: string;
  preferredGames: string[];
  preferredModes: string[];
  gameRanks: RankedGame[];
  region: string;
  languages: string[];
  playstyle: string;
  mlbbRole?: string;
  mlbbLane?: string;
  availability?: string;
  trustScore?: number;
  sellerRating?: number;
  lastActive: Date | string;
}

export interface MatchmakingFilters {
  game: string;
  rankValue?: number;
  region?: string;
  language?: string;
  mode?: string;
  playstyle?: string;
  mlbbRole?: string;
  mlbbLane?: string;
  availability?: string;
}

export interface ScoreBreakdown {
  total: number;
  rank: number;
  role: number;
  lane: number;
  region: number;
  language: number;
  mode: number;
  playstyle: number;
  availability: number;
  trust: number;
  activity: number;
  tags: string[];
}

const compatibleStyles = new Map<string, string[]>([
  ["Aggressive", ["Aggressive", "Objective-focused", "Shot-caller"]],
  ["Strategic", ["Strategic", "Shot-caller", "Objective-focused"]],
  ["Supportive", ["Supportive", "Shot-caller", "Flexible"]],
  ["Shot-caller", ["Shot-caller", "Supportive", "Strategic"]],
  ["Objective-focused", ["Objective-focused", "Strategic", "Aggressive"]],
  ["Flexible", ["Flexible", "Strategic", "Supportive", "Objective-focused"]]
]);

const compatibleRoles = new Map<string, string[]>([
  ["Tank", ["Tank", "Support"]],
  ["Fighter", ["Fighter", "Tank", "Assassin"]],
  ["Assassin", ["Assassin", "Fighter", "Mage"]],
  ["Mage", ["Mage", "Support", "Assassin"]],
  ["Marksman", ["Marksman", "Support", "Tank"]],
  ["Support", ["Support", "Tank", "Marksman"]]
]);

function findRankValue(user: MatchmakingUser, game: string) {
  return user.gameRanks.find((entry) => entry.game === game)?.rankValue;
}

function normalizeDate(value: Date | string) {
  return value instanceof Date ? value : new Date(value);
}

function availabilityScore(wanted: string | undefined, candidate: string | undefined) {
  if (!wanted || !candidate) return 3;
  if (candidate === wanted) return 6;
  if (candidate === "Flexible" || wanted === "Flexible") return 4;
  return 0;
}

export function calculateMatchScore(
  currentUser: MatchmakingUser,
  candidate: MatchmakingUser,
  filters: MatchmakingFilters
): ScoreBreakdown | null {
  if (!candidate.preferredGames.includes(filters.game)) {
    return null;
  }

  const tags: string[] = [];
  const currentRank = filters.rankValue ?? findRankValue(currentUser, filters.game) ?? 5;
  const candidateRank = findRankValue(candidate, filters.game) ?? currentRank;
  const rankGap = Math.abs(currentRank - candidateRank);
  const rank = Math.max(6, 28 - rankGap * 4);
  if (rankGap <= 1) tags.push("Close MLBB rank");

  const wantedRole = filters.mlbbRole ?? currentUser.mlbbRole;
  const roleOptions = wantedRole ? compatibleRoles.get(wantedRole) ?? [wantedRole] : [];
  const role = wantedRole && candidate.mlbbRole === wantedRole ? 12 : candidate.mlbbRole && roleOptions.includes(candidate.mlbbRole) ? 8 : 2;
  if (role >= 12) tags.push("Role fit");
  else if (role >= 8) tags.push("Role synergy");

  const wantedLane = filters.mlbbLane ?? currentUser.mlbbLane;
  const lane = wantedLane && candidate.mlbbLane === wantedLane ? 12 : candidate.mlbbLane ? 4 : 0;
  if (lane >= 12) tags.push("Lane match");

  const region = filters.region
    ? candidate.region === filters.region
      ? 12
      : 0
    : candidate.region === currentUser.region
      ? 12
      : 4;
  if (region >= 12) tags.push("Same region");

  const wantedLanguage = filters.language ?? currentUser.languages[0];
  const language = candidate.languages.includes(wantedLanguage)
    ? 10
    : currentUser.languages.some((languageCode) => candidate.languages.includes(languageCode))
      ? 5
      : 0;
  if (language >= 10) tags.push("Shared language");

  const wantedMode = filters.mode ?? currentUser.preferredModes[0];
  const mode = wantedMode && candidate.preferredModes.includes(wantedMode) ? 8 : candidate.preferredModes.length ? 3 : 0;
  if (mode >= 8) tags.push("Queue mode fit");

  const currentStyle = filters.playstyle ?? currentUser.playstyle;
  const styleOptions = compatibleStyles.get(currentStyle) ?? [currentStyle];
  const playstyle = styleOptions.includes(candidate.playstyle) ? 8 : 2;
  if (playstyle >= 8) tags.push("Playstyle fit");

  const availability = availabilityScore(filters.availability ?? currentUser.availability, candidate.availability);
  if (availability >= 6) tags.push("Same availability");
  else if (availability >= 4) tags.push("Flexible schedule");

  const trust = Math.round(((candidate.trustScore ?? 60) / 100) * 8);
  if ((candidate.trustScore ?? 0) >= 80) tags.push("High trust");

  const daysSinceActive = Math.floor(
    (Date.now() - normalizeDate(candidate.lastActive).getTime()) / (1000 * 60 * 60 * 24)
  );
  const activity = daysSinceActive <= 1 ? 4 : daysSinceActive <= 3 ? 3 : daysSinceActive <= 7 ? 2 : 1;
  if (activity >= 3) tags.push("Recently active");

  return {
    total: rank + role + lane + region + language + mode + playstyle + availability + trust + activity,
    rank,
    role,
    lane,
    region,
    language,
    mode,
    playstyle,
    availability,
    trust,
    activity,
    tags
  };
}

export function rankCandidates(
  currentUser: MatchmakingUser,
  candidates: MatchmakingUser[],
  filters: MatchmakingFilters
) {
  return candidates
    .map((candidate) => ({
      candidate,
      scoreBreakdown: calculateMatchScore(currentUser, candidate, filters)
    }))
    .filter((entry): entry is { candidate: MatchmakingUser; scoreBreakdown: ScoreBreakdown } => Boolean(entry.scoreBreakdown))
    .sort((a, b) => b.scoreBreakdown.total - a.scoreBreakdown.total);
}
