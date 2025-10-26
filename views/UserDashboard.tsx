import React, { useState, useEffect, useCallback } from 'react';
import { User, Bill, BillStatus, MeterReading, Announcement, InvoiceData } from '../types';
import { getBillsForUser, getReadingsForUser, payBill, updateUser, getAllAnnouncements } from '../services/api';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Spinner from '../components/Spinner';
import Modal from '../components/Modal';
import ConsumptionChart from '../components/ConsumptionChart';
import Invoice from '../components/Invoice';
import BillStatusBadge from '../components/BillStatusBadge';

interface UserDashboardProps {
  user: User;
  onUpdateUser: () => void;
}

const UserDashboard: React.FC<UserDashboardProps> = ({ user, onUpdateUser }) => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [readings, setReadings] =useState<MeterReading[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isEditing, setIsEditing] = useState<'phone' | null>(null);
  const [phone, setPhone] = useState(user.phoneNumber);
  const [isSaving, setIsSaving] = useState(false);
  
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);

  const fetchUserData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [userBills, userReadings, allAnnouncements] = await Promise.all([
        getBillsForUser(user.id),
        getReadingsForUser(user.id),
        getAllAnnouncements(),
      ]);
      setBills(userBills);
      setReadings(userReadings);
      setAnnouncements(allAnnouncements);
    } catch (error) {
      console.error("Failed to fetch user data", error);
    } finally {
      setIsLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);
  
  useEffect(() => {
    setPhone(user.phoneNumber);
  }, [user.phoneNumber]);


  const handlePayBill = async (billId: string) => {
    await payBill(billId);
    fetchUserData(); // Refresh bills
  };

  const handleInfoSave = async () => {
    setIsSaving(true);
    try {
        await updateUser({ id: user.id, phoneNumber: phone });
        onUpdateUser(); // Propagate update to App.tsx
        setIsEditing(null);
    } catch (error) {
        console.error("Failed to update user info", error);
    } finally {
        setIsSaving(false);
    }
  };
  
  const openImageModal = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setIsImageModalOpen(true);
  };

  const handleGenerateInvoice = (bill: Bill) => {
    const reading = readings.find(r => r.id === bill.readingId);
    if (!reading) {
        console.error("Could not find matching reading for the bill.");
        return;
    }

    // Find previous reading date for creating a billing period
    const sortedReadings = [...readings].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const currentReadingIndex = sortedReadings.findIndex(r => r.id === reading.id);
    const previousReadingDate = currentReadingIndex > 0 ? sortedReadings[currentReadingIndex - 1].date : null;

    setInvoiceData({ bill, user, reading, previousReadingDate });
    setIsInvoiceModalOpen(true);
  };


  const currentBill = bills.find(b => b.status === BillStatus.UNPAID || b.status === BillStatus.OVERDUE || b.status === BillStatus.PENDING_APPROVAL);

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Spinner/> جاري تحميل لوحة التحكم...</div>;
  }
  
  const renderBillingHistoryTable = (fullHistory = false) => {
      const data = fullHistory ? bills : bills.slice(0, 3);
      return (
         <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">تاريخ الإصدار</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المبلغ</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
                {fullHistory && <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">تاريخ الدفع</th>}
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">صورة</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">إجراءات</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.length > 0 ? data.map(bill => (
                <tr key={bill.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{new Date(bill.issueDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-medium">{bill.amount.toFixed(2)} د.م.</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm"><BillStatusBadge status={bill.status} /></td>
                  {fullHistory && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {bill.paymentDate ? new Date(bill.paymentDate).toLocaleDateString() : 'غير متاح'}
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {bill.meterImage ? (
                      <button onClick={() => openImageModal(bill.meterImage!)} className="text-primary hover:underline font-medium">عرض الصورة</button>
                    ) : (
                      <span className="text-gray-400">غير متاح</span>
                    )}
                  </td>
                   <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button onClick={() => handleGenerateInvoice(bill)} className="text-indigo-600 hover:text-indigo-900">
                          إنشاء فاتورة
                      </button>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={fullHistory ? 6 : 5} className="text-center py-4 text-gray-500">لا يوجد سجل فواتير.</td></tr>
              )}
            </tbody>
          </table>
      )
  }
  
  const renderInfoField = (label: string, value: string, type: 'phone') => {
      const isCurrentlyEditing = isEditing === type;
      return (
        <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="font-semibold text-gray-600 me-2">{label}:</span>
            {isCurrentlyEditing ? (
                <Input 
                    id={type} 
                    type="text" 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))} 
                    className="text-sm py-1 flex-grow"
                />
            ) : (
                <span className="text-gray-800">{value}</span>
            )}
            <div className="w-24 text-left">
                {isCurrentlyEditing ? (
                    <>
                        <Button onClick={handleInfoSave} isLoading={isSaving} className="ms-2 px-2 py-1 text-xs">حفظ</Button>
                        <button onClick={() => setIsEditing(null)} className="ms-1 text-xs text-gray-500 hover:underline">إلغاء</button>
                    </>
                ) : (
                    <button onClick={() => setIsEditing(type)} className="ms-2 text-primary hover:underline text-xs font-medium">تعديل</button>
                )}
            </div>
        </div>
      )
  }

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-800 mb-6">أهلاً بك، {user.name}</h2>
      
      {announcements.length > 0 && (
          <div className="mb-8">
            <Card title="إعلانات المجتمع">
                <div className="space-y-4 max-h-48 overflow-y-auto">
                    {announcements.map(ann => (
                        <div key={ann.id} className="p-3 bg-primary-50 rounded-lg border border-primary-200">
                            <p className="text-sm text-gray-800">{ann.message}</p>
                            <p className="text-xs text-gray-500 text-left mt-1">{new Date(ann.date).toLocaleString()}</p>
                        </div>
                    ))}
                </div>
            </Card>
          </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2">
            <Card 
              title="الفاتورة الحالية"
              className={currentBill?.status === BillStatus.OVERDUE ? 'border-2 border-red-500' : ''}
            >
            {currentBill ? (
                <div>
                  {currentBill.status === BillStatus.OVERDUE && (
                      <p className="text-red-600 font-bold mb-4 bg-red-50 p-3 rounded-md">
                          هذه الفاتورة متأخرة. الرجاء الدفع في أقرب وقت ممكن لتجنب انقطاع الخدمة.
                      </p>
                  )}
                  {currentBill.status === BillStatus.PENDING_APPROVAL && (
                        <p className="text-blue-600 font-bold mb-4 bg-blue-50 p-3 rounded-md">
                            تم إرسال دفعتك وهي الآن قيد المراجعة من قبل المسؤول.
                        </p>
                  )}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                      <div>
                          <p className="text-sm text-gray-500">المبلغ المستحق</p>
                          <p className={`text-4xl font-bold ${currentBill.status === BillStatus.OVERDUE ? 'text-red-600' : 'text-primary'}`}>
                            {currentBill.amount.toFixed(2)} د.م.
                          </p>
                          <p className="text-sm text-gray-500 mt-1">تستحق في {new Date(currentBill.dueDate).toLocaleDateString()}</p>
                      </div>
                      <div className="mt-4 md:mt-0">
                          {(currentBill.status === BillStatus.UNPAID || currentBill.status === BillStatus.OVERDUE) && (
                            <Button onClick={() => handlePayBill(currentBill.id)}>ادفع الآن</Button>
                          )}
                          {currentBill.status === BillStatus.PENDING_APPROVAL && (
                            <div className="text-right">
                                <p className="font-semibold text-gray-700">في انتظار الموافقة</p>
                                <p className="text-sm text-gray-500">سيتم تحديث الحالة قريباً</p>
                            </div>
                          )}
                      </div>
                  </div>
                </div>
            ) : (
                <p className="text-gray-600">لقد سددت كل فواتيرك! لا توجد فواتير مستحقة.</p>
            )}
            </Card>
        </div>

        <div className="lg:col-span-1">
            <Card title="معلوماتك">
                <div className="space-y-1 text-sm">
                    <p className="py-2 border-b border-gray-100"><span className="font-semibold text-gray-600">العنوان:</span> {user.address}</p>
                    <p className="py-2 border-b border-gray-100"><span className="font-semibold text-gray-600">معرّف العداد:</span> {user.meterId}</p>
                    {renderInfoField("الهاتف", user.phoneNumber, 'phone')}
                </div>
            </Card>
        </div>

        <div className="lg:col-span-3">
            <ConsumptionChart data={bills} />
        </div>
        
        <div className="lg:col-span-3">
          <Card title="سجل الفواتير الأخير">
            <div className="overflow-x-auto">
              {renderBillingHistoryTable(false)}
            </div>
            {bills.length > 3 && (
                <div className="text-center mt-4 pt-4 border-t border-gray-200">
                    <button onClick={() => setIsHistoryModalOpen(true)} className="font-medium text-primary hover:underline">
                        عرض السجل الكامل &larr;
                    </button>
                </div>
            )}
          </Card>
        </div>
      </div>
      
      <Modal isOpen={isImageModalOpen} onClose={() => setIsImageModalOpen(false)} title="صورة قراءة العداد">
        {selectedImage && <img src={selectedImage} alt="Meter reading" className="w-full h-auto rounded-lg" />}
        <div className="text-left mt-4">
          <Button onClick={() => setIsImageModalOpen(false)} variant="secondary">إغلاق</Button>
        </div>
      </Modal>

       <Modal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} title="سجل الدفعات الكامل" size="4xl">
        <div className="max-h-[60vh] overflow-y-auto">
          {renderBillingHistoryTable(true)}
        </div>
        <div className="text-left mt-4">
          <Button onClick={() => setIsHistoryModalOpen(false)} variant="secondary">إغلاق</Button>
        </div>
      </Modal>

      <Modal isOpen={isInvoiceModalOpen} onClose={() => setIsInvoiceModalOpen(false)} title="فاتورة" size="4xl">
        {invoiceData && <Invoice {...invoiceData} />}
      </Modal>

    </div>
  );
};

export default UserDashboard;