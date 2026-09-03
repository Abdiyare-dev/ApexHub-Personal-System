import { Inter, Dancing_Script } from "next/font/google";
import { ThemeProvider } from "@/context/ThemeContext";
import { NavigationProvider } from "@/context/NavigationContext";
import { FinanceProvider } from "@/context/FinanceContext";
import { ProductivityProvider } from "@/context/ProductivityContext";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/components/ui/Toast";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });
const dancingScript = Dancing_Script({ 
  subsets: ["latin"],
  variable: '--font-dancing-script',
});

export const metadata = {
  title: "ApexHub - Personal Tracking System",
  description: "ApexHub - Personal tracking system for managing projects, finances, and productivity.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="dark" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#0F172A" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className={`${inter.className} ${dancingScript.variable}`}>
        <AuthProvider>
          <ThemeProvider>
            <NavigationProvider>
              <FinanceProvider>
                <ProductivityProvider>
                  <ToastProvider>
                    {children}
                  </ToastProvider>
                </ProductivityProvider>
              </FinanceProvider>
            </NavigationProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
