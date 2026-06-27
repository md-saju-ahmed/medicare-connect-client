"use client";
import { createContext, useContext, useState, useMemo } from "react";
import { useUserContext } from "@/context/UserContext";

const DashboardContext = createContext(null);

export function DashboardProvider({ children }) {
  const { user, setUser } = useUserContext();
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const value = useMemo(
    () => ({
      user,
      setUser,
      doctorProfile,
      setDoctorProfile,
      loading,
      setLoading,
      error,
      setError,
    }),
    [user, setUser, doctorProfile, setDoctorProfile, loading, error],
  );

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboardContext() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error(
      "useDashboardContext must be used within a DashboardProvider",
    );
  }
  return context;
}

export function useDoctorContext() {
  return useDashboardContext();
}
