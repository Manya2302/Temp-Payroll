import { useEffect, useRef } from 'react';
import { ensureChartRegistered } from '@/lib/chart';

export function AttendanceChart({ data = [] }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (!chartRef.current) return;

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const labels = data.length > 0 ? data.map(d => d.name) : ['No Data'];
    const values = data.length > 0 ? data.map(d => d.value) : [1];
    const colors = data.length > 0 ? data.map(d => d.fill || '#3b82f6') : ['#d1d5db'];

    const Chart = ensureChartRegistered();
    chartInstance.current = new Chart(ctx, {
      type: 'pie',
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: colors,
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 15,
              usePointStyle: true,
              font: {
                size: 12
              }
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const value = context.parsed || 0;
                const total = context.dataset.data.reduce((acc, val) => acc + val, 0);
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                return `${label}: ${value} (${percentage}%)`;
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
  }, [data]);

  return (
    <canvas 
      ref={chartRef} 
      data-testid="attendance-chart"
      style={{ maxHeight: '256px' }}
    />
  );
}
