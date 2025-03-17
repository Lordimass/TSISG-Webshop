import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from './fetchProducts.jsx'
import Home from './pages/home/home.jsx';

createRoot(document.getElementById('root')).render(
    <BrowserRouter>
      <Routes>
        <Route index element={<Home />} />
        <Route path="test" element={<App />} />
      </Routes>
    </BrowserRouter>
);
