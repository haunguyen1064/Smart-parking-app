import { useEffect, useRef, useState } from "react";
import { Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createMap, createGraphicsLayer, createPoint, createGraphic, createMarkerSymbol } from "@/lib/arcgis-loader";

export type ParkingLotMarker = {
  id: number;
  name: string;
  latitude: string;
  longitude: string;
  availableSpots: number;
  totalSpots: number;
  isSelected?: boolean;
};

type MapViewProps = {
  markers: ParkingLotMarker[];
  onMarkerClick: (marker: ParkingLotMarker) => void;
  selectedMarkerId?: number;
  centerCoordinates?: [number, number];
};

export default function MapView({ 
  markers, 
  onMarkerClick, 
  selectedMarkerId, 
  centerCoordinates = [106.7, 10.77] // Default to Ho Chi Minh City coordinates
}: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<any>(null);
  const graphicsLayerRef = useRef<any>(null);
  
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  
  // Initialize map
  useEffect(() => {
    if (!mapRef.current || viewRef.current) return;
    
    const initializeMap = async () => {
      try {
        // Create map and view using the current ref instead of ID
        const mapContainer = mapRef.current;
        if (!mapContainer) return;
        
        const { map, view } = await createMap(mapContainer, centerCoordinates);
        viewRef.current = view;
        
        // Create graphics layer
        const graphicsLayer = await createGraphicsLayer();
        map.add(graphicsLayer);
        graphicsLayerRef.current = graphicsLayer;
        
        // Set map as loaded
        view.when(() => {
          setIsMapLoaded(true);
        });
      } catch (error) {
        console.error("Error initializing map:", error);
      }
    };
    
    initializeMap();
    
    // Cleanup
    return () => {
      if (viewRef.current) {
        viewRef.current.destroy();
        viewRef.current = null;
      }
    };
  }, [centerCoordinates]);
  
  // Update markers
  useEffect(() => {
    if (!isMapLoaded || !graphicsLayerRef.current) return;
    
    const updateMarkers = async () => {
      // Clear existing graphics
      graphicsLayerRef.current!.removeAll();
      
      // Add markers
      for (const marker of markers) {
        try {
          // Create point geometry
          const point = await createPoint(
            parseFloat(marker.longitude), 
            parseFloat(marker.latitude)
          );
          
          // Create symbol - different color for selected marker
          const isSelected = marker.id === selectedMarkerId;
          const symbolColor = isSelected ? "#1E40AF" : (marker.availableSpots > 0 ? "#3B82F6" : "#6B7280");
          const symbolSize = isSelected ? 20 : 15;
          const symbol = await createMarkerSymbol(symbolColor, symbolSize);
          
          // Create graphic with attributes
          const graphic = await createGraphic(point, symbol, {
            id: marker.id,
            name: marker.name,
            availableSpots: marker.availableSpots,
            totalSpots: marker.totalSpots,
            latitude: marker.latitude,
            longitude: marker.longitude
          });
          
          // Add click event
          graphic.popupTemplate = {
            title: marker.name,
            content: `Available spots: ${marker.availableSpots}/${marker.totalSpots}`
          };
          
          // Add to layer
          graphicsLayerRef.current!.add(graphic);
        } catch (error) {
          console.error(`Error adding marker ${marker.id}:`, error);
        }
      }
    };
    
    updateMarkers();
  }, [markers, selectedMarkerId, isMapLoaded]);
  
  // Add click handler
  useEffect(() => {
    if (!viewRef.current || !isMapLoaded) return;
    
    const handleClick = viewRef.current.on("click", (event: any) => {
      viewRef.current!.hitTest(event).then((response: any) => {
        const graphic = response.results?.[0]?.graphic;
        
        if (graphic?.attributes?.id) {
          const marker = markers.find(m => m.id === graphic.attributes.id);
          if (marker) {
            onMarkerClick(marker);
          }
        }
      });
    });
    
    return () => {
      if (handleClick && typeof handleClick.remove === 'function') {
        handleClick.remove();
      }
    };
  }, [markers, onMarkerClick, isMapLoaded]);
  
  // Center map on selected marker
  useEffect(() => {
    if (!viewRef.current || !isMapLoaded || !selectedMarkerId) return;
    
    const selectedMarker = markers.find(m => m.id === selectedMarkerId);
    if (selectedMarker) {
      viewRef.current.goTo({
        center: [parseFloat(selectedMarker.longitude), parseFloat(selectedMarker.latitude)],
        zoom: 15
      }, { duration: 500 });
    }
  }, [selectedMarkerId, markers, isMapLoaded]);
  
  // Zoom controls
  const handleZoomIn = () => {
    if (viewRef.current) {
      const newZoom = viewRef.current.zoom + 1;
      viewRef.current.goTo({ zoom: newZoom }, { duration: 200 });
    }
  };
  
  const handleZoomOut = () => {
    if (viewRef.current) {
      const newZoom = viewRef.current.zoom - 1;
      viewRef.current.goTo({ zoom: newZoom }, { duration: 200 });
    }
  };
  
  return (
    <div className="w-full md:w-3/5 h-[50vh] md:h-[calc(100vh-56px)] relative bg-gray-100" ref={mapRef}>
      {!isMapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      )}
      
      {/* Map controls */}
      <div className="absolute right-4 bottom-24 flex flex-col space-y-2 z-10">
        <Button variant="default" size="icon" className="rounded-md bg-white text-gray-800 hover:bg-gray-100" onClick={handleZoomIn}>
          <Plus className="h-4 w-4" />
        </Button>
        <Button variant="default" size="icon" className="rounded-md bg-white text-gray-800 hover:bg-gray-100" onClick={handleZoomOut}>
          <Minus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
