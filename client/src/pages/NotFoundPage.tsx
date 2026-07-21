import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="container" style={{ maxWidth: 700 }}>
      <section className="panel page-stack">
        <span className="eyebrow">404</span>
        <h1>Page not found</h1>
        <p className="kicker">That route is outside the arena. Head back to the main platform surface.</p>
        <Link className="button" to="/">Return home</Link>
      </section>
    </div>
  );
}
