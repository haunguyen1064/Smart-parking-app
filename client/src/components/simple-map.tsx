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
          },
          ui: {
            components: ["attribution"] // Remove default zoom buttons, keep only attribution
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
        const [Graphic, Point] = await loadModules([
          "esri/Graphic",
          "esri/geometry/Point"
        ]);
        
        // Clear existing markers (excluding user location)
        graphicsLayer.graphics.forEach((graphic: any) => {
          if (graphic.attributes && graphic.attributes.type !== 'user-location') {
            graphicsLayer.remove(graphic);
          }
        });
        
        // Add markers for each parking lot
        markers.forEach(marker => {
          // Create point
          const point = new Point({
            longitude: parseFloat(marker.longitude),
            latitude: parseFloat(marker.latitude)
          });
          
          // Create symbol based on selection state
          const markerSymbol = {
            type: "simple-marker",
            color: marker.isSelected ? [255, 0, 0] : [68, 50, 183], // Red if selected, purple otherwise
            outline: {
              color: [255, 255, 255],
              width: 2
            },
            size: marker.isSelected ? 14 : 10 // Larger if selected
          };
          
          // Create graphics for markers
          const markerGraphic = new Graphic({
            geometry: point,
            symbol: markerSymbol,
            attributes: {
              id: marker.id,
              name: marker.name,
              availableSpots: marker.availableSpots,
              totalSpots: marker.totalSpots,
              type: 'parking-marker'
            }
          });
          
          // Create text symbol for marker label
          const textSymbol = {
            type: "text",
            color: "black",
            haloColor: "white",
            haloSize: 1,
            text: marker.name,
            yoffset: -20,
            font: {
              size: 10,
              family: "sans-serif"
            }
          };
          
          // Create graphic for text label
          const textGraphic = new Graphic({
            geometry: point,
            symbol: textSymbol
          });
          
          // Add graphics to layer
          graphicsLayer.add(markerGraphic);
          graphicsLayer.add(textGraphic);
        });
        
        // Handle marker click events
        if (clickHandler) {
          clickHandler.remove();
        }
        
        const handler = view.on("click", (event: any) => {
          // Perform a hitTest to check if a marker was clicked
          view.hitTest(event).then((response: any) => {
            // Filter to only get graphics with the parking-marker type
            const markerResults = response.results?.filter(
              (result: any) => 
                result.graphic.attributes && 
                result.graphic.attributes.type === 'parking-marker'
            );
            
            if (markerResults && markerResults.length > 0) {
              const clickedMarker = markerResults[0].graphic.attributes;
              
              // Find the marker in our array to pass complete data
              const marker = markers.find(m => m.id === clickedMarker.id);
              if (marker) {
                onMarkerClick(marker);
              }
            }
          });
        });
        
        setClickHandler(handler);
        
        // If a marker is selected, center on it
        if (selectedMarkerId) {
          const selectedMarker = markers.find(marker => marker.id === selectedMarkerId);
          if (selectedMarker) {
            view.goTo({
              center: [parseFloat(selectedMarker.longitude), parseFloat(selectedMarker.latitude)],
              zoom: 17
            }, {
              duration: 1000,
              easing: "ease-out"
            });
          }
        }
        
      } catch (error) {
        console.error("Error updating markers:", error);
      }
    };
    
    updateMarkers();
  }, [markers, isLoading, graphicsLayer, view, selectedMarkerId, onMarkerClick]);
  
  // Handle zoom controls
  const handleZoomIn = () => {
    if (view) {
      const newZoom = view.zoom + 1;
      view.goTo({ zoom: newZoom }, { duration: 200 });
    }
  };
  
  const handleZoomOut = () => {
    if (view) {
      const newZoom = view.zoom - 1;
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
        
        // Clear any previous route graphics from all layers
        if (graphicsLayer) {
          // Find and remove any previous route-related graphics
          const itemsToRemove = [];
          graphicsLayer.graphics.items.forEach((graphic: any) => {
            if (graphic.attributes && 
               (graphic.attributes.type === 'route-line' || 
                graphic.attributes.type === 'route-arrow')) {
              itemsToRemove.push(graphic);
            }
          });
          
          // Remove the items outside of the forEach to avoid issues
          itemsToRemove.forEach(graphic => {
            graphicsLayer.remove(graphic);
          });
        }
        
        // Also clear the route graphics layer if it exists
        if (routeGraphicsLayer) {
          routeGraphicsLayer.removeAll();
        }
        
        // Create a more realistic curved path with intermediate points
        // This helps make the route look more like what you'd see in Google Maps
        const startLng = userLocation[0];
        const startLat = userLocation[1];
        const endLng = parseFloat(destinationMarker.longitude);
        const endLat = parseFloat(destinationMarker.latitude);
        
        // Generate a path with multiple points along a slightly curved route
        const paths = [];
        const numPoints = 15; // More points for a smoother curve
        
        for (let i = 0; i <= numPoints; i++) {
          const t = i / numPoints;
          // Linear interpolation for basic path
          let lng = startLng + t * (endLng - startLng);
          let lat = startLat + t * (endLat - startLat);
          
          // Add slight curve using sine function (if not a very short route)
          const dist = Math.sqrt(Math.pow(endLng - startLng, 2) + Math.pow(endLat - startLat, 2));
          if (dist > 0.01) { // Only add curve for longer routes
            // Calculate perpendicular offset (normal to the direct path)
            const perpFactor = Math.sin(t * Math.PI) * 0.005; // Controls curve amount
            const dirX = endLat - startLat;
            const dirY = -(endLng - startLng);
            const mag = Math.sqrt(dirX * dirX + dirY * dirY);
            if (mag > 0) {
              // Apply perpendicular offset
              lng += (dirY / mag) * perpFactor;
              lat += (dirX / mag) * perpFactor;
            }
          }
          
          paths.push([lng, lat]);
        }
        
        // Create the polyline with the curved path
        const polylineJson = {
          type: "polyline",
          paths: [paths]
        };
        
        // Create a more visually appealing line symbol for the route 
        // with a Google Maps style appearance
        const lineSymbol = {
          type: "simple-line",
          color: [0, 132, 255, 0.8], // Bright blue color similar to Google Maps
          width: 6,
          style: "solid",
          cap: "round",
          join: "round"
        };
        
        // Also create a secondary route outline for better visibility
        const outlineSymbol = {
          type: "simple-line",
          color: [255, 255, 255, 0.5], // White outline
          width: 9,
          style: "solid",
          cap: "round",
          join: "round"
        };
        
        // First create and add the white outline for the route (drawn underneath)
        const routeOutlineGraphic = new Graphic({
          geometry: polylineJson,
          symbol: outlineSymbol,
          attributes: { type: 'route-line-outline' }
        });
        
        // Then create the main blue route line
        const routeGraphic = new Graphic({
          geometry: polylineJson,
          symbol: lineSymbol,
          attributes: { type: 'route-line' }
        });
        
        // Add both graphics to the map - outline first so it appears underneath
        if (routeGraphicsLayer) {
          routeGraphicsLayer.add(routeOutlineGraphic);
          routeGraphicsLayer.add(routeGraphic);
        } else if (graphicsLayer) {
          // Fallback to the main graphics layer if route layer is not available
          graphicsLayer.add(routeOutlineGraphic);
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
        }).catch((err) => console.warn('Map navigation error:', err));
        
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
  
  // Method to calculate route to selected marker (exposed for external use)
  const navigateToSelectedMarker = () => {
    if (!selectedMarkerId || !userLocation) return;
    
    const selectedMarker = markers.find(marker => marker.id === selectedMarkerId);
    if (selectedMarker) {
      calculateRoute(selectedMarker);
    }
  };
  
  // Expose the navigation method
  // This makes it possible to call navigateToSelectedMarker from outside this component
  if (window) {
    // @ts-ignore - Add to window object for access from other components
    window.navigateToSelectedMarker = navigateToSelectedMarker;
  }

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
      <div className="absolute right-4 bottom-24 flex flex-col space-y-3 z-10">
        <Button 
          variant="default" 
          size="icon" 
          className="h-10 w-10 rounded-full bg-white text-gray-800 hover:bg-gray-100 shadow-lg border border-gray-200" 
          onClick={handleZoomIn}
        >
          <Plus className="h-5 w-5" />
        </Button>
        <Button 
          variant="default" 
          size="icon" 
          className="h-10 w-10 rounded-full bg-white text-gray-800 hover:bg-gray-100 shadow-lg border border-gray-200" 
          onClick={handleZoomOut}
        >
          <Minus className="h-5 w-5" />
        </Button>
        
        {/* Navigation button (only shown when a parking lot is selected and user location is available) */}
        {selectedMarkerId && userLocation && (
          <Button 
            variant="default" 
            size="icon" 
            className="h-10 w-10 rounded-full bg-blue-600 text-white hover:bg-blue-700 shadow-lg" 
            onClick={navigateToSelectedMarker}
            disabled={isCalculatingRoute}
            title="Navigate to this parking lot"
          >
            <Navigation className="h-5 w-5" />
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