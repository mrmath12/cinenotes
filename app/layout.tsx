import type { Metadata } from "next";
import { Unica_One } from "next/font/google";
import "./globals.css";
import { SupabaseProvider } from "../lib/supabase-provider";
import { AuthProvider } from "../lib/auth-context";
import { Toaster } from "sonner";

const unicaOne = Unica_One({
  variable: "--font-unica-one",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "CineNotes - Avalie Filmes com Precisão",
  description: "Plataforma para avaliação de filmes com critérios profissionais. Compartilhe suas opiniões e descubra novos filmes.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={unicaOne.variable}>
        <SupabaseProvider>
          <AuthProvider>
            {children}
            <Toaster position="top-right" richColors />
          </AuthProvider>
        </SupabaseProvider>
      </body>
    </html>
  )
}
