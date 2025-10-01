"use client";

import { useRouter as _useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";

const RouterContext = createContext(
  {} as Omit<ReturnType<typeof _useRouter>, "refresh" | "replace"> & {
    refresh: () => Promise<unknown>;
    replace: (href: string) => Promise<unknown>;
  },
);

export default function RouterProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = _useRouter();

  const [pending, start] = useTransition();
  const [triggered, setTriggered] = useState(false);

  const resolve = useRef<(v: unknown) => void | null>(null);

  const refresh = useCallback(() => {
    return new Promise((res) => {
      resolve.current = res;

      start(() => {
        router.refresh();
      });
    });
  }, [router]);

  const replace = useCallback(
    (href: string) => {
      return new Promise((res) => {
        resolve.current = res;

        start(() => {
          router.replace(href);
        });
      });
    },
    [router],
  );

  useEffect(() => {
    if (!pending && triggered) {
      if (resolve.current) {
        resolve.current(null);

        setTriggered(false);
        resolve.current = null;
      }
    }

    if (pending) {
      setTriggered(true);
    }
  }, [pending, triggered]);

  return (
    <RouterContext.Provider
      value={useMemo(() => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { refresh: _, replace: _2, ...rest } = router;

        return { refresh, replace, ...rest };
      }, [router, refresh, replace])}
    >
      {children}
    </RouterContext.Provider>
  );
}

export function useRouter() {
  return useContext(RouterContext);
}
