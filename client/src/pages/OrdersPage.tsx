import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/http";
import { useAuth } from "../context/AuthContext";
import type { EscrowStatus } from "../mlbb";
import type { Order } from "../types";
import { formatCurrency, formatDate } from "../utils";

function statusClass(status: EscrowStatus) {
  if (["released_to_seller", "buyer_confirmed"].includes(status)) return "status-pill good";
  if (["disputed", "refunded_to_buyer", "cancelled"].includes(status)) return "status-pill danger";
  if (["delivered", "seller_delivering"].includes(status)) return "status-pill warn";
  return "status-pill";
}

function OrderTimeline({ order }: { order: Order }) {
  return (
    <div className="order-timeline">
      {order.statusHistory?.map((entry, index) => (
        <div key={`${entry.status}-${index}`} className="timeline-item">
          <strong className="mono">{entry.status}</strong>
          <span className="kicker">{entry.actorRole} | {entry.note || "Status updated"} | {formatDate(entry.createdAt)}</span>
        </div>
      ))}
    </div>
  );
}

export function OrdersPage() {
  const queryClient = useQueryClient();
  const { token } = useAuth();
  const [reviewDrafts, setReviewDrafts] = useState<Record<string, { rating: number; comment: string }>>({});
  const [disputes, setDisputes] = useState<Record<string, string>>({});
  const ordersQuery = useQuery({ queryKey: ["orders"], queryFn: () => api<{ purchases: Order[]; sales: Order[] }>("/market/orders", {}, token ?? undefined) });
  const invalidateOrders = async () => { await queryClient.invalidateQueries({ queryKey: ["orders"] }); };
  const reviewMutation = useMutation({ mutationFn: ({ orderId, rating, comment }: { orderId: string; rating: number; comment: string }) => api(`/market/orders/${orderId}/review`, { method: "POST", body: JSON.stringify({ rating, comment }) }, token ?? undefined), onSuccess: invalidateOrders });
  const confirmMutation = useMutation({ mutationFn: (orderId: string) => api(`/market/orders/${orderId}/buyer-confirm`, { method: "POST", body: JSON.stringify({ note: "Buyer confirmed delivery from orders page." }) }, token ?? undefined), onSuccess: invalidateOrders });
  const cancelMutation = useMutation({ mutationFn: (orderId: string) => api(`/market/orders/${orderId}/cancel`, { method: "POST", body: JSON.stringify({ note: "Buyer cancelled before seller delivery." }) }, token ?? undefined), onSuccess: invalidateOrders });
  const disputeMutation = useMutation({
    mutationFn: ({ orderId, reason }: { orderId: string; reason: string }) => api(`/market/orders/${orderId}/dispute`, { method: "POST", body: JSON.stringify({ reason }) }, token ?? undefined),
    onSuccess: invalidateOrders
  });

  return (
    <div className="container page-stack">
      <section className="panel">
        <span className="eyebrow">Orders</span>
        <h1>Mock escrow history</h1>
        <p className="kicker">Buyer, seller, and admin actions update the same order timeline. This is a simulated escrow workflow, not real payment custody.</p>
      </section>

      <section className="two-col">
        <div className="panel">
          <div className="section-title"><h2>Purchases</h2></div>
          {ordersQuery.data?.purchases.length ? ordersQuery.data.purchases.map((order) => {
            const reviewDraft = reviewDrafts[order._id] ?? { rating: 5, comment: "Smooth MLBB order and clear delivery." };
            const disputeReason = disputes[order._id] ?? "Delivery does not match the listing or agreed MLBB service details.";
            return (
              <div key={order._id} className="card" style={{ marginBottom: "0.85rem" }}>
                <div className="helper-row" style={{ justifyContent: "space-between" }}>
                  <div>
                    <strong>{formatCurrency(order.total)}</strong>
                    <div>{order.items.map((item) => item.title).join(", ")}</div>
                    <div className="kicker">{formatDate(order.createdAt)}</div>
                  </div>
                  <span className={statusClass(order.escrowStatus)}>{order.escrowStatus}</span>
                </div>
                <div className="helper-row" style={{ marginTop: "0.8rem" }}>
                  {order.escrowStatus === "delivered" && <button className="buttonSuccess" onClick={() => confirmMutation.mutate(order._id)}>Confirm delivery</button>}
                  {["pending_payment", "escrow_secured"].includes(order.escrowStatus) && <button className="buttonDanger" onClick={() => cancelMutation.mutate(order._id)}>Cancel order</button>}
                  {["escrow_secured", "seller_delivering", "delivered", "buyer_confirmed"].includes(order.escrowStatus) && <button className="buttonDanger" onClick={() => disputeMutation.mutate({ orderId: order._id, reason: disputeReason })}>Open dispute</button>}
                </div>
                {["escrow_secured", "seller_delivering", "delivered", "buyer_confirmed"].includes(order.escrowStatus) && (
                  <label className="label" style={{ marginTop: "0.8rem" }}>Dispute reason<input className="input" value={disputeReason} onChange={(event) => setDisputes({ ...disputes, [order._id]: event.target.value })} /></label>
                )}
                {["buyer_confirmed", "released_to_seller"].includes(order.escrowStatus) && (
                  <div className="form-grid two" style={{ marginTop: "0.85rem" }}>
                    <label className="label">Rating<input className="input" type="number" min={1} max={5} value={reviewDraft.rating} onChange={(event) => setReviewDrafts({ ...reviewDrafts, [order._id]: { ...reviewDraft, rating: Number(event.target.value) } })} /></label>
                    <label className="label">Review<input className="input" value={reviewDraft.comment} onChange={(event) => setReviewDrafts({ ...reviewDrafts, [order._id]: { ...reviewDraft, comment: event.target.value } })} /></label>
                    <button className="buttonGhost" onClick={() => reviewMutation.mutate({ orderId: order._id, rating: reviewDraft.rating, comment: reviewDraft.comment })}>Submit review</button>
                  </div>
                )}
                <OrderTimeline order={order} />
              </div>
            );
          }) : <div className="empty">No purchases yet.</div>}
        </div>

        <div className="panel">
          <div className="section-title"><h2>Sales</h2></div>
          {ordersQuery.data?.sales.length ? ordersQuery.data.sales.map((order) => (
            <div key={order._id} className="card" style={{ marginBottom: "0.75rem" }}>
              <div className="helper-row" style={{ justifyContent: "space-between" }}>
                <strong>{formatCurrency(order.total)}</strong>
                <span className={statusClass(order.escrowStatus)}>{order.escrowStatus}</span>
              </div>
              <div className="kicker">{order.items.map((item) => item.title).join(", ")}</div>
              <OrderTimeline order={order} />
            </div>
          )) : <div className="empty">Sales appear here when marketplace orders include your listings.</div>}
        </div>
      </section>
    </div>
  );
}
