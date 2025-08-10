
"use client";

import { useState, useEffect, useCallback } from 'react';
import AdminHeader from '@/components/admin/header';
import AdminSidebar from '@/components/admin/sidebar';
import AdminLoginForm from './login-form';
import { usePathname, useRouter } from 'next/navigation';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const authStatus = localStorage.getItem("adminAuthenticated");
    const authenticated = authStatus === "true";
    setIsAuthenticated(authenticated);

    if (!authenticated && pathname !== "/admin/login") {
      // O layout agora controla o que é exibido, não precisa mais de redirecionamento aqui.
    }
  }, [pathname, router]);

  const handleAuthSuccess = useCallback(() => {
    setIsAuthenticated(true);
    router.replace('/admin');
  }, [router]);
  
  const handleLogout = useCallback(() => {
    localStorage.removeItem("adminAuthenticated");
    setIsAuthenticated(false);
    // Redireciona para a página inicial ao fazer logout.
    router.push('/');
  }, [router]);

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };
  
  // Exibe um estado de carregamento enquanto a autenticação é verificada no cliente.
  if (isAuthenticated === null) {
    return (
       <div className="flex h-screen w-full items-center justify-center bg-background">
        <p className="text-muted-foreground">Verificando autorização...</p>
      </div>
    );
  }

  // Se não estiver autenticado, renderiza o formulário de login.
  if (!isAuthenticated) {
    return <AdminLoginForm onAuthSuccess={handleAuthSuccess} />;
  }

  // Se autenticado, renderiza o layout do painel de administração.
  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      {/* Sidebar para Desktop */}
      <div className="hidden border-r bg-muted/40 md:block">
        <AdminSidebar onLogout={handleLogout} />
      </div>

      {/* Layout Principal */}
      <div className="flex flex-col">
        {/* Cabeçalho para Mobile */}
        <AdminHeader onMenuClick={toggleSidebar} />
        
        {/* Conteúdo da Página */}
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          {children}
        </main>
      </div>

      {/* Sidebar para Mobile (Sheet) */}
      {isSidebarOpen && (
        <div 
            className="fixed inset-0 bg-black/60 z-30 md:hidden" 
            onClick={toggleSidebar}
        >
            <div 
                className="fixed top-0 left-0 h-full w-[280px] bg-muted/40 z-40 border-r"
                onClick={(e) => e.stopPropagation()}
            >
                <AdminSidebar onLogout={() => {
                    handleLogout();
                    toggleSidebar();
                }} />
            </div>
        </div>
      )}
    </div>
  );
}
