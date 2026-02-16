'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { issueService } from '@/lib/services/issueService';
import { USER_ROLES } from '@/lib/types';
import StatusBadge from '@/components/StatusBadge';
import Pagination from '@/components/Pagination';
import { formatDate } from '@/lib/helpers';
import toast from 'react-hot-toast';
import { Plus, Search } from 'lucide-react';

export default function IssuesListPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState(null);

  useEffect(() => {
    if (user?.role === USER_ROLES.MEMBER) {
      router.replace('/issues/my-issues');
      return;
    }
    fetchIssues();
  }, [page, search, user, router]);

  const fetchIssues = async () => {
    try {
      const response = await issueService.getAll({ page, limit: 10, search });
      console.log('Issues response:', response);
      setIssues(response.data || []);
      setMeta(response.pagination);
    } catch (error) {
      console.error('Fetch issues error:', error);
      toast.error('Failed to fetch issues');
    } finally {
      setLoading(false);
    }
  };

  const handleReturn = async (id) => {
    if (!confirm('Mark this book as returned?')) return;

    try {
      await issueService.returnBook(id, {});
      toast.success('Book returned successfully');
      fetchIssues();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to return book');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-100">All Issues</h1>
        <Link
          href="/issues/new"
          className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg shadow-blue-500/30"
        >
          <Plus className="w-5 h-5" />
          <span>Issue Book</span>
        </Link>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 shadow-xl">
        <div className="flex items-center space-x-2">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by book title or user name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-100 placeholder-slate-500"
          />
        </div>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-slate-700">
            <thead className="bg-slate-900/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase">Book</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase">Issued</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase">Due</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase">Returned</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase">Status</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-slate-300 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {issues.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    No issues found
                  </td>
                </tr>
              ) : (
                issues.map((issue) => (
                  <tr key={issue.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-slate-100 max-w-xs truncate">{issue.book?.title}</td>
                    <td className="px-4 py-3 text-sm text-slate-300 whitespace-nowrap">
                      {issue.issuedTo?.firstName} {issue.issuedTo?.lastName}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">{formatDate(issue.issueDate)}</td>
                    <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">{formatDate(issue.dueDate)}</td>
                    <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">{formatDate(issue.returnDate) || '-'}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={issue.status} type="issue" />
                    </td>
                    <td className="px-4 py-3 text-center">
                      {issue.status === 'ACTIVE' && (
                        <button
                          onClick={() => handleReturn(issue.id)}
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
                        >
                          Return
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {meta && meta.totalPages > 1 && (
          <div className="border-t border-slate-700 p-4">
            <Pagination
              currentPage={meta.page}
              totalPages={meta.totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}
