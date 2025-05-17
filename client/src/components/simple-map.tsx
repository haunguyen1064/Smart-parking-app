import { useEffect, useRef, useState } from "react";
import { Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { loadModules } from "esri-loader";

export type ParkingLotMarker = {
  id: number;
  name: string;
  latitude: string;
  longitude: string;
  availableSpots: number;
  totalSpots: number;
  isSelected?: boolean;
};

type SimpleMapProps = {
  markers: ParkingLotMarker[];
  onMarkerClick: (marker: ParkingLotMarker) => void;
  selectedMarkerId?: number;
  centerCoordinates?: [number, number];
};

export default function SimpleMap({ 
  markers, 
  onMarkerClick, 
  selectedMarkerId, 
  centerCoordinates = [106.7, 10.77] // Default to Ho Chi Minh City coordinates
}: SimpleMapProps) {
  const mapDiv = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Map state (using any to avoid TypeScript issues with ArcGIS API)
  const [view, setView] = useState<any>(null);
  const [graphicsLayer, setGraphicsLayer] = useState<any>(null);
  const [clickHandler, setClickHandler] = useState<any>(null);
  
  // Initialize map
  useEffect(() => {
    // Don't re-initialize if already loaded or missing container
    if (!mapDiv.current || view) return;
    
    const initMap = async () => {
      try {
        // Load ArcGIS modules
        const [esriConfig, Map, MapView, GraphicsLayer] = await loadModules([
          "esri/config",
          "esri/Map",
          "esri/views/MapView",
          "esri/layers/GraphicsLayer"
        ]);
        
        // Configure basemap with a public basemap that doesn't require an API key
        // We're not setting an API key since the current one seems to be invalid
        
        // Create map with a basemap that doesn't require an API key
        const map = new Map({
          basemap: "osm" // OpenStreetMap basemap is free to use
        });
        
        // Create graphics layer
        const layer = new GraphicsLayer();
        map.add(layer);
        
        // Create view
        const mapView = new MapView({
          container: mapDiv.current,
          map: map,
          center: centerCoordinates,
          zoom: 13
        });
        
        // Wait for view to be ready
        await mapView.when();
        
        // Save references
        setView(mapView);
        setGraphicsLayer(layer);
        setIsLoading(false);
        
        console.log("Map initialized successfully");
      } catch (error) {
        console.error("Failed to initialize map:", error);
        setIsLoading(false);
      }
    };
    
    initMap();
    
    // Cleanup on unmount
    return () => {
      if (clickHandler) {
        clickHandler.remove();
      }
      
      if (view) {
        view.destroy();
      }
    };
  }, [centerCoordinates]);
  
  // Update markers when markers change or map is ready
  useEffect(() => {
    if (isLoading || !graphicsLayer || !view) return;
    
    const updateMarkers = async () => {
      try {
        // Load required modules
        const [Point, Graphic] = await loadModules([
          "esri/geometry/Point",
          "esri/Graphic"
        ]);
        
        // Clear existing markers
        graphicsLayer.removeAll();
        
        // Add markers
        markers.forEach(marker => {
          try {
            const longitude = parseFloat(marker.longitude);
            const latitude = parseFloat(marker.latitude);
            
            if (isNaN(longitude) || isNaN(latitude)) {
              console.warn(`Invalid coordinates for marker ${marker.id}`);
              return;
            }
            
            // Create marker point
            const point = new Point({
              longitude: longitude,
              latitude: latitude
            });
            
            // Style based on selection and availability
            const isSelected = marker.id === selectedMarkerId;
            const color = isSelected ? "#FF5733" : 
                         marker.availableSpots > 0 ? "#3B82F6" : "#9CA3AF";
            const size = isSelected ? 18 : 12;
            
            // Create marker symbol
            const markerSymbol = {
              type: "simple-marker",
              color: color,
              size: size,
              outline: {
                color: [255, 255, 255],
                width: 2
              }
            };
            
            // Create graphic
            const graphic = new Graphic({
              geometry: point,
              symbol: markerSymbol,
              attributes: {
                id: marker.id,
                name: marker.name,
                availableSpots: marker.availableSpots,
                totalSpots: marker.totalSpots
              }
            });
            
            // Add to layer
            graphicsLayer.add(graphic);
          } catch (err) {
            console.error(`Error adding marker ${marker.id}:`, err);
          }
        });
      } catch (error) {
        console.error("Error updating markers:", error);
      }
    };
    
    updateMarkers();
  }, [markers, selectedMarkerId, isLoading, graphicsLayer, view]);
  
  // Add click handler
  useEffect(() => {
    if (isLoading || !view || !markers.length) return;
    
    // Remove existing handler
    if (clickHandler) {
      clickHandler.remove();
    }
    
    // Add new handler
    const handler = view.on("click", (event: any) => {
      view.hitTest(event).then((response: any) => {
        // Check if a marker was clicked
        const result = response.results?.find((result: any) => 
          result.graphic?.attributes?.id !== undefined
        );
        
        if (result) {
          const markerID = result.graphic.attributes.id;
          const marker = markers.find(m => m.id === markerID);
          
          if (marker) {
            onMarkerClick(marker);
          }
        }
      });
    });
    
    setClickHandler(handler);
    
    return () => {
      handler.remove();
    };
  }, [isLoading, view, markers, onMarkerClick]);
  
  // Center map on selected marker
  useEffect(() => {
    if (isLoading || !view || !selectedMarkerId) return;
    
    const selectedMarker = markers.find(marker => marker.id === selectedMarkerId);
    
    if (selectedMarker) {
      const longitude = parseFloat(selectedMarker.longitude);
      const latitude = parseFloat(selectedMarker.latitude);
      
      if (!isNaN(longitude) && !isNaN(latitude)) {
        view.goTo({
          center: [longitude, latitude],
          zoom: 15
        }, {
          duration: 500
        });
      }
    }
  }, [selectedMarkerId, markers, isLoading, view]);
  
  // Zoom controls
  const handleZoomIn = () => {
    if (view) {
      const newZoom = Math.min(view.zoom + 1, 18);
      view.goTo({ zoom: newZoom }, { duration: 200 });
    }
  };
  
  const handleZoomOut = () => {
    if (view) {
      const newZoom = Math.max(view.zoom - 1, 5);
      view.goTo({ zoom: newZoom }, { duration: 200 });
    }
  };
  
  return (
    <div className="w-full md:w-3/5 h-[50vh] md:h-[calc(100vh-56px)] relative bg-gray-100">
      {/* Map container */}
      <div ref={mapDiv} className="absolute inset-0" />
      
      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-80 z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      )}
      
      {/* Map controls */}
      <div className="absolute right-4 bottom-24 flex flex-col space-y-2 z-10">
        <Button 
          variant="default" 
          size="icon" 
          className="rounded-md bg-white text-gray-800 hover:bg-gray-100 shadow-md" 
          onClick={handleZoomIn}
        >
          <Plus className="h-4 w-4" />
        </Button>
        <Button 
          variant="default" 
          size="icon" 
          className="rounded-md bg-white text-gray-800 hover:bg-gray-100 shadow-md" 
          onClick={handleZoomOut}
        >
          <Minus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}