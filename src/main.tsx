// src/main.tsx
import { createRoot } from "react-dom/client";
import { App } from "./app";
import { initGA4 } from "./appHooks";

const rootEl = document.getElementById("root");

if (rootEl) {
  initGA4()
  const root = createRoot(rootEl);
  root.render(<App />);
} else {
  console.error("Couldn't find root element!");
}
