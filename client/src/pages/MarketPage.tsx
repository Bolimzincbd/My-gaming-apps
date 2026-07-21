import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../api/http";
import { useAuth } from "../context/AuthContext";
import { MARKET_CATEGORIES, MLBB_GAME } from "../mlbb";
import type { Product } from "../types";
import { formatCurrency } from "../utils";

export function MarketPage() {
  const queryClient = useQueryClient();
  const { token } = useAuth();
  const [filters, setFilters] = useState({
    q: "",
    game: MLBB_GAME,
    category: "",
    listingType: "",
    sort: "newest",
    minPrice: "",
    maxPrice: "",
    minSellerRating: "",
    maxDeliveryHours: "",
    escrowEligible: "true"
  });
  const query = new URLSearchParams(Object.entries(filters).filter(([, value]) => value));
  const productsQuery = useQuery({ queryKey: ["market-products", filters], queryFn: () => api<{ products: Product[] }>(`/market/products?${query.toString()}`) });
  const addToCart = useMutation({
    mutationFn: (productId: string) => api("/market/cart/items", { method: "POST", body: JSON.stringify({ productId, quantity: 1 }) }, token ?? undefined),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["cart"] }); }
  });

  return (
    <div className="container page-stack">
      <section className="panel">
        <div className="section-title">
          <div>
            <span className="eyebrow">MLBB marketplace</span>
            <h1 style={{ marginTop: "0.6rem" }}>Services, guides, and digital products</h1>
            <p className="kicker">Every checkout uses a mock escrow workflow for university demonstration only.</p>
          </div>
          <Link className="buttonGhost" to="/cart">Cart</Link>
        </div>
      </section>

      <section className="market-layout">
        <aside className="panel page-stack">
          <div className="section-title"><h2>Filters</h2></div>
          <label className="label">Search<input className="input" value={filters.q} onChange={(event) => setFilters({ ...filters, q: event.target.value })} /></label>
          <label className="label">Category<select className="select" value={filters.category} onChange={(event) => setFilters({ ...filters, category: event.target.value })}><option value="">All categories</option>{MARKET_CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select></label>
          <label className="label">Listing type<select className="select" value={filters.listingType} onChange={(event) => setFilters({ ...filters, listingType: event.target.value })}><option value="">All types</option><option value="service">Service</option><option value="digital_product">Digital product</option></select></label>
          <label className="label">Sort<select className="select" value={filters.sort} onChange={(event) => setFilters({ ...filters, sort: event.target.value })}><option value="newest">Newest</option><option value="priceAsc">Price low to high</option><option value="priceDesc">Price high to low</option><option value="deliveryFast">Fastest delivery</option></select></label>
          <div className="form-grid two">
            <label className="label">Min price<input className="input" value={filters.minPrice} onChange={(event) => setFilters({ ...filters, minPrice: event.target.value })} /></label>
            <label className="label">Max price<input className="input" value={filters.maxPrice} onChange={(event) => setFilters({ ...filters, maxPrice: event.target.value })} /></label>
          </div>
          <label className="label">Minimum seller rating<select className="select" value={filters.minSellerRating} onChange={(event) => setFilters({ ...filters, minSellerRating: event.target.value })}><option value="">Any rating</option><option value="4">4.0+</option><option value="4.5">4.5+</option><option value="4.8">4.8+</option></select></label>
          <label className="label">Max delivery<select className="select" value={filters.maxDeliveryHours} onChange={(event) => setFilters({ ...filters, maxDeliveryHours: event.target.value })}><option value="">Any time</option><option value="6">6 hours</option><option value="24">24 hours</option><option value="48">48 hours</option></select></label>
          <label className="label">Escrow badge<select className="select" value={filters.escrowEligible} onChange={(event) => setFilters({ ...filters, escrowEligible: event.target.value })}><option value="true">Mock escrow eligible</option><option value="">All listings</option></select></label>
        </aside>

        <div className="product-grid">
          {productsQuery.isLoading && <div className="empty">Loading MLBB listings...</div>}
          {productsQuery.data?.products.map((product) => (
            <article key={product._id} className="card">
              <img src={product.images[0]} alt={product.title} className="media-thumb" />
              <div className="helper-row" style={{ justifyContent: "space-between", marginTop: "0.85rem" }}>
                <span className="status-pill good">{product.escrowEligible ? "Escrow demo" : "Direct demo"}</span>
                <span className="badge">{product.deliveryTimeLabel}</span>
              </div>
              <h3>{product.title}</h3>
              <p className="kicker">{product.category} | {product.listingType.replace("_", " ")}</p>
              <div className="kicker">Seller {product.sellerId.username} | Rating {product.sellerId.sellerRating || "New"} | Trust {product.sellerId.trustScore ?? 70}</div>
              <div className="helper-row" style={{ justifyContent: "space-between", marginTop: "0.9rem" }}>
                <strong>{formatCurrency(product.price)}</strong>
                <span className="badge">Stock {product.stock}</span>
              </div>
              <div className="badge-row" style={{ marginTop: "0.75rem" }}>{product.tags?.slice(0, 3).map((tag) => <span key={tag} className="badge">{tag}</span>)}</div>
              <div className="helper-row" style={{ marginTop: "1rem" }}>
                <Link className="buttonGhost" to={`/market/${product._id}`}>Details</Link>
                <button className="button" disabled={!token || addToCart.isPending} onClick={() => addToCart.mutate(product._id)}>Add to cart</button>
              </div>
            </article>
          ))}
          {!productsQuery.isLoading && !productsQuery.data?.products.length && <div className="empty">No listings match the current filters.</div>}
        </div>
      </section>
    </div>
  );
}
