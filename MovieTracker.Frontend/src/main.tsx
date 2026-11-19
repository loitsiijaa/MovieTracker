import { createRoot } from "react-dom/client";
import App from "./App";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error('У файлі index.html не знайдено елемент із id="root".');
}

createRoot(rootElement).render(<App />);