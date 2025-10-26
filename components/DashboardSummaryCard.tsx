import React, { ReactNode } from 'react';

interface DashboardSummaryCardProps {
    title: string;
    amount: number;
    count: number;
    icon: ReactNode;
    colorClass: string;
}

const DashboardSummaryCard: React.FC<DashboardSummaryCardProps> = ({ title, amount, count, icon, colorClass }) => {
    return (
        <div className="bg-white rounded-lg shadow-lg p-5 flex items-center space-x-4 rtl:space-x-reverse">
            <div className={`p-3 rounded-full ${colorClass}`}>
                {icon}
            </div>
            <div>
                <p className="text-sm text-gray-500">{title}</p>
                <p className="text-2xl font-bold text-gray-800">{amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} د.م.</p>
                <p className="text-xs text-gray-400">{count} فاتورة</p>
            </div>
        </div>
    );
};

export default DashboardSummaryCard;