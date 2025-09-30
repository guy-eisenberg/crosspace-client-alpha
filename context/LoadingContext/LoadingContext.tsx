"use client";

import LoadingScreen from "@/context/LoadingContext/LoadingScreen";
import { cn } from "@/lib/utils";
import { createContext, useCallback, useContext, useState } from "react";
import { v4 as uuid } from "uuid";

const LoadingContext = createContext<{ showLoading: () => () => void }>({
  showLoading: function (): () => void {
    throw new Error("Function not implemented.");
  },
});

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [loadings, setLoadings] = useState<{ [id: string]: true }>({});

  const showLoading = useCallback(() => {
    const id = uuid();

    setLoadings((loadings) => ({ ...loadings, [id]: true }));

    return () => {
      setLoadings((loadings) => {
        const updated = { ...loadings };

        delete updated[id];

        return updated;
      });
    };
  }, []);

  const loading = Object.keys(loadings).length > 0;

  return (
    <LoadingContext.Provider value={{ showLoading }}>
      <LoadingScreen
        className={cn(loading ? "opacity-100" : "opacity-0")}
        onTransitionStart={(e) => {
          if (loading) {
            e.currentTarget.style.zIndex = "99999";
          }
        }}
        onTransitionEnd={(e) => {
          if (!loading) {
            e.currentTarget.style.zIndex = "-99999";
          }
        }}
      />
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  return useContext(LoadingContext);
}
