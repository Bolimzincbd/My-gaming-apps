import { NavLink, Outlet } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/http";
import { useAuth } from "../../context/AuthContext";
import type { Notification } from "../../types";
import styles from "./AppShell.module.css";

interface NavItem {
  to: string;
  label: string;
  auth?: boolean;
  roles?: Array<"user" | "seller" | "admin">;
}

const baseLinks: NavItem[] = [
  { to: "/", label: "Home" },
  { to: "/matcher", label: "Squad Finder", auth: true },
  { to: "/market", label: "Marketplace" },
  { to: "/dashboard", label: "Hub", auth: true },
  { to: "/orders", label: "Orders", auth: true },
  { to: "/seller", label: "Seller", roles: ["seller", "admin"] },
  { to: "/admin", label: "Admin", roles: ["admin"] }
];

export function AppShell() {
  const { user, token, logout } = useAuth();
  const notificationsQuery = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: () => api<{ notifications: Notification[] }>("/notifications", {}, token ?? undefined),
    enabled: Boolean(token)
  });

  const notificationCount = notificationsQuery.data?.notifications.length ?? 0;
  const visibleLinks = baseLinks.filter((link) => {
    if (link.auth && !user) return false;
    if (link.roles && !link.roles.includes(user?.role ?? "user")) return false;
    return true;
  });

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={`container ${styles.topbar}`}>
          <NavLink to="/" className={styles.brand}>
            <span className={styles.brandMark}>ML</span>
            <div>
              <div>MLBB Nexus</div>
              <small style={{ color: "var(--muted)" }}>Matcher + Mock Escrow Market</small>
            </div>
          </NavLink>

          <nav className={styles.nav}>
            {visibleLinks.map((link) => (
              <NavLink key={link.to} to={link.to} className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ""}`}>
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className={styles.actions}>
            {user ? (
              <>
                <NavLink className="buttonGhost" to={`/profile/${user.id}`}>
                  {user.username}
                </NavLink>
                <NavLink className="buttonGhost" to="/dashboard">
                  Alerts {notificationCount ? `(${notificationCount})` : ""}
                </NavLink>
                <button className="buttonDanger" onClick={logout}>Logout</button>
              </>
            ) : (
              <>
                <NavLink className="buttonGhost" to="/login">Login</NavLink>
                <NavLink className="button" to="/register">Join Free</NavLink>
              </>
            )}
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <Outlet />
      </main>

      <footer className={styles.footer}>
        <div className={`container ${styles.footerInner}`}>
          <div>
            <strong>MLBB-focused squad matching and university mock escrow commerce.</strong>
            <div style={{ marginTop: "0.4rem" }}>No real payment escrow and no account resale. This is a practicum demo workflow.</div>
          </div>
          <div className={styles.meta}>
            <span>Rank + lane scoring</span>
            <span>Seller ratings</span>
            <span>Admin escrow actions</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
