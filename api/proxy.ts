import * as db from './db.ts';

// This is a Vercel Serverless Function that acts as a single endpoint for all API calls.
export default async function handler(request: Request) {
    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    try {
        const { action, payload } = await request.json();
        let data: any;

        // The 'action' determines which database/logic function to call.
        // This acts as a router for our API.
        switch (action) {
            case 'getAllUsers':
                data = await db.getAllUsers();
                break;
            case 'getUserById':
                data = await db.getUserById(payload.id);
                break;
            case 'registerUser':
                data = await db.registerUser(payload.userData);
                break;
            case 'loginUser':
                data = await db.loginUser(payload.phoneNumber, payload.password);
                break;
            case 'changePassword':
                data = await db.changePassword(payload.userId, payload.currentPassword, payload.newPassword);
                break;
            case 'forgotPasswordReset':
                data = await db.forgotPasswordReset(payload.phoneNumber);
                break;
            case 'resetPasswordByAdmin':
                data = await db.resetPasswordByAdmin(payload.userId, payload.newPassword);
                break;
            case 'updateUser':
                data = await db.updateUser(payload.updatedUser);
                break;
            case 'updateUserRole':
                data = await db.updateUserRole(payload.userId, payload.newRole);
                break;
            case 'getReadingsForUser':
                data = await db.getReadingsForUser(payload.userId);
                break;
            case 'getBillsForUser':
                data = await db.getBillsForUser(payload.userId);
                break;
            case 'getLatestBillForUser':
                data = await db.getLatestBillForUser(payload.userId);
                break;
            case 'addMeterReading':
                data = await db.addMeterReading(payload.userId, payload.newReadingValue, payload.meterImage);
                break;
            case 'payBill':
                data = await db.payBill(payload.billId);
                break;
            case 'getAllAnnouncements':
                data = await db.getAllAnnouncements();
                break;
            case 'addAnnouncement':
                data = await db.addAnnouncement(payload.message);
                break;
            case 'getAllPendingBills':
                data = await db.getAllPendingBills();
                break;
            case 'getInvoiceSummary':
                data = await db.getInvoiceSummary();
                break;
            case 'approvePayment':
                data = await db.approvePayment(payload.billId);
                break;
            case 'rejectPayment':
                data = await db.rejectPayment(payload.billId);
                break;
            case 'getSystemReportData':
                data = await db.getSystemReportData();
                break;
            case 'getWaterPrice':
                data = await db.getWaterPricePerUnit();
                break;
            case 'setWaterPrice':
                data = await db.setWaterPricePerUnit(payload.price);
                break;
            default:
                throw new Error(`Unknown API action: ${action}`);
        }

        return new Response(JSON.stringify({ data }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        console.error('API Error:', error);
        return new Response(JSON.stringify({ error: error.message || 'An internal server error occurred' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
