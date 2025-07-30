import { createRoot } from "react-dom/client";
import { App } from "./app";

const rootEl = document.getElementById("root")
if (rootEl) {
  const root = createRoot(rootEl);
  root.render(<App/>);
} else {
  console.error("Couldn't find root element!")
}