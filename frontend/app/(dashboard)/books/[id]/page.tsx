'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { bookService } from '@/lib/services/bookService';
import { useAuth } from '@/contexts/AuthContext';
import { USER_ROLES } from '@/lib/types';
import StatusBadge from '@/components/StatusBadge';
import toast from 'react-hot-toast';
import { ArrowLeft, Edit, Trash2, BookOpen } from 'lucide-react';

export default function BookDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBook();
  }, [params.id]);

  const fetchBook = async () => {
    try {
      const response = await bookService.getById(params.id);
      setBook(response.data);
    } catch (error) {
      toast.error('Failed to fetch book details');
      router.push('/books');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this book?')) return;

    try {
      await bookService.delete(params.id);
      toast.success('Book deleted successfully');
      router.push('/books');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete book');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!book) {
    return <div>Book not found</div>;
  }

  const canManageBooks = user?.role === USER_ROLES.LIBRARIAN;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Link
            href="/books"
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Books</span>
          </Link>
        </div>
        {canManageBooks && (
          <div className="flex items-center space-x-2">
            <Link
              href={`/books/${book.id}/edit`}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <Edit className="w-4 h-4" />
              <span>Edit</span>
            </Link>
            <button
              onClick={handleDelete}
              className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white">
          <div className="flex items-start space-x-6">
            <div className="bg-white/20 p-4 rounded-lg">
              <BookOpen className="w-16 h-16" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{book.title}</h1>
              <p className="text-blue-100 text-lg">
                by {book.authors?.map(a => a.name).join(', ') || 'Unknown Author'}
              </p>
              <div className="mt-4">
                <StatusBadge status={book.status} type="book" />
              </div>
            </div>
          </div>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-1">ISBN</h3>
              <p className="text-lg text-gray-800">{book.isbn}</p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-1">Publisher</h3>
              <p className="text-lg text-gray-800">{book.publisher || 'N/A'}</p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-1">Publication Year</h3>
              <p className="text-lg text-gray-800">{book.publishedYear || 'N/A'}</p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-1">Total Copies</h3>
              <p className="text-lg text-gray-800">{book.totalCopies}</p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-1">Available Copies</h3>
              <p className="text-lg text-gray-800">{book.availableCopies}</p>
            </div>
          </div>

          {book.description && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Description</h3>
              <p className="text-gray-700 leading-relaxed">{book.description}</p>
            </div>
          )}

          <div className="mt-6 pt-6 border-t">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <span className="font-semibold">Created:</span>{' '}
                {new Date(book.createdAt).toLocaleDateString()}
              </div>
              <div>
                <span className="font-semibold">Last Updated:</span>{' '}
                {new Date(book.updatedAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
