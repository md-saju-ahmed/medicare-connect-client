"use client";
import { useEffect } from "react";

const SITE = "MediCare Connect";

export default function PageTitle({ title }) {
  useEffect(() => {
    document.title = title ? `${title} | ${SITE}` : SITE;
  }, [title]);

  return null;
}
