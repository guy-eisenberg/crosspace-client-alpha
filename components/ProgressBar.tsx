"use client";

import { cn } from "@/lib/utils";
import { Line } from "progressbar.js";
import { useEffect, useRef } from "react";

export default function ProgressBar({
  show,
  ...rest
}: { show: boolean } & React.HTMLAttributes<HTMLDivElement>) {
  const line = useRef<InstanceType<typeof Line>>(null);
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;

    if (!line.current)
      line.current = new Line(container.current, {
        color: "#007f70",
        duration: 100000,
        svgStyle: {
          height: "4px",
          width: "100%",
        },
        easing: "easeOut",
      });

    if (show) {
      line.current.animate(1);

      return () => {
        line.current!.animate(1, { duration: 1000, easing: "easeOut" }, () => {
          line.current!.set(0);
        });
      };
    }
  }, [show]);

  return (
    <div
      {...rest}
      className={cn(
        "transition duration-1000",
        show ? "opacity-100" : "opacity-0",
        rest.className,
      )}
      ref={container}
    />
  );
}
