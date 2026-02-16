'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { bookService } from '@/lib/services/bookService';
import { useAuth } from '@/contexts/AuthContext';
import { USER_ROLES, Book, PaginationMeta } from '@/lib/types';
import StatusBadge from '@/components/StatusBadge';
import Pagination from '@/components/Pagination';
import toast from 'react-hot-toast';
import { Plus, Search, Eye, Edit, Trash2 } from 'lucide-react';

export default function BooksListPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);

  useEffect(() => {
    fetchBooks();
  }, [currentPage, searchTerm]);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const response = await bookService.getAll({
        page: currentPage,
        limit: 10,
        search: searchTerm,
      });
      setBooks(response.data.data || []);
      setPagination(response.data.pagination);
    } catch (error) {
      toast.error('Failed to fetch books');
      setBooks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this book?')) return;

    try {
      await bookService.delete(id);
      toast.success('Book deleted successfully');
      fetchBooks();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete book');
    }
  };

  const canManageBooks = user?.role === USER_ROLES.LIBRARIAN;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-100">Books</h1>
        {canManageBooks && (
          <Link
            href="/books/add"
            className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg shadow-blue-500/30"
          >
            <Plus className="w-5 h-5" />
            <span>Add Book</span>
          </Link>
        )}
      </div>

      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 shadow-xl">
        <div className="flex items-center space-x-2">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search books by title, author, or ISBN..."
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
      ) : books.length === 0 ? (
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-12 text-center shadow-xl">
          <p className="text-slate-400">No books found</p>
        </div>
      ) : (
        <>
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-slate-700">
                <thead className="bg-slate-900/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase">Title</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase">Author</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase">ISBN</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {books.map((book) => (
                    <tr key={book.id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-slate-100">{book.title}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-slate-300">
                          {book.authors?.[0]?.name || 'Unknown'}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-slate-400">{book.isbn}</div>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={book.status} type="book" />
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">
                        <div className="flex items-center space-x-3">
                          <Link
                            href={`/books/${book.id}`}
                            className="text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          {canManageBooks && (
                            <>
                              <Link
                                href={`/books/${book.id}/edit`}
                                className="text-green-400 hover:text-green-300 transition-colors"
                              >
                                <Edit className="w-4 h-4" />
                              </Link>
                              <button
                                onClick={() => handleDelete(book.id)}
                                className="text-red-400 hover:text-red-300 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
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
