-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('TRIAL', 'STARTER', 'PRO', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "CourtType" AS ENUM ('FUTSAL_VINYL', 'FUTSAL_SYNTHETIC', 'FUTSAL_INTERLOCK', 'MINI_SOCCER_OUTDOOR', 'MINI_SOCCER_INDOOR');

-- CreateEnum
CREATE TYPE "DayType" AS ENUM ('WEEKDAY', 'WEEKEND');

-- CreateEnum
CREATE TYPE "BookingType" AS ENUM ('ONLINE_PUBLIC', 'WALK_IN', 'MEMBER_ROUTINE');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING_PAYMENT', 'CONFIRMED', 'PLAYING', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'EXPIRED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('MIDTRANS_QRIS', 'MIDTRANS_VA', 'CASH_AT_COUNTER', 'EDC_DEBIT');

-- CreateEnum
CREATE TYPE "CanteenCategory" AS ENUM ('BEVERAGE', 'SNACK', 'EQUIPMENT_RENTAL');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "tenantId" TEXT,
ADD COLUMN     "venueId" TEXT,
ALTER COLUMN "role" SET DEFAULT 'PLAYER';

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "subdomain" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL,
    "ownerPhone" TEXT NOT NULL,
    "subscriptionPlan" "SubscriptionPlan" NOT NULL DEFAULT 'STARTER',
    "subscriptionEnd" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Venue" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Jakarta',
    "openHour" INTEGER NOT NULL DEFAULT 7,
    "closeHour" INTEGER NOT NULL DEFAULT 24,
    "defaultDpPercent" INTEGER NOT NULL DEFAULT 50,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Venue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Court" (
    "id" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "CourtType" NOT NULL,
    "lengthMeters" INTEGER,
    "widthMeters" INTEGER,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Court_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourtPricingRule" (
    "id" TEXT NOT NULL,
    "courtId" TEXT NOT NULL,
    "dayType" "DayType" NOT NULL DEFAULT 'WEEKDAY',
    "startHour" INTEGER NOT NULL,
    "endHour" INTEGER NOT NULL,
    "hourlyRate" BIGINT NOT NULL,

    CONSTRAINT "CourtPricingRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "teamName" TEXT,
    "totalBookings" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "courtId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "bookingCode" TEXT NOT NULL,
    "bookingType" "BookingType" NOT NULL DEFAULT 'ONLINE_PUBLIC',
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "bookingDate" DATE NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "durationHours" INTEGER NOT NULL,
    "courtTotal" BIGINT NOT NULL,
    "canteenTotal" BIGINT NOT NULL DEFAULT 0,
    "grandTotal" BIGINT NOT NULL,
    "depositAmount" BIGINT NOT NULL DEFAULT 0,
    "remainingDue" BIGINT NOT NULL,
    "paymentMethod" "PaymentMethod",
    "paidAt" TIMESTAMP(3),
    "isOpenSparring" BOOLEAN NOT NULL DEFAULT false,
    "sparringLevel" TEXT,
    "notes" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CanteenProduct" (
    "id" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "CanteenCategory" NOT NULL,
    "price" BIGINT NOT NULL,
    "costPrice" BIGINT NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CanteenProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CanteenOrder" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "qty" INTEGER NOT NULL,
    "price" BIGINT NOT NULL,
    "subtotal" BIGINT NOT NULL,

    CONSTRAINT "CanteenOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemberContract" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "courtId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startHour" INTEGER NOT NULL,
    "durationHours" INTEGER NOT NULL DEFAULT 2,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "monthlyFee" BIGINT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemberContract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecurringSlot" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "courtId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "startHour" INTEGER NOT NULL,
    "endHour" INTEGER NOT NULL,

    CONSTRAINT "RecurringSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CashierShift" (
    "id" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "openedById" TEXT NOT NULL,
    "closedById" TEXT,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "startingCash" BIGINT NOT NULL,
    "actualCashEnding" BIGINT,
    "systemCashTotal" BIGINT,
    "notes" TEXT,

    CONSTRAINT "CashierShift_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_subdomain_key" ON "Tenant"("subdomain");

-- CreateIndex
CREATE INDEX "Tenant_subdomain_idx" ON "Tenant"("subdomain");

-- CreateIndex
CREATE INDEX "Venue_tenantId_idx" ON "Venue"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Venue_tenantId_slug_key" ON "Venue"("tenantId", "slug");

-- CreateIndex
CREATE INDEX "Court_venueId_idx" ON "Court"("venueId");

-- CreateIndex
CREATE INDEX "CourtPricingRule_courtId_dayType_idx" ON "CourtPricingRule"("courtId", "dayType");

-- CreateIndex
CREATE INDEX "Customer_tenantId_phone_idx" ON "Customer"("tenantId", "phone");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_tenantId_phone_key" ON "Customer"("tenantId", "phone");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_bookingCode_key" ON "Booking"("bookingCode");

-- CreateIndex
CREATE INDEX "Booking_courtId_bookingDate_idx" ON "Booking"("courtId", "bookingDate");

-- CreateIndex
CREATE INDEX "Booking_courtId_startTime_endTime_idx" ON "Booking"("courtId", "startTime", "endTime");

-- CreateIndex
CREATE INDEX "Booking_bookingCode_idx" ON "Booking"("bookingCode");

-- CreateIndex
CREATE INDEX "CanteenProduct_venueId_category_idx" ON "CanteenProduct"("venueId", "category");

-- CreateIndex
CREATE INDEX "CanteenOrder_bookingId_idx" ON "CanteenOrder"("bookingId");

-- CreateIndex
CREATE INDEX "MemberContract_customerId_idx" ON "MemberContract"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "RecurringSlot_courtId_date_startHour_key" ON "RecurringSlot"("courtId", "date", "startHour");

-- CreateIndex
CREATE INDEX "CashierShift_venueId_openedAt_idx" ON "CashierShift"("venueId", "openedAt");

-- CreateIndex
CREATE INDEX "User_tenantId_idx" ON "User"("tenantId");

-- CreateIndex
CREATE INDEX "User_venueId_idx" ON "User"("venueId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Venue" ADD CONSTRAINT "Venue_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Court" ADD CONSTRAINT "Court_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourtPricingRule" ADD CONSTRAINT "CourtPricingRule_courtId_fkey" FOREIGN KEY ("courtId") REFERENCES "Court"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_courtId_fkey" FOREIGN KEY ("courtId") REFERENCES "Court"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CanteenProduct" ADD CONSTRAINT "CanteenProduct_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CanteenOrder" ADD CONSTRAINT "CanteenOrder_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CanteenOrder" ADD CONSTRAINT "CanteenOrder_productId_fkey" FOREIGN KEY ("productId") REFERENCES "CanteenProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberContract" ADD CONSTRAINT "MemberContract_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringSlot" ADD CONSTRAINT "RecurringSlot_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "MemberContract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringSlot" ADD CONSTRAINT "RecurringSlot_courtId_fkey" FOREIGN KEY ("courtId") REFERENCES "Court"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashierShift" ADD CONSTRAINT "CashierShift_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
