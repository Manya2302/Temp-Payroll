/**
 * 🔹 Frontend (React) - Application Entry Point
 * MERN Concepts Used:
 * ✅ Components - Root App component rendering
 * ✅ Styling (CSS / Tailwind / Bootstrap) - Global CSS imports
 */

import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")).render(<App />);