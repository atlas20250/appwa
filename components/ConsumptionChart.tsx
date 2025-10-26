import React from 'react';
import { Bill } from '../types';
import Card from './Card';

interface ConsumptionChartProps {
  data: Bill[];
}

const ConsumptionChart: React.FC<ConsumptionChartProps> = ({ data }) => {
  // data is sorted newest to oldest. We want to show the last 12 months in chronological order.
  const chartData = data.slice(0, 12).reverse();

  if (chartData.length < 2) {
    return (
      <Card title="سجل الاستهلاك">
        <div className="flex items-center justify-center h-48 text-gray-500">
          لا توجد بيانات كافية لعرض الرسم البياني. مطلوب المزيد من السجل.
        </div>
      </Card>
    );
  }

  const maxConsumption = Math.max(...chartData.map(bill => bill.consumption), 0);
  // Give the y-axis a bit of breathing room by rounding up to the nearest 10.
  const yAxisMax = maxConsumption > 0 ? Math.ceil(maxConsumption / 10) * 10 : 10;

  return (
    <Card title="سجل الاستهلاك (آخر 12 شهرًا)">
      <div className="h-72 w-full pt-4 pr-4 pb-0 pl-0 flex flex-col" aria-label="رسم بياني لاستهلاك المياه">
        <div className="flex-grow flex items-end justify-around space-x-2">
          {chartData.map((bill) => {
            const barHeight = yAxisMax > 0 ? (bill.consumption / yAxisMax) * 100 : 0;
            const month = new Date(bill.issueDate).toLocaleString('ar', { month: 'short' });

            return (
              <div key={bill.id} className="group relative flex-1 h-full flex flex-col items-center justify-end" role="figure" aria-label={`الاستهلاك في ${month}: ${bill.consumption} وحدة`}>
                {/* Tooltip */}
                <div className="absolute bottom-full mb-2 w-max px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" role="tooltip">
                  {bill.consumption} وحدة في {new Date(bill.issueDate).toLocaleDateString()}
                </div>
                {/* Bar */}
                <div
                  className="w-4/5 bg-primary-300 group-hover:bg-primary-400 rounded-t-md transition-colors"
                  style={{ height: `${barHeight}%` }}
                />
                {/* Label */}
                <div className="mt-2 text-xs text-gray-500 shrink-0">{month}</div>
              </div>
            );
          })}
        </div>
        <div className="border-t border-gray-200 mt-2"></div>
         <p className="text-center text-xs text-gray-400 mt-2">الاستهلاك (وحدة)</p>
      </div>
    </Card>
  );
};

export default ConsumptionChart;