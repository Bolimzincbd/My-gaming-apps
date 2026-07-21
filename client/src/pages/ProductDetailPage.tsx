import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/http";
import { useAuth } from "../context/AuthContext";
import type { Product } from "../types";
import { formatCurrency } from "../utils";

export function ProductDetailPage() {
  const { productId } = useParams();
  const queryClient = useQueryClient();
  const { token } = useAuth();
  const [reason, setReason] = useState("Please review this MLBB listing for marketplace compliance.");
  const query = useQuery({ queryKey: ["product", productId], queryFn: () => api<{ product: Product; related: Product[] }>(`/market/products/${productId}`), enabled: Boolean(productId) });
  const addToCart = useMutation({ mutationFn: () => api("/market/cart/items", { method: "POST", body: JSON.stringify({ productId, quantity: 1 }) }, token ?? undefined), onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["cart"] }); } });
  const reportListing = useMutation({ mutationFn: () => api(`/market/products/${productId}/report`, { method: "POST", body: JSON.stringify({ reason }) }, token ?? undefined) });

  const product = query.data?.product;
  if (!product) {
    return <div className="container"><div className="panel">Loading listing...</div></div>;
  }

  return (
    <div className="container page-stack">
      <section className="two-col">
        <div className="panel"><img src={product.images[0]} alt={product.title} className="media-thumb" style={{ height: 420 }} /></div>
        <div className="panel">
          <span className="eyebrow">MLBB listing</span>
          <h1>{product.title}</h1>
          <p className="kicker">{product.category} | {product.listingType.replace("_", " ")}</p>
          <p>{product.description}</p>
          <div className="badge-row" style={{ margin: "1rem 0" }}>
            <span className="status-pill good">{product.escrowEligible ? "Mock escrow eligible" : "No escrow demo"}</span>
            <span className="badge">Delivery {product.deliveryTimeLabel}</span>
            <span className="badge">Seller rating {product.sellerId.sellerRating || "New"}</span>
            <span className="badge">Trust {product.sellerId.trustScore ?? 70}</span>
            <span className="badge">Stock {product.stock}</span>
          </div>
          <div className="helper-row">
            <strong style={{ fontSize: "2rem" }}>{formatCurrency(product.price)}</strong>
            <button className="button" disabled={!token || addToCart.isPending} onClick={() => addToCart.mutate()}>Add to cart</button>
            <Link className="buttonGhost" to={`/profile/${product.sellerId._id}`}>Seller profile</Link>
          </div>
          {addToCart.isSuccess && <div className="success-text" style={{ marginTop: "0.75rem" }}>Added to cart.</div>}
          {addToCart.isError && <div className="error-text" style={{ marginTop: "0.75rem" }}>{(addToCart.error as Error).message}</div>}
        </div>
      </section>

      <section className="two-col">
        <div className="panel">
          <div className="section-title"><h2>Mock escrow expectation</h2></div>
          <div className="order-timeline">
            <div className="timeline-item"><strong>Checkout</strong><span className="kicker">Creates an order and records pending_payment then escrow_secured. No real payment is processed.</span></div>
            <div className="timeline-item"><strong>Seller delivery</strong><span className="kicker">Seller starts delivery and marks delivered when the service or digital product is ready.</span></div>
            <div className="timeline-item"><strong>Buyer/admin decision</strong><span className="kicker">Buyer confirms or disputes. Admin releases mock funds, refunds buyer, or resolves the dispute.</span></div>
          </div>
        </div>
        <div className="panel">
          <div className="section-title"><h2>Report listing</h2></div>
          <textarea className="textarea" value={reason} onChange={(event) => setReason(event.target.value)} />
          <button className="buttonDanger" style={{ marginTop: "0.85rem" }} disabled={!token} onClick={() => reportListing.mutate()}>Submit report</button>
          {reportListing.isSuccess && <div className="success-text" style={{ marginTop: "0.65rem" }}>Report submitted.</div>}
        </div>
      </section>

      <section className="panel">
        <div className="section-title"><h2>Related listings</h2></div>
        <div className="product-grid">
          {query.data?.related.map((related) => (
            <Link key={related._id} to={`/market/${related._id}`} className="card">
              <img src={related.images[0]} alt={related.title} className="media-thumb" style={{ height: 150 }} />
              <strong>{related.title}</strong>
              <div className="kicker">{related.category} | {formatCurrency(related.price)}</div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
