import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/http";
import { useAuth } from "../context/AuthContext";
import type { Order, Product, Report, User } from "../types";
import { formatCurrency, formatDate } from "../utils";

function getUserId(user: User) {
  return (user as any)._id ?? user.id;
}

function statusClass(status: string) {
  if (["released_to_seller", "buyer_confirmed"].includes(status)) return "status-pill good";
  if (["disputed", "refunded_to_buyer", "cancelled"].includes(status)) return "status-pill danger";
  if (["delivered", "seller_delivering"].includes(status)) return "status-pill warn";
  return "status-pill";
}

export function AdminPage() {
  const queryClient = useQueryClient();
  const { token } = useAuth();
  const [resolutionNotes, setResolutionNotes] = useState<Record<string, string>>({});
  const overviewQuery = useQuery({ queryKey: ["admin-overview"], queryFn: () => api<{ metrics: { users: number; activeMatches: number; products: number; orders: number; reports: number; disputedOrders: number; escrowSecured: number } }>("/admin/overview", {}, token ?? undefined) });
  const usersQuery = useQuery({ queryKey: ["admin-users"], queryFn: () => api<{ users: User[] }>("/admin/users", {}, token ?? undefined) });
  const listingsQuery = useQuery({ queryKey: ["admin-listings"], queryFn: () => api<{ listings: Product[] }>("/admin/listings", {}, token ?? undefined) });
  const reportsQuery = useQuery({ queryKey: ["admin-reports"], queryFn: () => api<{ reports: Report[] }>("/admin/reports", {}, token ?? undefined) });
  const ordersQuery = useQuery({ queryKey: ["admin-orders"], queryFn: () => api<{ orders: Order[] }>("/admin/orders", {}, token ?? undefined) });
  const reportMutation = useMutation({ mutationFn: ({ id, status }: { id: string; status: string }) => api(`/admin/reports/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }, token ?? undefined), onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["admin-reports"] }); } });
  const listingMutation = useMutation({ mutationFn: ({ id, status }: { id: string; status: string }) => api(`/admin/listings/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }, token ?? undefined), onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["admin-listings"] }); } });
  const roleMutation = useMutation({ mutationFn: ({ id, role }: { id: string; role: string }) => api(`/admin/users/${id}/role`, { method: "PATCH", body: JSON.stringify({ role }) }, token ?? undefined), onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["admin-users"] }); } });
  const orderAction = useMutation({
    mutationFn: ({ id, action, resolution }: { id: string; action: "admin-release" | "admin-refund" | "admin-resolve-dispute"; resolution?: "release" | "refund" }) => {
      const note = resolutionNotes[id] ?? "Admin resolved this mock escrow order during demo.";
      const body = action === "admin-resolve-dispute" ? { resolution: resolution ?? "release", note } : { note };
      return api(`/market/orders/${id}/${action}`, { method: "POST", body: JSON.stringify(body) }, token ?? undefined);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-orders"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-overview"] })
      ]);
    }
  });

  return (
    <div className="container page-stack">
      <section className="stats-grid">
        <article className="stat-card">Users<strong>{overviewQuery.data?.metrics.users ?? 0}</strong></article>
        <article className="stat-card">Active matches<strong>{overviewQuery.data?.metrics.activeMatches ?? 0}</strong></article>
        <article className="stat-card">Products<strong>{overviewQuery.data?.metrics.products ?? 0}</strong></article>
        <article className="stat-card">Orders<strong>{overviewQuery.data?.metrics.orders ?? 0}</strong></article>
        <article className="stat-card">Escrow active<strong>{overviewQuery.data?.metrics.escrowSecured ?? 0}</strong></article>
        <article className="stat-card">Disputes<strong>{overviewQuery.data?.metrics.disputedOrders ?? 0}</strong></article>
      </section>

      <section className="panel">
        <div className="section-title"><h2>Mock escrow orders</h2><span className="status-pill">Admin-only release/refund</span></div>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Order</th><th>Buyer</th><th>Items</th><th>Status</th><th>Resolution note</th><th>Actions</th></tr></thead>
            <tbody>
              {ordersQuery.data?.orders.map((order) => {
                const buyer = typeof order.buyerId === "string" ? order.buyerId : order.buyerId.username;
                const note = resolutionNotes[order._id] ?? "Admin reviewed mock escrow evidence.";
                return (
                  <tr key={order._id}>
                    <td><strong>{formatCurrency(order.total)}</strong><div className="kicker">{formatDate(order.createdAt)}</div></td>
                    <td>{buyer}</td>
                    <td>{order.items.map((item) => item.title).join(", ")}</td>
                    <td><span className={statusClass(order.escrowStatus)}>{order.escrowStatus}</span>{order.disputeReason && <div className="kicker">{order.disputeReason}</div>}</td>
                    <td><input className="input" value={note} onChange={(event) => setResolutionNotes({ ...resolutionNotes, [order._id]: event.target.value })} /></td>
                    <td>
                      <div className="split-actions">
                        {["buyer_confirmed", "delivered", "disputed"].includes(order.escrowStatus) && <button className="buttonSuccess" onClick={() => orderAction.mutate({ id: order._id, action: "admin-release" })}>Release</button>}
                        {["escrow_secured", "seller_delivering", "delivered", "buyer_confirmed", "disputed"].includes(order.escrowStatus) && <button className="buttonDanger" onClick={() => orderAction.mutate({ id: order._id, action: "admin-refund" })}>Refund</button>}
                        {order.escrowStatus === "disputed" && <button className="buttonGhost" onClick={() => orderAction.mutate({ id: order._id, action: "admin-resolve-dispute", resolution: "release" })}>Resolve release</button>}
                        {order.escrowStatus === "disputed" && <button className="buttonGhost" onClick={() => orderAction.mutate({ id: order._id, action: "admin-resolve-dispute", resolution: "refund" })}>Resolve refund</button>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <div className="section-title"><h2>User moderation</h2></div>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>User</th><th>MLBB profile</th><th>Region</th><th>Trust</th><th>Role</th><th>Action</th></tr></thead>
            <tbody>
              {usersQuery.data?.users.map((user) => (
                <tr key={getUserId(user)}>
                  <td>{user.username}</td>
                  <td>{user.mlbbRole} | {user.mlbbLane}</td>
                  <td>{user.region}</td>
                  <td>{user.trustScore}</td>
                  <td>{user.role}</td>
                  <td>
                    <select className="select" defaultValue={user.role} onChange={(event) => roleMutation.mutate({ id: getUserId(user), role: event.target.value })}>
                      <option value="user">user</option>
                      <option value="seller">seller</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <div className="section-title"><h2>Listings moderation</h2></div>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Listing</th><th>Status</th><th>Seller</th><th>Category</th><th>Action</th></tr></thead>
            <tbody>
              {listingsQuery.data?.listings.map((listing) => (
                <tr key={listing._id}>
                  <td>{listing.title}</td>
                  <td>{listing.status}</td>
                  <td>{listing.sellerId.username}</td>
                  <td>{listing.category}</td>
                  <td>
                    <select className="select" defaultValue={listing.status} onChange={(event) => listingMutation.mutate({ id: listing._id, status: event.target.value })}>
                      <option value="active">active</option>
                      <option value="paused">paused</option>
                      <option value="flagged">flagged</option>
                      <option value="sold">sold</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <div className="section-title"><h2>Reports queue</h2></div>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Type</th><th>Reason</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {reportsQuery.data?.reports.map((report) => (
                <tr key={report._id}>
                  <td>{report.targetType}</td>
                  <td>{report.reason}</td>
                  <td>{report.status}</td>
                  <td>
                    <select className="select" defaultValue={report.status} onChange={(event) => reportMutation.mutate({ id: report._id, status: event.target.value })}>
                      <option value="pending">pending</option>
                      <option value="reviewed">reviewed</option>
                      <option value="resolved">resolved</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
