"use client";

import { SPACE_OTP_TTL } from "@/constants";
import getSpaceUrl from "@/lib/getSpaceUrl";
import getSpaceOTP from "@/lib/server/getSpaceOTP";
import type { SpaceMetadata } from "@/types";
import { type DialogProps } from "@radix-ui/react-dialog";
import { Share2Icon } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Progress } from "./ui/progress";
import { CopyButton } from "./ui/shadcn-io/copy-button";
import { QRCode } from "./ui/shadcn-io/qr-code";
import { Skeleton } from "./ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

export default function ShareSpaceDialog({
  space,
  open,
  onOpenChange,
  ...rest
}: { space: SpaceMetadata } & DialogProps) {
  const [tab, setTab] = useState("url");

  const [otp, setOTP] = useState<string | null>(null);
  const [otpTTL, setOTPTTL] = useState(SPACE_OTP_TTL);

  useEffect(() => {
    if (!open) return;

    let requestTimeout: NodeJS.Timeout | null = null;
    let ttlInterval: NodeJS.Timeout | null = null;

    if (tab === "otp") fetchOTP();

    return () => {
      if (requestTimeout) clearTimeout(requestTimeout);
      if (ttlInterval) clearInterval(ttlInterval);
    };

    async function fetchOTP() {
      if (requestTimeout) clearTimeout(requestTimeout);
      if (ttlInterval) clearInterval(ttlInterval);

      const { otp, ttl } = await getSpaceOTP(space.id);

      requestTimeout = setTimeout(fetchOTP, ttl * 1000);
      ttlInterval = setInterval(() => {
        setOTPTTL((ttl) => {
          if (ttl > 0) return ttl - 1;

          return ttl;
        });
      }, 1000);

      setOTP(otp);
      setOTPTTL(ttl);
    }
  }, [space.id, open, tab]);

  const url = getSpaceUrl(space);

  return (
    <Dialog {...rest} open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share Space</DialogTitle>
          <DialogDescription>
            {tab === "url"
              ? "Share this space with others using the link or QR code below. Anyone you invite will instantly see files and notes in real time."
              : "Share this space with others by giving them the one-time code below. Anyone you invite will instantly see files and notes in real time."}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="mb-2 w-full">
              <TabsTrigger value="url">QR-Code/URL</TabsTrigger>
              <TabsTrigger value="otp">OTP</TabsTrigger>
            </TabsList>
            <TabsContent
              className="flex flex-col items-center gap-2"
              value="url"
            >
              <QRCode className="size-52 rounded-md border p-4" data={url} />
              <div className="flex w-full gap-1">
                <Input value={url} readOnly />
                <CopyButton
                  whileHover={{ scale: 1 }}
                  variant="outline"
                  className="size-9"
                  content={url}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={async () => {
                    try {
                      await navigator.share({
                        title: "Crosspace",
                        text: `You've been invited to join a space.`,
                        url,
                      });
                    } catch {}
                  }}
                >
                  <Share2Icon />
                </Button>
              </div>
            </TabsContent>
            <TabsContent
              className="flex flex-col items-center gap-2"
              value="otp"
            >
              {otp ? (
                <div className="flex w-full items-center rounded-md border p-4 text-2xl font-bold sm:text-3xl">
                  <div className="flex flex-1">
                    <span>{otp.slice(0, 3)}</span>
                    <span>-</span>
                    <span>{otp.slice(3, 6)}</span>
                    <span>-</span>
                    <span>{otp.slice(6)}</span>
                  </div>
                  <div className="flex gap-1">
                    <CopyButton
                      whileHover={{ scale: 1 }}
                      variant="outline"
                      className="size-9"
                      content={otp}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={async () => {
                        try {
                          await navigator.share({
                            title: "Crosspace",
                            text: `You've been invited to join a space using an OTP: ${otp.slice(0, 3)}-${otp.slice(3, 6)}-${otp.slice(6)}`,
                          });
                        } catch {}
                      }}
                    >
                      <Share2Icon />
                    </Button>
                  </div>
                </div>
              ) : (
                <Skeleton className="h-[70px] w-full" />
              )}
              {otp ? (
                <Progress value={(otpTTL / 60) * 100} />
              ) : (
                <Skeleton className="h-2 w-full rounded-full" />
              )}
              <Badge className="w-full bg-amber-100 text-amber-700">
                Please keep window open while using the code.
              </Badge>
            </TabsContent>
          </Tabs>
        </div>
        <DialogFooter>
          <Button
            variant="gray"
            onClick={() => {
              if (onOpenChange) onOpenChange(false);
            }}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
