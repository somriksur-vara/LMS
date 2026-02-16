# Library Management System

A full-stack library management system built with Next.js, NestJS, and PostgreSQL.

## Features

- User authentication and authorization (Librarian and Member roles)
- Book catalog management
- Book issue and return tracking
- Fine calculation and payment management
- Overdue book tracking
- User management

## Tech Stack

### Frontend
- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- React Hot Toast for notifications
- Axios for API calls

### Backend
- NestJS
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT Authentication
- Bcrypt for password hashing

## Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd LMS
```

2. Install backend dependencies
```bash
cd backend
npm install
```

3. Install frontend dependencies
```bash
cd ../frontend
npm install
```

4. Set up environment variables

Backend (.env):
```env
DATABASE_URL="postgresql://user:password@localhost:5432/library_db"
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"
PORT=3000
```

Frontend (.env.local):
```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

5. Run database migrations
```bash
cd backend
npx prisma migrate dev
```

6. Seed the database with demo data
```bash
npm run seed
```

7. Start the backend server
```bash
npm run start:dev
```

8. Start the frontend development server
```bash
cd ../frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3001
- Backend API: http://localhost:3000/api
- API Documentation: http://localhost:3000/api/docs

## Demo Credentials

The system comes with two pre-configured demo accounts:

### Librarian Account
- Email: `librarian@library.com`
- Password: `librarian123`
- Permissions: Full system access - manage books, users, issues, and fines

### Member Account
- Email: `member@library.com`
- Password: `member123`
- Permissions: View books, manage own issues and fines

## Fine Configuration

Default fine settings:
- Fine per day: ₹10
- Maximum fine amount: ₹1000
- Grace period: 1 day

## Project Structure

```
LMS/
├── backend/
│   ├── prisma/
│   │   ├── migrations/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── src/
│   │   ├── common/
│   │   ├── config/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── books/
│   │   │   ├── fines/
│   │   │   ├── issues/
│   │   │   └── users/
│   │   └── main.ts
│   └── package.json
├── frontend/
│   ├── app/
│   │   ├── (dashboard)/
│   │   │   ├── books/
│   │   │   ├── dashboard/
│   │   │   ├── fines/
│   │   │   ├── issues/
│   │   │   └── users/
│   │   └── login/
│   ├── components/
│   ├── contexts/
│   ├── lib/
│   └── package.json
└── README.md
```

## API Documentation

Once the backend is running, visit http://localhost:3000/api/docs for interactive API documentation powered by Swagger.

## License

MIT
