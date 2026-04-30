import "./globals.css";

export const metadata = {
  title: "First Step School - Daily Plan",
  description: "Auto-generate tomorrow's class plan poster",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
  themeColor: "#C02942",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
