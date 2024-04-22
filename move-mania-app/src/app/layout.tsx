import type { Metadata } from "next";
import { Bai_Jamjuree, Inter } from "next/font/google";
import "./globals.css";
import ChatWindow from "./chatWindow";
import Link from "next/link";
import BalanceButton from "./balanceButton";
import { Toaster } from "@/components/ui/toaster";
import { MenuIcon } from "lucide-react";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Analytics } from "@vercel/analytics/react"
import Image from "next/image";
import logo from "@/../public/zionbet_nobackground.png"
import NavbarDropdown from "./navbarDropdown";
import { Suspense } from "react";
import CrashProvider from "./CrashProvider";
import KeylessProvider from "./KeylessProvider";

const baijamjuree = Bai_Jamjuree({
  weight: ['200', '300', '400', '500', '600'],
  subsets: ['latin'],
});
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Zion Bets",
  description: "Your chance to win big!",
  generator: "Next.js",
  manifest: "/manifest.json",
  keywords: ["nextjs", "nextjs13", "next13", "pwa", "next-pwa", "aptos"],
  themeColor: [{ media: "(prefers-color-scheme: dark)", color: "#000" }],
  authors: [
    { name: "Daniel Leavitt" },
    { name: "Max Mohammadi" },
  ],
  viewport:
    "minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no, viewport-fit=cover",
  icons: [
    // { rel: "apple-touch-icon", url: "icons/icon-128x128.png" },
    // { rel: "icon", url: "icons/icon-128x128.png" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <Analytics/>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover"></meta>
      <body className={baijamjuree.className + " text-white bg-[#020202] bg-noise"}>
        <KeylessProvider>
          <CrashProvider>
              <div className="flex h-full min-h-screen overflow-hidden">
                <nav className="fixed w-full h-12 z-30 px-2 border-b border-neutral-700 bg-[#020202] bg-noise">
                  <div className="flex flex-row items-center justify-between w-full h-full">
                    <div className="flex flex-row items-center gap-4">
                      <div className="flex flex-row items-center justify-start">
                        <Link href='/'><Image src={logo} className="" alt="" width={200} height={200} /></Link>
                        {/* <Link href='/' className="text-white text-2xl font-bold">ZION</Link> */}
                      </div>
                      {/* <Link href='/pool' className="bg-neutral-800 hover:bg-neutral-700 px-2 py-1 text-xs text-white font-semibold">
                        Pool
                      </Link> */}
                    </div>
                    <div className="flex flex-row gap-4 items-center">
                      <BalanceButton />
                      {/* <AccountButton /> */}
                      <Suspense>
                        <NavbarDropdown />
                      </Suspense>
                    </div>
                  </div>
                </nav>
                <div className="flex flex-col pt-12 w-full items-center">
                  <main className="overflow-y-auto max-w-5xl">
                    {children}
                    <Toaster  />
                  </main>
                </div>

                <aside className="fixed bottom-4 right-4">
                  <ChatWindow />
                </aside>
              </div>
            </CrashProvider>
          </KeylessProvider>
        </body>
    </html>
  );
}

function HamburgerNavigation() {
  return (
    <Sheet>
      <SheetTrigger>
        <MenuIcon className="cursor-pointer text-green-500 hover:opacity-80" />
      </SheetTrigger>
      <SheetContent className="w-[70%] bg-neutral-950 border-neutral-700 flex flex-col items-start gap-2 pt-8" side={"left"}>
        <SheetClose asChild>
          <Link href='/' className="text-white text-2xl font-bold">Home</Link>  
        </SheetClose>
        <SheetClose asChild>
          <Link href='/crash' className="text-sm opacity-50">
            Crash
          </Link>
        </SheetClose>
        <SheetClose asChild>
          <Link href='/pool' className="text-sm opacity-50">
            Pool
          </Link>
        </SheetClose>
      </SheetContent>
    </Sheet>
  )
}