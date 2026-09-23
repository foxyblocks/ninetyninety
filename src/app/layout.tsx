import { Provider } from "@/components/ui/provider"
import type { Metadata } from "next"
import { Cormorant_Garamond, DM_Sans } from "next/font/google"

const display = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
})
const body = DM_Sans({ subsets: ["latin"], variable: "--font-body" })

export const metadata: Metadata = {
  title: "NinetyNinety - Elite Movie Discovery",
  description: "Discover the absolute best films with both 90%+ critics and audience scores",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark" style={{ colorScheme: "dark" }} suppressHydrationWarning>
      <body
        className={`${display.variable} ${body.variable}`}
        style={{ margin: 0, background: "#0e0e0c", fontFamily: "var(--font-body)" }}
      >
        <Provider forcedTheme="dark">{children}</Provider>
      </body>
    </html>
  )
}
