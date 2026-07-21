import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../api/http";
import { useAuth } from "../context/AuthContext";
import { MLBB_AVAILABILITY, MLBB_GAME, MLBB_LANES, MLBB_LANGUAGES, MLBB_MODES, MLBB_PLAYSTYLES, MLBB_RANKS, MLBB_REGIONS, MLBB_ROLES } from "../mlbb";
import type { Game, Match, MatchRequest, MatchSuggestion, ScoreBreakdown } from "../types";

function ScoreGrid({ score }: { score: ScoreBreakdown }) {
  const entries = [
    ["Rank", score.rank],
    ["Role", score.role],
    ["Lane", score.lane],
    ["Region", score.region],
    ["Lang", score.language],
    ["Mode", score.mode],
    ["Style", score.playstyle],
    ["Time", score.availability],
    ["Trust", score.trust],
    ["Active", score.activity]
  ];

  return (
    <div className="score-grid">
      {entries.map(([label, value]) => (
        <div key={label} className="score-chip">
          <span>{label}</span>
          <strong>{value}</strong>
        </div>
      ))}
    </div>
  );
}

export function MatcherPage() {
  const queryClient = useQueryClient();
  const { user, token } = useAuth();
  const gamesQuery = useQuery({ queryKey: ["games"], queryFn: () => api<{ games: Game[] }>("/games") });
  const [filters, setFilters] = useState({
    game: MLBB_GAME,
    region: user?.region ?? "Cambodia",
    language: user?.languages[0] ?? "Khmer",
    mode: "Ranked",
    playstyle: user?.playstyle ?? "Objective-focused",
    mlbbRole: "Tank",
    mlbbLane: "Roam",
    availability: user?.availability ?? "Weekday evenings"
  });
  const game = useMemo(() => gamesQuery.data?.games.find((entry) => entry.name === filters.game), [gamesQuery.data?.games, filters.game]);
  const rankOptions = game?.rankSystem.length ? game.rankSystem : MLBB_RANKS;
  const modeOptions = game?.supportedModes.length ? game.supportedModes : MLBB_MODES;
  const currentRank = user?.gameRanks.find((entry) => entry.game === filters.game);

  const suggestionParams = new URLSearchParams({
    game: filters.game,
    region: filters.region,
    language: filters.language,
    mode: filters.mode,
    playstyle: filters.playstyle,
    mlbbRole: filters.mlbbRole,
    mlbbLane: filters.mlbbLane,
    availability: filters.availability,
    rankValue: String(currentRank?.rankValue ?? 7)
  });

  const suggestionsQuery = useQuery({
    queryKey: ["matcher-suggestions", filters, currentRank?.rankValue],
    queryFn: () => api<{ results: MatchSuggestion[] }>(`/matcher/suggestions?${suggestionParams.toString()}`, {}, token ?? undefined),
    enabled: Boolean(token && filters.game)
  });
  const requestsQuery = useQuery({ queryKey: ["matcher-requests"], queryFn: () => api<{ incoming: MatchRequest[]; outgoing: MatchRequest[] }>("/matcher/requests", {}, token ?? undefined), enabled: Boolean(token) });
  const matchesQuery = useQuery({ queryKey: ["matcher-matches"], queryFn: () => api<{ matches: Match[] }>("/matcher/matches", {}, token ?? undefined), enabled: Boolean(token) });

  const sendRequest = useMutation({
    mutationFn: (suggestion: MatchSuggestion) => api("/matcher/requests", {
      method: "POST",
      body: JSON.stringify({
        targetUserId: suggestion.user.id,
        targetGame: filters.game,
        desiredRank: currentRank?.rank ?? rankOptions[6] ?? "Mythic",
        desiredRankValue: currentRank?.rankValue ?? 7,
        region: filters.region,
        language: filters.language,
        mode: filters.mode,
        playstyle: filters.playstyle,
        mlbbRole: filters.mlbbRole,
        mlbbLane: filters.mlbbLane,
        availability: filters.availability,
        scoreBreakdown: suggestion.scoreBreakdown
      })
    }, token ?? undefined),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["matcher-requests"] });
    }
  });

  const respondRequest = useMutation({
    mutationFn: ({ id, action }: { id: string; action: "accepted" | "declined" }) => api(`/matcher/requests/${id}/respond`, { method: "POST", body: JSON.stringify({ action }) }, token ?? undefined),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["matcher-requests"] }),
        queryClient.invalidateQueries({ queryKey: ["matcher-matches"] })
      ]);
    }
  });

  return (
    <div className="container page-stack">
      <section className="panel page-stack">
        <div>
          <span className="eyebrow">MLBB squad finder</span>
          <h1>Match by lane, role, schedule, and trust</h1>
          <p className="kicker">Same game is mandatory. Suggestions are ranked with visible scoring evidence for the practicum demo.</p>
        </div>
        <div className="form-grid three">
          <label className="label">Game<select className="select" value={filters.game} onChange={(event) => setFilters({ ...filters, game: event.target.value })}>{gamesQuery.data?.games.map((entry) => <option key={entry._id}>{entry.name}</option>) ?? <option>{MLBB_GAME}</option>}</select></label>
          <label className="label">Region<select className="select" value={filters.region} onChange={(event) => setFilters({ ...filters, region: event.target.value })}>{MLBB_REGIONS.map((region) => <option key={region}>{region}</option>)}</select></label>
          <label className="label">Language<select className="select" value={filters.language} onChange={(event) => setFilters({ ...filters, language: event.target.value })}>{MLBB_LANGUAGES.map((language) => <option key={language}>{language}</option>)}</select></label>
          <label className="label">Mode<select className="select" value={filters.mode} onChange={(event) => setFilters({ ...filters, mode: event.target.value })}>{modeOptions.map((mode) => <option key={mode}>{mode}</option>)}</select></label>
          <label className="label">Wanted role<select className="select" value={filters.mlbbRole} onChange={(event) => setFilters({ ...filters, mlbbRole: event.target.value })}>{MLBB_ROLES.map((role) => <option key={role}>{role}</option>)}</select></label>
          <label className="label">Wanted lane<select className="select" value={filters.mlbbLane} onChange={(event) => setFilters({ ...filters, mlbbLane: event.target.value })}>{MLBB_LANES.map((lane) => <option key={lane}>{lane}</option>)}</select></label>
          <label className="label">Playstyle<select className="select" value={filters.playstyle} onChange={(event) => setFilters({ ...filters, playstyle: event.target.value })}>{MLBB_PLAYSTYLES.map((style) => <option key={style}>{style}</option>)}</select></label>
          <label className="label">Availability<select className="select" value={filters.availability} onChange={(event) => setFilters({ ...filters, availability: event.target.value })}>{MLBB_AVAILABILITY.map((availability) => <option key={availability}>{availability}</option>)}</select></label>
          <label className="label">Your rank<select className="select" value={currentRank?.rank ?? "Mythic"} disabled>{rankOptions.map((rank) => <option key={rank}>{rank}</option>)}</select></label>
        </div>
      </section>

      <section className="two-col">
        <div className="panel">
          <div className="section-title"><h2>Ranked suggestions</h2><span className="status-pill">Score explains fit</span></div>
          <div className="product-grid">
            {suggestionsQuery.data?.results.map((suggestion) => (
              <article key={suggestion.user.id} className="card">
                <div className="helper-row" style={{ justifyContent: "space-between" }}>
                  <div>
                    <strong>{suggestion.user.username}</strong>
                    <div className="kicker">{suggestion.user.gameRank?.rank ?? "Unranked"} | {suggestion.user.mlbbRole} | {suggestion.user.mlbbLane}</div>
                  </div>
                  <span className="eyebrow">Score {suggestion.scoreBreakdown.total}</span>
                </div>
                <div className="badge-row" style={{ margin: "0.75rem 0" }}>{suggestion.scoreBreakdown.tags.map((tag) => <span key={tag} className="badge">{tag}</span>)}</div>
                <ScoreGrid score={suggestion.scoreBreakdown} />
                <div className="kicker" style={{ marginTop: "0.75rem" }}>Trust {suggestion.user.trustScore} | {suggestion.user.region} | {suggestion.user.availability}</div>
                <div className="helper-row" style={{ marginTop: "1rem" }}>
                  <button className="button" disabled={sendRequest.isPending} onClick={() => sendRequest.mutate(suggestion)}>Send request</button>
                  <Link className="buttonGhost" to={`/profile/${suggestion.user.id}`}>Profile</Link>
                </div>
              </article>
            ))}
            {suggestionsQuery.isLoading && <div className="empty">Loading MLBB teammate suggestions...</div>}
            {!suggestionsQuery.isLoading && !suggestionsQuery.data?.results.length && <div className="empty">No players match these filters yet.</div>}
          </div>
        </div>

        <div className="page-stack">
          <section className="panel">
            <div className="section-title"><h2>Incoming</h2></div>
            {requestsQuery.data?.incoming.length ? requestsQuery.data.incoming.map((request) => (
              <div key={request._id} className="card" style={{ marginBottom: "0.75rem" }}>
                <strong>{request.requesterId.username}</strong>
                <div className="kicker">{request.desiredRank} | {request.mlbbRole} | {request.mlbbLane}</div>
                <div className="badge-row" style={{ marginTop: "0.6rem" }}>
                  <span className="badge">{request.mode}</span>
                  <span className="badge">{request.language}</span>
                  <span className="badge">{request.availability}</span>
                </div>
                {request.status === "pending" && (
                  <div className="helper-row" style={{ marginTop: "0.75rem" }}>
                    <button className="buttonSuccess" onClick={() => respondRequest.mutate({ id: request._id, action: "accepted" })}>Accept</button>
                    <button className="buttonDanger" onClick={() => respondRequest.mutate({ id: request._id, action: "declined" })}>Decline</button>
                  </div>
                )}
                {request.status !== "pending" && <span className="status-pill">{request.status}</span>}
              </div>
            )) : <div className="empty">No pending incoming requests.</div>}
          </section>

          <section className="panel">
            <div className="section-title"><h2>Outgoing</h2></div>
            {requestsQuery.data?.outgoing.length ? requestsQuery.data.outgoing.map((request) => (
              <div key={request._id} className="card" style={{ marginBottom: "0.75rem" }}>
                <strong>{request.targetUserId.username}</strong>
                <div className="kicker">{request.targetGame} | {request.status}</div>
                <div className="badge-row" style={{ marginTop: "0.6rem" }}>
                  <span className="badge">{request.mlbbRole}</span>
                  <span className="badge">{request.mlbbLane}</span>
                </div>
              </div>
            )) : <div className="empty">Your sent requests will appear here.</div>}
          </section>
        </div>
      </section>

      <section className="panel">
        <div className="section-title"><h2>Accepted matches</h2></div>
        {matchesQuery.data?.matches.length ? matchesQuery.data.matches.map((match) => (
          <div key={match.id} className="card" style={{ marginBottom: "0.75rem" }}>
            <div className="helper-row" style={{ justifyContent: "space-between" }}>
              <div>
                <strong>{match.game}</strong>
                <div className="kicker">Participants: {match.participants.map((participant) => `${participant.username} (${participant.mlbbLane})`).join(", ")}</div>
              </div>
              <Link className="buttonGhost" to={`/matches/${match.id}/chat`}>Open chat</Link>
            </div>
            <div className="badge-row" style={{ marginTop: "0.7rem" }}>{match.scoreBreakdown.tags.map((tag) => <span key={tag} className="badge">{tag}</span>)}</div>
          </div>
        )) : <div className="empty">Accept a request to automatically generate a private Socket.IO chat room.</div>}
      </section>
    </div>
  );
}
