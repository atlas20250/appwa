import { User, MeterReading, Bill, UserRole, Announcement, InvoiceSummary, ReportData } from '../types';

const API_ENDPOINT = import.meta.env.VITE_API_URL ?? '/api';

interface ApiSuccess<T> {
    data: T;
}

interface ApiError {
    error: string;
}

type ApiResponse<T> = ApiSuccess<T> | ApiError;

async function callApi<T>(action: string, payload: Record<string, unknown> = {}): Promise<T> {
    const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload }),
    });

    let parsed: ApiResponse<T>;
    try {
        parsed = await response.json();
    } catch (err) {
        throw new Error('فشل في قراءة استجابة الخادم.');
    }

    if (!response.ok || 'error' in parsed) {
        const message = 'error' in parsed ? parsed.error : response.statusText;
        throw new Error(message || 'حدث خطأ غير متوقع.');
    }

    return parsed.data;
}

export const getAllUsers = () => callApi<User[]>('getAllUsers');

export const getUserById = (id: string) => callApi<User>('getUserById', { id });

export const registerUser = (userData: Omit<User, 'id' | 'role' | 'meterId'> & { password?: string }) =>
    callApi<User>('registerUser', { userData });

export const loginUser = (phoneNumber: string, password?: string) =>
    callApi<User>('loginUser', { phoneNumber, password });

export const changePassword = (userId: string, currentPassword?: string, newPassword?: string) =>
    callApi<User>('changePassword', { userId, currentPassword, newPassword });

export const forgotPasswordReset = (phoneNumber: string) =>
    callApi<{ user: User; tempPass: string }>('forgotPasswordReset', { phoneNumber });

export const resetPasswordByAdmin = (userId: string, newPassword: string) =>
    callApi<User>('resetPasswordByAdmin', { userId, newPassword });

export const updateUser = (updatedUser: Partial<User> & { id: string }) =>
    callApi<User>('updateUser', { updatedUser });

export const updateUserRole = (userId: string, newRole: UserRole) =>
    callApi<User>('updateUserRole', { userId, newRole });

export const getReadingsForUser = (userId: string) =>
    callApi<MeterReading[]>('getReadingsForUser', { userId });

export const getBillsForUser = (userId: string) =>
    callApi<Bill[]>('getBillsForUser', { userId });

export const getLatestBillForUser = (userId: string) =>
    callApi<Bill | null>('getLatestBillForUser', { userId });

export const addMeterReading = (userId: string, newReadingValue: number, meterImage?: string) =>
    callApi<{ reading: MeterReading; bill: Bill }>('addMeterReading', { userId, newReadingValue, meterImage });

export const payBill = (billId: string) =>
    callApi<Bill>('payBill', { billId });

export const getAllAnnouncements = () =>
    callApi<Announcement[]>('getAllAnnouncements');

export const addAnnouncement = (message: string) =>
    callApi<Announcement>('addAnnouncement', { message });

export const getAllPendingBills = () =>
    callApi<{ bill: Bill; user: User }[]>('getAllPendingBills');

export const getInvoiceSummary = () =>
    callApi<InvoiceSummary>('getInvoiceSummary');

export const approvePayment = (billId: string) =>
    callApi<Bill>('approvePayment', { billId });

export const rejectPayment = (billId: string) =>
    callApi<Bill>('rejectPayment', { billId });

export const getSystemReportData = () =>
    callApi<ReportData>('getSystemReportData');

export const getWaterPrice = () =>
    callApi<number>('getWaterPrice');

export const setWaterPrice = (price: number) =>
    callApi<void>('setWaterPrice', { price });
