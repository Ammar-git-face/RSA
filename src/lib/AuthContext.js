"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const tok = sessionStorage.getItem("rsa_token");
    setAuthed(!!tok);
    setChecking(false);
  }, []);

  const login = (token) => {
    sessionStorage.setItem("rsa_token", token);
    setAuthed(true);
  };

  const logout = () => {
    sessionStorage.removeItem("rsa_token");
    setAuthed(false);
    router.push("/");
  };

  return (
    <AuthCtx.Provider value={{ authed, checking, login, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
