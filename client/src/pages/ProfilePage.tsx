import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { api } from "../api/http";
import { useAuth } from "../context/AuthContext";
import type { Review, User } from "../types";
import { joinList } from "../utils";

export function ProfilePage() {
  const { id } = useParams();
  const { user: currentUser, token } = useAuth();
  const [reason, setReason] = useState("Please review this profile for moderation concerns.");
  const profileQuery = useQuery({ queryKey: ["profile", id], queryFn: () => api<{ user: User; reviews: Review[] }>(`/users/${id}`), enabled: Boolean(id) });
  const reportMutation = useMutation({ mutationFn: () => api(`/users/${id}/report`, { method: "POST", body: JSON.stringify({ reason }) }, token ?? undefined) });

  const profile = profileQuery.data?.user;
  if (!profile) {
    return <div className="container"><div className="panel">Loading profile...</div></div>;
  }

  return (
    <div className="container page-stack">
      <section className="panel three-grid" style={{ alignItems: "center" }}>
        <div>
          <span className="eyebrow">Public profile</span>
          <h1>{profile.username}</h1>
          <p className="kicker">{profile.bio || "No bio added yet."}</p>
          <div className="badge-row" style={{ marginTop: "1rem" }}>
            <span className="badge">{profile.region}</span>
            <span className="badge">{profile.playstyle}</span>
            <span className="badge">{profile.mlbbRole}</span>
            <span className="badge">{profile.mlbbLane}</span>
            <span className="badge">{profile.availability}</span>
            <span className="badge">Trust {profile.trustScore}</span>
            <span className="badge">{joinList(profile.languages)}</span>
            <span className="badge">Seller rating {profile.sellerRating}</span>
          </div>
        </div>
        <div className="card">
          <strong>MLBB profile</strong>
          <div className="kicker">{joinList(profile.preferredGames)}</div>
          <div className="badge-row" style={{ marginTop: "0.8rem" }}>{profile.gameRanks.map((entry) => <span className="badge" key={`${entry.game}-${entry.rank}`}>{entry.game}: {entry.rank}</span>)}</div>
        </div>
        {currentUser && currentUser.id !== profile.id && (
          <div className="card">
            <strong>Moderation report</strong>
            <textarea className="textarea" value={reason} onChange={(event) => setReason(event.target.value)} />
            <button className="buttonDanger" style={{ marginTop: "0.85rem" }} onClick={() => reportMutation.mutate()}>Report user</button>
            {reportMutation.isSuccess && <div className="success-text" style={{ marginTop: "0.6rem" }}>Report submitted.</div>}
          </div>
        )}
      </section>

      <section className="panel">
        <div className="section-title"><h2>Recent seller reviews</h2></div>
        {profileQuery.data?.reviews.length ? profileQuery.data.reviews.map((review) => (
          <div key={review._id} className="card" style={{ marginBottom: "0.75rem" }}>
            <strong>{review.rating} / 5</strong>
            <p className="kicker">{review.comment}</p>
          </div>
        )) : <div className="empty">No reviews yet.</div>}
      </section>
    </div>
  );
}
