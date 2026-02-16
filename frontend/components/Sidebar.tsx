'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  FileText,
  DollarSign
} from 'lucide-react';
import { USER_ROLES } from '@/lib/types';

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: [USER_ROLES.LIBRARIAN, USER_ROLES.MEMBER] },
    { name: 'Books', href: '/books', icon: BookOpen, roles: [USER_ROLES.LIBRARIAN, USER_ROLES.MEMBER] },
    { name: 'Members', href: '/users', icon: Users, roles: [USER_ROLES.LIBRARIAN] },
    { name: 'Issues', href: '/issues', icon: FileText, roles: [USER_ROLES.LIBRARIAN, USER_ROLES.MEMBER] },
    { name: 'Fines', href: '/fines', icon: DollarSign, roles: [USER_ROLES.LIBRARIAN, USER_ROLES.MEMBER] },
  ];

  const filteredNavigation = navigation.filter(item =>
    item.roles.includes(user?.role)
  );

  return (
    <aside className="w-64 bg-slate-900 text-white min-h-screen border-r border-slate-800">
      <div className="p-6 border-b border-slate-800">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
          Library MS
        </h2>
      </div>
      <nav className="p-4 space-y-2">
        {filteredNavigation.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/50'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
