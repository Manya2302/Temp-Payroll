/**
 * 🔹 Frontend (React) - Payroll Chart Component
 * MERN Concepts Used:
 * ✅ Components - Reusable chart component
 * ✅ Props - Receiving chart configuration (could be enhanced)
 * ✅ State (useState) - Using useRef for chart instance management
 * ✅ useEffect - Chart initialization and cleanup on component mount/unmount
 * ✅ Event Handling - Chart interactions (hover, click)
 * ✅ Styling (CSS / Tailwind / Bootstrap) - Chart styling and responsive design
 */

import { useEffect, useRef } from 'react';
import { ensureChartRegistered } from '@/lib/chart';

export function PayrollChart() {
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
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
          label: 'Monthly Payroll',
          data: [280000, 295000, 310000, 324580, 315000, 330000],
          borderColor: 'hsl(203.8863, 88.2845%, 53.1373%)',
          backgroundColor: 'hsla(203.8863, 88.2845%, 53.1373%, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
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
        },
        interaction: {
          mode: 'nearest',
          axis: 'x',
          intersect: false
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
      data-testid="payroll-chart"
      style={{ maxHeight: '256px' }}
    />
  );
}