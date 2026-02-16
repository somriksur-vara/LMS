'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { userService } from '@/lib/services/userService';
import Pagination from '@/components/Pagination';
import toast from 'react-hot-toast';
import { Plus, Search, Eye, Trash2 } from 'lucide-react';

export default function UsersListPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, [currentPage, searchTerm]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await userService.getAll({
        page: currentPage,
        limit: 10,
        search: searchTerm,
        role: 'MEMBER',
      });
      setUsers(response.data || []);
      setPagination(response.pagination);
    } catch (error) {
      toast.error('Failed to fetch members');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this member?')) return;

    try {
      await userService.delete(id);
      toast.success('Member deleted successfully');
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete member');
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'LIBRARIAN':
        return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
      case 'MEMBER':
        return 'bg-green-500/20 text-green-400 border border-green-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border border-slate-500/30';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-100">Members</h1>
        <Link
          href="/users/add"
          className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg shadow-blue-500/30"
        >
          <Plus className="w-5 h-5" />
          <span>Add Member</span>
        </Link>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 shadow-xl">
        <div className="flex items-center space-x-2">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search members by name or email..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="flex-1 px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-100 placeholder-slate-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : users.length === 0 ? (
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-12 text-center shadow-xl">
          <p className="text-slate-400">No members found</p>
        </div>
      ) : (
        <>
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-slate-700">
                <thead className="bg-slate-900/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase">Phone</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-slate-100">
                          {user.firstName} {user.lastName}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-slate-300">{user.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-slate-400">{user.phone || 'N/A'}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">
                        <div className="flex items-center space-x-3">
                          <Link
                            href={`/users/${user.id}`}
                            className="text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="text-red-400 hover:text-red-300 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {pagination && pagination.totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={pagination.totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </>
      )}
    </div>
  );
}
