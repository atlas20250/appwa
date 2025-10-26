import React, { useState, useEffect, useMemo } from 'react';
import { getSystemReportData } from '../services/api';
import { ReportData, BillWithUser, BillStatus } from '../types';
import Card from '../components/Card';
import Spinner from '../components/Spinner';
import BillStatusBadge from '../components/BillStatusBadge';
import PieChart from '../components/PieChart';
import Button from '../components/Button';
import Input from '../components/Input';

// Icons for summary cards
const RevenueIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const OutstandingIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const ConsumptionIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>;
const AverageIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;

const Reports: React.FC = () => {
    const [reportData, setReportData] = useState<ReportData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Table state
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [sortConfig, setSortConfig] = useState<{ key: keyof BillWithUser | 'userName', direction: 'ascending' | 'descending' }>({ key: 'issueDate', direction: 'descending' });

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const data = await getSystemReportData();
                setReportData(data);
            } catch (err) {
                setError("فشل في جلب بيانات التقارير.");
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const filteredAndSortedBills = useMemo(() => {
        if (!reportData) return [];

        let sortableItems = [...reportData.allBills];
        
        // Filter
        if (searchTerm) {
            sortableItems = sortableItems.filter(bill =>
                bill.user.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        if (statusFilter !== 'all') {
            sortableItems = sortableItems.filter(bill => bill.status === statusFilter);
        }

        // Sort
        sortableItems.sort((a, b) => {
            let aValue, bValue;
            if (sortConfig.key === 'userName') {
                aValue = a.user.name;
                bValue = b.user.name;
            } else {
                aValue = a[sortConfig.key as keyof BillWithUser];
                bValue = b[sortConfig.key as keyof BillWithUser];
            }

            if (aValue < bValue) {
                return sortConfig.direction === 'ascending' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortConfig.direction === 'ascending' ? 1 : -1;
            }
            return 0;
        });

        return sortableItems;
    }, [reportData, searchTerm, statusFilter, sortConfig]);

    const requestSort = (key: keyof BillWithUser | 'userName') => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const exportToCSV = () => {
        const headers = ['User Name', 'Issue Date', 'Due Date', 'Amount', 'Status', 'Consumption'];
        const rows = filteredAndSortedBills.map(bill => [
            `"${bill.user.name.replace(/"/g, '""')}"`,
            new Date(bill.issueDate).toLocaleDateString(),
            new Date(bill.dueDate).toLocaleDateString(),
            bill.amount.toFixed(2),
            bill.status,
            bill.consumption
        ].join(','));

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `invoice_report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-64"><Spinner /> جاري تحميل التقارير...</div>;
    }

    if (error) {
        return <div className="text-center text-red-500 bg-red-50 p-4 rounded-md">{error}</div>;
    }

    if (!reportData) {
        return <div className="text-center text-gray-500">لا توجد بيانات متاحة لعرض التقارير.</div>;
    }

    const { summary, monthlyRevenue, statusDistribution } = reportData;

    const maxRevenue = Math.max(...monthlyRevenue.map(m => m.revenue), 0);
    const yAxisMax = maxRevenue > 0 ? Math.ceil(maxRevenue / 100) * 100 : 100;

    return (
        <div className="space-y-8">
            <h2 className="text-3xl font-bold text-gray-800">تقارير النظام</h2>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="flex items-center p-5"><RevenueIcon /><div className="ms-4"><p className="text-sm text-gray-500">إجمالي الإيرادات</p><p className="text-2xl font-bold">{summary.totalRevenue.toFixed(2)} د.م.</p></div></Card>
                <Card className="flex items-center p-5"><OutstandingIcon /><div className="ms-4"><p className="text-sm text-gray-500">إجمالي المستحقات</p><p className="text-2xl font-bold">{summary.totalOutstanding.toFixed(2)} د.م.</p></div></Card>
                <Card className="flex items-center p-5"><ConsumptionIcon /><div className="ms-4"><p className="text-sm text-gray-500">إجمالي الاستهلاك</p><p className="text-2xl font-bold">{summary.totalConsumption} وحدة</p></div></Card>
                <Card className="flex items-center p-5"><AverageIcon /><div className="ms-4"><p className="text-sm text-gray-500">متوسط الفاتورة</p><p className="text-2xl font-bold">{summary.averageBill.toFixed(2)} د.م.</p></div></Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <Card title="الإيرادات الشهرية (آخر 12 شهرًا)" className="lg:col-span-3">
                    <div className="h-72 w-full flex items-end justify-around space-x-2 pt-4">
                        {monthlyRevenue.map((item, index) => {
                            const barHeight = yAxisMax > 0 ? (item.revenue / yAxisMax) * 100 : 0;
                            return (
                                <div key={index} className="group relative flex-1 h-full flex flex-col items-center justify-end">
                                    <div className="absolute bottom-full mb-2 w-max px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">{item.revenue.toFixed(2)} د.م.</div>
                                    <div className="w-4/5 bg-secondary-300 group-hover:bg-secondary-400 rounded-t-md transition-colors" style={{ height: `${barHeight}%` }}></div>
                                    <div className="mt-2 text-xs text-gray-500">{item.month}</div>
                                </div>
                            );
                        })}
                    </div>
                </Card>
                <Card title="توزيع حالات الفواتير" className="lg:col-span-2">
                    <PieChart data={statusDistribution} />
                </Card>
            </div>

            {/* Detailed Invoices Table */}
            <Card title="سجل الفواتير الكامل">
                <div className="space-y-4">
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                        <Input
                            id="search-report"
                            type="text"
                            placeholder="ابحث بالاسم..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full md:w-1/3"
                        />
                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                            className="w-full md:w-1/4 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                        >
                            <option value="all">كل الحالات</option>
                            <option value={BillStatus.PAID}>مدفوعة</option>
                            <option value={BillStatus.UNPAID}>غير مدفوعة</option>
                            <option value={BillStatus.OVERDUE}>متأخرة</option>
                            <option value={BillStatus.PENDING_APPROVAL}>قيد المراجعة</option>
                        </select>
                        <Button onClick={exportToCSV} variant="secondary">تصدير إلى CSV</Button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    {[{key: 'userName', label: 'المستخدم'}, {key: 'issueDate', label: 'تاريخ الإصدار'}, {key: 'dueDate', label: 'تاريخ الاستحقاق'}, {key: 'amount', label: 'المبلغ'}, {key: 'status', label: 'الحالة'}].map(header => (
                                        <th key={header.key} onClick={() => requestSort(header.key as any)} className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none">
                                            {header.label} {sortConfig.key === header.key ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredAndSortedBills.length > 0 ? filteredAndSortedBills.map(bill => (
                                    <tr key={bill.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{bill.user.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(bill.issueDate).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(bill.dueDate).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{bill.amount.toFixed(2)} د.م.</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm"><BillStatusBadge status={bill.status} /></td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={5} className="text-center py-8 text-gray-500">لا توجد فواتير تطابق معايير البحث.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default Reports;