import { createContext, useContext, useState, useEffect } from "react";
import { authAPI, setToken, removeToken, getToken } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // checking stored token on mount

  // On mount: validate stored token
  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    authAPI
      .me()
      .then((userData) => setUser(userData))
      .catch(() => removeToken())
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const data = await authAPI.login(email, password);
    setToken(data.access_token);
    setUser(data.user);
    return data.user;
  };

  const register = async (name, email, password) => {
    const data = await authAPI.register(name, email, password);
    setToken(data.access_token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    authAPI.logout().catch(() => {});
    removeToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}