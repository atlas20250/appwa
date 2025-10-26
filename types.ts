export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  USER = 'user'
}

export interface User {
  id: string;
  name: string;
  address: string;
  phoneNumber: string;
  meterId: string;
  role: UserRole;
  password?: string; // Optional for backward compatibility, but required for new users
}

export interface MeterReading {
  id: string;
  userId: string;
  reading: number; // The value on the meter
  date: string; // ISO string
  previousReading: number;
  consumption: number;
  meterImage?: string; // Base64 data URL of the meter photo
}

export enum BillStatus {
  UNPAID = 'unpaid',
  PAID = 'paid',
  OVERDUE = 'overdue',
  PENDING_APPROVAL = 'pending_approval',
}

export interface Bill {
  id: string;
  userId: string;
  readingId: string;
  amount: number;
  issueDate: string; // ISO string
  dueDate: string; // ISO string
  status: BillStatus;
  consumption: number;
  meterImage?: string; // Base64 data URL of the meter photo
  paymentDate?: string; // ISO string
}

export interface Announcement {
  id: string;
  message: string;
  date: string; // ISO string
}

export interface InvoiceData {
    bill: Bill;
    user: User;
    reading: MeterReading;
    previousReadingDate: string | null;
}

export interface InvoiceSummary {
    paid: {
        total: number;
        count: number;
    };
    unpaid: {
        total: number;
        count: number;
    };
    pending: {
        total: number;
        count: number;
    };
}

export interface BillWithUser extends Bill {
    user: User;
}

export interface ReportData {
    summary: {
        totalRevenue: number;
        totalOutstanding: number;
        totalConsumption: number;
        averageBill: number;
    };
    monthlyRevenue: { month: string; revenue: number }[];
    statusDistribution: { status: BillStatus; count: number }[];
    allBills: BillWithUser[];
}
