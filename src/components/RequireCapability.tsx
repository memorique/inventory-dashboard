import { Navigate } from "react-router";
import { usePermission } from "../context/AuthContext";
import type { Capabilities } from "../utils/permissions";

export default function RequireCapability({
  capability,
  children,
}: {
  capability: keyof Capabilities;
  children: React.ReactNode;
}) {
  const capabilities = usePermission();

  if (!capabilities[capability]) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
