import React from 'react';
import { BillStatus } from '../types';

interface PieChartProps {
    data: { status: BillStatus; count: number }[];
}

const statusConfig: Record<string, { color: string; name: string }> = {
    [BillStatus.PAID]: { color: '#4ade80', name: 'مدفوعة' }, // green-400
    [BillStatus.UNPAID]: { color: '#fbbf24', name: 'غير مدفوعة' }, // amber-400
    [BillStatus.OVERDUE]: { color: '#f87171', name: 'متأخرة' }, // red-400
    [BillStatus.PENDING_APPROVAL]: { color: '#60a5fa', name: 'قيد المراجعة' }, // blue-400
};


const PieChart: React.FC<PieChartProps> = ({ data }) => {
    const total = data.reduce((acc, item) => acc + item.count, 0);

    if (total === 0) {
        return <div className="text-center text-gray-500 py-8">لا توجد بيانات لعرضها.</div>;
    }

    let accumulatedPercentage = 0;
    const gradients = data
        .filter(item => item.count > 0)
        .map(item => {
            const percentage = (item.count / total) * 100;
            const color = statusConfig[item.status]?.color || '#9ca3af'; // gray-400
            const start = accumulatedPercentage;
            accumulatedPercentage += percentage;
            const end = accumulatedPercentage;
            return `${color} ${start}% ${end}%`;
        });
    
    const conicGradient = `conic-gradient(${gradients.join(', ')})`;

    return (
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 p-4">
            <div
                className="w-48 h-48 rounded-full"
                style={{ background: conicGradient }}
                role="img"
                aria-label="مخطط دائري لتوزيع حالات الفواتير"
            ></div>
            <div className="flex flex-col gap-2" aria-label="مفتاح المخطط">
                {data.filter(item => item.count > 0).map(item => (
                    <div key={item.status} className="flex items-center">
                        <span
                            className="w-4 h-4 rounded-full me-2"
                            style={{ backgroundColor: statusConfig[item.status]?.color || '#9ca3af' }}
                        ></span>
                        <span className="text-sm text-gray-700">{statusConfig[item.status]?.name || item.status}:</span>
                        <span className="text-sm font-semibold text-gray-800 ms-2">{item.count} فاتورة</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PieChart;
