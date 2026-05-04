import { Inter } from "next/font/google";
import { ThemeProvider } from "@/context/ThemeContext";
import { NavigationProvider } from "@/context/NavigationContext";
import { FinanceProvider } from "@/context/FinanceContext";
import { ProductivityProvider } from "@/context/ProductivityContext";
import { AuthProvider } from "@/context/AuthContext";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "ApexHub - Personal Tracking System",
  description: "ApexHub - Personal tracking system for managing projects, finances, and productivity.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="dark" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthProvider>
          <ThemeProvider>
            <NavigationProvider>
              <FinanceProvider>
                <ProductivityProvider>
                  {children}
                </ProductivityProvider>
              </FinanceProvider>
            </NavigationProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
