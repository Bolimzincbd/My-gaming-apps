import { Router } from "express";
import { isValidObjectId } from "mongoose";
import { z } from "zod";
import { requireAuth, requireRole } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { Product } from "../models/Product";
import { User } from "../models/User";
import { Cart } from "../models/Cart";
import { Order } from "../models/Order";
import { Review } from "../models/Review";
import { Report } from "../models/Report";
import { Notification } from "../models/Notification";
import { HttpError } from "../utils/httpError";
import { ESCROW_STATUSES, type EscrowStatus, MLBB_GAME, MLBB_MARKET_CATEGORIES } from "../utils/mlbb";

const router = Router();

const productSchema = z.object({
  title: z.string().min(4).max(120),
  description: z.string().min(20).max(1200),
  game: z.string().min(2).default(MLBB_GAME),
  category: z.enum(MLBB_MARKET_CATEGORIES as [string, ...string[]]),
  listingType: z.enum(["service", "digital_product"]).default("service"),
  price: z.number().min(0).max(10000),
  images: z.array(z.string()).min(1),
  status: z.enum(["active", "paused", "sold", "flagged"]).default("active"),
  stock: z.number().int().min(0).max(999),
  deliveryTimeHours: z.number().int().min(1).max(336).default(24),
  deliveryTimeLabel: z.string().max(60).optional(),
  escrowEligible: z.boolean().default(true),
  tags: z.array(z.string().max(32)).max(8).default([])
});

const addToCartSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().min(0).max(10)
});

const checkoutSchema = z.object({
  paymentMethod: z.string().default("Mock secure wallet")
});

const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().min(10).max(300)
});

const reportSchema = z.object({
  reason: z.string().min(10).max(300)
});

const noteSchema = z.object({
  note: z.string().max(300).optional()
});

const disputeSchema = z.object({
  reason: z.string().min(10).max(500)
});

const resolveDisputeSchema = z.object({
  resolution: z.enum(["release", "refund"]),
  note: z.string().min(10).max(500)
});

function assertObjectId(value: string, label = "id") {
  if (!isValidObjectId(value)) {
    throw new HttpError(400, `Invalid ${label}`);
  }
}

function routeParam(value: string | string[] | undefined, label: string) {
  if (!value || Array.isArray(value)) {
    throw new HttpError(400, `Invalid ${label}`);
  }
  return value;
}

function calculateSubtotal(items: Array<{ price: number; quantity: number }>) {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

async function getOrCreateCart(userId: string) {
  let cart = await Cart.findOne({ userId });
  if (!cart) {
    cart = await Cart.create({ userId, items: [], subtotal: 0 });
  }
  return cart;
}

async function updateSellerRating(sellerId: string) {
  const reviews = await Review.find({ sellerId });
  const rating = reviews.length ? Number((reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)) : 0;
  await User.findByIdAndUpdate(sellerId, { sellerRating: rating });
}

function statusToPayment(status: EscrowStatus) {
  if (status === "pending_payment") return "pending";
  if (status === "released_to_seller") return "released";
  if (status === "refunded_to_buyer") return "refunded";
  if (status === "cancelled") return "cancelled";
  return "secured";
}

function statusToFulfillment(status: EscrowStatus) {
  if (status === "seller_delivering") return "delivering";
  if (status === "delivered") return "delivered";
  if (status === "buyer_confirmed" || status === "released_to_seller") return "completed";
  if (status === "disputed") return "disputed";
  if (status === "refunded_to_buyer") return "refunded";
  if (status === "cancelled") return "cancelled";
  return "processing";
}

function applyEscrowStatus(
  order: any,
  status: EscrowStatus,
  actorRole: "buyer" | "seller" | "admin" | "system",
  byUserId?: string,
  note = ""
) {
  order.escrowStatus = status;
  order.paymentStatusMock = statusToPayment(status);
  order.fulfillmentStatus = statusToFulfillment(status);
  order.statusHistory.push({ status, actorRole, byUserId, note, createdAt: new Date() });
}

function ensureStatus(order: any, allowed: EscrowStatus[]) {
  if (!allowed.includes(order.escrowStatus)) {
    throw new HttpError(409, `Order is ${order.escrowStatus}; expected ${allowed.join(" or ")}`);
  }
}

function ensureBuyer(order: any, userId: string) {
  if (order.buyerId.toString() !== userId) {
    throw new HttpError(403, "You can only act on your own purchase");
  }
}

function ensureSeller(order: any, userId: string, isAdmin: boolean) {
  if (isAdmin) return;
  const hasSellerItem = (order.items as any[]).some((item) => item.sellerId.toString() === userId);
  if (!hasSellerItem) {
    throw new HttpError(403, "You can only act on orders for your listings");
  }
}

async function loadOrder(orderId: string) {
  assertObjectId(orderId, "order id");
  const order = await Order.findById(orderId);
  if (!order) {
    throw new HttpError(404, "Order not found");
  }
  return order;
}

async function notifyOrderParties(order: any, content: string) {
  const sellerIds = Array.from(new Set((order.items as any[]).map((item) => item.sellerId.toString())));
  await Notification.create([
    { userId: order.buyerId, type: "escrow-update", content, link: "/orders" },
    ...sellerIds.map((sellerId) => ({ userId: sellerId, type: "escrow-update", content, link: "/seller" }))
  ]);
}

router.get("/products/featured", asyncHandler(async (_req, res) => {
  const products = await Product.find({ status: "active", game: MLBB_GAME })
    .sort({ createdAt: -1 })
    .limit(4)
    .populate("sellerId", "username sellerRating avatar trustScore");
  res.json({ products });
}));

router.get("/products", asyncHandler(async (req, res) => {
  const query: Record<string, unknown> = { status: "active" };
  if (req.query.category) query.category = req.query.category;
  if (req.query.game) query.game = req.query.game;
  if (req.query.listingType) query.listingType = req.query.listingType;
  if (req.query.escrowEligible) query.escrowEligible = req.query.escrowEligible === "true";
  if (req.query.maxDeliveryHours) query.deliveryTimeHours = { $lte: Number(req.query.maxDeliveryHours) };
  if (req.query.minPrice || req.query.maxPrice) {
    query.price = {};
    if (req.query.minPrice) (query.price as Record<string, number>).$gte = Number(req.query.minPrice);
    if (req.query.maxPrice) (query.price as Record<string, number>).$lte = Number(req.query.maxPrice);
  }
  if (req.query.q) {
    query.$or = [
      { title: { $regex: req.query.q as string, $options: "i" } },
      { description: { $regex: req.query.q as string, $options: "i" } },
      { tags: { $regex: req.query.q as string, $options: "i" } }
    ];
  }

  const sortBy: any =
    req.query.sort === "priceAsc" ? { price: 1 } :
      req.query.sort === "priceDesc" ? { price: -1 } :
        req.query.sort === "deliveryFast" ? { deliveryTimeHours: 1 } :
          { createdAt: -1 };
  let products = await Product.find(query).sort(sortBy).populate("sellerId", "username sellerRating avatar region languages trustScore");
  if (req.query.minSellerRating) {
    const minRating = Number(req.query.minSellerRating);
    products = products.filter((product: any) => (product.sellerId?.sellerRating ?? 0) >= minRating);
  }
  res.json({ products });
}));

router.get("/products/:id", asyncHandler(async (req, res) => {
  const productId = routeParam(req.params.id, "product id");
  assertObjectId(productId, "product id");
  const product = await Product.findById(productId).populate("sellerId", "username sellerRating avatar region languages trustScore");
  if (!product) {
    throw new HttpError(404, "Product not found");
  }
  const related = await Product.find({ _id: { $ne: product._id }, game: product.game, status: "active" }).limit(3).populate("sellerId", "username sellerRating avatar");
  res.json({ product, related });
}));

router.post("/products", requireAuth, requireRole(["seller", "admin"]), asyncHandler(async (req, res) => {
  const payload = productSchema.parse(req.body);
  const product = await Product.create({
    ...payload,
    deliveryTimeLabel: payload.deliveryTimeLabel ?? `${payload.deliveryTimeHours} hours`,
    sellerId: req.user!.userId
  });
  res.status(201).json({ product });
}));

router.put("/products/:id", requireAuth, requireRole(["seller", "admin"]), asyncHandler(async (req, res) => {
  const productId = routeParam(req.params.id, "product id");
  assertObjectId(productId, "product id");
  const payload = productSchema.parse(req.body);
  const product = await Product.findById(productId);
  if (!product) throw new HttpError(404, "Product not found");
  if (req.user!.role !== "admin" && product.sellerId.toString() !== req.user!.userId) {
    throw new HttpError(403, "You can only edit your own listings");
  }
  Object.assign(product, {
    ...payload,
    deliveryTimeLabel: payload.deliveryTimeLabel ?? `${payload.deliveryTimeHours} hours`
  });
  await product.save();
  res.json({ product });
}));

router.delete("/products/:id", requireAuth, requireRole(["seller", "admin"]), asyncHandler(async (req, res) => {
  const productId = routeParam(req.params.id, "product id");
  assertObjectId(productId, "product id");
  const product = await Product.findById(productId);
  if (!product) throw new HttpError(404, "Product not found");
  if (req.user!.role !== "admin" && product.sellerId.toString() !== req.user!.userId) {
    throw new HttpError(403, "You can only delete your own listings");
  }
  await product.deleteOne();
  res.json({ message: "Listing removed" });
}));

router.post("/products/:id/report", requireAuth, asyncHandler(async (req, res) => {
  const productId = routeParam(req.params.id, "product id");
  assertObjectId(productId, "product id");
  const payload = reportSchema.parse(req.body);
  await Report.create({ reporterId: req.user!.userId, targetType: "listing", targetId: productId, reason: payload.reason });
  res.status(201).json({ message: "Listing report submitted" });
}));

router.get("/cart", requireAuth, asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user!.userId);
  res.json({ cart });
}));

router.post("/cart/items", requireAuth, asyncHandler(async (req, res) => {
  const payload = addToCartSchema.parse(req.body);
  assertObjectId(payload.productId, "product id");
  const product = await Product.findById(payload.productId);
  if (!product || product.status !== "active") throw new HttpError(404, "Product is not available");
  if (payload.quantity > product.stock) throw new HttpError(400, "Requested quantity exceeds available stock");

  const cart = await getOrCreateCart(req.user!.userId);
  const existingItem = cart.items.find((item: any) => item.productId.toString() === payload.productId);

  if (payload.quantity === 0) {
    cart.items = cart.items.filter((item: any) => item.productId.toString() !== payload.productId) as any;
  } else if (existingItem) {
    existingItem.quantity = payload.quantity;
  } else {
    cart.items.push({ productId: product._id, title: product.title, game: product.game, image: product.images[0], price: product.price, quantity: payload.quantity } as any);
  }

  cart.subtotal = calculateSubtotal((cart.items as any[]).map((item: any) => ({ price: item.price, quantity: item.quantity })));
  await cart.save();
  res.json({ cart });
}));

router.delete("/cart/items/:productId", requireAuth, asyncHandler(async (req, res) => {
  const productId = routeParam(req.params.productId, "product id");
  assertObjectId(productId, "product id");
  const cart = await getOrCreateCart(req.user!.userId);
  cart.items = cart.items.filter((item: any) => item.productId.toString() !== productId) as any;
  cart.subtotal = calculateSubtotal((cart.items as any[]).map((item: any) => ({ price: item.price, quantity: item.quantity })));
  await cart.save();
  res.json({ cart });
}));

router.post("/checkout", requireAuth, asyncHandler(async (req, res) => {
  const payload = checkoutSchema.parse(req.body);
  const cart = await getOrCreateCart(req.user!.userId);
  if (!cart.items.length) throw new HttpError(400, "Your cart is empty");

  const orderItems: any[] = [];
  for (const item of cart.items as any[]) {
    const product = await Product.findById(item.productId);
    if (!product || product.status !== "active") throw new HttpError(400, `${item.title} is no longer available`);
    if (product.stock < item.quantity) throw new HttpError(400, `${item.title} does not have enough stock`);
    product.stock -= item.quantity;
    if (product.stock === 0) product.status = "sold";
    await product.save();

    orderItems.push({
      ...item.toObject(),
      sellerId: product.sellerId,
      category: product.category,
      deliveryTimeHours: product.deliveryTimeHours,
      deliveryTimeLabel: product.deliveryTimeLabel,
      escrowEligible: product.escrowEligible
    });
  }

  const order = await Order.create({
    buyerId: req.user!.userId,
    items: orderItems,
    total: cart.subtotal,
    paymentMethodMock: payload.paymentMethod,
    paymentStatusMock: "secured",
    fulfillmentStatus: "processing",
    escrowStatus: "escrow_secured",
    statusHistory: [
      { status: "pending_payment", actorRole: "buyer", byUserId: req.user!.userId, note: "Mock checkout opened.", createdAt: new Date() },
      { status: "escrow_secured", actorRole: "system", note: "Mock funds secured for demo escrow. No real payment was processed.", createdAt: new Date() }
    ]
  });

  await Notification.create((order.items as any[]).map((item: any) => ({
    userId: item.sellerId,
    type: "new-order",
    content: `New MLBB order received for ${item.title}. Mock escrow is secured.`,
    link: "/seller"
  })));
  cart.items = [] as any;
  cart.subtotal = 0;
  await cart.save();

  res.status(201).json({ message: "Mock escrow checkout completed. No real payment was processed.", order });
}));

router.get("/orders", requireAuth, asyncHandler(async (req, res) => {
  const purchases = await Order.find({ buyerId: req.user!.userId }).sort({ createdAt: -1 });
  const sales = await Order.find({ "items.sellerId": req.user!.userId }).sort({ createdAt: -1 });
  res.json({ purchases, sales });
}));

router.post("/orders/:orderId/seller-delivering", requireAuth, requireRole(["seller", "admin"]), asyncHandler(async (req, res) => {
  const payload = noteSchema.parse(req.body);
  const order = await loadOrder(routeParam(req.params.orderId, "order id"));
  ensureSeller(order, req.user!.userId, req.user!.role === "admin");
  ensureStatus(order, ["escrow_secured"]);
  applyEscrowStatus(order, "seller_delivering", req.user!.role === "admin" ? "admin" : "seller", req.user!.userId, payload.note ?? "Seller started delivery.");
  await order.save();
  await notifyOrderParties(order, "Seller started delivery for an MLBB marketplace order.");
  res.json({ order });
}));

router.post("/orders/:orderId/seller-delivered", requireAuth, requireRole(["seller", "admin"]), asyncHandler(async (req, res) => {
  const payload = noteSchema.parse(req.body);
  const order = await loadOrder(routeParam(req.params.orderId, "order id"));
  ensureSeller(order, req.user!.userId, req.user!.role === "admin");
  ensureStatus(order, ["escrow_secured", "seller_delivering"]);
  if (order.escrowStatus === "escrow_secured") {
    applyEscrowStatus(order, "seller_delivering", req.user!.role === "admin" ? "admin" : "seller", req.user!.userId, "Seller started and completed delivery in one step.");
  }
  applyEscrowStatus(order, "delivered", req.user!.role === "admin" ? "admin" : "seller", req.user!.userId, payload.note ?? "Seller marked order as delivered.");
  await order.save();
  await notifyOrderParties(order, "Seller marked an MLBB marketplace order as delivered.");
  res.json({ order });
}));

router.post("/orders/:orderId/buyer-confirm", requireAuth, asyncHandler(async (req, res) => {
  const payload = noteSchema.parse(req.body);
  const order = await loadOrder(routeParam(req.params.orderId, "order id"));
  ensureBuyer(order, req.user!.userId);
  ensureStatus(order, ["delivered"]);
  applyEscrowStatus(order, "buyer_confirmed", "buyer", req.user!.userId, payload.note ?? "Buyer confirmed delivery.");
  await order.save();
  await notifyOrderParties(order, "Buyer confirmed delivery. Admin can now release mock escrow funds.");
  res.json({ order });
}));

router.post("/orders/:orderId/dispute", requireAuth, asyncHandler(async (req, res) => {
  const payload = disputeSchema.parse(req.body);
  const order = await loadOrder(routeParam(req.params.orderId, "order id"));
  ensureBuyer(order, req.user!.userId);
  ensureStatus(order, ["escrow_secured", "seller_delivering", "delivered", "buyer_confirmed"]);
  order.disputeReason = payload.reason;
  applyEscrowStatus(order, "disputed", "buyer", req.user!.userId, payload.reason);
  await order.save();
  await notifyOrderParties(order, "Buyer opened a dispute. Admin review is required.");
  res.json({ order });
}));

router.post("/orders/:orderId/cancel", requireAuth, asyncHandler(async (req, res) => {
  const payload = noteSchema.parse(req.body);
  const order = await loadOrder(routeParam(req.params.orderId, "order id"));
  ensureBuyer(order, req.user!.userId);
  ensureStatus(order, ["pending_payment", "escrow_secured"]);
  applyEscrowStatus(order, "cancelled", "buyer", req.user!.userId, payload.note ?? "Buyer cancelled before delivery.");
  await order.save();
  await notifyOrderParties(order, "Buyer cancelled the order before seller delivery.");
  res.json({ order });
}));

router.post("/orders/:orderId/admin-release", requireAuth, requireRole(["admin"]), asyncHandler(async (req, res) => {
  const payload = noteSchema.parse(req.body);
  const order = await loadOrder(routeParam(req.params.orderId, "order id"));
  ensureStatus(order, ["buyer_confirmed", "delivered", "disputed"]);
  applyEscrowStatus(order, "released_to_seller", "admin", req.user!.userId, payload.note ?? "Admin released mock escrow funds to seller.");
  await order.save();
  await notifyOrderParties(order, "Admin released mock escrow funds to seller.");
  res.json({ order });
}));

router.post("/orders/:orderId/admin-refund", requireAuth, requireRole(["admin"]), asyncHandler(async (req, res) => {
  const payload = noteSchema.parse(req.body);
  const order = await loadOrder(routeParam(req.params.orderId, "order id"));
  ensureStatus(order, ["escrow_secured", "seller_delivering", "delivered", "buyer_confirmed", "disputed"]);
  applyEscrowStatus(order, "refunded_to_buyer", "admin", req.user!.userId, payload.note ?? "Admin refunded buyer in the mock escrow workflow.");
  await order.save();
  await notifyOrderParties(order, "Admin refunded buyer in the mock escrow workflow.");
  res.json({ order });
}));

router.post("/orders/:orderId/admin-resolve-dispute", requireAuth, requireRole(["admin"]), asyncHandler(async (req, res) => {
  const payload = resolveDisputeSchema.parse(req.body);
  const order = await loadOrder(routeParam(req.params.orderId, "order id"));
  ensureStatus(order, ["disputed"]);
  order.resolutionNote = payload.note;
  applyEscrowStatus(order, payload.resolution === "release" ? "released_to_seller" : "refunded_to_buyer", "admin", req.user!.userId, payload.note);
  await order.save();
  await notifyOrderParties(order, `Admin resolved dispute: ${payload.resolution === "release" ? "released to seller" : "refunded to buyer"}.`);
  res.json({ order });
}));

router.post("/orders/:orderId/review", requireAuth, asyncHandler(async (req, res) => {
  const payload = reviewSchema.parse(req.body);
  const order = await loadOrder(routeParam(req.params.orderId, "order id"));
  if (order.buyerId.toString() !== req.user!.userId) throw new HttpError(404, "Order not found");
  if (!["buyer_confirmed", "released_to_seller"].includes(order.escrowStatus)) {
    throw new HttpError(409, "Reviews are available after buyer confirmation or admin release");
  }
  const sellerId = (order.items as any[])[0]?.sellerId?.toString();
  if (!sellerId) throw new HttpError(400, "This order has no seller attached");

  const existing = await Review.findOne({ orderId: order._id, reviewerId: req.user!.userId });
  if (existing) throw new HttpError(409, "You already reviewed this order");

  const review = await Review.create({ reviewerId: req.user!.userId, sellerId, orderId: order._id, rating: payload.rating, comment: payload.comment });
  await updateSellerRating(sellerId);
  res.status(201).json({ review });
}));

router.get("/seller/overview", requireAuth, requireRole(["seller", "admin"]), asyncHandler(async (req, res) => {
  const products = await Product.find({ sellerId: req.user!.userId }).sort({ createdAt: -1 });
  const sales = await Order.find({ "items.sellerId": req.user!.userId }).sort({ createdAt: -1 });
  const activeListings = products.filter((product) => product.status === "active").length;
  const relevantLineTotal = (order: any) =>
    order.items
      .filter((item: any) => item.sellerId.toString() === req.user!.userId)
      .reduce((inner: number, item: any) => inner + item.price * item.quantity, 0);
  const grossValue = sales.reduce((sum: number, order: any) => sum + relevantLineTotal(order), 0);
  const releasedRevenue = sales
    .filter((order: any) => order.escrowStatus === "released_to_seller")
    .reduce((sum: number, order: any) => sum + relevantLineTotal(order), 0);
  const escrowValue = sales
    .filter((order: any) => ["escrow_secured", "seller_delivering", "delivered", "buyer_confirmed", "disputed"].includes(order.escrowStatus))
    .reduce((sum: number, order: any) => sum + relevantLineTotal(order), 0);
  const disputedOrders = sales.filter((order: any) => order.escrowStatus === "disputed").length;
  res.json({
    stats: { listings: products.length, activeListings, sales: sales.length, revenue: releasedRevenue, grossValue, escrowValue, disputedOrders },
    products,
    sales
  });
}));

export default router;
