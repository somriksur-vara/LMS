# Library Fine Management System

## Overview
The Library Management System now includes a comprehensive fine calculation and management system for overdue books.

## Features

### 🔧 Fine Configuration
- **Configurable fine rates**: Set daily fine amount (default: $5.00/day)
- **Maximum fine limit**: Cap total fines per book (default: $500.00)
- **Grace period**: Allow days before fines start (default: 1 day)
- **Admin-only configuration**: Only admins can modify fine settings

### 📊 Fine Calculation
- **Automatic calculation**: Fines calculated based on overdue days
- **Real-time updates**: Fines recalculated when books are returned
- **Cron job automation**: Daily fine calculations at 2 AM
- **Overdue status tracking**: Automatic status updates every hour

### 💰 Fine Management
- **Payment recording**: Track fine payments with payment methods
- **Partial payments**: Support for partial fine payments
- **Fine waiving**: Librarians/admins can waive fines with reasons
- **Outstanding balance tracking**: View total outstanding fines per user

## API Endpoints

### Fine Management
```
GET    /fines/overdue                    # Get overdue books with fines
POST   /fines/calculate-all              # Calculate fines for all active issues
GET    /fines/issue/:id/calculate        # Calculate fine for specific issue
GET    /fines/user/:id/outstanding       # Get user's outstanding fines
GET    /fines/user/my-fines              # Get current user's fines
POST   /fines/issue/:id/waive            # Waive fine (admin/librarian)
POST   /fines/issue/:id/payment          # Record fine payment
GET    /fines/configuration              # Get fine configuration
PUT    /fines/configuration              # Update fine configuration (admin)
```

### Request Examples

#### Calculate All Fines
```bash
POST /fines/calculate-all
Authorization: Bearer <token>
```

#### Record Payment
```bash
POST /fines/issue/123/payment
Content-Type: application/json
Authorization: Bearer <token>

{
  "paidAmount": 25.00,
  "paymentMethod": "CASH"
}
```

#### Waive Fine
```bash
POST /fines/issue/123/waive
Content-Type: application/json
Authorization: Bearer <token>

{
  "waiveReason": "Book was damaged when issued"
}
```

#### Update Fine Configuration
```bash
PUT /fines/configuration
Content-Type: application/json
Authorization: Bearer <admin-token>

{
  "finePerDay": 3.00,
  "maxFineAmount": 300.00,
  "gracePeriodDays": 2
}
```

## Fine Calculation Logic

### Formula
```
overdueDays = max(0, currentDate - expectedReturnDate)
effectiveOverdueDays = max(0, overdueDays - gracePeriodDays)
fineAmount = min(effectiveOverdueDays * finePerDay, maxFineAmount)
```

### Example
- Book due: January 1st
- Current date: January 10th
- Grace period: 1 day
- Fine per day: $5.00
- Max fine: $500.00

**Calculation:**
- Overdue days: 9 days
- Effective overdue days: 9 - 1 = 8 days
- Fine amount: 8 × $5.00 = $40.00

## Automated Tasks

### Daily Fine Calculation (2:00 AM)
- Calculates fines for all active issues
- Updates fine amounts in database
- Logs calculation results

### Hourly Status Updates
- Updates issues to OVERDUE status when past due date
- Ensures accurate overdue tracking

## Database Schema

### FineConfiguration Table
```sql
CREATE TABLE fine_configurations (
  id VARCHAR PRIMARY KEY,
  fine_per_day DECIMAL(10,2) DEFAULT 5.00,
  max_fine_amount DECIMAL(10,2) DEFAULT 500.00,
  grace_period_days INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Enhanced Issue Table
```sql
-- Existing issue table now includes:
fine_amount DECIMAL(10,2) DEFAULT 0,
status ENUM('ACTIVE', 'RETURNED', 'OVERDUE')
```

## Audit Logging
All fine-related actions are logged:
- `CALCULATE_FINE`: When fines are calculated
- `WAIVE_FINE`: When fines are waived
- `PAY_FINE`: When payments are recorded

## Default Configuration
- **Fine per day**: $5.00
- **Maximum fine**: $500.00
- **Grace period**: 1 day
- **Payment methods**: CASH, CARD, ONLINE, BANK_TRANSFER

## User Roles & Permissions
- **ADMIN**: Full access to all fine operations and configuration
- **LIBRARIAN**: Can calculate, waive fines, and record payments
- **MEMBER**: Can view their own outstanding fines only

## Integration Points
- **Book Return Process**: Automatically calculates fines when books are returned
- **Issue Management**: Fine amounts displayed in issue details
- **User Dashboard**: Shows outstanding fine totals
- **Reporting**: Fine data included in audit logs and reports