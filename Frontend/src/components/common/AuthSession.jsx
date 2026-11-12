import { useEffect } from "react";
import { useAuthStore } from "../../store/useAuthStore";

export default function AuthSession({ children }) {
  const isInitializing = useAuthStore(state => state.isInitializing);
  const error = useAuthStore(state => state.initializationError);
  useEffect(() => { void useAuthStore.getState().initialize(); }, []);
  if (isInitializing) return <div id="session-loading" role="status" className="p-12 text-center">Restoring your session...</div>;
  if (error) return <div id="session-refresh-error" role="alert" className="p-12 text-center space-y-3"><p>{error}</p><button className="text-[#007185] underline" onClick={() => void useAuthStore.getState().initialize()}>Try again</button><button className="ml-4 text-[#007185] underline" onClick={() => useAuthStore.getState().logout()}>Sign in again</button></div>;
  return children;
}
