"use client";

import { cn } from "@/lib/utils";
import Lottie from "lottie-react";
import brandBlackAnimation from "./animations/brand-black-animation.json";
import brandWhiteAnimation from "./animations/brand-white-animation.json";

export default function LoadingScreen({
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...rest}
      className={cn(
        "fixed inset-0 flex items-center justify-center bg-white transition dark:bg-black",
        rest.className,
      )}
    >
      <Lottie
        className="hidden size-24 dark:block"
        animationData={brandWhiteAnimation}
        loop
      />
      <Lottie
        className="size-24 dark:hidden"
        animationData={brandBlackAnimation}
        loop
      />
    </div>
  );
}
