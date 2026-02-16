

ALTER TYPE "AuditAction" ADD VALUE 'CALCULATE_FINE';
ALTER TYPE "AuditAction" ADD VALUE 'WAIVE_FINE';
ALTER TYPE "AuditAction" ADD VALUE 'PAY_FINE';

-- CreateTable
CREATE TABLE "fine_configurations" (
    "id" TEXT NOT NULL,
    "finePerDay" DECIMAL(10,2) NOT NULL DEFAULT 5.00,
    "maxFineAmount" DECIMAL(10,2) NOT NULL DEFAULT 500.00,
    "gracePeriodDays" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fine_configurations_pkey" PRIMARY KEY ("id")
);
