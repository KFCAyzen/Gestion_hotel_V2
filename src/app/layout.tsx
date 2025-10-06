import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "./context/AuthContext";
import { ActivityLogProvider } from "./context/ActivityLogContext";

export const metadata: Metadata = {
  title: "Gestion d'Hôtel",
  description: "Système de gestion d'hôtel",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="antialiased">
        <AuthProvider>
          <ActivityLogProvider>
            {children}
          </ActivityLogProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
