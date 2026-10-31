import { useAuthStore } from "@/store/useAuthStore";
import { authService } from "@/services/auth.service";

export function useAuth() {
  const { user, accessToken, refreshToken, setAuth, logout: storeLogout } = useAuthStore();

  const isAuthenticated = !!accessToken;
  const isAdmin = user?.role === "ADMIN";

  const login = async (credentials) => {
    const res = await authService.login(credentials);
    const { user, accessToken, refreshToken } = res.data?.data || {};
    setAuth({ user, accessToken, refreshToken });
    return res.data?.data;
  };

  const register = async (userData) => {
    const res = await authService.register(userData);
    const { user, accessToken, refreshToken } = res.data?.data || {};
    setAuth({ user, accessToken, refreshToken });
    return res.data?.data;
  };

  const logout = async () => {
    try {
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
    } catch (e) {
      // Ignore network errors on logout
    } finally {
      storeLogout();
    }
  };

  return {
    user,
    accessToken,
    refreshToken,
    isAuthenticated,
    isAdmin,
    login,
    register,
    logout,
  };
}

export default useAuth;
