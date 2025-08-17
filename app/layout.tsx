import type React from "react"
import { DM_Sans } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"

const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-dm-sans",
  weight: ["400", "500", "700"],
})

export const metadata = {
  title: "AI Meeting Notes Summarizer",
  description: "Transform transcripts into actionable insights",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${dmSans.variable} antialiased`}>
      <body className="font-sans" suppressHydrationWarning={true}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
