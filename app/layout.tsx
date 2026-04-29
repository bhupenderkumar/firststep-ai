export const metadata = {
  title: "First Step School - Daily Plan",
  description: "Auto-generate tomorrow's class plan poster",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily:
            "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
          background: "#FFFAF0",
          color: "#28283C",
        }}
      >
        {children}
      </body>
    </html>
  );
}
