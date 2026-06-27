import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { authClient } from "@/lib/auth-client";

export function getInitials(name = "") {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function formatDate(dateString) {
  if (!dateString) return "—";
  return format(parseISO(dateString), "MMM d, yyyy");
}

export function formatCurrency(amount, currency = "USD") {
  if (amount == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function toArray(payload, key) {
  if (Array.isArray(payload?.[key])) return payload[key];
  if (Array.isArray(payload)) return payload;
  return [];
}

export async function fetchAuthToken() {
  const { data } = await authClient.token();
  const token = data?.token;
  if (!token) throw new Error("No authentication token");
  return token;
}

export function buildHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export function useDebounce(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
