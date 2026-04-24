import type { Metadata } from "next";
import { Fira_Sans } from "next/font/google";
import "./globals.css";
import { SupabaseProvider } from "../lib/supabase-provider";
import { AuthProvider } from "../lib/auth-context";
import { Toaster } from "sonner";
import Header from "./components/Header";

const firaSans = Fira_Sans({
  variable: "--font-fira-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://cinenotes-seven.vercel.app"),
  title: {
    default: "CineNotes - Avalie Filmes com Precisão",
    template: "%s - CineNotes",
  },
  description: "Avalie cada aspecto — do roteiro à trilha sonora — e veja o que a comunidade está achando.",
  openGraph: {
    title: "Sua opinião merece mais do que uma nota",
    description: "Avalie cada aspecto — do roteiro à trilha sonora — e veja o que a comunidade está achando.",
    url: "https://cinenotes-seven.vercel.app",
    siteName: "CineNotes",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "CineNotes - Avalie Filmes com Precisão",
      },
    ],
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sua opinião merece mais do que uma nota",
    description: "Avalie cada aspecto — do roteiro à trilha sonora — e veja o que a comunidade está achando.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={firaSans.variable}>
        <SupabaseProvider>
          <AuthProvider>
            <Header />
            <main className="pt-[72px]">
              {children}
            </main>
            <Toaster position="top-right" richColors />
          </AuthProvider>
        </SupabaseProvider>
      </body>
    </html>
  )
}
