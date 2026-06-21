import { Geist } from "next/font/google";
import "./globals.css";
import Footer from "@/components/shared/Footer";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata = {
  title: "MediCare Connect",
  description: "Hospital Appointment & Healthcare Management System",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Footer />
      </body>
    </html>
  );
}
