import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"

export const metadata: Metadata = {
  title: "Movie Inferno - Discover Movies & TV Shows",
  description:
    "Your ultimate destination for discovering movies and TV shows. Browse trending, popular, and top-rated content.",
  generator: "Movie Inferno",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable} antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
