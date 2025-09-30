"use client";

import { io } from "@/clients/client/ably";
import { SPACE_OTP_LENGTH, SpaceEvents } from "@/constants";
import { useLoading } from "@/context/LoadingContext/LoadingContext";
import { useRTC } from "@/context/RTCContext/RTCContext";
import { submitSpaceOTP } from "@/lib/server/submitSpaceOTP";
import { type DialogProps } from "@radix-ui/react-dialog";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "./ui/input-otp";
import { Separator } from "./ui/separator";

export default function OpenSpaceDialog({
  open,
  onOpenChange,
  ...rest
}: DialogProps) {
  const router = useRouter();

  const { showLoading } = useLoading();

  const { onRTCEvent } = useRTC();

  const [otp, setOTP] = useState("");

  useEffect(() => {
    setOTP("");
  }, [open]);

  return (
    <Dialog {...rest} open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Open Space</DialogTitle>
          <DialogDescription>Choose a method to join a space</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-4">
            <p className="font-semibold">Enter a link or scan a QR code</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="QR code scan" src="/qrcode-scan.png" className="w-32" />
          </div>
          <div className="relative">
            <Separator />
            <p className="text-muted-foreground bg-background absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-1 text-xs">
              OR
            </p>
          </div>
          <div className="flex flex-col items-center gap-4">
            <p className="font-semibold">Enter a one-time code below:</p>
            <div className="flex flex-col items-center gap-3">
              <InputOTP
                containerClassName="flex-wrap justify-center font-semibold"
                maxLength={SPACE_OTP_LENGTH}
                pattern="^[a-zA-Z0-9]*$"
                value={otp}
                onChange={(value) => setOTP(value.toUpperCase())}
                pasteTransformer={(pasted) =>
                  pasted.replaceAll("\n", "").replaceAll("-", "")
                }
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                </InputOTPGroup>
                <InputOTPGroup>
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
                <InputOTPGroup>
                  <InputOTPSlot index={6} />
                  <InputOTPSlot index={7} />
                  <InputOTPSlot index={8} />
                </InputOTPGroup>
              </InputOTP>
              <Button
                disabled={otp.length < SPACE_OTP_LENGTH}
                onClick={async () => {
                  const hideLoading = showLoading();

                  const newRequestId = await submitSpaceOTP(
                    otp,
                    io.connection.id as string,
                  );

                  if (newRequestId) {
                    const clearListener = onRTCEvent(
                      SpaceEvents.SpaceUrlRes,
                      (_, data) => {
                        const { requestId, url } = data as {
                          requestId: string;
                          url: string;
                        };

                        if (requestId === newRequestId) {
                          router.replace(url);
                          clearListener();
                          hideLoading();
                        }
                      },
                    );

                    if (onOpenChange) onOpenChange(false);
                  }
                }}
              >
                Connect
              </Button>
            </div>
          </div>
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
