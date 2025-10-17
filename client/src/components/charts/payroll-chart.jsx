import { useEffect, useRef } from 'react';
import { ensureChartRegistered } from '@/lib/chart';

export function PayrollChart({ data = [] }) {
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
    const values = data.length > 0 ? data.map(d => d.totalPayroll) : [0];

    const Chart = ensureChartRegistered();
    chartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Total Payroll',
          data: values,
          backgroundColor: 'hsla(203.8863, 88.2845%, 53.1373%, 0.8)',
          borderColor: 'hsl(203.8863, 88.2845%, 53.1373%)',
          borderWidth: 1,
          borderRadius: 6,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              label: (context) => `$${context.parsed.y.toLocaleString()}`
            }
          }
        },
        scales: {
          x: {
            display: true,
            grid: {
              display: false
            }
          },
          y: {
            display: true,
            grid: {
              color: 'hsl(210, 3.3898%, 85%)'
            },
            ticks: {
              callback: (value) => `$${Number(value).toLocaleString()}`
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
      data-testid="payroll-chart"
      style={{ maxHeight: '256px' }}
    />
  );
}
