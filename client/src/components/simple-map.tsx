import { useEffect, useRef, useState } from "react";
import { Plus, Minus, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { loadModules, loadCss } from "esri-loader";

export type ParkingLotMarker = {
  id: number;
  name: string;
  latitude: string;
  longitude: string;
  availableSpots: number;
  totalSpots: number;
  isSelected?: boolean;
};

export type RouteInfo = {
  name: string;
  distance: number;
  duration: number;
};

type SimpleMapProps = {
  markers: ParkingLotMarker[];
  onMarkerClick: (marker: ParkingLotMarker) => void;
  selectedMarkerId?: number;
  centerCoordinates?: [number, number];
  onRouteCalculated?: (routes: RouteInfo[]) => void;
};

export default function SimpleMap({ 
  markers, 
  onMarkerClick, 
  selectedMarkerId, 
  centerCoordinates = [106.7, 10.77], // Default to Ho Chi Minh City coordinates
  onRouteCalculated
}: SimpleMapProps) {
  const mapDiv = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Map state (using any to avoid TypeScript issues with ArcGIS API)
  const [view, setView] = useState<any>(null);
  const [graphicsLayer, setGraphicsLayer] = useState<any>(null);
  const [routeGraphicsLayer, setRouteGraphicsLayer] = useState<any>(null);
  const [clickHandler, setClickHandler] = useState<any>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [routeTask, setRouteTask] = useState<any>(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [routeResult, setRouteResult] = useState<RouteInfo[] | null>(null);
  
  // Initialize map
  useEffect(() => {
    // Don't re-initialize if already loaded or missing container
    if (!mapDiv.current || view) return;
    
    // Load ArcGIS CSS
    loadCss("https://js.arcgis.com/4.25/esri/themes/light/main.css");
    
    const initMap = async () => {
      try {
        // Load basic map modules
        const [esriConfig, Map, MapView, GraphicsLayer, Graphic, Point] = await loadModules([
          "esri/config",
          "esri/Map",
          "esri/views/MapView",
          "esri/layers/GraphicsLayer",
          "esri/Graphic",
          "esri/geometry/Point"
        ], { css: false }); // CSS is already loaded above
        
        // Configure map
        const map = new Map({
          basemap: "osm" // OpenStreetMap basemap is free to use and doesn't require an API key
        });
        
        // Create graphics layer for markers
        const layer = new GraphicsLayer();
        map.add(layer);
        
        // Create a separate graphics layer for the route
        const routeLayer = new GraphicsLayer();
        map.add(routeLayer);
        
        // Create view
        const mapView = new MapView({
          container: mapDiv.current,
          map: map,
          center: centerCoordinates,
          zoom: 13,
          constraints: {
            snapToZoom: false // Smoother zooming
          },
          padding: {
            top: 10,
            right: 10,
            bottom: 10,
            left: 10
          }
        });
        
        // Wait for view to be ready
        await mapView.when();
        
        // Save references for the map view and graphics layers
        setView(mapView);
        setGraphicsLayer(layer);
        setRouteGraphicsLayer(routeLayer);
        setIsLoading(false);
        
        console.log("Basic map initialized successfully");
        
        // Try to get user's current location
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const userCoordinates: [number, number] = [
                position.coords.longitude,
                position.coords.latitude
              ];
              setUserLocation(userCoordinates);
              
              // Add user location marker
              const userLocationPoint = new Point({
                longitude: userCoordinates[0],
                latitude: userCoordinates[1]
              });
              
              const userLocationSymbol = {
                type: "simple-marker",
                color: [0, 123, 255],
                size: 12,
                outline: {
                  color: [255, 255, 255],
                  width: 2
                }
              };
              
              const userLocationGraphic = new Graphic({
                geometry: userLocationPoint,
                symbol: userLocationSymbol,
                attributes: {
                  title: "Your Location",
                  type: "user-location"
                }
              });
              
              layer.add(userLocationGraphic);
              
              // Add a text label for user's location
              const textSymbol = {
                type: "text",
                color: "black",
                haloColor: "white",
                haloSize: 1,
                text: "Your Location",
                yoffset: -20,
                font: {
                  size: 12,
                  family: "sans-serif",
                  weight: "bold"
                }
              };
              
              const labelGraphic = new Graphic({
                geometry: userLocationPoint,
                symbol: textSymbol
              });
              
              layer.add(labelGraphic);
              
              // Center map on user location with animation
              mapView.goTo({
                center: userCoordinates,
                zoom: 14
              }, {
                duration: 1000,
                easing: "ease-in-out"
              });
            },
            (error) => {
              console.error("Error getting user location:", error);
            },
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0
            }
          );
        }
        
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
  
  // Calculate route between user location and selected parking lot
  const calculateRoute = async (destinationMarker: ParkingLotMarker) => {
    if (!userLocation || !view) {
      console.error("Cannot calculate route: missing user location or map view");
      return;
    }
    
    try {
      setIsCalculatingRoute(true);
      
      // Use a simplified direct line for routing
      try {
        // Load necessary modules
        const [Point, Graphic] = await loadModules([
          "esri/geometry/Point",
          "esri/Graphic"
        ]);
        
        // Create start point (user location)
        const startPoint = new Point({
          longitude: userLocation[0],
          latitude: userLocation[1]
        });
        
        // Create end point (parking lot)
        const endPoint = new Point({
          longitude: parseFloat(destinationMarker.longitude),
          latitude: parseFloat(destinationMarker.latitude)
        });
        
        // Clear any previous route graphics from the layer
        if (graphicsLayer) {
          // Find and remove any previous route lines
          graphicsLayer.graphics.items.forEach((graphic: any) => {
            if (graphic.attributes && graphic.attributes.type === 'route-line') {
              graphicsLayer.remove(graphic);
            }
          });
        }
        
        // Create a polyline geometry for the route
        const polylineJson = {
          type: "polyline",
          paths: [
            [userLocation[0], userLocation[1]],
            [parseFloat(destinationMarker.longitude), parseFloat(destinationMarker.latitude)]
          ]
        };
        
        // Create a line symbol for the route
        const lineSymbol = {
          type: "simple-line",
          color: [0, 123, 255, 0.8],
          width: 5,
          style: "solid",
          cap: "round",
          join: "round"
        };
        
        // Create a graphic for the route line
        const routeGraphic = new Graphic({
          geometry: polylineJson,
          symbol: lineSymbol,
          attributes: { type: 'route-line' }
        });
        
        // Add the route graphic to the map
        if (graphicsLayer) {
          graphicsLayer.add(routeGraphic);
        }
        
        // Add directionality arrows to indicate the route direction
        const midpoint = {
          x: (userLocation[0] + parseFloat(destinationMarker.longitude)) / 2,
          y: (userLocation[1] + parseFloat(destinationMarker.latitude)) / 2
        };
        
        const arrowSymbol = {
          type: "picture-marker",
          url: "https://static.arcgis.com/images/Symbols/Transportation/DefaultTransitRight.png",
          width: 20,
          height: 20
        };
        
        const arrowGraphic = new Graphic({
          geometry: {
            type: "point",
            x: midpoint.x,
            y: midpoint.y,
            spatialReference: view.spatialReference
          },
          symbol: arrowSymbol,
          attributes: { type: 'route-arrow' }
        });
        
        if (graphicsLayer) {
          graphicsLayer.add(arrowGraphic);
        }
        
        // Calculate straight-line distance
        const dx = parseFloat(destinationMarker.longitude) - userLocation[0];
        const dy = parseFloat(destinationMarker.latitude) - userLocation[1];
        
        // Convert to kilometers (rough approximation)
        const distance = Math.sqrt(dx * dx + dy * dy) * 111.32; // 1 degree ≈ 111.32 km at the equator
        
        // Estimate travel duration using different modes
        const walkingSpeed = 5; // km/h
        const drivingSpeed = 30; // km/h
        const walkingDuration = Math.round(distance / walkingSpeed * 60);
        const drivingDuration = Math.round(distance / drivingSpeed * 60);
        
        // Create route info objects for different travel modes
        const routeInfos: RouteInfo[] = [
          {
            name: "Driving",
            distance: Math.round(distance * 10) / 10,
            duration: drivingDuration
          },
          {
            name: "Walking",
            distance: Math.round(distance * 10) / 10,
            duration: walkingDuration
          }
        ];
        
        // Zoom to show both points with padding
        const extent = {
          xmin: Math.min(userLocation[0], parseFloat(destinationMarker.longitude)),
          ymin: Math.min(userLocation[1], parseFloat(destinationMarker.latitude)),
          xmax: Math.max(userLocation[0], parseFloat(destinationMarker.longitude)),
          ymax: Math.max(userLocation[1], parseFloat(destinationMarker.latitude)),
          spatialReference: view.spatialReference
        };
        
        view.goTo(extent, {
          duration: 1000,
          easing: "ease-out"
        }).catch(err => console.warn(err));
        
        // Notify parent component about routes
        if (onRouteCalculated) {
          onRouteCalculated(routeInfos);
        }
        
        // Update internal state
        setRouteResult(routeInfos);
        
      } catch (err) {
        console.error("Error calculating route:", err);
        
        // Even if there's an error with the graphics, still try to provide route information
        const destinationLng = parseFloat(destinationMarker.longitude);
        const destinationLat = parseFloat(destinationMarker.latitude);
        
        // Calculate distance using Haversine formula for more accuracy
        const R = 6371; // Radius of the Earth in km
        const dLat = (destinationLat - userLocation[1]) * Math.PI / 180;
        const dLon = (destinationLng - userLocation[0]) * Math.PI / 180;
        const a = 
          Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(userLocation[1] * Math.PI / 180) * Math.cos(destinationLat * Math.PI / 180) * 
          Math.sin(dLon/2) * Math.sin(dLon/2); 
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
        const distance = R * c;
        
        // Estimate durations
        const drivingDuration = Math.round(distance / 30 * 60);
        const walkingDuration = Math.round(distance / 5 * 60);
        
        const routeInfos: RouteInfo[] = [
          {
            name: "Driving",
            distance: Math.round(distance * 10) / 10,
            duration: drivingDuration
          },
          {
            name: "Walking",
            distance: Math.round(distance * 10) / 10,
            duration: walkingDuration
          }
        ];
        
        if (onRouteCalculated) {
          onRouteCalculated(routeInfos);
        }
        
        setRouteResult(routeInfos);
      }
    } catch (error) {
      console.error("Error in main route calculation:", error);
    } finally {
      setIsCalculatingRoute(false);
    }
  };
  
  // Method to calculate route to selected marker
  const navigateToSelectedMarker = () => {
    if (!selectedMarkerId || !userLocation) return;
    
    const selectedMarker = markers.find(marker => marker.id === selectedMarkerId);
    if (selectedMarker) {
      calculateRoute(selectedMarker);
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
        
        {/* Navigation button (only shown when a parking lot is selected and user location is available) */}
        {selectedMarkerId && userLocation && (
          <Button 
            variant="default" 
            size="icon" 
            className="rounded-md bg-blue-600 text-white hover:bg-blue-700 shadow-md" 
            onClick={navigateToSelectedMarker}
            disabled={isCalculatingRoute}
          >
            <Navigation className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      {/* Route calculation loading indicator */}
      {isCalculatingRoute && (
        <div className="absolute bottom-4 left-4 z-10 bg-white p-2 rounded-md shadow-md">
          <div className="flex items-center space-x-2">
            <div className="animate-spin h-4 w-4 border-t-2 border-blue-500"></div>
            <span className="text-sm">Calculating route...</span>
          </div>
        </div>
      )}
    </div>
  );
}