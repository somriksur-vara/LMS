# 📚 Library Management System - Complete Guide

## 🎯 System Overview

A **Production-Ready Library Management System** with complete authentication, book management, issue tracking, and automated fine calculation.

**Tech Stack:** NestJS + PostgreSQL + Prisma + JWT + Docker

## 🏗️ How The Entire System Works

### 👥 **User Roles & What They Can Do**

```
🔴 ADMIN (Super User)
├── Manage all users (create, update, delete)
├── Configure system settings (fine rates, etc.)
├── View all reports and audit logs
└── Full access to everything

🟡 LIBRARIAN (Staff)
├── Issue and return books
├── Manage book catalog (add, edit books)
├── Handle fines (collect payments, waive fines)
└── View member activities

🟢 MEMBER (Regular User)
├── Browse and search books
├── View their issued books
├── Check and pay their fines
└── Update their own profile
```

### 🔐 **Authentication Flow - How Login Works**

```
1. User enters email/password → POST /auth/login
2. System checks database for user
3. Validates password (hashed with bcrypt)
4. If valid → Generate JWT token (contains user ID, email, role)
5. Return token + user info to frontend
6. Frontend stores token for future requests
7. All API calls include: Authorization: Bearer <token>
8. System validates token and extracts user info
```

**Default Test Users:**
- **Admin:** admin@library.com / admin123
- **Librarian:** librarian@library.com / librarian123  
- **Member:** member@library.com / member123

### 📖 **Complete Book Management Flow**

```
📚 ADDING BOOKS (Admin/Librarian)
1. POST /books → Create book record
2. Include: title, ISBN, authors, category, total copies
3. System creates book + links authors (many-to-many)
4. Sets availableCopies = totalCopies
5. Book becomes available for issuing

🔍 SEARCHING BOOKS (All Users)
1. GET /books → List with filters
2. Search by: title, author, ISBN, category
3. Filter by: availability, status
4. Shows: book details, availability, location
```

### 📋 **Book Issue & Return System**

```
📤 ISSUE PROCESS (Librarian)
1. Member requests book → Librarian processes
2. POST /issues → Create issue record
3. System checks:
   ✓ Book available? (availableCopies > 0)
   ✓ User eligible? (not suspended)
   ✓ No outstanding fines > ₹100?
4. If OK → Create issue, reduce availableCopies
5. Set expectedReturnDate (usually +14 days)
6. Status = ACTIVE

📥 RETURN PROCESS (Librarian)
1. Member returns book → Librarian scans
2. POST /issues/{id}/return → Mark as returned
3. System calculates:
   ✓ Days overdue (if any)
   ✓ Fine amount (₹10/day, max ₹500)
4. Update: actualReturnDate, fineAmount, status
5. Increase availableCopies
6. If overdue → Status = OVERDUE, apply fine
```

### 💰 **Fine System - Complete Logic (Simplified)**

```
🔢 HOW FINES ARE CALCULATED
Book due: Jan 15, returned: Jan 20 (5 days late)
Fine = 5 days × ₹10/day = ₹50
Maximum fine per book = ₹500

⏰ FINE LIFECYCLE
Book Issued → Due Date → Overdue → Fine Accrues → Payment → Cleared
     ↓           ↓          ↓           ↓            ↓         ↓
  14 days    Auto-mark   ₹10/day    User pays   Fine=₹0   Can issue
             OVERDUE     (max ₹500)              again

💳 PAYMENT PROCESS
1. User checks fines → GET /fines/my-fines
2. Shows: book title, days overdue, fine amount
3. User pays → POST /fines/pay/{issueId}
4. Payment methods: CASH, CARD, UPI, ONLINE
5. System records payment, reduces fine
6. If fully paid → User can issue new books

❌ ADMIN WAIVER
1. Admin can cancel fines → POST /fines/waive/{issueId}
2. Requires reason: "Book was pre-damaged"
3. Sets fine to ₹0, logs the action
```

#### **Simplified Fines Module**

We've dramatically simplified the fines system:

**✅ What it does:**
- **Calculates fines**: ₹10 per day for overdue books (max ₹500)
- **Tracks payments**: Record when users pay their fines
- **Admin controls**: Library staff can waive fines when needed

**✅ API Endpoints (Only 4):**
```bash
# For Users
GET  /fines/my-fines           # Check your current fines
POST /fines/pay/{issueId}      # Pay fine for a specific book

# For Admin/Librarian
GET  /fines/overdue            # View all overdue books with fines
POST /fines/waive/{issueId}    # Cancel a fine (with reason)
```

**✅ Example Usage:**
```bash
# Check my fines
GET /fines/my-fines

# Pay ₹50 fine for a book
POST /fines/pay/issue_123
{
  "paidAmount": 50.00,
  "paymentMethod": "CASH"
}

# Admin: Waive a fine
POST /fines/waive/issue_123
{
  "reason": "Book was damaged when issued"
}
```

**✅ Key Simplifications:**
- ❌ Removed complex fine configuration system
- ❌ Removed automatic cron jobs
- ❌ Removed pagination and complex queries
- ❌ Removed test data creation endpoints
- ✅ Fixed ₹10/day rate with ₹500 max
- ✅ Simple payment recording
- ✅ Clear admin waiver system
- ✅ Easy-to-understand responses

## 🔄 **Complete User Journey Examples**

### Example 1: Member Borrowing a Book
```
1. Member logs in → POST /auth/login
   Response: { accessToken: "jwt...", user: {...} }

2. Searches for book → GET /books?search="Clean Code"
   Response: [{ id: "book_123", title: "Clean Code", availableCopies: 2 }]

3. Goes to library, librarian issues book
   POST /issues
   {
     "bookId": "book_123",
     "issuedToId": "user_456"
   }

4. System response:
   {
     "success": true,
     "issueId": "issue_789",
     "dueDate": "2024-02-15",
     "message": "Book issued successfully"
   }

5. Book availableCopies reduced to 1
6. Issue status = ACTIVE
```

### Example 2: Late Return with Fine
```
1. Book due: Feb 15, returned: Feb 20 (5 days late)

2. Librarian processes return → POST /issues/issue_789/return
   System calculates: 5 days × ₹10 = ₹50 fine

3. Response:
   {
     "success": true,
     "message": "Book returned with fine",
     "fineAmount": 50.00,
     "daysOverdue": 5
   }

4. Member checks fines → GET /fines/my-fines
   Response:
   {
     "totalFines": 50.00,
     "overdueBooks": [{
       "issueId": "issue_789",
       "bookTitle": "Clean Code",
       "fineAmount": 50.00,
       "daysOverdue": 5
     }]
   }

5. Member pays fine → POST /fines/pay/issue_789
   {
     "paidAmount": 50.00,
     "paymentMethod": "CASH"
   }

6. Fine cleared, member can issue new books
```

### Example 3: Admin Managing System
```
1. Admin logs in → Full dashboard access

2. Views overdue books → GET /fines/overdue
   Shows all members with outstanding fines

3. Sees member with damaged book fine
   Admin waives fine → POST /fines/waive/issue_789
   {
     "reason": "Book was pre-damaged when issued"
   }

4. System sets fine to ₹0, logs the waiver action

5. Admin checks audit logs → GET /audit-logs
   Shows all system activities with timestamps
```

## 🗄️ **Database Structure & Relationships**

```
👤 USERS                    📚 BOOKS
├── id, email, password     ├── id, isbn, title
├── firstName, lastName     ├── totalCopies, availableCopies
├── role (ADMIN/LIBRARIAN/MEMBER) ├── status, publishedYear
└── isActive, createdAt     └── categoryId

📋 ISSUES (Book Loans)      💰 FINES
├── id, issueDate          ├── Calculated in Issue model
├── expectedReturnDate     ├── fineAmount (Decimal)
├── actualReturnDate       ├── Applied when overdue
├── fineAmount            └── Cleared when paid
├── status, notes
├── bookId → Book
├── issuedToId → User
└── processedById → User

📂 CATEGORIES              👥 AUTHORS
├── id, name               ├── id, name
├── description            ├── biography
└── isActive              └── Books (many-to-many)

📊 AUDIT_LOGS
├── id, action, entity
├── entityId, userId
├── metadata, timestamp
└── Tracks all activities
```

**Key Relationships:**
- User **has many** Issues (borrowed books)
- Book **has many** Issues (loan history)
- Issue **belongs to** User and Book
- Book **belongs to** Category
- Book **has many** Authors (many-to-many)
- All actions logged in AuditLogs

## 🚀 **API Endpoints - Complete List**

### 🔐 Authentication
```
POST /auth/login          # User login (get JWT token)
GET  /auth/profile        # Get current user info
```

### 👥 Users
```
GET    /users             # List all users (Admin)
POST   /users             # Create user (Admin)
GET    /users/{id}        # Get user details
PUT    /users/{id}        # Update user (Admin)
DELETE /users/{id}        # Delete user (Admin)
```

### 📚 Books
```
GET    /books             # List/search books (all users)
POST   /books             # Add book (Admin/Librarian)
GET    /books/{id}        # Get book details
PUT    /books/{id}        # Update book (Admin/Librarian)
DELETE /books/{id}        # Delete book (Admin/Librarian)
```

### 📋 Issues (Book Loans)
```
GET    /issues            # List issues with filters
POST   /issues            # Issue book (Librarian)
GET    /issues/{id}       # Get issue details
POST   /issues/{id}/return # Return book (Librarian)
PUT    /issues/{id}       # Update issue (Admin/Librarian)
```

### 💰 Fines (Simplified)
```
GET  /fines/my-fines      # Check your fines
POST /fines/pay/{issueId} # Pay fine for a book
GET  /fines/overdue       # All overdue books (Admin)
POST /fines/waive/{issueId} # Cancel fine (Admin)
```

### 📂 Categories
```
GET    /categories        # List categories
POST   /categories        # Create category (Admin/Librarian)
PUT    /categories/{id}   # Update category (Admin/Librarian)
DELETE /categories/{id}   # Delete category (Admin/Librarian)
```

### 📊 Audit Logs
```
GET /audit-logs           # View system activities (Admin)
```

### ❤️ Health Check
```
GET /health               # System status
```

## 🔄 **Data Flow - How Everything Connects**

```
Frontend → JWT Auth → Role Check → Controller → Service → Database → Response

Example: Member checking fines
1. Frontend: GET /fines/my-fines with JWT token
2. JWT Guard: Validates token, extracts user ID
3. Controller: Calls FinesService.getUserFines(userId)
4. Service: Queries database for user's overdue issues
5. Database: Returns issues with calculated fines
6. Service: Formats response with book titles, amounts
7. Controller: Returns JSON response to frontend
8. Audit: Logs the "VIEW_FINES" action
```

## 🛡️ **Security & Business Rules**

### Security Features
- **Password Hashing:** bcrypt for secure storage
- **JWT Tokens:** Stateless authentication
- **Role-based Access:** Different permissions per role
- **Input Validation:** Prevent malicious data
- **Audit Logging:** Track all activities

### Business Rules
- **Max 3 books** per member at a time
- **14-day loan period** (configurable)
- **₹10 per day fine** (max ₹500 per book)
- **No new issues** if fines > ₹100
- **Auto-mark overdue** after due date
- **Grace period:** 1 day before fines start

## 🛠️ **Quick Setup**

```bash
# 1. Clone and install
git clone <repo-url>
cd library-management-system
npm install

# 2. Setup database
cp .env.example .env
# Edit .env with your database URL
npx prisma migrate dev
npx prisma db seed

# 3. Start server
npm run start:dev

# 4. Test API
# Open: http://localhost:3000/api/docs
# Login with: admin@library.com / admin123
```

## 🧪 **Testing the System**

### 1. Login & Get Token
```bash
POST /auth/login
{
  "email": "admin@library.com",
  "password": "admin123"
}
# Copy the accessToken
```

### 2. Test Book Management
```bash
# Add book (Admin/Librarian)
POST /books
{
  "title": "Clean Code",
  "isbn": "9780132350884",
  "authors": ["Robert C. Martin"],
  "categoryId": "category_id",
  "totalCopies": 3
}

# Search books
GET /books?search=clean&available=true
```

### 3. Test Issue System
```bash
# Issue book (Librarian)
POST /issues
{
  "bookId": "book_id",
  "issuedToId": "member_id"
}

# Return book
POST /issues/{issueId}/return
```

### 4. Test Fine System
```bash
# Check my fines
GET /fines/my-fines

# Pay fine
POST /fines/pay/{issueId}
{
  "paidAmount": 50.00,
  "paymentMethod": "CASH"
}
```

## 📊 **System Architecture**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   NestJS API    │    │  PostgreSQL     │
│   (React/Vue)   │◄──►│   (Backend)     │◄──►│   Database      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                       │                       │
        │                       │                       │
   JWT Tokens              Prisma ORM              Audit Logs
   Role-based              Guards & Filters        Fine Calculations
   Authentication          Input Validation        Book Tracking
```

**Key Components:**
- **Authentication:** JWT-based with role permissions
- **Database:** PostgreSQL with Prisma ORM
- **API:** RESTful with Swagger documentation
- **Security:** Guards, filters, validation
- **Logging:** Complete audit trail
- **Fines:** Automated calculation and tracking

This system provides a complete library management solution with proper authentication, book tracking, automated fines, and comprehensive audit logging! 🎉

---

## � **Troubleshooting**

### TypeScript Cache Issues
If you see TypeScript errors for deleted files in your IDE:

**✅ Quick Fix:**
1. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
2. Type: `TypeScript: Restart TS Server`
3. Press Enter
4. Wait 10 seconds

**✅ Alternative Solutions:**
- Reload IDE window: `Developer: Reload Window`
- Close and reopen IDE
- Run: `npm run build` (should work fine)

**Note:** These are just IDE cache issues - the code compiles perfectly!

### Common Issues
- **Port 3000 in use**: Change PORT in .env or kill existing process
- **Database connection**: Check DATABASE_URL in .env
- **JWT errors**: Verify JWT_SECRET is set
- **Permission denied**: Check user roles and JWT token

## 📈 **Project Structure**

```
LMS/
├── 📁 src/
│   ├── 📁 common/           # Shared utilities (guards, decorators, enums)
│   ├── 📁 config/           # Configuration files
│   ├── 📁 modules/          # Feature modules
│   │   ├── 📁 auth/         # Authentication & authorization
│   │   ├── 📁 users/        # User management
│   │   ├── 📁 books/        # Book catalog management
│   │   ├── 📁 categories/   # Book categories
│   │   ├── 📁 issues/       # Book issue/return operations
│   │   ├── 📁 fines/        # Fine calculation & management (simplified)
│   │   └── 📁 audit-logs/   # Activity tracking
│   ├── 📁 prisma/           # Prisma service
│   ├── 📄 app.module.ts     # Root application module
│   └── 📄 main.ts           # Application entry point
├── 📁 prisma/               # Database schema and migrations
├── 📄 package.json          # Dependencies and scripts
├── 📄 tsconfig.json         # TypeScript configuration
├── 📄 Dockerfile            # Docker configuration
└── 📄 docker-compose.yml    # Multi-container setup
```

## 🚀 **Production Deployment**

### Docker Setup
```bash
# Start with Docker
docker-compose up -d

# Check logs
docker-compose logs -f api
```

### Environment Variables
```bash
NODE_ENV=production
DATABASE_URL="postgresql://user:pass@host:5432/db"
JWT_SECRET="your-production-secret"
PORT=3000
```

---

**Built with ❤️ using NestJS, Prisma, and PostgreSQL**