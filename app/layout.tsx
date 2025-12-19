import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { OrganizationProvider } from "@/contexts/OrganizationContext";
import LayoutWrapper from "@/components/LayoutWrapper";

export const metadata: Metadata = {
  title: "Codev - Payment Platform",
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
            <LayoutWrapper>
              {children}
            </LayoutWrapper>
          </OrganizationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
