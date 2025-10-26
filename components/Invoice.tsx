import React, { useState, useEffect } from 'react';
import { Bill, User, MeterReading, BillStatus } from '../types';
import Button from './Button';
import { getWaterPrice } from '../services/api';

interface InvoiceProps {
  bill: Bill;
  user: User;
  reading: MeterReading;
  previousReadingDate: string | null;
}

const WaterDropIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
       <path d="M12 2.25C6.477 2.25 2 6.727 2 12.25c0 4.16 2.703 7.735 6.45 9.073.4.074.85.102 1.3.102 4.136 0 7.824-2.68 9.17-6.434a9.71 9.71 0 0 0-1.01-6.178A9.73 9.73 0 0 0 12 2.25Z" />
    </svg>
);

const BillStatusBadge: React.FC<{ status: BillStatus, large?: boolean }> = ({ status, large = false }) => {
    const statusStyles: Record<BillStatus, string> = {
      [BillStatus.PAID]: 'border-green-500 bg-green-100 text-green-700',
      [BillStatus.UNPAID]: 'border-yellow-500 bg-yellow-100 text-yellow-700',
      [BillStatus.OVERDUE]: 'border-red-500 bg-red-100 text-red-700',
      [BillStatus.PENDING_APPROVAL]: 'border-blue-500 bg-blue-100 text-blue-700',
    };
    const translations: Record<BillStatus, string> = {
        [BillStatus.PAID]: 'مدفوعة',
        [BillStatus.UNPAID]: 'غير مدفوعة',
        [BillStatus.OVERDUE]: 'متأخرة',
        [BillStatus.PENDING_APPROVAL]: 'قيد المراجعة',
    };
    const size = large ? 'text-lg px-4 py-1' : 'text-xs px-2 py-0.5';
    return (
      <span className={`font-bold uppercase tracking-widest border rounded-full ${size} ${statusStyles[status]}`}>
        {translations[status] || status}
      </span>
    );
  };


const Invoice: React.FC<InvoiceProps> = ({ bill, user, reading, previousReadingDate }) => {
  const [waterPrice, setWaterPrice] = useState<number | null>(null);

  useEffect(() => {
      const fetchPrice = async () => {
          try {
              const price = await getWaterPrice();
              setWaterPrice(price);
          } catch (error) {
              console.error("Failed to fetch water price for invoice", error);
              // Fallback to calculating from the bill amount if API fails
              setWaterPrice(bill.consumption > 0 ? bill.amount / bill.consumption : 0);
          }
      };
      fetchPrice();
  }, [bill.amount, bill.consumption]);

  const handlePrint = () => {
    window.print();
  };

  const consumptionPeriod = previousReadingDate 
    ? `${new Date(previousReadingDate).toLocaleDateString()} إلى ${new Date(reading.date).toLocaleDateString()}`
    : `تنتهي في ${new Date(reading.date).toLocaleDateString()}`;
  
  const calculatedAmount = waterPrice !== null ? bill.consumption * waterPrice : bill.amount;

  return (
    <>
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body * {
            visibility: hidden;
          }
          #invoice-content, #invoice-content * {
            visibility: visible;
          }
          #invoice-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: auto;
            margin: 0;
            padding: 1rem; /* Reduced padding for better fit */
            box-shadow: none;
            border: none;
            border-radius: 0;
            max-width: 100%;
          }
          /* --- Print Optimization --- */
          /* Ensure all text is black for readability and to save colored ink. */
          /* Remove background colors and shadows for a clean, paper-friendly output. */
          #invoice-content * {
            color: #000 !important;
            background-color: transparent !important;
            box-shadow: none !important;
            text-shadow: none !important;
          }
          /* Ensure borders are visible but not too dark */
           #invoice-content table, #invoice-content th, #invoice-content td, #invoice-content header, #invoice-content section, #invoice-content div {
            border-color: #ddd !important;
           }
        }
      `}</style>
      <div className="bg-white p-8 rounded-lg shadow-2xl max-w-4xl mx-auto" id="invoice-content">
        {/* Header */}
        <header className="flex justify-between items-start pb-6 border-b-2 border-gray-200">
          <div className="flex items-center space-x-3">
            <WaterDropIcon className="w-12 h-12 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-primary">جمعية تلوى للماء</h1>
              <p className="text-sm text-gray-500">خدمات المياه</p>
            </div>
          </div>
          <div className="text-left">
            <h2 className="text-4xl font-bold uppercase text-gray-700">فاتورة</h2>
            <p className="text-sm text-gray-500 mt-1">رقم الفاتورة: {bill.id.split('-')[1]}</p>
          </div>
        </header>

        {/* Bill Details */}
        <section className="grid grid-cols-2 gap-8 mt-6">
          <div>
            <h3 className="text-sm font-semibold uppercase text-gray-500 tracking-wider">فاتورة إلى</h3>
            <p className="font-bold text-lg text-gray-800 mt-2">{user.name}</p>
            <p className="text-gray-600">{user.address}</p>
            <p className="text-gray-600">{user.phoneNumber}</p>
          </div>
          <div className="text-left">
              <div className="mb-4">
                  <h3 className="text-sm font-semibold uppercase text-gray-500 tracking-wider">تاريخ الإصدار</h3>
                  <p className="font-medium text-gray-800 mt-1">{new Date(bill.issueDate).toLocaleDateString()}</p>
              </div>
              <div>
                  <h3 className="text-sm font-semibold uppercase text-gray-500 tracking-wider">تاريخ الاستحقاق</h3>
                  <p className="font-medium text-gray-800 mt-1">{new Date(bill.dueDate).toLocaleDateString()}</p>
              </div>
          </div>
        </section>

        {/* Line Items Table */}
        <section className="mt-8">
          <div className="overflow-x-auto">
              <table className="min-w-full text-right">
                  <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                          <th className="px-4 py-3 text-sm font-semibold text-gray-600 uppercase tracking-wider">الوصف</th>
                          <th className="px-4 py-3 text-sm font-semibold text-gray-600 uppercase tracking-wider text-center">القراءات (السابقة/الحالية)</th>
                          <th className="px-4 py-3 text-sm font-semibold text-gray-600 uppercase tracking-wider text-center">الاستهلاك</th>
                          <th className="px-4 py-3 text-sm font-semibold text-gray-600 uppercase tracking-wider text-left">المبلغ</th>
                      </tr>
                  </thead>
                  <tbody>
                      <tr className="border-b border-gray-100">
                          <td className="px-4 py-4">
                              <p className="font-medium text-gray-800">استهلاك المياه</p>
                              <p className="text-xs text-gray-500">الفترة: {consumptionPeriod}</p>
                          </td>
                          <td className="px-4 py-4 text-center font-mono text-gray-600">{reading.previousReading} &larr; {reading.reading}</td>
                          <td className="px-4 py-4 text-center text-gray-600">{bill.consumption} وحدة</td>
                          <td className="px-4 py-4 text-left font-medium text-gray-800">${calculatedAmount.toFixed(2)}</td>
                      </tr>
                  </tbody>
              </table>
          </div>
        </section>

        {/* Total & Status */}
        <section className="mt-6 flex justify-between items-center">
          <div className="w-1/2">
              <h4 className="font-semibold text-gray-600">ملاحظات:</h4>
              <p className="text-xs text-gray-500">شكرًا لدفعك في الوقت المحدد. يرجى الاتصال بالدعم لأي أسئلة بخصوص فاتورتك.</p>
          </div>
          <div className="w-1/3 bg-gray-50 p-4 rounded-lg text-left">
              <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-gray-600">الإجمالي:</span>
                  <span className="font-bold text-gray-800">${bill.amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t">
                  <span className="font-semibold text-gray-600">الحالة:</span>
                  <BillStatusBadge status={bill.status} />
              </div>
          </div>
        </section>
        
        {/* Print Button */}
        <div className="text-center mt-10 no-print">
          <Button onClick={handlePrint}>
              طباعة / حفظ كملف PDF
          </Button>
        </div>
      </div>
    </>
  );
};

export default Invoice;