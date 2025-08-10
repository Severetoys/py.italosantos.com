import { NextRequest, NextResponse } from 'next/server';

// Rotas que requerem assinatura ativa
const SUBSCRIPTION_REQUIRED_PATHS = [
  '/galeria-assinantes'
];

// Rotas que requerem apenas autenticação básica
const AUTH_REQUIRED_PATHS = [
  '/admin',
  '/dashboard'
];

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  console.log(`🔍 Middleware triggered for: ${pathname}`);
  
  // Verificar se é uma rota protegida que requer assinatura
  const requiresSubscription = SUBSCRIPTION_REQUIRED_PATHS.some(path => 
    pathname.startsWith(path)
  );
  
  console.log(`📋 Requer assinatura: ${requiresSubscription}`);
  
  if (requiresSubscription) {
    // Verificar headers ou cookies para autenticação/assinatura
    const isAuthenticated = request.headers.get('x-authenticated') === 'true' ||
                           request.cookies.get('isAuthenticated')?.value === 'true';
    
    const hasSubscription = request.headers.get('x-has-subscription') === 'true' ||
                          request.cookies.get('hasSubscription')?.value === 'true';
    
    console.log(`🔐 Autenticado: ${isAuthenticated}, Tem assinatura: ${hasSubscription}`);
    
    // Se não estiver autenticado, redirecionar para Face ID
    if (!isAuthenticated) {
      console.log(`🚫 Middleware: Acesso negado a ${pathname} - não autenticado`);
      return NextResponse.redirect(new URL('/auth/face', request.url));
    }
    
    // Se não tiver assinatura ativa, redirecionar para página de assinatura
    if (!hasSubscription) {
      console.log(`🚫 Middleware: Acesso negado a ${pathname} - sem assinatura ativa`);
      return NextResponse.redirect(new URL('/assinante', request.url));
    }
    
    console.log(`✅ Middleware: Acesso permitido a ${pathname}`);
  }
  
  // Verificar rotas que requerem apenas autenticação básica
  const requiresAuth = AUTH_REQUIRED_PATHS.some(path => 
    pathname.startsWith(path)
  );
  
  if (requiresAuth) {
    const isAuthenticated = request.headers.get('x-authenticated') === 'true' ||
                           request.cookies.get('isAuthenticated')?.value === 'true';
    
    if (!isAuthenticated) {
      console.log(`🚫 Middleware: Acesso negado a ${pathname} - não autenticado`);
      return NextResponse.redirect(new URL('/auth/face', request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Proteger rotas específicas
    '/galeria-assinantes',
    '/galeria-assinantes/:path*',
    '/admin/:path*',
    '/dashboard/:path*'
  ]
};
