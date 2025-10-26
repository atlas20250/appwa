"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSystemReportData = exports.getInvoiceSummary = exports.rejectPayment = exports.approvePayment = exports.getAllPendingBills = exports.addAnnouncement = exports.getAllAnnouncements = exports.payBill = exports.addMeterReading = exports.getLatestBillForUser = exports.getBillsForUser = exports.getReadingsForUser = exports.updateUserRole = exports.updateUser = exports.resetPasswordByAdmin = exports.forgotPasswordReset = exports.changePassword = exports.loginUser = exports.registerUser = exports.getUserById = exports.getAllUsers = exports.setWaterPricePerUnit = exports.getWaterPricePerUnit = void 0;
const postgres_1 = require("@vercel/postgres");
const types_1 = require("../types");
// Helper for mapping raw SQL results to camelCase object properties.
// Note: @vercel/postgres can sometimes handle this automatically, but being explicit prevents issues.
const mapRowToBill = (row) => ({
    id: row.id,
    userId: row.user_id,
    readingId: row.reading_id,
    amount: parseFloat(row.amount),
    issueDate: row.issue_date,
    dueDate: row.due_date,
    status: row.status,
    consumption: row.consumption,
    meterImage: row.meter_image,
    paymentDate: row.payment_date,
});
// --- Water Price ---
const getWaterPricePerUnit = async () => {
    const { rows } = await (0, postgres_1.sql) `SELECT value FROM settings WHERE key = 'water_price_per_unit'`;
    return rows.length ? parseFloat(rows[0].value) : 1.5; // Default fallback
};
exports.getWaterPricePerUnit = getWaterPricePerUnit;
const setWaterPricePerUnit = async (price) => {
    if (typeof price !== 'number' || price < 0) {
        throw new Error("Invalid price provided. Price must be a non-negative number.");
    }
    await (0, postgres_1.sql) `
        INSERT INTO settings (key, value) VALUES ('water_price_per_unit', ${String(price)})
        ON CONFLICT (key) DO UPDATE SET value = ${String(price)};
    `;
};
exports.setWaterPricePerUnit = setWaterPricePerUnit;
// --- User Management ---
const getAllUsers = async () => {
    const { rows } = await (0, postgres_1.sql) `SELECT id, name, address, phone_number as "phoneNumber", meter_id as "meterId", role, password FROM users ORDER BY created_at;`;
    return rows.map((r) => ({
        id: r.id,
        name: r.name,
        address: r.address,
        phoneNumber: r.phoneNumber,
        meterId: r.meterId,
        role: r.role,
        password: r.password,
    }));
};
exports.getAllUsers = getAllUsers;
const getUserById = async (id) => {
    const { rows } = await (0, postgres_1.sql) `SELECT id, name, address, phone_number as "phoneNumber", meter_id as "meterId", role, password FROM users WHERE id = ${id}`;
    if (rows.length === 0)
        throw new Error("المستخدم غير موجود");
    const r = rows[0];
    return {
        id: r.id,
        name: r.name,
        address: r.address,
        phoneNumber: r.phoneNumber,
        meterId: r.meterId,
        role: r.role,
        password: r.password,
    };
};
exports.getUserById = getUserById;
const registerUser = async (userData) => {
    const { rows: existingUsers } = await (0, postgres_1.sql) `SELECT id FROM users WHERE phone_number = ${userData.phoneNumber}`;
    if (existingUsers.length > 0) {
        throw new Error("يوجد مستخدم مسجل بنفس رقم الهاتف.");
    }
    const { rows: userCount } = await (0, postgres_1.sql) `SELECT COUNT(*) FROM users`;
    const meterId = `WTR${String(parseInt(userCount[0].count, 10) + 1).padStart(3, '0')}`;
    const { rows } = await (0, postgres_1.sql) `
        INSERT INTO users (name, address, phone_number, meter_id, role, password)
        VALUES (${userData.name}, ${userData.address}, ${userData.phoneNumber}, ${meterId}, ${types_1.UserRole.USER}, ${userData.password})
        RETURNING id, name, address, phone_number as "phoneNumber", meter_id as "meterId", role;
    `;
    const r = rows[0];
    return {
        id: r.id,
        name: r.name,
        address: r.address,
        phoneNumber: r.phoneNumber,
        meterId: r.meterId,
        role: r.role,
    };
};
exports.registerUser = registerUser;
const loginUser = async (phoneNumber, password) => {
    const { rows } = await (0, postgres_1.sql) `SELECT id, name, address, phone_number as "phoneNumber", meter_id as "meterId", role, password FROM users WHERE phone_number = ${phoneNumber}`;
    const user = rows[0];
    if (!user || user.password !== password) {
        throw new Error("رقم الهاتف أو كلمة المرور غير صالحة.");
    }
    const r = user;
    return {
        id: r.id,
        name: r.name,
        address: r.address,
        phoneNumber: r.phoneNumber,
        meterId: r.meterId,
        role: r.role,
        password: r.password,
    };
};
exports.loginUser = loginUser;
const changePassword = async (userId, currentPassword, newPassword) => {
    const user = await (0, exports.getUserById)(userId);
    if (user.password !== currentPassword) {
        throw new Error("كلمة المرور الحالية غير صحيحة.");
    }
    await (0, postgres_1.sql) `UPDATE users SET password = ${newPassword} WHERE id = ${userId}`;
    return { ...user, password: newPassword };
};
exports.changePassword = changePassword;
const forgotPasswordReset = async (phoneNumber) => {
    const { rows } = await (0, postgres_1.sql) `SELECT id, name, address, phone_number as "phoneNumber", meter_id as "meterId", role, password FROM users WHERE phone_number = ${phoneNumber}`;
    const user = rows[0];
    if (!user) {
        throw new Error("لم يتم العثور على مستخدم برقم الهاتف هذا.");
    }
    const tempPass = Math.random().toString(36).slice(-8);
    await (0, postgres_1.sql) `UPDATE users SET password = ${tempPass} WHERE id = ${user.id}`;
    const r = user;
    return { user: { id: r.id, name: r.name, address: r.address, phoneNumber: r.phoneNumber, meterId: r.meterId, role: r.role, password: tempPass }, tempPass };
};
exports.forgotPasswordReset = forgotPasswordReset;
const resetPasswordByAdmin = async (userId, newPassword) => {
    const user = await (0, exports.getUserById)(userId);
    if (user.role === types_1.UserRole.SUPER_ADMIN) {
        throw new Error("لا يمكن إعادة تعيين كلمة مرور مدير نظام آخر.");
    }
    await (0, postgres_1.sql) `UPDATE users SET password = ${newPassword} WHERE id = ${userId}`;
    return user;
};
exports.resetPasswordByAdmin = resetPasswordByAdmin;
const updateUser = async (updatedUser) => {
    if (updatedUser.phoneNumber) {
        const { rows } = await (0, postgres_1.sql) `SELECT id FROM users WHERE phone_number = ${updatedUser.phoneNumber} AND id != ${updatedUser.id}`;
        if (rows.length > 0) {
            throw new Error("رقم الهاتف مستخدم بالفعل من قبل مستخدم آخر.");
        }
    }
    const currentUser = await (0, exports.getUserById)(updatedUser.id);
    const userToUpdate = { ...currentUser, ...updatedUser };
    const { rows: updatedRows } = await (0, postgres_1.sql) `
        UPDATE users
        SET name = ${userToUpdate.name},
            address = ${userToUpdate.address},
            phone_number = ${userToUpdate.phoneNumber},
            meter_id = ${userToUpdate.meterId}
        WHERE id = ${updatedUser.id}
        RETURNING id, name, address, phone_number as "phoneNumber", meter_id as "meterId", role;
    `;
    const r = updatedRows[0];
    return {
        id: r.id,
        name: r.name,
        address: r.address,
        phoneNumber: r.phoneNumber,
        meterId: r.meterId,
        role: r.role,
    };
};
exports.updateUser = updateUser;
const updateUserRole = async (userId, newRole) => {
    const user = await (0, exports.getUserById)(userId);
    if (user.role === types_1.UserRole.SUPER_ADMIN) {
        throw new Error("لا يمكن تغيير دور مدير النظام.");
    }
    await (0, postgres_1.sql) `UPDATE users SET role = ${newRole} WHERE id = ${userId}`;
    return { ...user, role: newRole };
};
exports.updateUserRole = updateUserRole;
// --- Readings and Bills ---
const checkAndUpdateBillStatus = async (bill) => {
    if (bill.status === types_1.BillStatus.UNPAID && new Date(bill.dueDate) < new Date()) {
        const { rows } = await (0, postgres_1.sql) `UPDATE bills SET status = ${types_1.BillStatus.OVERDUE} WHERE id = ${bill.id} RETURNING *`;
        return mapRowToBill(rows[0]);
    }
    return bill;
};
const getReadingsForUser = async (userId) => {
    const { rows } = await (0, postgres_1.sql) `SELECT id, user_id as "userId", reading, date, previous_reading as "previousReading", consumption, meter_image as "meterImage" FROM meter_readings WHERE user_id = ${userId} ORDER BY date DESC`;
    return rows.map((r) => ({
        id: r.id,
        userId: r.userId,
        reading: r.reading,
        date: r.date,
        previousReading: r.previousReading,
        consumption: r.consumption,
        meterImage: r.meterImage,
    }));
};
exports.getReadingsForUser = getReadingsForUser;
const getBillsForUser = async (userId) => {
    const { rows } = await (0, postgres_1.sql) `SELECT * FROM bills WHERE user_id = ${userId} ORDER BY issue_date DESC`;
    const mappedBills = rows.map(mapRowToBill);
    return Promise.all(mappedBills.map(checkAndUpdateBillStatus));
};
exports.getBillsForUser = getBillsForUser;
const getLatestBillForUser = async (userId) => {
    const bills = await (0, exports.getBillsForUser)(userId);
    return bills.length > 0 ? bills[0] : null;
};
exports.getLatestBillForUser = getLatestBillForUser;
const addMeterReading = async (userId, newReadingValue, meterImage) => {
    const { rows: lastReadingRows } = await (0, postgres_1.sql) `SELECT reading FROM meter_readings WHERE user_id = ${userId} ORDER BY date DESC LIMIT 1`;
    const previousReadingValue = lastReadingRows.length > 0 ? lastReadingRows[0].reading : 0;
    if (newReadingValue < previousReadingValue) {
        throw new Error("لا يمكن أن تكون القراءة الجديدة أقل من القراءة السابقة.");
    }
    const consumption = newReadingValue - previousReadingValue;
    const now = new Date();
    const { rows: newReadingRows } = await (0, postgres_1.sql) `
        INSERT INTO meter_readings (user_id, reading, date, previous_reading, consumption, meter_image)
        VALUES (${userId}, ${newReadingValue}, ${now.toISOString()}, ${previousReadingValue}, ${consumption}, ${meterImage})
        RETURNING id, user_id as "userId", reading, date, previous_reading as "previousReading", consumption, meter_image as "meterImage";
    `;
    const nr = newReadingRows[0];
    const newReading = {
        id: nr.id,
        userId: nr.userId,
        reading: nr.reading,
        date: nr.date,
        previousReading: nr.previousReading,
        consumption: nr.consumption,
        meterImage: nr.meterImage,
    };
    const price = await (0, exports.getWaterPricePerUnit)();
    const amount = consumption * price;
    const dueDate = new Date(now);
    dueDate.setDate(now.getDate() + 30);
    const { rows: newBillRows } = await (0, postgres_1.sql) `
        INSERT INTO bills (user_id, reading_id, amount, issue_date, due_date, status, consumption, meter_image)
        VALUES (${userId}, ${newReading.id}, ${amount}, ${now.toISOString()}, ${dueDate.toISOString()}, ${types_1.BillStatus.UNPAID}, ${consumption}, ${meterImage})
        RETURNING *;
    `;
    const newBill = mapRowToBill(newBillRows[0]);
    return { reading: newReading, bill: newBill };
};
exports.addMeterReading = addMeterReading;
const payBill = async (billId) => {
    const { rows } = await (0, postgres_1.sql) `
        UPDATE bills
        SET status = ${types_1.BillStatus.PENDING_APPROVAL}, payment_date = NULL
        WHERE id = ${billId}
        RETURNING *;
    `;
    if (rows.length === 0)
        throw new Error("الفاتورة غير موجودة");
    return mapRowToBill(rows[0]);
};
exports.payBill = payBill;
// --- Announcements ---
const getAllAnnouncements = async () => {
    const { rows } = await (0, postgres_1.sql) `SELECT * FROM announcements ORDER BY date DESC`;
    return rows.map((r) => ({ id: r.id, message: r.message, date: r.date }));
};
exports.getAllAnnouncements = getAllAnnouncements;
const addAnnouncement = async (message) => {
    if (!message.trim())
        throw new Error("لا يمكن أن تكون رسالة الإعلان فارغة.");
    const { rows } = await (0, postgres_1.sql) `
        INSERT INTO announcements (message, date)
        VALUES (${message}, ${new Date().toISOString()})
        RETURNING *;
    `;
    const r = rows[0];
    return { id: r.id, message: r.message, date: r.date };
};
exports.addAnnouncement = addAnnouncement;
// --- Admin Actions ---
const getAllPendingBills = async () => {
    const { rows } = await (0, postgres_1.sql) `
        SELECT
            b.id as bill_id, b.user_id, b.reading_id, b.amount, b.issue_date, b.due_date, b.status, b.consumption, b.meter_image, b.payment_date,
            u.id as user_id_from_user, u.name, u.address, u.phone_number, u.meter_id, u.role
        FROM bills b
        JOIN users u ON b.user_id = u.id
        WHERE b.status = ${types_1.BillStatus.PENDING_APPROVAL}
        ORDER BY b.issue_date ASC;
    `;
    return rows.map(row => ({
        bill: mapRowToBill({ ...row, id: row.bill_id }),
        user: {
            id: row.user_id_from_user,
            name: row.name,
            address: row.address,
            phoneNumber: row.phone_number,
            meterId: row.meter_id,
            role: row.role,
        }
    }));
};
exports.getAllPendingBills = getAllPendingBills;
const approvePayment = async (billId) => {
    const { rows } = await (0, postgres_1.sql) `
        UPDATE bills
        SET status = ${types_1.BillStatus.PAID}, payment_date = ${new Date().toISOString()}
        WHERE id = ${billId} AND status = ${types_1.BillStatus.PENDING_APPROVAL}
        RETURNING *;
    `;
    if (rows.length === 0)
        throw new Error("الفاتورة غير موجودة أو ليست قيد المراجعة.");
    return mapRowToBill(rows[0]);
};
exports.approvePayment = approvePayment;
const rejectPayment = async (billId) => {
    const { rows } = await (0, postgres_1.sql) `
        UPDATE bills
        SET status = ${types_1.BillStatus.UNPAID}, payment_date = NULL
        WHERE id = ${billId} AND status = ${types_1.BillStatus.PENDING_APPROVAL}
        RETURNING *;
    `;
    if (rows.length === 0)
        throw new Error("الفاتورة غير موجودة أو ليست قيد المراجعة.");
    return checkAndUpdateBillStatus(mapRowToBill(rows[0]));
};
exports.rejectPayment = rejectPayment;
// --- Reports ---
const getInvoiceSummary = async () => {
    await (0, postgres_1.sql) `UPDATE bills SET status = ${types_1.BillStatus.OVERDUE} WHERE status = ${types_1.BillStatus.UNPAID} AND due_date < NOW()`;
    const { rows } = await (0, postgres_1.sql) `
        SELECT
            status,
            COUNT(*)::int as count,
            SUM(amount) as total
        FROM bills
        GROUP BY status;
    `;
    const summary = {
        paid: { total: 0, count: 0 },
        unpaid: { total: 0, count: 0 },
        pending: { total: 0, count: 0 },
    };
    rows.forEach(row => {
        const total = parseFloat(row.total || 0);
        if (row.status === types_1.BillStatus.PAID) {
            summary.paid = { total, count: row.count };
        }
        else if (row.status === types_1.BillStatus.UNPAID || row.status === types_1.BillStatus.OVERDUE) {
            summary.unpaid.total += total;
            summary.unpaid.count += row.count;
        }
        else if (row.status === types_1.BillStatus.PENDING_APPROVAL) {
            summary.pending = { total, count: row.count };
        }
    });
    return summary;
};
exports.getInvoiceSummary = getInvoiceSummary;
const getSystemReportData = async () => {
    await (0, postgres_1.sql) `UPDATE bills SET status = ${types_1.BillStatus.OVERDUE} WHERE status = ${types_1.BillStatus.UNPAID} AND due_date < NOW()`;
    const { rows: summaryRows } = await (0, postgres_1.sql) `
        SELECT
            SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as "totalRevenue",
            SUM(CASE WHEN status IN ('unpaid', 'overdue') THEN amount ELSE 0 END) as "totalOutstanding",
            SUM(consumption) as "totalConsumption"
        FROM bills;
    `;
    const summaryData = summaryRows[0];
    const { rows: totalBillsRows } = await (0, postgres_1.sql) `SELECT COUNT(*) FROM bills`;
    const totalBillsCount = parseInt(totalBillsRows[0].count, 10);
    const totalAmount = (parseFloat(summaryData.totalRevenue || 0)) + (parseFloat(summaryData.totalOutstanding || 0));
    const averageBill = totalBillsCount > 0 ? totalAmount / totalBillsCount : 0;
    const { rows: monthlyRevenueRows } = await (0, postgres_1.sql) `
        SELECT
            TO_CHAR(payment_date, 'YYYY-MM') as month,
            SUM(amount) as revenue
        FROM bills
        WHERE status = 'paid' AND payment_date >= NOW() - INTERVAL '12 months'
        GROUP BY month
        ORDER BY month;
    `;
    const monthlyRevenueData = {};
    monthlyRevenueRows.forEach(row => { monthlyRevenueData[row.month] = parseFloat(row.revenue); });
    const monthlyRevenue = [];
    const today = new Date();
    for (let i = 11; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthKey = d.toISOString().slice(0, 7);
        const monthName = d.toLocaleString('ar', { month: 'short', year: 'numeric' });
        monthlyRevenue.push({ month: monthName, revenue: monthlyRevenueData[monthKey] || 0 });
    }
    const { rows: statusRows } = await (0, postgres_1.sql) `SELECT status, COUNT(*)::int as count FROM bills GROUP BY status;`;
    const { rows: allBillsRows } = await (0, postgres_1.sql) `
        SELECT b.*, u.name as "userName" FROM bills b JOIN users u ON b.user_id = u.id ORDER BY b.issue_date DESC;
    `;
    const allBills = allBillsRows.map(row => ({
        ...mapRowToBill(row),
        user: {
            id: row.user_id, name: row.userName,
            address: '', phoneNumber: '', meterId: '', role: types_1.UserRole.USER
        }
    }));
    return {
        summary: {
            totalRevenue: parseFloat(summaryData.totalRevenue || 0),
            totalOutstanding: parseFloat(summaryData.totalOutstanding || 0),
            totalConsumption: parseInt(summaryData.totalConsumption || 0, 10),
            averageBill,
        },
        monthlyRevenue,
        statusDistribution: statusRows.map((r) => ({ status: r.status, count: r.count })),
        allBills,
    };
};
exports.getSystemReportData = getSystemReportData;
