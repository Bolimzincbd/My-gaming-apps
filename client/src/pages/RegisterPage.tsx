import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/http";
import { useAuth } from "../context/AuthContext";
import { MLBB_AVAILABILITY, MLBB_GAME, MLBB_LANES, MLBB_LANGUAGES, MLBB_MODES, MLBB_PLAYSTYLES, MLBB_RANKS, MLBB_REGIONS, MLBB_ROLES } from "../mlbb";
import type { Game } from "../types";

export function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const gamesQuery = useQuery({ queryKey: ["games"], queryFn: () => api<{ games: Game[] }>("/games") });
  const game = gamesQuery.data?.games[0];

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "Password123!",
    region: "Cambodia",
    languages: "English, Khmer",
    playstyle: "Objective-focused",
    mlbbRole: "Marksman",
    mlbbLane: "Gold Lane",
    availability: "Weekday evenings",
    trustScore: 75,
    preferredGame: MLBB_GAME,
    preferredMode: "Ranked",
    rank: "Mythic",
    rankValue: 7,
    role: "user" as "user" | "seller"
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const activeGame = useMemo(() => gamesQuery.data?.games.find((entry) => entry.name === form.preferredGame) ?? game, [gamesQuery.data?.games, form.preferredGame, game]);
  const modeOptions = activeGame?.supportedModes.length ? activeGame.supportedModes : MLBB_MODES;
  const rankOptions = activeGame?.rankSystem.length ? activeGame.rankSystem : MLBB_RANKS;

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await register({
        username: form.username,
        email: form.email,
        password: form.password,
        region: form.region,
        languages: form.languages.split(",").map((item) => item.trim()).filter(Boolean),
        playstyle: form.playstyle,
        mlbbRole: form.mlbbRole,
        mlbbLane: form.mlbbLane,
        availability: form.availability,
        trustScore: form.trustScore,
        preferredGames: [form.preferredGame],
        preferredModes: [form.preferredMode],
        gameRanks: [{ game: form.preferredGame, rank: form.rank, rankValue: form.rankValue }],
        role: form.role
      });
      navigate("/dashboard");
    } catch (submissionError) {
      setError((submissionError as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 760 }}>
      <section className="panel page-stack">
        <div>
          <span className="eyebrow">Create your profile</span>
          <h1>Register</h1>
          <p className="kicker">Build your MLBB teammate profile and decide whether you want standard player access or seller tools from day one.</p>
        </div>
        <form className="form-grid two" onSubmit={onSubmit}>
          <label className="label">Username<input className="input" value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} /></label>
          <label className="label">Email<input className="input" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
          <label className="label">Password<input className="input" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></label>
          <label className="label">Region<select className="select" value={form.region} onChange={(event) => setForm({ ...form, region: event.target.value })}>{MLBB_REGIONS.map((region) => <option key={region}>{region}</option>)}</select></label>
          <label className="label">Languages<input className="input" value={form.languages} onChange={(event) => setForm({ ...form, languages: event.target.value })} list="language-options" /><datalist id="language-options">{MLBB_LANGUAGES.map((language) => <option key={language} value={language} />)}</datalist></label>
          <label className="label">Playstyle<select className="select" value={form.playstyle} onChange={(event) => setForm({ ...form, playstyle: event.target.value })}>{MLBB_PLAYSTYLES.map((style) => <option key={style}>{style}</option>)}</select></label>
          <label className="label">MLBB role<select className="select" value={form.mlbbRole} onChange={(event) => setForm({ ...form, mlbbRole: event.target.value })}>{MLBB_ROLES.map((role) => <option key={role}>{role}</option>)}</select></label>
          <label className="label">Lane<select className="select" value={form.mlbbLane} onChange={(event) => setForm({ ...form, mlbbLane: event.target.value })}>{MLBB_LANES.map((lane) => <option key={lane}>{lane}</option>)}</select></label>
          <label className="label">Availability<select className="select" value={form.availability} onChange={(event) => setForm({ ...form, availability: event.target.value })}>{MLBB_AVAILABILITY.map((availability) => <option key={availability}>{availability}</option>)}</select></label>
          <label className="label">Preferred game<select className="select" value={form.preferredGame} onChange={(event) => setForm({ ...form, preferredGame: event.target.value, preferredMode: gamesQuery.data?.games.find((entry) => entry.name === event.target.value)?.supportedModes[0] ?? "Ranked", rank: gamesQuery.data?.games.find((entry) => entry.name === event.target.value)?.rankSystem[6] ?? "Mythic", rankValue: 7 })}>{gamesQuery.data?.games.length ? gamesQuery.data.games.map((entry) => <option key={entry._id}>{entry.name}</option>) : <option>{MLBB_GAME}</option>}</select></label>
          <label className="label">Preferred mode<select className="select" value={form.preferredMode} onChange={(event) => setForm({ ...form, preferredMode: event.target.value })}>{modeOptions.map((mode) => <option key={mode}>{mode}</option>)}</select></label>
          <label className="label">Rank<select className="select" value={form.rank} onChange={(event) => setForm({ ...form, rank: event.target.value, rankValue: rankOptions.indexOf(event.target.value) + 1 })}>{rankOptions.map((rank) => <option key={rank}>{rank}</option>)}</select></label>
          <label className="label">Account type<select className="select" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as "user" | "seller" })}><option value="user">User</option><option value="seller">Seller</option></select></label>
          {error && <div className="error-text" style={{ gridColumn: "1 / -1" }}>{error}</div>}
          <div style={{ gridColumn: "1 / -1" }} className="helper-row">
            <button className="button" disabled={submitting}>{submitting ? "Creating account..." : "Create account"}</button>
            <Link className="buttonGhost" to="/login">Already have an account</Link>
          </div>
        </form>
      </section>
    </div>
  );
}
