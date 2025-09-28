import ChatProvider from "@/context/ChatContext";
import LogProvider from "@/context/LogProvider";
import RTCProvider from "@/context/RTCContext/RTCContext";
import SWProvider from "@/context/SWContext";
import { TransfersProvider } from "@/context/TransfersContext/TransfersContext";
import { getAuth } from "@/lib/server/getAuth";
import { getIceServers } from "@/lib/server/getIceServers";
import { type Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Crosspace",
  description: "Scan. Share. Effortlessly. Seamlessly.",
  icons: {
    icon: [
      {
        media: "(prefers-color-scheme: light)",
        url: "/favicon.png",
        href: "/favicon.png",
      },
      {
        media: "(prefers-color-scheme: dark)",
        url: "/favicon-white.png",
        href: "/favicon-white.png",
      },
    ],
  },
};

export default async function RootLayout({
  children,
  navbar,
}: Readonly<{
  children: React.ReactNode;
  navbar: React.ReactNode;
}>) {
  const auth = await getAuth();
  const iceServers = await getIceServers();

  return (
    <html className="h-full" lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} flex h-full flex-col antialiased`}
      >
        <LogProvider>
          <SWProvider>
            <RTCProvider userId={auth.id} iceServers={iceServers}>
              <TransfersProvider>
                <ChatProvider>
                  <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                  >
                    {navbar}
                    <main className="relative flex min-h-0 flex-1 flex-col">
                      {children}
                    </main>
                  </ThemeProvider>
                </ChatProvider>
              </TransfersProvider>
            </RTCProvider>
          </SWProvider>
        </LogProvider>
      </body>
    </html>
  );
}
