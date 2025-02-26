// layout.tsx
import type React from "react"
import "./globals.css"
import { Inter } from "next/font/google"
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"
import AppKitProvider from "@/components/AppKitProvider"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "BSlap Awards",
  description: "Give The Person You Like Or Dislike The Most An Award",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.className} flex flex-col min-h-screen`}>
        <AppKitProvider>
          <Navbar />
          <main className="flex-grow">{children}</main>
          <Footer />
        </AppKitProvider>
      </body>
    </html>
  )
}
