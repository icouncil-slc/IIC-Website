import { Outfit } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { EdgeStoreProvider } from '../lib/edgestore';
import { Toaster } from "@/components/ui/sonner";
import ChatBot from "@/components/ChatBot";
import { Providers } from "./providers";


const outfit = Outfit({ subsets: ["latin"] });


export const metadata = {
  title: "IIC | Shyam Lal College",
  description: "Explore innovation and entrepreneurship initiatives at IIC Shyam Lal College. Stay updated with events, workshops, and opportunities driving student innovation and startup culture."
,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <link rel="icon" href="/favicon.ico" />
      <body className={outfit.className}>
        <Providers>
          <EdgeStoreProvider>
          <Navbar />
          {children}
          <ChatBot />
          <Toaster/>
          </EdgeStoreProvider>
        </Providers>
      </body>
    </html>
  );
}
