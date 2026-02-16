'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { issueService } from '@/lib/services/issueService';
import { bookService } from '@/lib/services/bookService';
import { userService } from '@/lib/services/userService';
import toast from 'react-hot-toast';
import { ArrowLeft, Plus } from 'lucide-react';

export default function IssueBookPage() {
  const router = useRouter();
  const [books, setBooks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    bookId: '',
    issuedToId: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [booksRes, usersRes] = await Promise.all([
        bookService.getAll({ limit: 100, status: 'AVAILABLE' }),
        userService.getAll({ limit: 100, role: 'MEMBER' })
      ]);
      
      const booksData = booksRes.data?.data || [];
      const usersData = usersRes.data || [];
      
      const memberUsers = usersData.filter((u: any) => u.isActive && u.role === 'MEMBER');
      
      setBooks(booksData);
      setUsers(memberUsers);
    } catch (error: any) {
      console.error('Fetch error:', error);
      console.error('Error response:', error?.response);
      toast.error(error?.response?.data?.message || 'Failed to fetch data');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await issueService.create(formData);
      toast.success('Book issued successfully');
      router.push('/issues');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to issue book');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center space-x-4 mb-6">
        <Link
          href="/issues"
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Issues</span>
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Issue Book</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Book *</label>
            <select
              name="bookId"
              value={formData.bookId}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select a book</option>
              {books.map(book => (
                <option key={book.id} value={book.id}>
                  {book.title} - {book.authors?.[0]?.name || 'Unknown'} (Available: {book.availableCopies})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">User *</label>
            <select
              name="issuedToId"
              value={formData.issuedToId}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select a user</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.firstName} {user.lastName} - {user.email}
                </option>
              ))}
            </select>
            <p className="mt-2 text-sm text-gray-600">
              Due date will be automatically set to 14 days from today
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              <span>{loading ? 'Issuing...' : 'Issue Book'}</span>
            </button>
            <Link
              href="/issues"
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
