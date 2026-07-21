import type { IUser } from "../models/User";

export function toPublicUser(user: IUser) {
  return {
    id: user._id.toString(),
    username: user.username,
    email: user.email,
    avatar: user.avatar,
    bio: user.bio,
    preferredGames: user.preferredGames,
    preferredModes: user.preferredModes,
    gameRanks: user.gameRanks,
    region: user.region,
    languages: user.languages,
    playstyle: user.playstyle,
    mlbbRole: user.mlbbRole,
    mlbbLane: user.mlbbLane,
    availability: user.availability,
    trustScore: user.trustScore,
    winRate: user.winRate,
    lastActive: user.lastActive,
    role: user.role,
    sellerRating: user.sellerRating
  };
}
