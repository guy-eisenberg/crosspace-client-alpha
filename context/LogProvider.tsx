"use client";

import { initLogRocket } from "@/lib/initLogRocket";
import { useEffect } from "react";

export default function LogProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === "production") initLogRocket();
  }, []);

  return children;
}
