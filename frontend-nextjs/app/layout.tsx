import "../styles/globals.css";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import { AuthProvider } from "@/context/AuthContext";
import ThemeProvider from "@/context/ThemeProvider";
import { SocketProvider } from "@/context/SocketContext";
import LoadingIndicator from "@/components/LoadingIndicator";

const inter = Inter({
  subsets: ["latin"],
  display: "swap", // Optimize font loading
});

export const metadata = {
  title: "Messaging App",
  description: "Real-time messaging application",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Suspense fallback={<LoadingIndicator />}>
          <AuthProvider>
            <ThemeProvider>
              <SocketProvider>{children}</SocketProvider>
            </ThemeProvider>
          </AuthProvider>
        </Suspense>
      </body>
    </html>
  );
}
