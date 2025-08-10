
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Inter } from 'next/font/google';
import Layout from '@/components/layout/layout';
import WhatsAppButton from '@/components/whatsapp-button';
import Script from 'next/script';
import ScreenProtector from '@/components/screen-protector';
import { FaceIDAuthProvider } from '@/contexts/face-id-auth-context';
import { AuthProvider } from '@/contexts/AuthProvider';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'Italo Santos',
  description: 'Sistema profissional de autenticação e pagamentos.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  
  return (
    <html lang="pt-BR" className="dark" suppressHydrationWarning>
      <head>
        <Script id="error-handler" strategy="beforeInteractive">
          {`
            // Capturar erros de segurança cross-origin e outros erros relacionados a iframes
            window.addEventListener('error', function(event) {
              if (event.message && event.message.includes('cross-origin')) {
                console.warn('Erro cross-origin capturado e ignorado:', event.message);
                event.preventDefault();
                return false;
              }
            });
            
            // Capturar erros de segurança específicos
            window.addEventListener('securitypolicyviolation', function(event) {
              console.warn('Violação de política de segurança capturada:', event);
            });
          `}
        </Script>
      </head>
      <body className={`font-sans ${inter.variable} antialiased bg-background`}>
        <Script id="google-tag-manager" strategy="afterInteractive">
            {`
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','GTM-XXXXXXX');
            `}
        </Script>
        <noscript>
            <iframe
                src="https://www.googletagmanager.com/ns.html?id=GTM-XXXXXXX"
                height="0"
                width="0"
                style={{ display: "none", visibility: "hidden" }}
            ></iframe>
        </noscript>
        
        <div id="fb-root"></div>
        <Script id="facebook-jssdk" strategy="afterInteractive">
          {`
            window.fbAsyncInit = function() {
              FB.init({
                appId      : '3924094051199143',
                cookie     : true,
                xfbml      : true,
                version    : 'v23.0'
              });
              
              FB.AppEvents.logPageView();

              // Dispara um evento personalizado quando o SDK estiver pronto
              window.dispatchEvent(new Event('fb-sdk-ready'));
            };

            (function(d, s, id){
               var js, fjs = d.getElementsByTagName(s)[0];
               if (d.getElementById(id)) {return;}
               js = d.createElement(s); js.id = id;
               js.src = "https://connect.facebook.net/en_US/sdk.js";
               fjs.parentNode.insertBefore(js, fjs);
             }(document, 'script', 'facebook-jssdk'));
          `}
        </Script>
        
        <AuthProvider>
          <FaceIDAuthProvider>
            <Layout>
              {children}
            </Layout>
          </FaceIDAuthProvider>
        </AuthProvider>
        <Toaster />
        <Sonner />
        <WhatsAppButton />
        <ScreenProtector />
      </body>
    </html>
  );
}
