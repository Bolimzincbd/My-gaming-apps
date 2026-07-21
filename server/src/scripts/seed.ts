import bcrypt from "bcryptjs";
import { connectDatabase, disconnectDatabase } from "../db/connect";
import { Game } from "../models/Game";
import { User } from "../models/User";
import { MatchRequest } from "../models/MatchRequest";
import { Match } from "../models/Match";
import { ChatRoom } from "../models/ChatRoom";
import { Message } from "../models/Message";
import { Product } from "../models/Product";
import { Cart } from "../models/Cart";
import { Order } from "../models/Order";
import { Review } from "../models/Review";
import { Report } from "../models/Report";
import { Notification } from "../models/Notification";
import { MLBB_GAME, MLBB_RANKS } from "../utils/mlbb";

async function seed() {
  await connectDatabase();

  await Promise.all([
    Game.deleteMany({}),
    User.deleteMany({}),
    MatchRequest.deleteMany({}),
    Match.deleteMany({}),
    ChatRoom.deleteMany({}),
    Message.deleteMany({}),
    Product.deleteMany({}),
    Cart.deleteMany({}),
    Order.deleteMany({}),
    Review.deleteMany({}),
    Report.deleteMany({}),
    Notification.deleteMany({})
  ]);

  await Game.create({
    name: MLBB_GAME,
    slug: "mobile-legends-bang-bang",
    rankSystem: MLBB_RANKS,
    supportedModes: ["Ranked", "Classic", "Brawl", "Custom Scrim", "MCL"]
  });

  const passwordHash = await bcrypt.hash("Password123!", 10);
  const users = await User.insertMany([
    {
      username: "AdminMythic",
      email: "admin@gamematcher.gg",
      passwordHash,
      avatar: "https://api.dicebear.com/9.x/bottts/svg?seed=AdminMythic",
      bio: "MLBB marketplace moderator and practicum demo administrator.",
      preferredGames: [MLBB_GAME],
      preferredModes: ["Ranked", "Custom Scrim"],
      gameRanks: [{ game: MLBB_GAME, rank: "Mythical Glory", rankValue: 9 }],
      region: "Cambodia",
      languages: ["English", "Khmer"],
      playstyle: "Strategic",
      mlbbRole: "Tank",
      mlbbLane: "Roam",
      availability: "Weekday evenings",
      trustScore: 95,
      winRate: 61,
      role: "admin",
      sellerRating: 4.9,
      lastActive: new Date()
    },
    {
      username: "MythicCoach",
      email: "seller@gamematcher.gg",
      passwordHash,
      avatar: "https://api.dicebear.com/9.x/bottts/svg?seed=MythicCoach",
      bio: "MLBB coach offering hero pool, draft, macro, and replay review services with mock escrow orders.",
      preferredGames: [MLBB_GAME],
      preferredModes: ["Ranked", "MCL"],
      gameRanks: [{ game: MLBB_GAME, rank: "Mythical Glory", rankValue: 9 }],
      region: "Cambodia",
      languages: ["English", "Khmer"],
      playstyle: "Shot-caller",
      mlbbRole: "Mage",
      mlbbLane: "Mid Lane",
      availability: "Weekend nights",
      trustScore: 91,
      winRate: 68,
      role: "seller",
      sellerRating: 4.8,
      lastActive: new Date()
    },
    {
      username: "GoldLanePilot",
      email: "user@gamematcher.gg",
      passwordHash,
      avatar: "https://api.dicebear.com/9.x/bottts/svg?seed=GoldLanePilot",
      bio: "Evening MLBB ranked grinder looking for stable Roam and Jungle partners.",
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
      winRate: 56,
      role: "user",
      sellerRating: 0,
      lastActive: new Date()
    },
    {
      username: "RoamCaptain",
      email: "roam@gamematcher.gg",
      passwordHash,
      avatar: "https://api.dicebear.com/9.x/bottts/svg?seed=RoamCaptain",
      bio: "Tank/Roam main who calls turtle, lord, and bush vision timings.",
      preferredGames: [MLBB_GAME],
      preferredModes: ["Ranked", "Custom Scrim"],
      gameRanks: [{ game: MLBB_GAME, rank: "Mythic", rankValue: 7 }],
      region: "Cambodia",
      languages: ["English", "Khmer"],
      playstyle: "Shot-caller",
      mlbbRole: "Tank",
      mlbbLane: "Roam",
      availability: "Weekday evenings",
      trustScore: 87,
      winRate: 58,
      role: "user",
      sellerRating: 0,
      lastActive: new Date(Date.now() - 1000 * 60 * 60 * 3)
    },
    {
      username: "JungleTempo",
      email: "jungle@gamematcher.gg",
      passwordHash,
      avatar: "https://api.dicebear.com/9.x/bottts/svg?seed=JungleTempo",
      bio: "Assassin/Jungle player focused on buff control and fast objective trades.",
      preferredGames: [MLBB_GAME],
      preferredModes: ["Ranked"],
      gameRanks: [{ game: MLBB_GAME, rank: "Legend", rankValue: 6 }],
      region: "SEA",
      languages: ["English", "Thai"],
      playstyle: "Aggressive",
      mlbbRole: "Assassin",
      mlbbLane: "Jungle",
      availability: "Late night",
      trustScore: 74,
      winRate: 54,
      role: "user",
      sellerRating: 0,
      lastActive: new Date(Date.now() - 1000 * 60 * 60 * 16)
    }
  ]);

  const [admin, seller, buyer, roamer, jungler] = users;

  const products = await Product.insertMany([
    {
      title: "MLBB Mythic Duo Coaching",
      description: "One-hour live coaching for ranked duo queue, draft planning, hero pool tuning, rotation timing, and post-game notes.",
      game: MLBB_GAME,
      category: "Coaching",
      listingType: "service",
      price: 25,
      images: ["/images/products/mlbb-coaching.svg"],
      sellerId: seller._id,
      status: "active",
      stock: 6,
      deliveryTimeHours: 24,
      deliveryTimeLabel: "Within 24 hours",
      escrowEligible: true,
      tags: ["mythic", "duo", "draft"]
    },
    {
      title: "Hero Counter-Pick Guide Pack",
      description: "Digital MLBB guide pack covering counter-picks, item swaps, emblem choices, and lane-specific matchup notes.",
      game: MLBB_GAME,
      category: "Hero Guide",
      listingType: "digital_product",
      price: 12,
      images: ["/images/products/mlbb-guide.svg"],
      sellerId: seller._id,
      status: "active",
      stock: 20,
      deliveryTimeHours: 6,
      deliveryTimeLabel: "Same day",
      escrowEligible: true,
      tags: ["heroes", "counter", "emblem"]
    },
    {
      title: "Marksman Emblem Build Board",
      description: "Editable build board for Gold Lane heroes with item order, emblem trees, battle spell notes, and patch reminders.",
      game: MLBB_GAME,
      category: "Emblem Build",
      listingType: "digital_product",
      price: 9,
      images: ["/images/products/mlbb-emblem.svg"],
      sellerId: seller._id,
      status: "active",
      stock: 30,
      deliveryTimeHours: 2,
      deliveryTimeLabel: "Instant after seller confirmation",
      escrowEligible: true,
      tags: ["gold lane", "emblem", "build"]
    },
    {
      title: "5v5 Squad Scrim Setup",
      description: "Arrange a structured custom scrim session with role checklist, draft rules, match recap, and improvement notes.",
      game: MLBB_GAME,
      category: "Squad Scrim",
      listingType: "service",
      price: 35,
      images: ["/images/products/mlbb-scrim.svg"],
      sellerId: admin._id,
      status: "active",
      stock: 4,
      deliveryTimeHours: 48,
      deliveryTimeLabel: "1-2 days",
      escrowEligible: true,
      tags: ["scrim", "team", "custom"]
    },
    {
      title: "Replay Review for Turtle/Lord Control",
      description: "Seller reviews one replay and returns timestamped notes for turtle setup, lord baiting, vision, and wave pressure.",
      game: MLBB_GAME,
      category: "Replay Review",
      listingType: "service",
      price: 18,
      images: ["/images/products/mlbb-review.svg"],
      sellerId: seller._id,
      status: "paused",
      stock: 8,
      deliveryTimeHours: 24,
      deliveryTimeLabel: "Within 24 hours",
      escrowEligible: true,
      tags: ["replay", "macro", "objective"]
    }
  ]);

  await MatchRequest.create({
    requesterId: buyer._id,
    targetUserId: roamer._id,
    targetGame: MLBB_GAME,
    desiredRank: "Mythic",
    desiredRankValue: 7,
    region: "Cambodia",
    language: "Khmer",
    mode: "Ranked",
    playstyle: "Objective-focused",
    mlbbRole: "Tank",
    mlbbLane: "Roam",
    availability: "Weekday evenings",
    status: "pending",
    scoreBreakdown: { total: 100, rank: 28, role: 12, lane: 12, region: 12, language: 10, mode: 8, playstyle: 8, availability: 6, trust: 7, activity: 4, tags: ["Close MLBB rank", "Role fit", "Lane match", "Same region", "Shared language"] }
  });

  const match = await Match.create({
    userIds: [buyer._id, jungler._id],
    game: MLBB_GAME,
    scoreBreakdown: { total: 81, rank: 24, role: 8, lane: 4, region: 4, language: 5, mode: 8, playstyle: 8, availability: 0, trust: 6, activity: 3, tags: ["Role synergy", "Queue mode fit", "Playstyle fit", "Recently active"] },
    status: "active"
  });

  const room = await ChatRoom.create({ participantIds: [buyer._id, jungler._id], matchId: match._id });
  match.chatRoomId = room._id;
  await match.save();

  await Message.insertMany([
    { roomId: room._id, senderId: buyer._id, content: "Can you jungle around 8 tonight? I can hold Gold Lane and rotate for turtle." },
    { roomId: room._id, senderId: jungler._id, content: "Yes. I will start litho side and ping first turtle setup." }
  ]);

  await Cart.create({
    userId: buyer._id,
    items: [{ productId: products[0]._id, title: products[0].title, game: products[0].game, image: products[0].images[0], price: products[0].price, quantity: 1 }],
    subtotal: products[0].price
  });

  const releasedOrder = await Order.create({
    buyerId: buyer._id,
    items: [{
      productId: products[1]._id,
      sellerId: seller._id,
      title: products[1].title,
      price: products[1].price,
      quantity: 1,
      image: products[1].images[0],
      game: products[1].game,
      category: products[1].category,
      deliveryTimeHours: products[1].deliveryTimeHours,
      deliveryTimeLabel: products[1].deliveryTimeLabel,
      escrowEligible: true
    }],
    total: products[1].price,
    paymentMethodMock: "Mock secure wallet",
    paymentStatusMock: "released",
    fulfillmentStatus: "completed",
    escrowStatus: "released_to_seller",
    statusHistory: [
      { status: "pending_payment", actorRole: "buyer", byUserId: buyer._id, note: "Mock checkout opened.", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 30) },
      { status: "escrow_secured", actorRole: "system", note: "Mock funds secured.", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 29) },
      { status: "seller_delivering", actorRole: "seller", byUserId: seller._id, note: "Seller prepared guide pack.", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 25) },
      { status: "delivered", actorRole: "seller", byUserId: seller._id, note: "Guide pack delivered.", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24) },
      { status: "buyer_confirmed", actorRole: "buyer", byUserId: buyer._id, note: "Buyer confirmed file access.", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 22) },
      { status: "released_to_seller", actorRole: "admin", byUserId: admin._id, note: "Admin released mock escrow after confirmation.", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 20) }
    ]
  });

  const disputedOrder = await Order.create({
    buyerId: buyer._id,
    items: [{
      productId: products[3]._id,
      sellerId: admin._id,
      title: products[3].title,
      price: products[3].price,
      quantity: 1,
      image: products[3].images[0],
      game: products[3].game,
      category: products[3].category,
      deliveryTimeHours: products[3].deliveryTimeHours,
      deliveryTimeLabel: products[3].deliveryTimeLabel,
      escrowEligible: true
    }],
    total: products[3].price,
    paymentMethodMock: "Mock secure wallet",
    paymentStatusMock: "secured",
    fulfillmentStatus: "disputed",
    escrowStatus: "disputed",
    disputeReason: "Scrim time was not agreed clearly in the demo order.",
    statusHistory: [
      { status: "pending_payment", actorRole: "buyer", byUserId: buyer._id, note: "Mock checkout opened.", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 16) },
      { status: "escrow_secured", actorRole: "system", note: "Mock funds secured.", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 15) },
      { status: "seller_delivering", actorRole: "seller", byUserId: admin._id, note: "Seller arranging scrim.", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 10) },
      { status: "disputed", actorRole: "buyer", byUserId: buyer._id, note: "Scrim time was not agreed clearly in the demo order.", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4) }
    ]
  });

  await Review.create({
    reviewerId: buyer._id,
    sellerId: seller._id,
    orderId: releasedOrder._id,
    rating: 5,
    comment: "Clear MLBB guide pack, fast delivery, and the mock escrow flow was easy to follow."
  });

  await Report.insertMany([
    { reporterId: buyer._id, targetType: "listing", targetId: products[4]._id, reason: "Please verify this replay review listing is available before activation.", status: "pending" },
    { reporterId: admin._id, targetType: "user", targetId: jungler._id, reason: "Review repeated late-night queue spam in demo messages.", status: "reviewed" }
  ]);

  await Notification.insertMany([
    { userId: roamer._id, type: "match-request", content: "GoldLanePilot wants a Roam partner for MLBB ranked.", link: "/matcher" },
    { userId: buyer._id, type: "match-ready", content: "Your MLBB match with JungleTempo has a live chat room.", link: `/matches/${match._id.toString()}/chat` },
    { userId: seller._id, type: "new-order", content: "A released hero guide order is visible in seller tools.", link: "/seller" },
    { userId: admin._id, type: "escrow-update", content: `Disputed mock escrow order ${disputedOrder._id.toString()} needs admin review.`, link: "/admin" }
  ]);

  console.log("MLBB seed completed successfully.");
  console.log("admin@gamematcher.gg / Password123!");
  console.log("seller@gamematcher.gg / Password123!");
  console.log("user@gamematcher.gg / Password123!");
}

seed().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(async () => {
  await disconnectDatabase();
});
