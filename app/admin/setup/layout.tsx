'use client';

export default function AdminSetupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This layout doesn't require admin authentication
  // It's for creating the first admin account
  return <>{children}</>;
}

