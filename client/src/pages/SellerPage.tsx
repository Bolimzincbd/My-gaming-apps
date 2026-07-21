import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/http";
import { useAuth } from "../context/AuthContext";
import { MARKET_CATEGORIES, MLBB_GAME } from "../mlbb";
import type { Order, Product } from "../types";
import { formatCurrency, formatDate } from "../utils";

const initialForm = {
  title: "MLBB Mythic Duo Coaching",
  description: "One-hour live coaching for MLBB ranked duo queue, draft planning, hero pool tuning, rotation timing, and post-game notes.",
  game: MLBB_GAME,
  category: "Coaching",
  listingType: "service",
  price: 25,
  images: "/images/products/mlbb-coaching.svg",
  status: "active",
  stock: 1,
  deliveryTimeHours: 24,
  deliveryTimeLabel: "Within 24 hours",
  escrowEligible: true,
  tags: "mythic, duo, draft"
};

function orderStatusClass(status: string) {
  if (["released_to_seller", "buyer_confirmed"].includes(status)) return "status-pill good";
  if (["disputed", "refunded_to_buyer", "cancelled"].includes(status)) return "status-pill danger";
  if (["delivered", "seller_delivering"].includes(status)) return "status-pill warn";
  return "status-pill";
}

export function SellerPage() {
  const queryClient = useQueryClient();
  const { token } = useAuth();
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(initialForm);
  const query = useQuery({
    queryKey: ["seller-overview"],
    queryFn: () => api<{ stats: { listings: number; activeListings: number; sales: number; revenue: number; grossValue: number; escrowValue: number; disputedOrders: number }; products: Product[]; sales: Order[] }>("/market/seller/overview", {}, token ?? undefined)
  });

  useEffect(() => {
    if (editing) {
      setForm({
        title: editing.title,
        description: editing.description,
        game: editing.game,
        category: editing.category,
        listingType: editing.listingType,
        price: editing.price,
        images: editing.images.join(", "),
        status: editing.status,
        stock: editing.stock,
        deliveryTimeHours: editing.deliveryTimeHours,
        deliveryTimeLabel: editing.deliveryTimeLabel,
        escrowEligible: editing.escrowEligible,
        tags: editing.tags?.join(", ") ?? ""
      });
    } else {
      setForm(initialForm);
    }
  }, [editing]);

  const productPayload = () => ({
    ...form,
    price: Number(form.price),
    stock: Number(form.stock),
    deliveryTimeHours: Number(form.deliveryTimeHours),
    images: form.images.split(",").map((item) => item.trim()).filter(Boolean),
    tags: form.tags.split(",").map((item) => item.trim()).filter(Boolean)
  });

  const saveMutation = useMutation({
    mutationFn: () => api(editing ? `/market/products/${editing._id}` : "/market/products", { method: editing ? "PUT" : "POST", body: JSON.stringify(productPayload()) }, token ?? undefined),
    onSuccess: async () => {
      setEditing(null);
      await queryClient.invalidateQueries({ queryKey: ["seller-overview"] });
    }
  });
  const deleteMutation = useMutation({ mutationFn: (id: string) => api(`/market/products/${id}`, { method: "DELETE" }, token ?? undefined), onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["seller-overview"] }); } });
  const quickStatusMutation = useMutation({
    mutationFn: ({ product, status }: { product: Product; status: string }) => api(`/market/products/${product._id}`, {
      method: "PUT",
      body: JSON.stringify({
        title: product.title,
        description: product.description,
        game: product.game,
        category: product.category,
        listingType: product.listingType,
        price: product.price,
        images: product.images,
        status,
        stock: product.stock,
        deliveryTimeHours: product.deliveryTimeHours,
        deliveryTimeLabel: product.deliveryTimeLabel,
        escrowEligible: product.escrowEligible,
        tags: product.tags
      })
    }, token ?? undefined),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["seller-overview"] }); }
  });
  const sellerOrderAction = useMutation({
    mutationFn: ({ orderId, action }: { orderId: string; action: "seller-delivering" | "seller-delivered" }) => api(`/market/orders/${orderId}/${action}`, { method: "POST", body: JSON.stringify({ note: action === "seller-delivering" ? "Seller started delivery from dashboard." : "Seller marked delivery complete from dashboard." }) }, token ?? undefined),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["seller-overview"] }); }
  });

  return (
    <div className="container page-stack">
      <section className="stats-grid">
        <article className="stat-card">Listings<strong>{query.data?.stats.listings ?? 0}</strong></article>
        <article className="stat-card">Active<strong>{query.data?.stats.activeListings ?? 0}</strong></article>
        <article className="stat-card">Orders<strong>{query.data?.stats.sales ?? 0}</strong></article>
        <article className="stat-card">Escrow value<strong>{formatCurrency(query.data?.stats.escrowValue ?? 0)}</strong></article>
        <article className="stat-card">Released revenue<strong>{formatCurrency(query.data?.stats.revenue ?? 0)}</strong></article>
        <article className="stat-card">Disputes<strong>{query.data?.stats.disputedOrders ?? 0}</strong></article>
      </section>

      <section className="two-col">
        <div className="panel">
          <div className="section-title"><h2>{editing ? "Edit MLBB listing" : "Create MLBB listing"}</h2></div>
          <div className="form-grid">
            <label className="label">Title<input className="input" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label>
            <label className="label">Description<textarea className="textarea" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
            <div className="form-grid two">
              <label className="label">Category<select className="select" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>{MARKET_CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select></label>
              <label className="label">Type<select className="select" value={form.listingType} onChange={(event) => setForm({ ...form, listingType: event.target.value })}><option value="service">Service</option><option value="digital_product">Digital product</option></select></label>
              <label className="label">Price<input className="input" type="number" value={form.price} onChange={(event) => setForm({ ...form, price: Number(event.target.value) })} /></label>
              <label className="label">Stock<input className="input" type="number" value={form.stock} onChange={(event) => setForm({ ...form, stock: Number(event.target.value) })} /></label>
              <label className="label">Delivery hours<input className="input" type="number" value={form.deliveryTimeHours} onChange={(event) => setForm({ ...form, deliveryTimeHours: Number(event.target.value) })} /></label>
              <label className="label">Delivery label<input className="input" value={form.deliveryTimeLabel} onChange={(event) => setForm({ ...form, deliveryTimeLabel: event.target.value })} /></label>
            </div>
            <label className="label">Image URLs<input className="input" value={form.images} onChange={(event) => setForm({ ...form, images: event.target.value })} /></label>
            <label className="label">Tags<input className="input" value={form.tags} onChange={(event) => setForm({ ...form, tags: event.target.value })} /></label>
            <div className="form-grid two">
              <label className="label">Status<select className="select" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}><option>active</option><option>paused</option></select></label>
              <label className="label">Mock escrow<select className="select" value={String(form.escrowEligible)} onChange={(event) => setForm({ ...form, escrowEligible: event.target.value === "true" })}><option value="true">Eligible</option><option value="false">Not eligible</option></select></label>
            </div>
            <div className="helper-row">
              <button className="button" onClick={() => saveMutation.mutate()}>{editing ? "Save changes" : "Create listing"}</button>
              {editing && <button className="buttonGhost" onClick={() => setEditing(null)}>Cancel</button>}
            </div>
            {saveMutation.isError && <div className="error-text">{(saveMutation.error as Error).message}</div>}
          </div>
        </div>

        <div className="panel">
          <div className="section-title"><h2>Your listings</h2></div>
          {query.data?.products.map((product) => (
            <div key={product._id} className="card" style={{ marginBottom: "0.75rem" }}>
              <div className="helper-row" style={{ justifyContent: "space-between" }}>
                <div><strong>{product.title}</strong><div className="kicker">{product.category} | {product.deliveryTimeLabel}</div></div>
                <span className="badge">{product.status}</span>
              </div>
              <div className="helper-row" style={{ marginTop: "0.85rem" }}>
                <button className="buttonGhost" onClick={() => setEditing(product)}>Edit</button>
                <button className="buttonGhost" onClick={() => quickStatusMutation.mutate({ product, status: product.status === "active" ? "paused" : "active" })}>{product.status === "active" ? "Pause" : "Activate"}</button>
                <button className="buttonDanger" onClick={() => deleteMutation.mutate(product._id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="section-title"><h2>Seller order queue</h2><span className="status-pill">Mock escrow</span></div>
        {query.data?.sales.length ? query.data.sales.map((sale) => (
          <div key={sale._id} className="card" style={{ marginBottom: "0.75rem" }}>
            <div className="helper-row" style={{ justifyContent: "space-between" }}>
              <div>
                <strong>{formatCurrency(sale.total)}</strong>
                <div className="kicker">{sale.items.map((item) => item.title).join(", ")} | {formatDate(sale.createdAt)}</div>
              </div>
              <span className={orderStatusClass(sale.escrowStatus)}>{sale.escrowStatus}</span>
            </div>
            <div className="helper-row" style={{ marginTop: "0.75rem" }}>
              {sale.escrowStatus === "escrow_secured" && <button className="buttonGhost" onClick={() => sellerOrderAction.mutate({ orderId: sale._id, action: "seller-delivering" })}>Start delivery</button>}
              {["escrow_secured", "seller_delivering"].includes(sale.escrowStatus) && <button className="buttonSuccess" onClick={() => sellerOrderAction.mutate({ orderId: sale._id, action: "seller-delivered" })}>Mark delivered</button>}
            </div>
            <div className="order-timeline">
              {sale.statusHistory?.slice(-4).map((entry, index) => (
                <div key={`${entry.status}-${index}`} className="timeline-item">
                  <strong className="mono">{entry.status}</strong>
                  <span className="kicker">{entry.note || "Status updated"}</span>
                </div>
              ))}
            </div>
          </div>
        )) : <div className="empty">No sales yet.</div>}
      </section>
    </div>
  );
}
