import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../api/http";
import { useAuth } from "../context/AuthContext";
import type { Match, Notification, Order } from "../types";
import { formatCurrency, formatDate } from "../utils";

export function DashboardPage() {
  const { user, token } = useAuth();

  const notificationsQuery = useQuery({ queryKey: ["dashboard-notifications"], queryFn: () => api<{ notifications: Notification[] }>("/notifications", {}, token ?? undefined) });
  const matchesQuery = useQuery({ queryKey: ["dashboard-matches"], queryFn: () => api<{ matches: Match[] }>("/matcher/matches", {}, token ?? undefined) });
  const ordersQuery = useQuery({ queryKey: ["dashboard-orders"], queryFn: () => api<{ purchases: Order[]; sales: Order[] }>("/market/orders", {}, token ?? undefined) });

  return (
    <div className="container page-stack">
      <section className="panel">
        <span className="eyebrow">Command center</span>
        <h1 style={{ marginBottom: "0.4rem" }}>Welcome back, {user?.username}</h1>
        <p className="kicker">{user?.mlbbRole} | {user?.mlbbLane} | {user?.region} | Trust {user?.trustScore}. Track MLBB matches, marketplace notifications, and mock escrow orders from one place.</p>
      </section>

      <section className="stats-grid">
        <article className="stat-card">Active matches<strong>{matchesQuery.data?.matches.length ?? 0}</strong><span className="kicker">Accepted matches with live chat rooms</span></article>
        <article className="stat-card">Notifications<strong>{notificationsQuery.data?.notifications.length ?? 0}</strong><span className="kicker">Recent product, moderation, and match updates</span></article>
        <article className="stat-card">Purchases<strong>{ordersQuery.data?.purchases.length ?? 0}</strong><span className="kicker">Mock escrow transactions stored in your order history</span></article>
        <article className="stat-card">Trust score<strong>{user?.trustScore ?? 0}</strong><span className="kicker">Used by matchmaking as one visible score input</span></article>
      </section>

      <section className="three-grid">
        <div className="panel">
          <div className="section-title"><h2>Recent alerts</h2><Link className="buttonGhost" to="/matcher">Matcher</Link></div>
          {notificationsQuery.data?.notifications.length ? notificationsQuery.data.notifications.slice(0, 5).map((notification) => (
            <div key={notification._id} className="card" style={{ marginBottom: "0.75rem" }}>
              <strong>{notification.type}</strong>
              <div>{notification.content}</div>
              <div className="kicker">{formatDate(notification.createdAt)}</div>
            </div>
          )) : <div className="empty">No notifications yet.</div>}
        </div>

        <div className="panel">
          <div className="section-title"><h2>Live matches</h2><Link className="buttonGhost" to="/matcher">Open matcher</Link></div>
          {matchesQuery.data?.matches.length ? matchesQuery.data.matches.slice(0, 4).map((match) => (
            <div key={match.id} className="card" style={{ marginBottom: "0.75rem" }}>
              <strong>{match.game}</strong>
              <div className="kicker">{match.participants.map((participant) => `${participant.username} ${participant.mlbbLane}`).join(" | ")}</div>
              <div className="badge-row" style={{ margin: "0.6rem 0" }}>{match.scoreBreakdown.tags.map((tag) => <span key={tag} className="badge">{tag}</span>)}</div>
              <Link className="buttonGhost" to={`/matches/${match.id}/chat`}>Open chat</Link>
            </div>
          )) : <div className="empty">Accept a match request to open your first team chat.</div>}
        </div>

        <div className="panel">
          <div className="section-title"><h2>Orders</h2><Link className="buttonGhost" to="/orders">Full history</Link></div>
          {ordersQuery.data?.purchases.length ? ordersQuery.data.purchases.slice(0, 4).map((order) => (
            <div key={order._id} className="card" style={{ marginBottom: "0.75rem" }}>
              <strong>{formatCurrency(order.total)}</strong>
              <div>{order.items.map((item) => item.title).join(", ")}</div>
              <div className="kicker">{order.escrowStatus} · {formatDate(order.createdAt)}</div>
            </div>
          )) : <div className="empty">Checkout from the marketplace to generate your first order.</div>}
        </div>
      </section>
    </div>
  );
}
