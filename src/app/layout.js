import { Inter, Dancing_Script } from "next/font/google";
import { ThemeProvider } from "@/context/ThemeContext";
import { NavigationProvider } from "@/context/NavigationContext";
import { FinanceProvider } from "@/context/FinanceContext";
import { ProductivityProvider } from "@/context/ProductivityContext";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/components/ui/Toast";
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });
const dancingScript = Dancing_Script({ 
  subsets: ["latin"],
  variable: '--font-dancing-script',
});

export const metadata = {
  title: "ApexHub - Personal Tracking System",
  description: "ApexHub - Personal tracking system for managing projects, finances, and productivity.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ApexHub"
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/favicon.png", sizes: "48x48", type: "image/png" }
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }
    ]
  }
};

// Next injects <meta name="viewport"> from this export. viewportFit: "cover"
// is what makes env(safe-area-inset-bottom) resolve to a real value, which the
// mobile .bottom-nav relies on to clear the home indicator in standalone mode.
export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0F172A",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="dark" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className={`${inter.className} ${dancingScript.variable}`}>
        <ServiceWorkerRegistrar />
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
