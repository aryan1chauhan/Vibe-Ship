'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Zap,
  LayoutDashboard,
  ListTodo,
  Target,
  LogOut,
  ChevronLeft,
  ChevronRight,
  User,
} from 'lucide-react';
import { useState } from 'react';

interface SidebarProps {
  userName?: string | null;
  userEmail?: string | null;
  userAvatar?: string | null;
}

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/tasks', label: 'Tasks', icon: ListTodo },
  { href: '/focus', label: 'Focus', icon: Target },
];

export function Sidebar({ userName, userEmail, userAvatar }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className="hidden md:flex h-screen sticky top-0 flex-col border-r transition-all duration-300"
        style={{
          width: collapsed ? '72px' : '260px',
          background: 'var(--background-secondary)',
          borderColor: 'var(--border)',
        }}
      >
        {/* Header / Brand */}
        <div
          className="h-16 flex items-center px-4 border-b shrink-0"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-tr from-orange-500 via-amber-500 to-rose-500 shadow-md shadow-orange-500/20"
            >
              <Zap className="w-5 h-5 text-white" />
            </div>
            {!collapsed && (
              <span className="font-bold text-lg whitespace-nowrap text-white">
                CrunchAI
              </span>
            )}
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 py-4 px-3 space-y-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                data-testid={`sidebar-nav-${label.toLowerCase()}`}
                className="flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden"
                style={{
                  background: isActive ? 'var(--primary-glow)' : 'transparent',
                  color: isActive
                    ? 'var(--primary-light)'
                    : 'var(--foreground-muted)',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'var(--surface)';
                    e.currentTarget.style.color = 'var(--foreground)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--foreground-muted)';
                  }
                }}
              >
                <Icon className="w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110" />
                {!collapsed && (
                  <span className="text-sm font-semibold tracking-tight">{label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Collapse Button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          data-testid="sidebar-collapse-btn"
          className="mx-3 mb-2 p-2 rounded-xl transition-all duration-200 cursor-pointer"
          style={{ color: 'var(--foreground-subtle)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--surface)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <div className="flex items-center gap-2">
              <ChevronLeft className="w-4 h-4" />
              <span className="text-xs font-medium">Collapse</span>
            </div>
          )}
        </button>

        {/* Profile Footer */}
        <div
          className="px-3 py-3 border-t shrink-0"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-3">
            {userAvatar ? (
              <img
                src={userAvatar}
                alt={userName || 'User'}
                className="w-8 h-8 rounded-full shrink-0 ring-1 ring-white/10"
              />
            ) : (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                style={{ background: 'var(--surface)' }}
              >
                <User
                  className="w-4 h-4"
                  style={{ color: 'var(--foreground-muted)' }}
                />
              </div>
            )}
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate text-white">
                  {userName || 'User'}
                </p>
                <p
                  className="text-xs truncate"
                  style={{ color: 'var(--foreground-subtle)' }}
                >
                  {userEmail}
                </p>
              </div>
            )}
            <button
              onClick={handleLogout}
              data-testid="sidebar-logout-btn"
              className="p-2 rounded-xl transition-all duration-200 shrink-0 cursor-pointer hover:bg-rose-500/10 hover:text-rose-400"
              title="Sign out"
              style={{ color: 'var(--foreground-subtle)' }}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="bottom-nav">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              data-testid={`mobile-nav-${label.toLowerCase()}`}
              className={`bottom-nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span>{label}</span>
            </Link>
          );
        })}
        <button
          onClick={handleLogout}
          data-testid="mobile-logout-btn"
          className="bottom-nav-item hover:text-red-400"
        >
          <LogOut className="w-5 h-5 mb-0.5" />
          <span>Sign Out</span>
        </button>
      </nav>
    </>
  );
}
