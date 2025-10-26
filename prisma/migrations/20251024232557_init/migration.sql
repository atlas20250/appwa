-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('super_admin', 'admin', 'user');

-- CreateEnum
CREATE TYPE "BillStatus" AS ENUM ('unpaid', 'paid', 'overdue', 'pending_approval');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "address" VARCHAR(255) NOT NULL,
    "phone_number" VARCHAR(255) NOT NULL,
    "meter_id" VARCHAR(255) NOT NULL,
    "role" "UserRole" NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeterReading" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "reading" INTEGER NOT NULL,
    "date" TIMESTAMPTZ(6) NOT NULL,
    "previous_reading" INTEGER NOT NULL,
    "consumption" INTEGER NOT NULL,
    "meter_image" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MeterReading_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bill" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "reading_id" UUID NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "issue_date" TIMESTAMPTZ(6) NOT NULL,
    "due_date" TIMESTAMPTZ(6) NOT NULL,
    "status" "BillStatus" NOT NULL,
    "consumption" INTEGER NOT NULL,
    "meter_image" TEXT,
    "payment_date" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Announcement" (
    "id" UUID NOT NULL,
    "message" TEXT NOT NULL,
    "date" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting" (
    "key" VARCHAR(255) NOT NULL,
    "value" VARCHAR(255) NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_number_key" ON "User"("phone_number");

-- CreateIndex
CREATE UNIQUE INDEX "User_meter_id_key" ON "User"("meter_id");

-- AddForeignKey
ALTER TABLE "MeterReading" ADD CONSTRAINT "MeterReading_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bill" ADD CONSTRAINT "Bill_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bill" ADD CONSTRAINT "Bill_reading_id_fkey" FOREIGN KEY ("reading_id") REFERENCES "MeterReading"("id") ON DELETE CASCADE ON UPDATE CASCADE;
