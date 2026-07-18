'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon, Laptop } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

export default function AuthThemeToggler() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="absolute top-4 right-4 z-50">
      <DropdownMenu>
        <DropdownMenuTrigger 
          className="inline-flex items-center justify-center h-9 w-9 bg-card/60 backdrop-blur-xs border border-border text-foreground hover:bg-accent hover:text-foreground rounded-md cursor-pointer transition-colors focus-visible:outline-hidden"
          title="Toggle theme"
        >
          {theme === 'light' ? (
            <Sun className="h-4.5 w-4.5 text-amber-500" />
          ) : theme === 'dark' ? (
            <Moon className="h-4.5 w-4.5 text-indigo-400" />
          ) : (
            <Laptop className="h-4.5 w-4.5" />
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-card border-border text-foreground">
          <DropdownMenuItem onClick={() => setTheme('light')} className="gap-2 focus:bg-accent cursor-pointer">
            <Sun className="h-4 w-4 text-amber-500" />
            <span>Light</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme('dark')} className="gap-2 focus:bg-accent cursor-pointer">
            <Moon className="h-4 w-4 text-indigo-400" />
            <span>Dark</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme('system')} className="gap-2 focus:bg-accent cursor-pointer">
            <Laptop className="h-4 w-4" />
            <span>System</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
