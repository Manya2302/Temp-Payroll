import { useEffect, useRef } from 'react';
import { ensureChartRegistered } from '@/lib/chart';

export function EmployeeChart({ data = [], type = 'bar' }) {
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
    const values = data.length > 0 ? data.map(d => d.employees || d.value || 0) : [0];
    const colors = data.length > 0 && data[0].fill 
      ? data.map(d => d.fill) 
      : ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

    const Chart = ensureChartRegistered();
    chartInstance.current = new Chart(ctx, {
      type: type,
      data: {
        labels,
        datasets: [{
          label: 'Employees',
          data: values,
          backgroundColor: type === 'bar' 
            ? 'hsla(159.7826, 100%, 36.0784%, 0.8)' 
            : colors,
          borderColor: type === 'bar' 
            ? 'hsl(159.7826, 100%, 36.0784%)' 
            : '#ffffff',
          borderWidth: type === 'bar' ? 1 : 2,
          borderRadius: type === 'bar' ? 6 : undefined,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: type !== 'bar',
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
                const value = context.parsed.y || context.parsed || 0;
                return type === 'bar' 
                  ? `${label}: ${value} employees` 
                  : `${label}: ${value} employees`;
              }
            }
          }
        },
        scales: type === 'bar' ? {
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
              stepSize: 1
            }
          }
        } : undefined
      }
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data, type]);

  return (
    <canvas 
      ref={chartRef} 
      data-testid="employee-chart"
      style={{ maxHeight: '256px' }}
    />
  );
}
