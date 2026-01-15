import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { OrganizationProvider } from "@/contexts/OrganizationContext";
import { BalanceProvider } from "@/contexts/BalanceContext";
import LayoutWrapper from "@/components/LayoutWrapper";

export const metadata: Metadata = {
  title: "Instanvi - Payment Platform",
  description: "instanvi UI Clone",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className="font-poppins antialiased bg-white text-gray-900"
      >
        <AuthProvider>
          <OrganizationProvider>
            <BalanceProvider>
              <LayoutWrapper>
                {children}
              </LayoutWrapper>
            </BalanceProvider>
          </OrganizationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
