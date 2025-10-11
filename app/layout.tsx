import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"

const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" })
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" })

export const metadata: Metadata = {
  title: "IPL Auction App",
  description: "Ultimate Cricket Auction Experience",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <body
        className={`${geistSans.className} bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white`}
      >
        {children}
      </body>
    </html>
  )
}
