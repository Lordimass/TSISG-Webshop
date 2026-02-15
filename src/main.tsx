// src/main.tsx
import {createRoot} from "react-dom/client";
import {App} from "./app";
import {initGA4} from "./appHooks";

import '@flaticon/flaticon-uicons/css/all/all.css';
import '@mdxeditor/editor/style.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import "bootstrap/dist/js/bootstrap.bundle.min.js"
import "./common.scss"

const rootEl = document.getElementById("root");

if (rootEl) {
  initGA4()
  const root = createRoot(rootEl);
  root.render(<App />);
} else {
  console.error("Couldn't find root element!");
}