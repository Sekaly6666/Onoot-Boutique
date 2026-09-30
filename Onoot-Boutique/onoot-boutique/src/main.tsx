import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// ⚡ Signature Développeur BSA
if (typeof window !== "undefined") {
  console.log(
    "%c ⚡ Conçu & Développé par BSA %c WhatsApp: +225 05 66 66 80 39 ",
    "background: #0f172a; color: #f59e0b; font-weight: bold; font-size: 11px; padding: 4px 8px; border-radius: 4px 0 0 4px; border: 1px solid #f59e0b;",
    "background: #f59e0b; color: #0f172a; font-weight: bold; font-size: 11px; padding: 4px 8px; border-radius: 0 4px 4px 0;"
  );
}

createRoot(document.getElementById("root")!).render(<App />);

