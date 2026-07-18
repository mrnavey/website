/* Arcade leaderboard — shared by all games.
   Talks straight to Firebase Realtime Database over REST (no SDK).
   Boards are append-only; security rules validate every entry server-side. */
(() => {
  "use strict";

  const DB = "https://arcade-leaderboard-944a0-default-rtdb.firebaseio.com";
  const MAX = 10;

  // Top scores for a board, best first (ties broken by earliest submission)
  async function fetchTop(board) {
    const url = `${DB}/scores/${board}.json?orderBy=${encodeURIComponent('"score"')}&limitToLast=${MAX}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("leaderboard fetch failed: " + res.status);
    const data = await res.json() || {};
    return Object.entries(data)
      .map(([id, e]) => ({
        id,
        initials: typeof e.initials === "string" ? e.initials : "???",
        score: Number(e.score) || 0,
        ts: Number(e.ts) || 0
      }))
      .sort((a, b) => b.score - a.score || a.ts - b.ts);
  }

  // Would this score make the board?
  function qualifies(top, score) {
    if (!(score > 0)) return false;
    return top.length < MAX || score > top[top.length - 1].score;
  }

  async function submit(board, initials, score) {
    const res = await fetch(`${DB}/scores/${board}.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initials, score, ts: { ".sv": "timestamp" } })
    });
    if (!res.ok) throw new Error("leaderboard submit failed: " + res.status);
    return res.json();
  }

  window.ArcadeLB = { fetchTop, qualifies, submit, MAX };
})();
