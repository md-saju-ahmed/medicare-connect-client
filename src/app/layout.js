import { Geist } from "next/font/google";
import "./globals.css";
import Footer from "@/components/shared/Footer";
import Navbar from "@/components/shared/Navbar";
import Providers from "@/app/Providers";
import { Toaster } from "react-hot-toast";

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
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Providers>
          <Navbar />
          {children}
          <Footer />
          <Toaster position="top-right" reverseOrder={false} />
        </Providers>
      </body>
    </html>
  );
}
