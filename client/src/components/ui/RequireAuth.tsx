import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export function RequireAuth({ roles }: { roles?: Array<"user" | "seller" | "admin"> }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="container"><div className="panel">Loading account...</div></div>;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
