import { BOOK_STATUS, ISSUE_STATUS } from '@/lib/types';

export default function StatusBadge({ status, type = 'book' }) {
  const getStatusColor = () => {
    if (type === 'book') {
      switch (status) {
        case BOOK_STATUS.AVAILABLE:
          return 'bg-green-100 text-green-800';
        case BOOK_STATUS.ISSUED:
          return 'bg-yellow-100 text-yellow-800';
        case BOOK_STATUS.MAINTENANCE:
          return 'bg-orange-100 text-orange-800';
        case BOOK_STATUS.LOST:
          return 'bg-red-100 text-red-800';
        default:
          return 'bg-gray-100 text-gray-800';
      }
    } else if (type === 'issue') {
      switch (status) {
        case ISSUE_STATUS.ACTIVE:
          return 'bg-blue-100 text-blue-800';
        case ISSUE_STATUS.RETURNED:
          return 'bg-green-100 text-green-800';
        case ISSUE_STATUS.OVERDUE:
          return 'bg-red-100 text-red-800';
        default:
          return 'bg-gray-100 text-gray-800';
      }
    }
  };

  return (
    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor()}`}>
      {status}
    </span>
  );
}
