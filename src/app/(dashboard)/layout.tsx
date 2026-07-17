'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { 
  LayoutDashboard, 
  FolderKanban, 
  UserCircle, 
  LogOut, 
  Menu, 
  X,
  Sun,
  Moon,
  Laptop
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const { theme, setTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Projects', href: '/projects', icon: FolderKanban },
    { name: 'Profile', href: '/profile', icon: UserCircle },
  ];

  if (status === 'loading') {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950 dark:bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  const ThemeToggler = () => {
    if (!mounted) return <div className="h-9 w-full bg-accent/20 rounded-lg animate-pulse" />;
    return (
      <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-accent/10 border border-border/60">
        <span className="text-xs font-semibold text-muted-foreground">Theme</span>
        <div className="flex rounded-md bg-accent/30 p-0.5">
          <Button
            variant="ghost"
            size="icon"
            className={`h-6 w-6 rounded-sm p-0 ${
              theme === 'light' 
                ? 'bg-background text-amber-500 shadow-xs' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setTheme('light')}
            title="Light Mode"
          >
            <Sun className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={`h-6 w-6 rounded-sm p-0 ${
              theme === 'dark' 
                ? 'bg-background text-indigo-400 shadow-xs' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setTheme('dark')}
            title="Dark Mode"
          >
            <Moon className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={`h-6 w-6 rounded-sm p-0 ${
              theme === 'system' 
                ? 'bg-background text-foreground shadow-xs' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setTheme('system')}
            title="System Mode"
          >
            <Laptop className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground transition-colors duration-200">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:border-r md:border-border md:bg-card/40 backdrop-blur-md">
        <div className="flex h-16 items-center px-6 border-b border-border/80">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400">
              Opygen
            </span>
            <span className="text-sm font-semibold text-muted-foreground">Dash</span>
          </Link>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-6">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-l-2 border-indigo-500 pl-2.5'
                    : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                }`}
              >
                <item.icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-muted-foreground group-hover:text-foreground'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer controls & Profile */}
        <div className="border-t border-border/80 p-4 space-y-4 bg-accent/5">
          <ThemeToggler />

          <div className="flex items-center gap-3 pt-1">
            <Avatar className="h-9 w-9 border border-indigo-500/30">
              <AvatarImage src={session?.user?.avatarUrl || ''} alt={session?.user?.name || ''} />
              <AvatarFallback className="bg-accent text-indigo-600 dark:text-indigo-400 font-bold">
                {session?.user?.name?.substring(0, 2).toUpperCase() || 'OP'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-semibold text-foreground">{session?.user?.name}</p>
              <p className="truncate text-xs text-muted-foreground">{session?.user?.email}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors h-8 w-8"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile layouts */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="flex h-16 items-center justify-between border-b border-border px-4 md:hidden bg-card/60 backdrop-blur-md">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-500 to-pink-500 bg-clip-text text-transparent dark:from-indigo-400 dark:to-pink-400">
              Opygen
            </span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(true)}
            className="text-muted-foreground hover:text-foreground"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </header>

        {/* Mobile Menu Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            <div className="fixed inset-0 bg-background/80 backdrop-blur-xs" onClick={() => setMobileMenuOpen(false)} />
            
            <aside className="relative flex w-64 max-w-xs flex-1 flex-col bg-card border-r border-border animate-in slide-in-from-left duration-200">
              <div className="flex h-16 items-center justify-between px-6 border-b border-border">
                <Link href="/dashboard" className="flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                  <span className="text-xl font-bold bg-gradient-to-r from-indigo-500 to-pink-500 bg-clip-text text-transparent dark:from-indigo-400 dark:to-pink-400">
                    Opygen
                  </span>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <nav className="flex-1 space-y-1 px-3 py-6">
                {navigation.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-l-2 border-indigo-500 pl-2.5'
                          : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                      }`}
                    >
                      <item.icon className="h-4.5 w-4.5 shrink-0" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>

              <div className="border-t border-border p-4 space-y-4 bg-accent/5">
                <ThemeToggler />

                <div className="flex items-center gap-3 pt-1">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={session?.user?.avatarUrl || ''} />
                    <AvatarFallback className="bg-accent text-indigo-600 dark:text-indigo-400 font-bold">
                      {session?.user?.name?.substring(0, 2).toUpperCase() || 'OP'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 overflow-hidden">
                    <p className="truncate text-sm font-semibold text-foreground">{session?.user?.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{session?.user?.email}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors h-8 w-8"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </aside>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}
