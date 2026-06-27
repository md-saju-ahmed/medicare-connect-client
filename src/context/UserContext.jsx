"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authClient } from "@/lib/auth-client";

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL}/api`;

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const { data: session, isPending } = authClient.useSession();
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (isPending) return;

    if (!session?.user) {
      setUser(null);
      return;
    }

    if (!API_BASE) {
      setUser(null);
      return;
    }

    let ignore = false;

    async function loadUser() {
      try {
        const { data } = await authClient.token();
        const token = data?.token;

        if (!token || ignore) return;

        const response = await fetch(`${API_BASE}/users/me`, {
          credentials: "include",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (ignore) return;

        if (!response.ok) {
          setUser(null);
          return;
        }

        const userData = await response.json();
        setUser(userData);
      } catch {
        setUser(null);
      }
    }

    loadUser();

    return () => {
      ignore = true;
    };
  }, [isPending, session?.user?.id]);

  const value = useMemo(
    () => ({
      user,
      setUser,
    }),
    [user],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUserContext() {
  const context = useContext(UserContext);

  if (!context) {
    throw new Error("useUserContext must be used within UserProvider");
  }

  return context;
}
