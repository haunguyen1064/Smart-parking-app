import { loadModules as esriLoadModules } from "esri-loader";

export type MapView = __esri.MapView;
export type Map = __esri.Map;
export type Point = __esri.Point;
export type Graphic = __esri.Graphic;
export type GraphicsLayer = __esri.GraphicsLayer;

// Load ArcGIS modules
export async function loadModules() {
  // Specify modules to load
  return esriLoadModules([
    "esri/config", 
    "esri/Map", 
    "esri/views/MapView",
    "esri/layers/GraphicsLayer",
    "esri/Graphic",
    "esri/geometry/Point"
  ], {
    css: true
  }).then(([esriConfig]) => {
    // Configure API key
    esriConfig.apiKey = import.meta.env.VITE_ARCGIS_API_KEY;
    
    // Set portal URL if using a custom portal
    // esriConfig.portalUrl = "https://yourportal.domain.com/arcgis";
    
    return;
  }).catch(err => {
    console.error("ArcGIS JavaScript API failed to load", err);
  });
}

// Create a map instance
export async function createMap(container: HTMLDivElement, center: [number, number], zoom: number = 13) {
  try {
    const [Map, MapView] = await esriLoadModules(["esri/Map", "esri/views/MapView"]);
    
    const map = new Map({
      basemap: "streets-vector"
    });
    
    const view = new MapView({
      container,
      map,
      center,
      zoom
    });
    
    return { map, view };
  } catch (error) {
    console.error("Error creating map:", error);
    throw error;
  }
}

// Create a graphics layer
export async function createGraphicsLayer() {
  try {
    const [GraphicsLayer] = await esriLoadModules(["esri/layers/GraphicsLayer"]);
    return new GraphicsLayer();
  } catch (error) {
    console.error("Error creating graphics layer:", error);
    throw error;
  }
}

// Create a point
export async function createPoint(longitude: number, latitude: number) {
  try {
    const [Point] = await esriLoadModules(["esri/geometry/Point"]);
    return new Point({
      longitude,
      latitude
    });
  } catch (error) {
    console.error("Error creating point:", error);
    throw error;
  }
}

// Create a graphic
export async function createGraphic(geometry: Point, symbol: any, attributes?: any) {
  try {
    const [Graphic] = await esriLoadModules(["esri/Graphic"]);
    return new Graphic({
      geometry,
      symbol,
      attributes
    });
  } catch (error) {
    console.error("Error creating graphic:", error);
    throw error;
  }
}

// Create a marker symbol
export async function createMarkerSymbol(color: string = "#3B82F6", size: number = 12) {
  return {
    type: "simple-marker",
    color,
    size,
    outline: {
      color: [255, 255, 255],
      width: 2
    }
  };
}
