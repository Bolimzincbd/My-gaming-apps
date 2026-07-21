import type { EscrowStatus } from "./mlbb";

export interface RankedGame {
  game: string;
  rank: string;
  rankValue: number;
}

export interface User {
  id: string;
  username: string;
  email?: string;
  avatar: string;
  bio: string;
  preferredGames: string[];
  preferredModes: string[];
  gameRanks: RankedGame[];
  region: string;
  languages: string[];
  playstyle: string;
  mlbbRole: string;
  mlbbLane: string;
  availability: string;
  trustScore: number;
  winRate: number;
  lastActive: string;
  role: "user" | "seller" | "admin";
  sellerRating: number;
}

export interface Game {
  _id: string;
  name: string;
  slug: string;
  rankSystem: string[];
  supportedModes: string[];
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

export interface MatchSuggestion {
  user: {
    id: string;
    username: string;
    avatar: string;
    region: string;
    languages: string[];
    playstyle: string;
    mlbbRole: string;
    mlbbLane: string;
    availability: string;
    trustScore: number;
    preferredModes: string[];
    gameRank?: RankedGame;
    sellerRating: number;
  };
  scoreBreakdown: ScoreBreakdown;
}

export interface MatchRequestUser {
  _id: string;
  username: string;
  avatar: string;
  region: string;
  languages: string[];
  playstyle: string;
  mlbbRole: string;
  mlbbLane: string;
  availability: string;
  trustScore: number;
}

export interface MatchRequest {
  _id: string;
  requesterId: MatchRequestUser;
  targetUserId: MatchRequestUser;
  targetGame: string;
  desiredRank: string;
  desiredRankValue: number;
  region: string;
  language: string;
  mode: string;
  playstyle: string;
  mlbbRole: string;
  mlbbLane: string;
  availability: string;
  scoreBreakdown?: ScoreBreakdown;
  status: string;
  createdAt: string;
}

export interface Match {
  id: string;
  game: string;
  status: string;
  scoreBreakdown: ScoreBreakdown;
  chatRoomId: string | null;
  participants: Array<{
    id: string;
    username: string;
    avatar: string;
    role: string;
    region: string;
    languages: string[];
    mlbbRole: string;
    mlbbLane: string;
    availability: string;
    trustScore: number;
    sellerRating: number;
  }>;
  createdAt: string;
}

export interface ChatRoom {
  id: string;
  matchId: string;
  participants: Array<{
    id: string;
    username: string;
    avatar: string;
    region: string;
    languages: string[];
    role: string;
  }>;
  createdAt: string;
}

export interface Message {
  _id: string;
  roomId: string;
  senderId: { _id: string; username: string; avatar: string };
  content: string;
  createdAt: string;
}

export interface SellerInfo {
  _id: string;
  username: string;
  avatar: string;
  sellerRating: number;
  trustScore?: number;
  region?: string;
  languages?: string[];
}

export interface Product {
  _id: string;
  title: string;
  description: string;
  game: string;
  category: string;
  listingType: "service" | "digital_product";
  price: number;
  images: string[];
  sellerId: SellerInfo;
  status: string;
  stock: number;
  deliveryTimeHours: number;
  deliveryTimeLabel: string;
  escrowEligible: boolean;
  tags: string[];
  createdAt: string;
}

export interface CartItem {
  productId: string;
  title: string;
  game: string;
  image: string;
  price: number;
  quantity: number;
}

export interface Cart {
  _id: string;
  userId: string;
  items: CartItem[];
  subtotal: number;
  updatedAt: string;
}

export interface OrderItem {
  productId: string;
  sellerId: string | SellerInfo;
  title: string;
  price: number;
  quantity: number;
  image: string;
  game: string;
  category?: string;
  deliveryTimeHours?: number;
  deliveryTimeLabel?: string;
  escrowEligible?: boolean;
}

export interface OrderStatusHistory {
  status: EscrowStatus;
  actorRole: "buyer" | "seller" | "admin" | "system";
  byUserId?: string;
  note: string;
  createdAt: string;
}

export interface Order {
  _id: string;
  buyerId: string | { _id: string; username: string; email?: string };
  items: OrderItem[];
  total: number;
  paymentMethodMock: string;
  paymentStatusMock: string;
  fulfillmentStatus: string;
  escrowStatus: EscrowStatus;
  statusHistory: OrderStatusHistory[];
  disputeReason?: string;
  resolutionNote?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Review {
  _id: string;
  reviewerId: string;
  sellerId: string;
  orderId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Notification {
  _id: string;
  userId: string;
  type: string;
  content: string;
  read: boolean;
  link: string;
  createdAt: string;
}

export interface Report {
  _id: string;
  reporterId: { _id: string; username: string; email: string; role: string };
  targetType: string;
  targetId: string;
  reason: string;
  status: string;
  createdAt: string;
}
