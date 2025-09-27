"use client";

import { isSafariIOS } from "@/lib/isSafariIOS";
import { createContext, useCallback, useContext, useEffect } from "react";

export type SWStream = {
  append: (data: ArrayBuffer) => void;
  close: () => void;
};

const SWContext = createContext<{
  createDownloadStream: (file: {
    name: string;
    size: number;
  }) => Promise<SWStream>;
}>({
  createDownloadStream: function (): Promise<SWStream> {
    throw new Error("Function not implemented.");
  },
});

export default function SWProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const createDownloadStream = useCallback(
    (file: { name: string; size: number }) => {
      const messageChannel = new MessageChannel();

      const controller = navigator.serviceWorker.controller;
      if (!controller) throw new Error("Service worker controller not found.");

      controller.postMessage(
        {
          subject: "create-stream",
          name: file.name,
          size: file.size,
          port: messageChannel.port2,
        },
        [messageChannel.port2],
      );

      return new Promise<SWStream>((res) => {
        messageChannel.port1.onmessage = async (event) => {
          const message = event.data as {
            subject: "new-stream";
            id: string;
          };

          if (message.subject === "new-stream") {
            const downloadUrl = `${window.location.origin}/stream/${message.id}`;
            const iframe = document.createElement("iframe");
            iframe.style.display = "none";
            iframe.src = downloadUrl;

            document.body.appendChild(iframe);

            const stream: SWStream = {
              append(buffer: ArrayBuffer) {
                messageChannel.port1.postMessage(
                  { subject: "append-stream", buffer },
                  [buffer],
                );
              },
              close() {
                if (!isIOSSafariBelow18_5()) {
                  // For some reason, Safari-IOS < 18.5 thinks he's a big shot, and prefers to close the stream itself:
                  messageChannel.port1.postMessage({
                    subject: "close-stream",
                  });
                }

                messageChannel.port1.close();
                // document.body.removeChild(iframe);
              },
            };

            if (isSafariIOS()) {
              window.onblur = () => {
                window.onfocus = () => {
                  res(stream);

                  window.onfocus = null;
                };

                window.onblur = null;
              };
            } else {
              res(stream);
            }
          }
        };
      });
    },
    [],
  );

  useEffect(() => {
    if ("serviceWorker" in navigator) init();

    async function init() {
      const regs = await navigator.serviceWorker.getRegistrations();
      for (const reg of regs) await reg.unregister();

      await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });
    }
  }, []);

  return (
    <SWContext.Provider value={{ createDownloadStream }}>
      {children}
    </SWContext.Provider>
  );

  function isIOSSafariBelow18_5() {
    const userAgent = navigator.userAgent;

    // Check if it's iOS device
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);
    if (!isIOS) return false;

    // Check if it's Safari (not Chrome or other browsers on iOS)
    const isSafari =
      /Safari/.test(userAgent) && !/CriOS|FxiOS|EdgiOS/.test(userAgent);
    if (!isSafari) return false;

    // Extract iOS version
    const iosVersionMatch = userAgent.match(/OS (\d+)_(\d+)/);
    if (!iosVersionMatch) return false;

    const majorVersion = parseInt(iosVersionMatch[1]);
    const minorVersion = parseInt(iosVersionMatch[2]);

    // iOS version below 18.5
    return majorVersion < 18 || (majorVersion === 18 && minorVersion < 5);
  }
}

export function useSW() {
  return useContext(SWContext);
}
