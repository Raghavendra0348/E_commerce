import { useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";

export default function AuthSession({ children }) {
  const isInitializing = useAuthStore(state => state.isInitializing);
  useEffect(() => { void useAuthStore.getState().initialize(); }, []);
  if (isInitializing) return <div id="session-loading" role="status" className="p-12 text-center">Restoring your session...</div>;
  return children;
}
