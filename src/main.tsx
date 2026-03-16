// NightClaw — React entry point
// Pattern adapted from OpenMaiWaifu (github.com/buyve/OpenMaiWaifu)

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
