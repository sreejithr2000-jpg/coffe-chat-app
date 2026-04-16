import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";

export const metadata: Metadata = {
  title: {
    default: "CoffeeChat — Connect with Mentors",
    template: "%s · CoffeeChat",
  },
  description:
    "Book coffee chats and mock interviews with experienced mentors (Aurors) who help you grow.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white antialiased">
        <Navbar />
        <main className="container-page py-10">{children}</main>
      </body>
    </html>
  );
}
