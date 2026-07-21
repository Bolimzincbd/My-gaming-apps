import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../api/http";
import type { Product } from "../types";
import { formatCurrency } from "../utils";

export function LandingPage() {
  const featuredQuery = useQuery({
    queryKey: ["featured-products"],
    queryFn: () => api<{ products: Product[] }>("/market/products/featured")
  });

  return (
    <div className="container page-stack">
      <section className="hero-card hero-arena">
        <div>
          <span className="eyebrow">Mobile Legends: Bang Bang</span>
          <h1 className="hero-title">MLBB Nexus</h1>
          <p className="kicker" style={{ maxWidth: 680 }}>
            Squad matching by rank, role, lane, region, language, playstyle, availability, and trust score with a marketplace that demonstrates a mock escrow order lifecycle.
          </p>
          <div className="helper-row" style={{ marginTop: "1.1rem" }}>
            <Link to="/matcher" className="button">Find Squad</Link>
            <Link to="/market" className="buttonGhost">Open Marketplace</Link>
            <Link to="/orders" className="buttonGhost">Track Escrow Orders</Link>
          </div>
        </div>
      </section>

      <section className="stats-grid">
        <article className="stat-card">Match inputs<strong>9</strong><span className="kicker">Rank, role, lane, region, language, mode, playstyle, schedule, trust</span></article>
        <article className="stat-card">Escrow states<strong>9</strong><span className="kicker">From pending payment to release, refund, dispute, or cancellation</span></article>
        <article className="stat-card">Marketplace focus<strong>MLBB</strong><span className="kicker">Coaching, guides, scrims, replay review, build boards</span></article>
        <article className="stat-card">Payment note<strong>Mock</strong><span className="kicker">University demo only; no real funds are held or moved</span></article>
      </section>

      <section className="two-col">
        <article className="panel">
          <div className="section-title">
            <div>
              <span className="eyebrow">Squad finder</span>
              <h2 style={{ marginTop: "0.6rem" }}>Queue with players who fit your lane plan</h2>
            </div>
            <Link className="buttonGhost" to="/matcher">Matcher</Link>
          </div>
          <div className="three-grid">
            <div className="card"><strong>Rank proximity</strong><p className="kicker">MLBB ranks are scored by value, so Mythic players surface near Mythic teammates.</p></div>
            <div className="card"><strong>Role and lane</strong><p className="kicker">Tank, Mage, Assassin, Marksman, Support and lane preference affect score.</p></div>
            <div className="card"><strong>Trust signal</strong><p className="kicker">Trust score and recent activity help avoid stale or risky teammate suggestions.</p></div>
          </div>
        </article>

        <article className="panel">
          <div className="section-title">
            <div>
              <span className="eyebrow">Escrow workflow</span>
              <h2 style={{ marginTop: "0.6rem" }}>Mock order status path</h2>
            </div>
          </div>
          <div className="order-timeline">
            {["pending_payment", "escrow_secured", "seller_delivering", "delivered", "buyer_confirmed", "released_to_seller"].map((status) => (
              <div key={status} className="timeline-item">
                <strong className="mono">{status}</strong>
                <span className="kicker">Recorded in order history for demo auditability.</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="panel">
        <div className="section-title">
          <div>
            <span className="eyebrow">Featured listings</span>
            <h2 style={{ marginTop: "0.6rem" }}>MLBB services and digital products</h2>
          </div>
          <Link className="buttonGhost" to="/market">View all</Link>
        </div>
        <div className="product-grid">
          {featuredQuery.isLoading && <div className="empty">Loading featured listings...</div>}
          {featuredQuery.data?.products.map((product) => (
            <Link key={product._id} to={`/market/${product._id}`} className="card">
              <img src={product.images[0]} alt={product.title} className="media-thumb" />
              <h3>{product.title}</h3>
              <p className="kicker">{product.category} | {product.deliveryTimeLabel}</p>
              <div className="helper-row" style={{ justifyContent: "space-between" }}>
                <strong>{formatCurrency(product.price)}</strong>
                <span className="status-pill good">Escrow demo</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
