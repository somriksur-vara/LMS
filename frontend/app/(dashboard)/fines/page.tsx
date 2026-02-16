'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { fineService } from '@/lib/services/fineService';
import { USER_ROLES } from '@/lib/types';
import toast from 'react-hot-toast';

export default function FinesListPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [fines, setFines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role === USER_ROLES.MEMBER) {
      router.replace('/fines/my-fines');
      return;
    }
    fetchFines();
  }, [user, router]);

  const fetchFines = async () => {
    try {
      const response = await fineService.getAll({ limit: 100 });
      setFines(response.data?.data?.overdueBooks || []);
    } catch (error) {
      toast.error('Failed to fetch fines');
      setFines([]);
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
      <h1 className="text-3xl font-bold text-slate-100">Overdue Fines</h1>

      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl shadow-xl overflow-hidden">
        {fines.length === 0 ? (
          <p className="text-center text-slate-400 py-12">No overdue fines</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-slate-700">
              <thead className="bg-slate-900/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase">Book</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase">Due Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase">Days Overdue</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase">Fine Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {fines.map((fine) => (
                  <tr key={fine.issueId} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-100">{fine.bookTitle}</td>
                    <td className="px-4 py-3 text-slate-300">{fine.userName}</td>
                    <td className="px-4 py-3 text-sm text-slate-400">{fine.dueDate}</td>
                    <td className="px-4 py-3 text-slate-300">{fine.daysOverdue || 0}</td>
                    <td className="px-4 py-3 font-medium text-red-400">
                      ₹{fine.fineAmount}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                        Unpaid
                      </span>
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
