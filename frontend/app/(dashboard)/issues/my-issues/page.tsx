'use client';

import { useState, useEffect } from 'react';
import { issueService } from '@/lib/services/issueService';
import StatusBadge from '@/components/StatusBadge';
import { formatDate } from '@/lib/helpers';
import toast from 'react-hot-toast';
import { BookOpen } from 'lucide-react';

export default function MyIssuesPage() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyIssues();
  }, []);

  const fetchMyIssues = async () => {
    try {
      const response = await issueService.getMyIssues({ limit: 100 });
      console.log('My issues response:', response);
      setIssues(response.data || []);
    } catch (error) {
      console.error('Fetch my issues error:', error);
      toast.error('Failed to fetch your issues');
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

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-100">My Issues</h1>

      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl shadow-xl overflow-hidden">
        {issues.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <BookOpen className="w-16 h-16 text-slate-600 mb-4" />
            <p className="text-center text-slate-400 text-lg">You have no issued books</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-slate-700">
              <thead className="bg-slate-900/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase">Book</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase">Issued</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase">Due</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase">Returned</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase">Fine</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {issues.map((issue) => (
                  <tr key={issue.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-slate-100 max-w-xs truncate">{issue.book?.title}</td>
                    <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">{formatDate(issue.issueDate)}</td>
                    <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">{formatDate(issue.dueDate)}</td>
                    <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">{formatDate(issue.returnDate) || '-'}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={issue.status} type="issue" />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {issue.fine > 0 ? (
                        <span className="text-red-400 font-medium">₹{issue.fine}</span>
                      ) : (
                        <span className="text-green-400">No Fine</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
