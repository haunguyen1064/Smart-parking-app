import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { loadModules } from "./lib/arcgis-loader";

// Load ArcGIS modules for the map
loadModules();

createRoot(document.getElementById("root")!).render(<App />);
