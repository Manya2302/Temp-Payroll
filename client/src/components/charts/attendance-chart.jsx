

import { useEffect, useRef } from 'react';
import { ensureChartRegistered } from '@/lib/chart';

export function AttendanceChart() {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (!chartRef.current) return;

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    // Destroy existing chart if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

  const Chart = ensureChartRegistered();
  chartInstance.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Present', 'Absent', 'Late'],
        datasets: [{
          data: [85, 10, 5],
          backgroundColor: [
            'hsl(159.7826, 100%, 36.0784%)', // green
            'hsl(356.3033, 90.5579%, 54.3137%)', // red  
            'hsl(42.0290, 92.8251%, 56.2745%)' // yellow
          ],
          borderWidth: 0,
          cutout: '60%'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 20,
              usePointStyle: true
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const value = context.parsed || 0;
                const total = context.dataset.data.reduce((acc, val) => acc + val, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return `${label}: ${value}% (${percentage}%)`;
              }
            }
          }
        }
      }
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, []);

  return (
    <canvas 
      ref={chartRef} 
      data-testid="attendance-chart"
      style={{ maxHeight: '256px' }}
    />
  );
}