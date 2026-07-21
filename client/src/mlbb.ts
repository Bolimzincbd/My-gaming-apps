export const MLBB_GAME = "Mobile Legends: Bang Bang";

export const MLBB_RANKS = [
  "Warrior",
  "Elite",
  "Master",
  "Grandmaster",
  "Epic",
  "Legend",
  "Mythic",
  "Mythical Honor",
  "Mythical Glory",
  "Mythical Immortal"
];

export const MLBB_ROLES = ["Tank", "Fighter", "Assassin", "Mage", "Marksman", "Support"];
export const MLBB_LANES = ["EXP Lane", "Jungle", "Mid Lane", "Gold Lane", "Roam"];
export const MLBB_PLAYSTYLES = ["Aggressive", "Strategic", "Supportive", "Shot-caller", "Objective-focused", "Flexible"];
export const MLBB_AVAILABILITY = ["Weekday evenings", "Weekend nights", "Late night", "After school", "Flexible"];
export const MLBB_REGIONS = ["SEA", "Cambodia", "Indonesia", "Philippines", "Malaysia", "Singapore", "Thailand"];
export const MLBB_LANGUAGES = ["English", "Khmer", "Indonesian", "Tagalog", "Malay", "Thai"];
export const MLBB_MODES = ["Ranked", "Classic", "Brawl", "Custom Scrim", "MCL"];

export const MARKET_CATEGORIES = [
  "Coaching",
  "Hero Guide",
  "Rank Mentoring",
  "Squad Scrim",
  "Emblem Build",
  "Replay Review",
  "Tournament Prep",
  "Digital Asset"
];

export const ESCROW_STATUSES = [
  "pending_payment",
  "escrow_secured",
  "seller_delivering",
  "delivered",
  "buyer_confirmed",
  "released_to_seller",
  "disputed",
  "refunded_to_buyer",
  "cancelled"
] as const;

export type EscrowStatus = (typeof ESCROW_STATUSES)[number];
