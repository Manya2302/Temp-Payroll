/**
 * 🔹 Frontend (React) - Chart.js Configuration
 * MERN Concepts Used:
 * ✅ Components - Chart component configuration and registration
 * ✅ Props - Chart configuration and data visualization setup
 * ✅ State (useState) - Chart instance management and rendering
 * ✅ useEffect - Chart initialization and cleanup logic
 * ✅ Styling (CSS / Tailwind / Bootstrap) - Chart visual styling configuration
 */

// Centralized Chart.js registration to ensure single instance.
import { Chart, ArcElement, LineElement, BarElement, PointElement, DoughnutController, LineController, BarController, CategoryScale, LinearScale, Tooltip, Legend, Filler } from 'chart.js';

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
