import React, { useState, useEffect, useCallback } from 'react';
import { User, UserRole, Bill, MeterReading, BillStatus, InvoiceData, Announcement, InvoiceSummary } from '../types';
import { 
    getAllUsers, 
    updateUserRole, 
    resetPasswordByAdmin, 
    updateUser,
    getReadingsForUser,
    getBillsForUser,
    getLatestBillForUser,
    addAnnouncement,
    getAllPendingBills,
    approvePayment,
    rejectPayment,
    getInvoiceSummary,
    getWaterPrice,
    setWaterPrice
} from '../services/api';
import Card from '../components/Card';
import Modal from '../components/Modal';
import Input from '../components/Input';
import Button from '../components/Button';
import Spinner from '../components/Spinner';
import Invoice from '../components/Invoice';
import BillStatusBadge from '../components/BillStatusBadge';
import DashboardSummaryCard from '../components/DashboardSummaryCard';

const WhatsAppIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 ms-2" viewBox="0 0 24 24" fill="currentColor">
      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.894 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.886-.001 2.267.655 4.398 1.919 6.22l-1.078 3.945 4.032-1.057zm4.521-7.14c-.276 0-.549.039-.81.118-.261.079-.496.164-.693.284-.197.12-.352.219-.462.318-.11.1-.21.176-.282. ২৩3-.072.057-.126.1-.141.118-.015.018-.044.057-.087.118-.043.061-.097.147-.146.257-.05.109-.092.228-.118.364-.026.136-.039.283-.039.439s.013.302.039.439c.026.136.066.26.118.373.051.113.109.213.176.299.067.086.141.164.221.233.081.069.166.13.257.184.09.054.182.097.276.129.094.032.193.051.291.062.099.011.203.016.304.016.182 0 .359-.026.524-.078.165-.052.32-.12.458-.204.138-.084.258-.175.352-.273.094-.098.166-.193.212-.284.046-.091.078-.173.094-.242.016-.07.023-.125.023-.164.001-.086-.01-.176-.035-.267-.024-.09-.061-.182-.111-.273-.05-.091-.115-.173-.193-.242-.078-.07-.168-.124-.264-.164-.096-.04-.2-.069-.304-.087-.104-.018-.213-.026-.32-.026zm-2.812 4.136c-.11-.057-.225-.13-.339-.219-.115-.089-.219-.204-.304-.34-.085-.136-.149-.299-.19-.488-.041-.189-.062-.399-.062-.626 0-.25.031-.488.094-.715.062-.227.152-.429.27-.601.118-.172.261-.318.423-.439.162-.12.344-.204.539-.253.195-.049.4-.073.606-.073.257 0 .502.035.729.102.227.067.433.164.612.284.179.12.329.266.443.439.114.172.193.373.236.592.043.219.065.456.065.703 0 .113-.005.227-.016.34-.011.113-.035.228-.072.34-.037.112-.086.223-.146.33-.061.107-.132.208-.212.304-.08.096-.171.182-.27.257-.099.075-.208.136-.323.183-.115.047-.235.078-.354.094-.119.016-.242.023-.365.023-.223 0-.44-.031-.646-.094-.206-.063-.399-.153-.573-.267z"/>
    </svg>
);

const CameraIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12 9a3.75 3.75 0 1 0 0 7.5A3.75 3.75 0 0 0 12 9Z" />
        <path fillRule="evenodd" d="M9.344 3.071a49.52 49.52 0 0 1 5.312 0c.967.052 1.783.212 2.5.585.32.164.623.358.89.595.27.24.504.512.688.811.183.3.33.631.437.98.107.348.182.72.23 1.103.048.383.066.78.066 1.184s-.018.801-.066 1.183a49.524 49.524 0 0 1-5.312 0c-.967-.052-1.783-.212-2.5-.585a4.992 4.992 0 0 1-1.578-1.406c-.183-.3-.33-.631-.437-.98-.107-.348-.182-.72-.23-1.102a49.518 49.518 0 0 1-.066-1.184c0-.404.018-.801.066-1.184.048-.383.123-.755.23-1.103.107-.348.254-.68.437-.98.184-.3.418-.571.688-.81.267-.238.57-.432.89-.596.717-.373 1.533-.533 2.5-.585ZM10.5 8.25a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Z" clipRule="evenodd" />
    </svg>
);

const PaidIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const UnpaidIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const PendingIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const translateBillStatus = (status: BillStatus): string => {
    const translations: Record<BillStatus, string> = {
        [BillStatus.PAID]: 'مدفوعة',
        [BillStatus.UNPAID]: 'غير مدفوعة',
        [BillStatus.OVERDUE]: 'متأخرة',
        [BillStatus.PENDING_APPROVAL]: 'قيد المراجعة',
    };
    return translations[status] || status;
};

interface SuperAdminDashboardProps {
    currentUser: User;
    onUsersUpdated: () => void;
}

const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ currentUser, onUsersUpdated }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [updateStatus, setUpdateStatus] = useState<{ [key: string]: 'updating' | 'success' | 'error' }>({});

    // Password reset modal
    const [userToReset, setUserToReset] = useState<User | null>(null);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isResetting, setIsResetting] = useState(false);
    const [resetError, setResetError] = useState<string | null>(null);
    const [resetSuccess, setResetSuccess] = useState<string | null>(null);

    // Edit user info modal
    const [userToEdit, setUserToEdit] = useState<User | null>(null);
    const [editedInfo, setEditedInfo] = useState({ name: '', address: '', phoneNumber: '', meterId: '' });
    const [isUpdatingUser, setIsUpdatingUser] = useState(false);
    const [editError, setEditError] = useState<string | null>(null);
    const [editSuccess, setEditSuccess] = useState<string | null>(null);

    // Settings
    const [priceInput, setPriceInput] = useState<string>('');
    const [isSavingPrice, setIsSavingPrice] = useState(false);
    const [priceStatus, setPriceStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    // Admin dashboard states
    const [lastReadings, setLastReadings] = useState<Record<string, MeterReading | null>>({});
    const [announcement, setAnnouncement] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [announcementStatus, setAnnouncementStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [isSendingInvoice, setIsSendingInvoice] = useState(false);
    const [invoiceStatus, setInvoiceStatus] = useState<{ userId: string; message: string; type: 'error' | 'success' } | null>(null);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [historyUser, setHistoryUser] = useState<User | null>(null);
    const [userBills, setUserBills] = useState<Bill[]>([]);
    const [userReadings, setUserReadings] = useState<MeterReading[]>([]);
    const [isHistoryLoading, setIsHistoryLoading] = useState(false);
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
    const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
    const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
    const [viewingImage, setViewingImage] = useState<string | null>(null);
    const [pendingBills, setPendingBills] = useState<{bill: Bill, user: User}[]>([]);
    const [isApprovalsLoading, setIsApprovalsLoading] = useState(false);
    const [approvalStatus, setApprovalStatus] = useState<{[billId: string]: { state: 'loading' | 'error', message?: string }}>({});
    const [summary, setSummary] = useState<InvoiceSummary | null>(null);

    const fetchUsersAndReadings = useCallback(async () => {
        setIsLoading(true);
        try {
            const allUsers = await getAllUsers();
            setUsers(allUsers);
            
            const readingsMap: Record<string, MeterReading | null> = {};
            for (const user of allUsers) {
                const readings = await getReadingsForUser(user.id);
                readingsMap[user.id] = readings.length > 0 ? readings[0] : null;
            }
            setLastReadings(readingsMap);

        } catch (err) {
            setError('فشل في جلب بيانات المستخدم.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchPendingApprovals = useCallback(async () => {
        setIsApprovalsLoading(true);
        try {
            const pending = await getAllPendingBills();
            setPendingBills(pending);
        } catch (err) {
            console.error("Failed to fetch pending bills");
        } finally {
            setIsApprovalsLoading(false);
        }
      }, []);

    const fetchSummaryData = useCallback(async () => {
        try {
            const summaryData = await getInvoiceSummary();
            setSummary(summaryData);
        } catch (error) {
            console.error("Failed to fetch invoice summary", error);
        }
    }, []);

    const fetchInitialData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            await Promise.all([
                fetchUsersAndReadings(),
                fetchPendingApprovals(),
                fetchSummaryData()
            ]);
            const currentPrice = await getWaterPrice();
            setPriceInput(String(currentPrice));
        } catch (err) {
            setError("فشل في تحميل بيانات لوحة التحكم.");
        } finally {
            setIsLoading(false);
        }
    }, [fetchUsersAndReadings, fetchPendingApprovals, fetchSummaryData]);

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    const handleRoleChange = async (userId: string, newRole: UserRole) => {
        setUpdateStatus(prev => ({ ...prev, [userId]: 'updating' }));
        try {
            await updateUserRole(userId, newRole);
            setUpdateStatus(prev => ({ ...prev, [userId]: 'success' }));
            await fetchUsersAndReadings();
            onUsersUpdated();
            setTimeout(() => setUpdateStatus(prev => ({...prev, [userId]: undefined!})), 2000);
        } catch (err: any) {
            console.error(err.message);
            setUpdateStatus(prev => ({ ...prev, [userId]: 'error' }));
        }
    };

    const openResetModal = (user: User) => {
        setUserToEdit(null);
        setUserToReset(user);
        setNewPassword('');
        setConfirmPassword('');
        setResetError(null);
        setResetSuccess(null);
    };

    const handlePasswordResetSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userToReset) return;
        if (newPassword.length < 8) { setResetError("يجب أن لا تقل كلمة المرور عن 8 أحرف."); return; }
        if (newPassword !== confirmPassword) { setResetError("كلمتا المرور غير متطابقتين."); return; }
        
        setResetError(null);
        setResetSuccess(null);
        setIsResetting(true);
        try {
            await resetPasswordByAdmin(userToReset.id, newPassword);
            setResetSuccess(`تمت إعادة تعيين كلمة مرور ${userToReset.name} بنجاح.`);
            setTimeout(() => setUserToReset(null), 2000);
        } catch (err: any) {
            setResetError(err.message || "فشل في إعادة تعيين كلمة المرور.");
        } finally {
            setIsResetting(false);
        }
    };
    
    const openEditModal = (user: User) => {
        setUserToReset(null);
        setUserToEdit(user);
        setEditedInfo({ name: user.name, address: user.address, phoneNumber: user.phoneNumber, meterId: user.meterId });
        setEditError(null);
        setEditSuccess(null);
    };

    const handleEditInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setEditedInfo(prev => ({ ...prev, [name]: value }));
    };

    const handleUserUpdateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userToEdit) return;
        setEditError(null);
        setEditSuccess(null);
        setIsUpdatingUser(true);
        try {
            await updateUser({ id: userToEdit.id, ...editedInfo });
            setEditSuccess(`تم تحديث معلومات ${userToEdit.name} بنجاح.`);
            await fetchUsersAndReadings();
            onUsersUpdated();
            setTimeout(() => setUserToEdit(null), 2000);
        } catch (err: any) {
            setEditError(err.message || "فشل في تحديث المعلومات.");
        } finally {
            setIsUpdatingUser(false);
        }
    };

    const handlePriceUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSavingPrice(true);
        setPriceStatus(null);
        const newPrice = parseFloat(priceInput);
        if (isNaN(newPrice) || newPrice < 0) {
            setPriceStatus({ type: 'error', message: 'الرجاء إدخال سعر صالح (رقم موجب).' });
            setIsSavingPrice(false);
            return;
        }
        try {
            await setWaterPrice(newPrice);
            setPriceStatus({ type: 'success', message: 'تم تحديث سعر المياه بنجاح!' });
        } catch (err) {
            setPriceStatus({ type: 'error', message: 'فشل حفظ السعر.' });
        } finally {
            setIsSavingPrice(false);
            setTimeout(() => setPriceStatus(null), 3000);
        }
    };

    const handleSendAnnouncement = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSending(true);
        setAnnouncementStatus(null);
        try {
            await addAnnouncement(announcement);
            setAnnouncementStatus({ type: 'success', message: 'تم إرسال الإعلان بنجاح!' });
            setAnnouncement('');
        } catch (err: any) {
            setAnnouncementStatus({ type: 'error', message: err.message || 'فشل الإرسال.'});
        } finally {
            setIsSending(false);
            setTimeout(() => setAnnouncementStatus(null), 5000);
        }
    }

    const handleApprovePayment = async (billId: string) => {
        setApprovalStatus(prev => ({ ...prev, [billId]: { state: 'loading' } }));
        try {
            await approvePayment(billId);
            fetchPendingApprovals();
            fetchSummaryData();
        } catch (err: any) {
            setApprovalStatus(prev => ({ ...prev, [billId]: { state: 'error', message: err.message } }));
        }
      };
    
      const handleRejectPayment = async (billId: string) => {
        setApprovalStatus(prev => ({ ...prev, [billId]: { state: 'loading' } }));
        try {
            await rejectPayment(billId);
            fetchPendingApprovals();
            fetchSummaryData();
        } catch (err: any) {
            setApprovalStatus(prev => ({ ...prev, [billId]: { state: 'error', message: err.message } }));
        }
      };

      const handleSendInvoice = async (user: User) => {
        setIsSendingInvoice(true);
        setInvoiceStatus(null);
        try {
          const latestBill = await getLatestBillForUser(user.id);
          if (!latestBill) throw new Error("لا توجد فاتورة لهذا المستخدم بعد.");
          const invoiceSummary = `*ملخص فاتورة المياه من جمعية تلوى للماء*\n\nمرحباً ${user.name}،\nإليك ملخص لآخر فاتورة مياه خاصة بك:\n\n*رقم الفاتورة:* ${latestBill.id.split('-')[1]}\n*تاريخ الإصدار:* ${new Date(latestBill.issueDate).toLocaleDateString()}\n*تاريخ الاستحقاق:* ${new Date(latestBill.dueDate).toLocaleDateString()}\n\n*المبلغ:* ${latestBill.amount.toFixed(2)} د.م.\n*الاستهلاك:* ${latestBill.consumption} وحدة\n*الحالة:* ${translateBillStatus(latestBill.status).toUpperCase()}`.trim();
          const formattedPhone = user.phoneNumber.replace(/\D/g, "");
          const whatsAppUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(invoiceSummary)}`;
          window.open(whatsAppUrl, "_blank", "noopener,noreferrer");
          setInvoiceStatus({ userId: user.id, message: "تم فتح واتساب.", type: 'success' });
        } catch (err: any) {
          setInvoiceStatus({ userId: user.id, message: err.message, type: 'error' });
        } finally {
          setIsSendingInvoice(false);
          setTimeout(() => setInvoiceStatus(null), 5000);
        }
      };
    
      const handleViewHistory = async (user: User) => {
        setHistoryUser(user);
        setIsHistoryModalOpen(true);
        setIsHistoryLoading(true);
        try {
          const [bills, readings] = await Promise.all([ getBillsForUser(user.id), getReadingsForUser(user.id) ]);
          setUserBills(bills);
          setUserReadings(readings);
        } catch (error) {
          console.error("Failed to fetch user history", error);
        } finally {
          setIsHistoryLoading(false);
        }
      };
      
      const handleGenerateInvoice = (bill: Bill) => {
        if (!historyUser) return;
        const reading = userReadings.find(r => r.id === bill.readingId);
        if (!reading) return;
        const sortedReadings = [...userReadings].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const currentReadingIndex = sortedReadings.findIndex(r => r.id === reading.id);
        const previousReadingDate = currentReadingIndex > 0 ? sortedReadings[currentReadingIndex - 1].date : null;
        setInvoiceData({ bill, user: historyUser, reading, previousReadingDate });
        setIsInvoiceModalOpen(true);
      };

    const openImageViewer = (imageUrl: string) => {
        setViewingImage(imageUrl);
        setIsImageViewerOpen(true);
    }

    const translateRole = (role: UserRole) => ({ [UserRole.SUPER_ADMIN]: 'مدير النظام', [UserRole.ADMIN]: 'مسؤول', [UserRole.USER]: 'مستخدم' })[role] || role;

    if (isLoading) return <div>جاري تحميل المستخدمين...</div>;
    if(error) return <div className="text-red-500">{error}</div>

    return (
        <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-6">لوحة تحكم مدير النظام</h2>

            {summary && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    <DashboardSummaryCard
                        title="إجمالي المدفوعات"
                        amount={summary.paid.total}
                        count={summary.paid.count}
                        icon={<PaidIcon />}
                        colorClass="bg-green-100"
                    />
                    <DashboardSummaryCard
                        title="إجمالي المستحقات"
                        amount={summary.unpaid.total}
                        count={summary.unpaid.count}
                        icon={<UnpaidIcon />}
                        colorClass="bg-red-100"
                    />
                    <DashboardSummaryCard
                        title="قيد المراجعة"
                        amount={summary.pending.total}
                        count={summary.pending.count}
                        icon={<PendingIcon />}
                        colorClass="bg-blue-100"
                    />
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <Card title="إرسال إعلان">
                    <form onSubmit={handleSendAnnouncement} className="space-y-4">
                        <textarea id="announcement-message" rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" placeholder="أدخل إعلانك هنا..." value={announcement} onChange={(e) => setAnnouncement(e.target.value)} />
                        {announcementStatus && (<p className={`text-sm ${announcementStatus.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>{announcementStatus.message}</p>)}
                        <Button type="submit" isLoading={isSending} disabled={!announcement} className="w-full">إرسال الإعلان</Button>
                    </form>
                </Card>
                <Card title="موافقات الدفع المعلقة">
                    {isApprovalsLoading ? <div className="flex justify-center items-center h-24"><Spinner /></div> : pendingBills.length > 0 ? (
                        <div className="space-y-4 max-h-64 overflow-y-auto">
                            {pendingBills.map(({ bill, user }) => (
                                <div key={bill.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border">
                                    <div>
                                        <p className="font-semibold">{user.name}</p>
                                        <p className="text-sm text-gray-600">المبلغ: <span className="font-bold">{bill.amount.toFixed(2)} د.م.</span></p>
                                        {approvalStatus[bill.id]?.state === 'error' && <p className="text-xs text-red-500 mt-1">{approvalStatus[bill.id].message}</p>}
                                    </div>
                                    <div className="flex space-x-2">
                                        <Button onClick={() => handleApprovePayment(bill.id)} isLoading={approvalStatus[bill.id]?.state === 'loading'} className="px-3 py-1 text-sm bg-green-600 hover:bg-green-700">موافقة</Button>
                                        <Button onClick={() => handleRejectPayment(bill.id)} isLoading={approvalStatus[bill.id]?.state === 'loading'} variant="danger" className="px-3 py-1 text-sm">رفض</Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : <p className="text-center text-gray-500 py-4">لا توجد دفعات معلقة للموافقة عليها.</p>}
                </Card>
            </div>

            <Card title="إدارة المستخدمين الشاملة">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">المستخدم</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">الدور</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">معلومات العداد</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {users.map((user) => (
                                <tr key={user.id} className="even:bg-stone-50 hover:bg-stone-100 transition-colors">
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <p className="text-sm font-medium text-gray-900">{user.name}</p>
                                        <p className="text-sm text-gray-500">{user.phoneNumber}</p>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        {user.id === currentUser.id || user.role === UserRole.SUPER_ADMIN ? <span className="text-sm text-gray-600 font-semibold">{translateRole(user.role)}</span> : (
                                            <select value={user.role} onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)} disabled={updateStatus[user.id] === 'updating'} className="text-sm rounded-md border-gray-300">
                                                <option value={UserRole.USER}>مستخدم</option>
                                                <option value={UserRole.ADMIN}>مسؤول</option>
                                            </select>
                                        )}
                                         {updateStatus[user.id] === 'success' && <span className="text-xs text-green-600 ms-2">تم!</span>}
                                         {updateStatus[user.id] === 'error' && <span className="text-xs text-red-600 ms-2">خطأ!</span>}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <p>المعرّف: {user.meterId}</p>
                                        <p>آخر قراءة: <span className="font-mono">{lastReadings[user.id]?.reading ?? 'N/A'}</span></p>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex items-center space-x-2">
                                            <Button onClick={() => handleViewHistory(user)} variant="secondary" className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700">السجل</Button>
                                            <Button onClick={() => handleSendInvoice(user)} isLoading={isSendingInvoice && invoiceStatus?.userId === user.id} variant="secondary" className="px-2 py-1 text-xs"><WhatsAppIcon /></Button>
                                            {user.id !== currentUser.id && user.role !== UserRole.SUPER_ADMIN && (
                                                <>
                                                    <Button onClick={() => openEditModal(user)} variant="secondary" className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-700">تعديل</Button>
                                                    <Button onClick={() => openResetModal(user)} variant="danger" className="px-2 py-1 text-xs">كلمة المرور</Button>
                                                </>
                                            )}
                                        </div>
                                         {invoiceStatus && invoiceStatus.userId === user.id && (<p className={`text-xs mt-1 ${invoiceStatus.type === 'error' ? 'text-red-500' : 'text-green-500'}`}>{invoiceStatus.message}</p>)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            <div className="mt-8">
                <Card title="إعدادات النظام">
                    <form onSubmit={handlePriceUpdate} className="space-y-4 max-w-md">
                        <Input id="waterPrice" label="سعر وحدة المياه" type="number" value={priceInput} onChange={(e) => setPriceInput(e.target.value)} required step="0.01" min="0" />
                         {priceStatus && <p className={`text-sm ${priceStatus.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>{priceStatus.message}</p>}
                        <div className="text-left"><Button type="submit" isLoading={isSavingPrice}>حفظ السعر</Button></div>
                    </form>
                </Card>
            </div>

            <Modal isOpen={!!userToEdit} onClose={() => setUserToEdit(null)} title={`تعديل معلومات ${userToEdit?.name}`}>
                <form onSubmit={handleUserUpdateSubmit} className="space-y-4">
                    <Input id="name" name="name" label="الاسم الكامل" type="text" value={editedInfo.name} onChange={handleEditInfoChange} required />
                    <Input id="address" name="address" label="العنوان" type="text" value={editedInfo.address} onChange={handleEditInfoChange} required />
                    <Input id="phoneNumber" name="phoneNumber" label="رقم الهاتف" type="text" value={editedInfo.phoneNumber} onChange={(e) => setEditedInfo(prev => ({ ...prev, phoneNumber: e.target.value.replace(/\D/g, '')}))} required />
                    <Input id="meterId" name="meterId" label="معرّف العداد" type="text" value={editedInfo.meterId} onChange={handleEditInfoChange} required />
                    {editError && <p className="text-sm text-red-600">{editError}</p>}
                    {editSuccess && <p className="text-sm text-green-600">{editSuccess}</p>}
                    <div className="flex justify-end space-x-2 pt-4">
                        <Button type="button" variant="secondary" onClick={() => setUserToEdit(null)}>إلغاء</Button>
                        <Button type="submit" isLoading={isUpdatingUser}>حفظ التغييرات</Button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={!!userToReset} onClose={() => setUserToReset(null)} title={`إعادة تعيين كلمة المرور لـ ${userToReset?.name}`}>
                <form onSubmit={handlePasswordResetSubmit} className="space-y-4">
                    <Input id="newAdminPassword" label="كلمة المرور الجديدة" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
                    <Input id="confirmAdminPassword" label="تأكيد كلمة المرور الجديدة" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                    {resetError && <p className="text-sm text-red-600">{resetError}</p>}
                    {resetSuccess && <p className="text-sm text-green-600">{resetSuccess}</p>}
                    <div className="flex justify-end space-x-2 pt-4">
                        <Button type="button" variant="secondary" onClick={() => setUserToReset(null)}>إلغاء</Button>
                        <Button type="submit" isLoading={isResetting}>إعادة تعيين</Button>
                    </div>
                </form>
            </Modal>
            
            <Modal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} title={`سجل فواتير ${historyUser?.name}`} size="4xl">
              <div className="max-h-[70vh] overflow-y-auto">
                {isHistoryLoading ? <div className="flex justify-center h-48"><Spinner /></div> : userBills.length > 0 ? (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">تاريخ الإصدار</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">المبلغ</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">صورة</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {userBills.map(bill => (
                        <tr key={bill.id}>
                          <td className="px-4 py-4 text-sm">{new Date(bill.issueDate).toLocaleDateString()}</td>
                          <td className="px-4 py-4 text-sm font-medium">{bill.amount.toFixed(2)} د.م.</td>
                          <td className="px-4 py-4 text-sm"><BillStatusBadge status={bill.status} /></td>
                          <td className="px-4 py-4 text-sm">{bill.meterImage ? <button onClick={() => openImageViewer(bill.meterImage!)} className="text-primary"><CameraIcon className="w-6 h-6" /></button> : 'لا يوجد'}</td>
                          <td className="px-4 py-4 text-sm"><button onClick={() => handleGenerateInvoice(bill)} className="text-indigo-600 hover:text-indigo-900">عرض الفاتورة</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : <p className="text-center py-8 text-gray-500">لا يوجد سجل فواتير لهذا المستخدم.</p>}
              </div>
            </Modal>

            <Modal isOpen={isInvoiceModalOpen} onClose={() => setIsInvoiceModalOpen(false)} title="فاتورة" size="4xl">
              {invoiceData && <Invoice {...invoiceData} />}
            </Modal>

            <Modal isOpen={isImageViewerOpen} onClose={() => setIsImageViewerOpen(false)} title="صورة العداد">
                {viewingImage && <img src={viewingImage} alt="Meter" className="w-full h-auto rounded-md" />}
            </Modal>

        </div>
    );
};

export default SuperAdminDashboard;