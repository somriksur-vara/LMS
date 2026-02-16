'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { bookService } from '@/lib/services/bookService';
import { BookOpen, Users, FileText, DollarSign, TrendingUp } from 'lucide-react';
import { USER_ROLES } from '@/lib/types';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<{
    totalBooks: number;
    availableBooks: number;
    issuedBooks: number;
    totalUsers: number;
    activeIssues: number;
    overdueIssues: number;
    totalFines: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      const isLibrarian = user?.role === USER_ROLES.LIBRARIAN;
      const isMember = user?.role === USER_ROLES.MEMBER;

      const booksResponse = await bookService.getAll({ limit: 1000 });
      
      const responseData = (booksResponse as any).data;
      const allBooks = responseData?.data || [];
      const booksPagination = responseData?.pagination;
      const totalBooks = booksPagination?.total || allBooks.length;
      
      let availableBooks = 0;
      let issuedBooks = 0;
      
      if (Array.isArray(allBooks)) {
        availableBooks = allBooks.filter((b: any) => b.status === 'AVAILABLE').length;
        issuedBooks = allBooks.filter((b: any) => b.status === 'ISSUED').length;
      }

      let totalUsers = 0;
      let activeIssues = 0;
      let overdueIssues = 0;
      let totalFines = 0;

      if (isLibrarian) {
        const [usersResponse, activeIssuesResponse, overdueIssuesResponse, allIssuesResponse] = await Promise.all([
          api.get('/users?role=MEMBER&limit=1'),
          api.get('/issues?status=ACTIVE&limit=1'),
          api.get('/issues?overdue=true&limit=1'),
          api.get('/issues?limit=1000')
        ]);

        totalUsers = usersResponse.data.pagination?.total || 0;
        activeIssues = activeIssuesResponse.data.pagination?.total || 0;
        overdueIssues = overdueIssuesResponse.data.pagination?.total || 0;

        const allIssues = allIssuesResponse.data.data || [];
        totalFines = allIssues.reduce((sum: number, issue: any) => sum + (issue.fine || 0), 0);
      } else if (isMember) {
        const myIssuesResponse = await api.get('/issues/my-issues?limit=1');
        activeIssues = myIssuesResponse.data.pagination?.total || 0;
      }

      setStats({
        totalBooks,
        availableBooks,
        issuedBooks,
        totalUsers,
        activeIssues,
        overdueIssues,
        totalFines: totalFines.toFixed(2),
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);

      setStats({
        totalBooks: 0,
        availableBooks: 0,
        issuedBooks: 0,
        totalUsers: 0,
        activeIssues: 0,
        overdueIssues: 0,
        totalFines: '0.00',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Books',
      value: stats?.totalBooks || 0,
      icon: BookOpen,
      gradient: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-500/10 to-cyan-500/10',
      roles: [USER_ROLES.LIBRARIAN],
    },
    {
      title: 'Available Books',
      value: stats?.availableBooks || 0,
      icon: BookOpen,
      gradient: 'from-green-500 to-emerald-500',
      bgGradient: 'from-green-500/10 to-emerald-500/10',
      roles: [USER_ROLES.LIBRARIAN, USER_ROLES.MEMBER],
    },
    {
      title: 'Issued Books',
      value: stats?.issuedBooks || 0,
      icon: FileText,
      gradient: 'from-yellow-500 to-orange-500',
      bgGradient: 'from-yellow-500/10 to-orange-500/10',
      roles: [USER_ROLES.LIBRARIAN],
    },
    {
      title: 'Total Members',
      value: stats?.totalUsers || 0,
      icon: Users,
      gradient: 'from-purple-500 to-pink-500',
      bgGradient: 'from-purple-500/10 to-pink-500/10',
      roles: [USER_ROLES.LIBRARIAN],
    },
    {
      title: 'Active Issues',
      value: stats?.activeIssues || 0,
      icon: TrendingUp,
      gradient: 'from-indigo-500 to-blue-500',
      bgGradient: 'from-indigo-500/10 to-blue-500/10',
      roles: [USER_ROLES.LIBRARIAN, USER_ROLES.MEMBER],
    },
    {
      title: 'Overdue Issues',
      value: stats?.overdueIssues || 0,
      icon: FileText,
      gradient: 'from-red-500 to-rose-500',
      bgGradient: 'from-red-500/10 to-rose-500/10',
      roles: [USER_ROLES.LIBRARIAN],
    },
    {
      title: 'Total Fines',
      value: `₹${stats?.totalFines || '0.00'}`,
      icon: DollarSign,
      gradient: 'from-orange-500 to-amber-500',
      bgGradient: 'from-orange-500/10 to-amber-500/10',
      roles: [USER_ROLES.LIBRARIAN],
    },
  ];

  const filteredStats = statCards.filter(card => card.roles.includes(user?.role as any));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-100">Dashboard</h1>
        <div className="text-sm text-slate-400">
          Welcome back, <span className="text-blue-400 font-medium">{user?.name}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className={`relative overflow-hidden bg-gradient-to-br ${stat.bgGradient} backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20`}
            >
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-slate-400 font-medium">{stat.title}</p>
                  <p className="text-3xl font-bold text-slate-100">{stat.value}</p>
                </div>
                <div className={`p-4 rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.gradient}`}></div>
            </div>
          );
        })}
      </div>

      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 shadow-xl">
        <h2 className="text-xl font-semibold text-slate-100 mb-3">Quick Info</h2>
        <p className="text-slate-300">
          You are logged in as <span className="font-semibold text-blue-400">{user?.role}</span>.
          Use the sidebar to navigate through the system.
        </p>
      </div>
    </div>
  );
}
