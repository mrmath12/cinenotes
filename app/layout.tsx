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
  title: {
    default: "CineNotes - Avalie Filmes com Precisão",
    template: "%s - CineNotes",
  },
  description: "Plataforma para avaliação de filmes com critérios profissionais. Compartilhe suas opiniões e descubra novos filmes.",
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
