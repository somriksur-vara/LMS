'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { userService } from '@/lib/services/userService';
import { issueService } from '@/lib/services/issueService';
import toast from 'react-hot-toast';
import { ArrowLeft, Trash2, User, Mail, Phone, MapPin, Calendar, BookOpen } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';

export default function UserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [user, setUser] = useState(null);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, [params.id]);

  const fetchUserData = async () => {
    try {
      const [userResponse, issuesResponse] = await Promise.all([
        userService.getById(params.id),
        issueService.getAll({ issuedToId: params.id, limit: 100 })
      ]);
      console.log('User response:', userResponse);
      console.log('Issues response:', issuesResponse);
      setUser(userResponse.data);
      setIssues(issuesResponse.data || []);
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Failed to fetch user details');
      router.push('/users');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this member?')) return;

    try {
      await userService.delete(params.id);
      toast.success('Member deleted successfully');
      router.push('/users');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete member');
    }
  };

  const calculateTotalFine = () => {
    return issues.reduce((total, issue) => total + (issue.fine || 0), 0);
  };

  const getActiveIssues = () => {
    return issues.filter(issue => issue.status === 'ACTIVE');
  };

  const getOverdueIssues = () => {
    return issues.filter(issue => 
      issue.status === 'ACTIVE' && new Date(issue.dueDate) < new Date()
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <div>Member not found</div>;
  }

  const activeIssues = getActiveIssues();
  const overdueIssues = getOverdueIssues();
  const totalFine = calculateTotalFine();

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'LIBRARIAN':
        return 'bg-blue-100 text-blue-800';
      case 'MEMBER':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Link
            href="/users"
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Members</span>
          </Link>
        </div>
        <button
          onClick={handleDelete}
          className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
        >
          <Trash2 className="w-4 h-4" />
          <span>Delete</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white">
          <div className="flex items-start space-x-6">
            <div className="bg-white/20 p-4 rounded-full">
              <User className="w-16 h-16" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">
                {user.firstName} {user.lastName}
              </h1>
              <p className="text-blue-100 text-lg">{user.email}</p>
              <div className="mt-4">
                <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                  {user.role}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start space-x-3">
              <Mail className="w-5 h-5 text-gray-400 mt-1" />
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-1">Email</h3>
                <p className="text-lg text-gray-800">{user.email}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Phone className="w-5 h-5 text-gray-400 mt-1" />
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-1">Phone</h3>
                <p className="text-lg text-gray-800">{user.phone || 'N/A'}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <MapPin className="w-5 h-5 text-gray-400 mt-1" />
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-1">Address</h3>
                <p className="text-lg text-gray-800">{user.address || 'N/A'}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Calendar className="w-5 h-5 text-gray-400 mt-1" />
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-1">Member Since</h3>
                <p className="text-lg text-gray-800">
                  {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Account Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <span className="font-semibold">Account Created:</span>{' '}
                {new Date(user.createdAt).toLocaleString()}
              </div>
              <div>
                <span className="font-semibold">Last Updated:</span>{' '}
                {new Date(user.updatedAt).toLocaleString()}
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Book Issue Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{issues.length}</div>
                <div className="text-sm text-gray-600">Total Issues</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{activeIssues.length}</div>
                <div className="text-sm text-gray-600">Active Issues</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{overdueIssues.length}</div>
                <div className="text-sm text-gray-600">Overdue Books</div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">₹{totalFine.toFixed(2)}</div>
                <div className="text-sm text-gray-600">Total Fines</div>
              </div>
            </div>
          </div>

          {issues.length > 0 && (
            <div className="mt-8 pt-6 border-t">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Issued Books</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Book</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Issue Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Return Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fine</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {issues.map((issue) => (
                      <tr key={issue.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <BookOpen className="w-4 h-4 text-gray-400" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">{issue.book?.title}</div>
                              <div className="text-xs text-gray-500">{issue.book?.isbn}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(issue.issueDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={new Date(issue.dueDate) < new Date() && issue.status === 'ACTIVE' ? 'text-red-600 font-semibold' : 'text-gray-500'}>
                            {new Date(issue.dueDate).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {issue.returnDate ? new Date(issue.returnDate).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={issue.fine > 0 ? 'text-red-600 font-semibold' : 'text-gray-500'}>
                            ₹{issue.fine?.toFixed(2) || '0.00'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={issue.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
