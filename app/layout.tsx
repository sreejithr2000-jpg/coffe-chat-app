import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: {
    default: "Lumora OneFlow | Career Mentorship & Growth",
    template: "%s · Lumora OneFlow",
  },
  description:
    "Lumora OneFlow connects ambitious professionals with real practitioners. Book focused career sessions — one clear path from preparation to momentum.",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/brand/lumora-oneflow-icon.png", type: "image/png", sizes: "any" },
    ],
    apple: "/brand/lumora-oneflow-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={poppins.variable}>
      <body className="min-h-screen bg-white antialiased">
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
