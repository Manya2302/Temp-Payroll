
// Centralized Chart.js registration to ensure single instance.
import { Chart, ArcElement, LineElement, BarElement, PointElement, DoughnutController, PieController, LineController, BarController, CategoryScale, LinearScale, Tooltip, Legend, Filler } from 'chart.js';

// Only register once
let registered = false;
export function ensureChartRegistered() {
  if (registered) return Chart;
  Chart.register(
    ArcElement,
    LineElement,
    BarElement,
    PointElement,
    DoughnutController,
    PieController,
    LineController,
    BarController,
    CategoryScale,
    LinearScale,
    Tooltip,
    Legend,
    Filler,
  );
  registered = true;
  return Chart;
}

export { Chart };
