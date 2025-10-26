import { sql } from '@vercel/postgres';
import { User, MeterReading, Bill, UserRole, BillStatus, Announcement, InvoiceSummary, ReportData, BillWithUser } from '../types.ts';

// Construct Prisma client by trying the installed package first, then falling back to the generated client file.
// Lazy Prisma client getter to avoid module-load issues under ts-node/esm.
let _prisma: any = undefined;
async function getPrisma() {
    if (_prisma) return _prisma;
    let mod: any;
    try {
        mod = await import('@prisma/client');
    } catch (e) {
        // fall back to the generated client
        mod = await import('../generated/prisma/index.js');
    }
    const ClientCtor = mod?.PrismaClient || mod?.default?.PrismaClient || mod?.default || mod;
    _prisma = new ClientCtor();
    return _prisma;
}
let prisma = await getPrisma();
let PrismaClientCtor: any;
try {
    const pkg = await import('@prisma/client');
    PrismaClientCtor = pkg?.PrismaClient || pkg?.default || pkg;
} catch (e) {
    // Import the generated client's index.js explicitly to avoid directory import errors under ESM
    const local = await import('../generated/prisma/index.js');
    PrismaClientCtor = local?.PrismaClient || local?.default || local;
}
prisma = new PrismaClientCtor();

// Helper for mapping raw SQL results to camelCase object properties.
// Note: @vercel/postgres can sometimes handle this automatically, but being explicit prevents issues.
const mapRowToBill = (row: any): Bill => ({
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
export const getWaterPricePerUnit = async (): Promise<number> => {
    const { rows } = await sql`SELECT value FROM settings WHERE key = 'water_price_per_unit'`;
    return rows.length ? parseFloat(rows[0].value) : 1.5; // Default fallback
};
export const setWaterPricePerUnit = async (price: number): Promise<void> => {
    if (typeof price !== 'number' || price < 0) {
        throw new Error("Invalid price provided. Price must be a non-negative number.");
    }
    await sql`
        INSERT INTO settings (key, value) VALUES ('water_price_per_unit', ${String(price)})
        ON CONFLICT (key) DO UPDATE SET value = ${String(price)};
    `;
};

// --- User Management ---
export const getAllUsers = async (): Promise<User[]> => {
    // Use Prisma raw query so the Prisma/Accelerate connection string works locally and in production.
        const prisma = await getPrisma();
        const rows: any[] = await prisma.$queryRaw`
        SELECT id, name, address, phone_number as "phoneNumber", meter_id as "meterId", role, password
        FROM users
        ORDER BY created_at;
    `;
    return rows.map((r: any) => ({
        id: r.id,
        name: r.name,
        address: r.address,
        phoneNumber: r.phoneNumber,
        meterId: r.meterId,
        role: r.role as UserRole,
        password: r.password,
    }));
};

export const getUserById = async (id: string): Promise<User> => {
    const { rows } = await sql`SELECT id, name, address, phone_number as "phoneNumber", meter_id as "meterId", role, password FROM users WHERE id = ${id}`;
    if (rows.length === 0) throw new Error("المستخدم غير موجود");
    const r: any = rows[0];
    return {
        id: r.id,
        name: r.name,
        address: r.address,
        phoneNumber: r.phoneNumber,
        meterId: r.meterId,
        role: r.role as UserRole,
        password: r.password,
    };
}

export const registerUser = async (userData: Omit<User, 'id' | 'role' | 'meterId'> & { password?: string }): Promise<User> => {
    // Check existing user by phone
        const prisma = await getPrisma();
        const existing: any[] = await prisma.$queryRaw`
            SELECT id FROM users WHERE phone_number = ${userData.phoneNumber}
        `;
    if (existing.length > 0) {
        throw new Error("يوجد مستخدم مسجل بنفس رقم الهاتف.");
    }

    // Compute new meter id
    const userCountRows: any[] = await prisma.$queryRaw`SELECT COUNT(*)::int as count FROM users`;
    const nextIndex = (userCountRows[0]?.count ?? 0) + 1;
    const meterId = `WTR${String(nextIndex).padStart(3, '0')}`;

    const rows: any[] = await prisma.$queryRaw`
        INSERT INTO users (name, address, phone_number, meter_id, role, password)
        VALUES (${userData.name}, ${userData.address}, ${userData.phoneNumber}, ${meterId}, ${UserRole.USER}, ${userData.password})
        RETURNING id, name, address, phone_number as "phoneNumber", meter_id as "meterId", role;
    `;
    const r: any = rows[0];
    return {
        id: r.id,
        name: r.name,
        address: r.address,
        phoneNumber: r.phoneNumber,
        meterId: r.meterId,
        role: r.role as UserRole,
    };
};

export const loginUser = async (phoneNumber: string, password?: string): Promise<User> => {
    const { rows } = await sql`SELECT id, name, address, phone_number as "phoneNumber", meter_id as "meterId", role, password FROM users WHERE phone_number = ${phoneNumber}`;
    const user = rows[0];
    if (!user || user.password !== password) {
        throw new Error("رقم الهاتف أو كلمة المرور غير صالحة.");
    }
    const r: any = user;
    return {
        id: r.id,
        name: r.name,
        address: r.address,
        phoneNumber: r.phoneNumber,
        meterId: r.meterId,
        role: r.role as UserRole,
        password: r.password,
    };
};

export const changePassword = async (userId: string, currentPassword?: string, newPassword?: string): Promise<User> => {
    const user = await getUserById(userId);
    if (user.password !== currentPassword) {
        throw new Error("كلمة المرور الحالية غير صحيحة.");
    }
    await sql`UPDATE users SET password = ${newPassword} WHERE id = ${userId}`;
    return { ...user, password: newPassword };
};

export const forgotPasswordReset = async (phoneNumber: string): Promise<{user: User, tempPass: string}> => {
    const { rows } = await sql`SELECT id, name, address, phone_number as "phoneNumber", meter_id as "meterId", role, password FROM users WHERE phone_number = ${phoneNumber}`;
    const user = rows[0];
    if (!user) {
        throw new Error("لم يتم العثور على مستخدم برقم الهاتف هذا.");
    }
    const tempPass = Math.random().toString(36).slice(-8);
    await sql`UPDATE users SET password = ${tempPass} WHERE id = ${user.id}`;
    const r: any = user;
    return { user: { id: r.id, name: r.name, address: r.address, phoneNumber: r.phoneNumber, meterId: r.meterId, role: r.role as UserRole, password: tempPass }, tempPass };
};

export const resetPasswordByAdmin = async (userId: string, newPassword: string): Promise<User> => {
    const user = await getUserById(userId);
    if (user.role === UserRole.SUPER_ADMIN) {
        throw new Error("لا يمكن إعادة تعيين كلمة مرور مدير نظام آخر.");
    }
    await sql`UPDATE users SET password = ${newPassword} WHERE id = ${userId}`;
    return user;
};

export const updateUser = async (updatedUser: Partial<User> & { id: string }): Promise<User> => {
    if (updatedUser.phoneNumber) {
        const { rows } = await sql`SELECT id FROM users WHERE phone_number = ${updatedUser.phoneNumber} AND id != ${updatedUser.id}`;
        if (rows.length > 0) {
            throw new Error("رقم الهاتف مستخدم بالفعل من قبل مستخدم آخر.");
        }
    }

    const currentUser = await getUserById(updatedUser.id);
    const userToUpdate = { ...currentUser, ...updatedUser };

    const { rows: updatedRows } = await sql`
        UPDATE users
        SET name = ${userToUpdate.name},
            address = ${userToUpdate.address},
            phone_number = ${userToUpdate.phoneNumber},
            meter_id = ${userToUpdate.meterId}
        WHERE id = ${updatedUser.id}
        RETURNING id, name, address, phone_number as "phoneNumber", meter_id as "meterId", role;
    `;
    const r: any = updatedRows[0];
    return {
        id: r.id,
        name: r.name,
        address: r.address,
        phoneNumber: r.phoneNumber,
        meterId: r.meterId,
        role: r.role as UserRole,
    };
}

export const updateUserRole = async (userId: string, newRole: UserRole): Promise<User> => {
    const user = await getUserById(userId);
    if (user.role === UserRole.SUPER_ADMIN) {
        throw new Error("لا يمكن تغيير دور مدير النظام.");
    }
    await sql`UPDATE users SET role = ${newRole} WHERE id = ${userId}`;
    return { ...user, role: newRole };
};

// --- Readings and Bills ---
const checkAndUpdateBillStatus = async (bill: Bill): Promise<Bill> => {
    if (bill.status === BillStatus.UNPAID && new Date(bill.dueDate) < new Date()) {
        const { rows } = await sql`UPDATE bills SET status = ${BillStatus.OVERDUE} WHERE id = ${bill.id} RETURNING *`;
        return mapRowToBill(rows[0]);
    }
    return bill;
};

export const getReadingsForUser = async (userId: string): Promise<MeterReading[]> => {
    const { rows } = await sql`SELECT id, user_id as "userId", reading, date, previous_reading as "previousReading", consumption, meter_image as "meterImage" FROM meter_readings WHERE user_id = ${userId} ORDER BY date DESC`;
    return rows.map((r: any) => ({
        id: r.id,
        userId: r.userId,
        reading: r.reading,
        date: r.date,
        previousReading: r.previousReading,
        consumption: r.consumption,
        meterImage: r.meterImage,
    }));
};

export const getBillsForUser = async (userId: string): Promise<Bill[]> => {
    const { rows } = await sql`SELECT * FROM bills WHERE user_id = ${userId} ORDER BY issue_date DESC`;
    const mappedBills = rows.map(mapRowToBill);
    return Promise.all(mappedBills.map(checkAndUpdateBillStatus));
};

export const getLatestBillForUser = async (userId: string): Promise<Bill | null> => {
    const bills = await getBillsForUser(userId);
    return bills.length > 0 ? bills[0] : null;
};

export const addMeterReading = async (userId: string, newReadingValue: number, meterImage?: string): Promise<{ reading: MeterReading; bill: Bill }> => {
    const { rows: lastReadingRows } = await sql`SELECT reading FROM meter_readings WHERE user_id = ${userId} ORDER BY date DESC LIMIT 1`;
    const previousReadingValue = lastReadingRows.length > 0 ? lastReadingRows[0].reading : 0;

    if (newReadingValue < previousReadingValue) {
        throw new Error("لا يمكن أن تكون القراءة الجديدة أقل من القراءة السابقة.");
    }
    
    const consumption = newReadingValue - previousReadingValue;
    const now = new Date();
    
    const { rows: newReadingRows } = await sql`
        INSERT INTO meter_readings (user_id, reading, date, previous_reading, consumption, meter_image)
        VALUES (${userId}, ${newReadingValue}, ${now.toISOString()}, ${previousReadingValue}, ${consumption}, ${meterImage})
        RETURNING id, user_id as "userId", reading, date, previous_reading as "previousReading", consumption, meter_image as "meterImage";
    `;
    const nr: any = newReadingRows[0];
    const newReading: MeterReading = {
        id: nr.id,
        userId: nr.userId,
        reading: nr.reading,
        date: nr.date,
        previousReading: nr.previousReading,
        consumption: nr.consumption,
        meterImage: nr.meterImage,
    };

    const price = await getWaterPricePerUnit();
    const amount = consumption * price;
    const dueDate = new Date(now);
    dueDate.setDate(now.getDate() + 30);

    const { rows: newBillRows } = await sql`
        INSERT INTO bills (user_id, reading_id, amount, issue_date, due_date, status, consumption, meter_image)
        VALUES (${userId}, ${newReading.id}, ${amount}, ${now.toISOString()}, ${dueDate.toISOString()}, ${BillStatus.UNPAID}, ${consumption}, ${meterImage})
        RETURNING *;
    `;
    const newBill = mapRowToBill(newBillRows[0]);
    
    return { reading: newReading, bill: newBill };
};

export const payBill = async (billId: string): Promise<Bill> => {
    const { rows } = await sql`
        UPDATE bills
        SET status = ${BillStatus.PENDING_APPROVAL}, payment_date = NULL
        WHERE id = ${billId}
        RETURNING *;
    `;
    if (rows.length === 0) throw new Error("الفاتورة غير موجودة");
    return mapRowToBill(rows[0]);
}

// --- Announcements ---
export const getAllAnnouncements = async (): Promise<Announcement[]> => {
    const { rows } = await sql`SELECT * FROM announcements ORDER BY date DESC`;
    return rows.map((r: any) => ({ id: r.id, message: r.message, date: r.date }));
}

export const addAnnouncement = async (message: string): Promise<Announcement> => {
    if (!message.trim()) throw new Error("لا يمكن أن تكون رسالة الإعلان فارغة.");
    const { rows } = await sql`
        INSERT INTO announcements (message, date)
        VALUES (${message}, ${new Date().toISOString()})
        RETURNING *;
    `;
    const r: any = rows[0];
    return { id: r.id, message: r.message, date: r.date };
}

// --- Admin Actions ---
export const getAllPendingBills = async (): Promise<{bill: Bill, user: User}[]> => {
    const { rows } = await sql`
        SELECT
            b.id as bill_id, b.user_id, b.reading_id, b.amount, b.issue_date, b.due_date, b.status, b.consumption, b.meter_image, b.payment_date,
            u.id as user_id_from_user, u.name, u.address, u.phone_number, u.meter_id, u.role
        FROM bills b
        JOIN users u ON b.user_id = u.id
        WHERE b.status = ${BillStatus.PENDING_APPROVAL}
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

export const approvePayment = async (billId: string): Promise<Bill> => {
    const { rows } = await sql`
        UPDATE bills
        SET status = ${BillStatus.PAID}, payment_date = ${new Date().toISOString()}
        WHERE id = ${billId} AND status = ${BillStatus.PENDING_APPROVAL}
        RETURNING *;
    `;
    if (rows.length === 0) throw new Error("الفاتورة غير موجودة أو ليست قيد المراجعة.");
    return mapRowToBill(rows[0]);
}

export const rejectPayment = async (billId: string): Promise<Bill> => {
    const { rows } = await sql`
        UPDATE bills
        SET status = ${BillStatus.UNPAID}, payment_date = NULL
        WHERE id = ${billId} AND status = ${BillStatus.PENDING_APPROVAL}
        RETURNING *;
    `;
    if (rows.length === 0) throw new Error("الفاتورة غير موجودة أو ليست قيد المراجعة.");
    return checkAndUpdateBillStatus(mapRowToBill(rows[0]));
}


// --- Reports ---
export const getInvoiceSummary = async (): Promise<InvoiceSummary> => {
    await sql`UPDATE bills SET status = ${BillStatus.OVERDUE} WHERE status = ${BillStatus.UNPAID} AND due_date < NOW()`;

    const { rows } = await sql`
        SELECT
            status,
            COUNT(*)::int as count,
            SUM(amount) as total
        FROM bills
        GROUP BY status;
    `;

    const summary: InvoiceSummary = {
        paid: { total: 0, count: 0 },
        unpaid: { total: 0, count: 0 },
        pending: { total: 0, count: 0 },
    };

    rows.forEach(row => {
        const total = parseFloat(row.total || 0);
        if (row.status === BillStatus.PAID) {
            summary.paid = { total, count: row.count };
        } else if (row.status === BillStatus.UNPAID || row.status === BillStatus.OVERDUE) {
            summary.unpaid.total += total;
            summary.unpaid.count += row.count;
        } else if (row.status === BillStatus.PENDING_APPROVAL) {
            summary.pending = { total, count: row.count };
        }
    });
    return summary;
};

export const getSystemReportData = async (): Promise<ReportData> => {
    await sql`UPDATE bills SET status = ${BillStatus.OVERDUE} WHERE status = ${BillStatus.UNPAID} AND due_date < NOW()`;
    
    const { rows: summaryRows } = await sql`
        SELECT
            SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as "totalRevenue",
            SUM(CASE WHEN status IN ('unpaid', 'overdue') THEN amount ELSE 0 END) as "totalOutstanding",
            SUM(consumption) as "totalConsumption"
        FROM bills;
    `;
    const summaryData = summaryRows[0];
    const { rows: totalBillsRows } = await sql`SELECT COUNT(*) FROM bills`;
    const totalBillsCount = parseInt(totalBillsRows[0].count, 10);
    const totalAmount = (parseFloat(summaryData.totalRevenue || 0)) + (parseFloat(summaryData.totalOutstanding || 0));
    const averageBill = totalBillsCount > 0 ? totalAmount / totalBillsCount : 0;
    
    const { rows: monthlyRevenueRows } = await sql`
        SELECT
            TO_CHAR(payment_date, 'YYYY-MM') as month,
            SUM(amount) as revenue
        FROM bills
        WHERE status = 'paid' AND payment_date >= NOW() - INTERVAL '12 months'
        GROUP BY month
        ORDER BY month;
    `;
    const monthlyRevenueData: { [month: string]: number } = {};
    monthlyRevenueRows.forEach(row => { monthlyRevenueData[row.month] = parseFloat(row.revenue); });

    const monthlyRevenue: { month: string; revenue: number }[] = [];
    const today = new Date();
    for (let i = 11; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthKey = d.toISOString().slice(0, 7);
        const monthName = d.toLocaleString('ar', { month: 'short', year: 'numeric' });
        monthlyRevenue.push({ month: monthName, revenue: monthlyRevenueData[monthKey] || 0 });
    }

    const { rows: statusRows } = await sql`SELECT status, COUNT(*)::int as count FROM bills GROUP BY status;`;

    const { rows: allBillsRows } = await sql`
        SELECT b.*, u.name as "userName" FROM bills b JOIN users u ON b.user_id = u.id ORDER BY b.issue_date DESC;
    `;

    const allBills: BillWithUser[] = allBillsRows.map(row => ({
        ...mapRowToBill(row),
        user: {
            id: row.user_id, name: row.userName,
            address: '', phoneNumber: '', meterId: '', role: UserRole.USER
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
        statusDistribution: statusRows.map((r: any) => ({ status: r.status as BillStatus, count: r.count })),
        allBills,
    };
};
