import type React from "react"
import type { Metadata } from "next"
import { Inter } from 'next/font/google'
import Script from "next/script"
import { CartProvider } from "@/context/cart-context"
import { MobileMenuProvider } from "@/context/mobile-menu-context"
import { CompareProvider } from "@/context/compare-context"
import { Toaster } from "@/components/ui/sonner"
import { ThemeProvider } from "@/components/theme-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Мадикс Граундбейтс - Професионални риболовни принадлежности",
  description: "Най-голямата фабрика за захранки в България. Висококачествени риболовни продукти от 1995 година.",
  generator: "v0.dev",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Madiks",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="bg">
      <head>
        {/* Meta Pixel Code */}
        <Script
          id="meta-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              
              // Wait for fbq to be available and then initialize
              function initPixel() {
                if (typeof window.fbq === 'function') {
                  console.log('Meta Pixel: Initializing with ID 4091774537713950');
                  fbq('init', '4091774537713950');
                  fbq('track', 'PageView');
                  console.log('Meta Pixel: PageView tracked successfully');
                } else {
                  console.log('Meta Pixel: fbq not ready, retrying...');
                  setTimeout(initPixel, 100);
                }
              }
              
              // Start initialization
              initPixel();
            `,
          }}
        />
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=4091774537713950&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>
        <Script
          id="google-analytics"
          strategy="afterInteractive"
          src="https://www.googletagmanager.com/gtag/js?id=G-W22547RZWL"
        />
        <Script
          id="google-analytics-config"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-W22547RZWL');
            `,
          }}
        />
        {/* Google Translate - hides default banner/UI while keeping translation engine */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              .goog-te-banner-frame.skiptranslate,
              .goog-te-gadget-icon,
              #goog-gt-tt,
              .goog-te-balloon-frame { display: none !important; }
              .goog-te-gadget { font-size: 0 !important; }
              #google_translate_element { display: none !important; }
              body { top: 0 !important; position: static !important; }
              .skiptranslate iframe { display: none !important; }
            `,
          }}
        />
        <Script
          id="google-translate-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              function googleTranslateElementInit() {
                new google.translate.TranslateElement(
                  {
                    pageLanguage: 'bg',
                    includedLanguages: 'en,bg',
                    autoDisplay: false,
                  },
                  'google_translate_element'
                );
              }
            `,
          }}
        />
        <Script
          id="google-translate-script"
          strategy="afterInteractive"
          src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
        />
      </head>
      <body className={inter.className}>
        <div id="google_translate_element" aria-hidden="true" />
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <CartProvider>
            <CompareProvider>
              <MobileMenuProvider>
                {children}
                <Toaster />
              </MobileMenuProvider>
            </CompareProvider>
          </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

import "./globals.css"
