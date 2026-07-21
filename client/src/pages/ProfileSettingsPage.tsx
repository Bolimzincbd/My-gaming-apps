import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "../api/http";
import { useAuth } from "../context/AuthContext";
import { MLBB_AVAILABILITY, MLBB_GAME, MLBB_LANES, MLBB_PLAYSTYLES, MLBB_RANKS, MLBB_REGIONS, MLBB_ROLES } from "../mlbb";

export function ProfileSettingsPage() {
  const { user, token, refreshUser } = useAuth();
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ avatar: "", bio: "", region: "Cambodia", languages: "English, Khmer", playstyle: "Objective-focused", mlbbRole: "Marksman", mlbbLane: "Gold Lane", availability: "Weekday evenings", trustScore: 75, winRate: 50, preferredGames: [MLBB_GAME], preferredModes: ["Ranked"], gameRanks: [{ game: MLBB_GAME, rank: "Mythic", rankValue: 7 }] });

  useEffect(() => {
    if (!user) return;
    setForm({
      avatar: user.avatar,
      bio: user.bio,
      region: user.region,
      languages: user.languages.join(", "),
      playstyle: user.playstyle,
      mlbbRole: user.mlbbRole,
      mlbbLane: user.mlbbLane,
      availability: user.availability,
      trustScore: user.trustScore,
      winRate: user.winRate,
      preferredGames: user.preferredGames,
      preferredModes: user.preferredModes,
      gameRanks: user.gameRanks.length ? user.gameRanks : [{ game: user.preferredGames[0] ?? MLBB_GAME, rank: "Mythic", rankValue: 7 }]
    });
  }, [user]);

  const mutation = useMutation({
    mutationFn: () => api("/users/me/profile", { method: "PUT", body: JSON.stringify({ ...form, languages: form.languages.split(",").map((item) => item.trim()).filter(Boolean) }) }, token ?? undefined),
    onSuccess: async () => {
      await refreshUser();
      setMessage("Profile updated successfully.");
    }
  });

  return (
    <div className="container page-stack">
      <section className="panel page-stack">
        <div>
          <span className="eyebrow">Profile controls</span>
          <h1>Edit profile</h1>
        </div>
        <div className="form-grid two">
          <label className="label">Avatar URL<input className="input" value={form.avatar} onChange={(event) => setForm({ ...form, avatar: event.target.value })} /></label>
          <label className="label">Region<select className="select" value={form.region} onChange={(event) => setForm({ ...form, region: event.target.value })}>{MLBB_REGIONS.map((region) => <option key={region}>{region}</option>)}</select></label>
          <label className="label">Languages<input className="input" value={form.languages} onChange={(event) => setForm({ ...form, languages: event.target.value })} /></label>
          <label className="label">Playstyle<select className="select" value={form.playstyle} onChange={(event) => setForm({ ...form, playstyle: event.target.value })}>{MLBB_PLAYSTYLES.map((style) => <option key={style}>{style}</option>)}</select></label>
          <label className="label">MLBB role<select className="select" value={form.mlbbRole} onChange={(event) => setForm({ ...form, mlbbRole: event.target.value })}>{MLBB_ROLES.map((role) => <option key={role}>{role}</option>)}</select></label>
          <label className="label">Lane<select className="select" value={form.mlbbLane} onChange={(event) => setForm({ ...form, mlbbLane: event.target.value })}>{MLBB_LANES.map((lane) => <option key={lane}>{lane}</option>)}</select></label>
          <label className="label">Availability<select className="select" value={form.availability} onChange={(event) => setForm({ ...form, availability: event.target.value })}>{MLBB_AVAILABILITY.map((availability) => <option key={availability}>{availability}</option>)}</select></label>
          <label className="label">Trust score<input className="input" type="number" min={0} max={100} value={form.trustScore} onChange={(event) => setForm({ ...form, trustScore: Number(event.target.value) })} /></label>
          <label className="label">Win rate<input className="input" type="number" min={0} max={100} value={form.winRate} onChange={(event) => setForm({ ...form, winRate: Number(event.target.value) })} /></label>
          <label className="label">Preferred games (comma separated)<input className="input" value={form.preferredGames.join(", ")} onChange={(event) => setForm({ ...form, preferredGames: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) })} /></label>
          <label className="label">Preferred modes (comma separated)<input className="input" value={form.preferredModes.join(", ")} onChange={(event) => setForm({ ...form, preferredModes: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) })} /></label>
          <div />
        </div>
        <label className="label">Bio<textarea className="textarea" value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} /></label>

        <div className="page-stack">
          <div className="section-title"><h2>Game ranks</h2><button className="buttonGhost" onClick={() => setForm({ ...form, gameRanks: [...form.gameRanks, { game: form.preferredGames[0] ?? MLBB_GAME, rank: "Mythic", rankValue: 7 }] })}>Add rank</button></div>
          {form.gameRanks.map((entry, index) => (
            <div key={`${entry.game}-${index}`} className="form-grid two">
              <label className="label">Game<input className="input" value={entry.game} onChange={(event) => setForm({ ...form, gameRanks: form.gameRanks.map((rank, rankIndex) => rankIndex === index ? { ...rank, game: event.target.value } : rank) })} /></label>
              <label className="label">Rank<select className="select" value={entry.rank} onChange={(event) => setForm({ ...form, gameRanks: form.gameRanks.map((rank, rankIndex) => rankIndex === index ? { ...rank, rank: event.target.value, rankValue: MLBB_RANKS.indexOf(event.target.value) + 1 } : rank) })}>{MLBB_RANKS.map((rank) => <option key={rank}>{rank}</option>)}</select></label>
              <label className="label">Rank value<input className="input" type="number" min={1} max={10} value={entry.rankValue} onChange={(event) => setForm({ ...form, gameRanks: form.gameRanks.map((rank, rankIndex) => rankIndex === index ? { ...rank, rankValue: Number(event.target.value) } : rank) })} /></label>
              <button className="buttonDanger" onClick={() => setForm({ ...form, gameRanks: form.gameRanks.filter((_, rankIndex) => rankIndex !== index) })}>Remove</button>
            </div>
          ))}
        </div>

        <div className="helper-row">
          <button className="button" onClick={() => mutation.mutate()}>{mutation.isPending ? "Saving..." : "Save profile"}</button>
          {message && <span className="success-text">{message}</span>}
          {mutation.isError && <span className="error-text">{(mutation.error as Error).message}</span>}
        </div>
      </section>
    </div>
  );
}
