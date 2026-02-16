'use client';

import { useState, useEffect } from 'react';
import { fineService } from '@/lib/services/fineService';
import toast from 'react-hot-toast';

export default function MyFinesPage() {
  const [fines, setFines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyFines();
  }, []);

  const fetchMyFines = async () => {
    try {
      const response = await fineService.getMyFines({ limit: 100 });
      setFines(response.data?.data?.overdueBooks || []);
    } catch (error) {
      toast.error('Failed to fetch your fines');
      setFines([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async (issueId) => {
    if (!confirm('Confirm payment of this fine?')) return;

    try {
      await fineService.recordPayment(issueId, { paymentMethod: 'CASH' });
      toast.success('Fine paid successfully');
      fetchMyFines();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to pay fine');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const totalFine = fines.reduce((sum, fine) => sum + (fine.fineAmount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-100">My Fines</h1>
        {totalFine > 0 && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 backdrop-blur-sm">
            <p className="text-sm text-red-400">Total Outstanding</p>
            <p className="text-2xl font-bold text-red-400">₹{totalFine}</p>
          </div>
        )}
      </div>

      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl shadow-xl overflow-hidden">
        {fines.length === 0 ? (
          <p className="text-center text-slate-400 py-12">You have no fines</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-slate-700">
              <thead className="bg-slate-900/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase">Book</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase">Due Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase">Days Overdue</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase">Fine Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-slate-300 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {fines.map((fine) => (
                  <tr key={fine.issueId} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-100">{fine.bookTitle}</td>
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
                    <td className="px-4 py-3 text-center">
                      {fine.fineAmount > 0 && (
                        <button
                          onClick={() => handlePay(fine.issueId)}
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
                        >
                          Pay Fine
                        </button>
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
