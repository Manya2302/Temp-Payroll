import express from "express";
import { setupVite, serveStatic, log } from "./vite.js";
import { setupAuth } from "./auth.js";
import { createRoutes } from "./routes.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

setupAuth(app);
createRoutes(app);

if (process.env.NODE_ENV === "development") {
  await setupVite(app);
} else {
  serveStatic(app);
}

const PORT = 5000;
app.listen(PORT, "0.0.0.0", () => {
  log(`Express server running on port ${PORT}`);
});