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
import { useState, useEffect } from 'react';

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
    <aside
      className="h-screen sticky top-0 flex flex-col border-r transition-all duration-300"
      style={{
        width: collapsed ? '72px' : '260px',
        background: 'var(--background-secondary)',
        borderColor: 'var(--border)',
      }}
    >
      {}
      <div
        className="h-16 flex items-center px-4 border-b shrink-0"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'var(--gradient-primary)' }}
          >
            <Zap className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <span className="font-bold text-lg whitespace-nowrap">
              CrunchAI
            </span>
          )}
        </div>
      </div>

      {}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group"
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
              <Icon className="w-5 h-5 shrink-0" />
              {!collapsed && (
                <span className="text-sm font-medium">{label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="mx-3 mb-2 p-2 rounded-lg transition-colors cursor-pointer"
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
            <span className="text-xs">Collapse</span>
          </div>
        )}
      </button>

      {}
      <div
        className="px-3 py-3 border-t shrink-0"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-3">
          {userAvatar ? (
            <img
              src={userAvatar}
              alt={userName || 'User'}
              className="w-8 h-8 rounded-full shrink-0"
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
              <p className="text-sm font-medium truncate">
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
            className="p-1.5 rounded-lg transition-colors shrink-0 cursor-pointer"
            title="Sign out"
            style={{ color: 'var(--foreground-subtle)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--surface)';
              e.currentTarget.style.color = 'var(--danger)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--foreground-subtle)';
            }}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
