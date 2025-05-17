import { useEffect, useRef, useState } from "react";
import { Plus, Minus, Navigation } from "lucide-react";
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
    
    const initMap = async () => {
      try {
        // Load ArcGIS modules
        const [
          esriConfig, 
          Map, 
          MapView, 
          GraphicsLayer, 
          RouteTask, 
          RouteParameters,
          FeatureSet, 
          SimpleMarkerSymbol, 
          SimpleLineSymbol,
          Graphic,
          Point,
          Locator
        ] = await loadModules([
          "esri/config",
          "esri/Map",
          "esri/views/MapView",
          "esri/layers/GraphicsLayer",
          "esri/tasks/RouteTask",
          "esri/tasks/support/RouteParameters",
          "esri/tasks/support/FeatureSet",
          "esri/symbols/SimpleMarkerSymbol",
          "esri/symbols/SimpleLineSymbol",
          "esri/Graphic",
          "esri/geometry/Point",
          "esri/tasks/Locator"
        ]);
        
        // Create map with a basemap that doesn't require an API key
        const map = new Map({
          basemap: "osm" // OpenStreetMap basemap is free to use
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
          zoom: 13
        });
        
        // Create route task
        const route = new RouteTask({
          url: "https://route-api.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World"
        });
        
        // Wait for view to be ready
        await mapView.when();
        
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
              
              const userLocationSymbol = new SimpleMarkerSymbol({
                color: "blue",
                outline: {
                  color: "white",
                  width: 2
                }
              });
              
              const userLocationGraphic = new Graphic({
                geometry: userLocationPoint,
                symbol: userLocationSymbol,
                attributes: {
                  title: "Your Location",
                  type: "user-location"
                }
              });
              
              layer.add(userLocationGraphic);
            },
            (error) => {
              console.error("Error getting user location:", error);
            }
          );
        }
        
        // Save references
        setView(mapView);
        setGraphicsLayer(layer);
        setRouteGraphicsLayer(routeLayer);
        setRouteTask(route);
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
  
  // Calculate route between user location and selected parking lot
  const calculateRoute = async (destinationMarker: ParkingLotMarker) => {
    if (!userLocation || !view) {
      console.error("Cannot calculate route: missing user location or map view");
      return;
    }
    
    try {
      setIsCalculatingRoute(true);
      
      // Check if we have access to routing features
      const hasRoutingModules = routeTask && routeGraphicsLayer;
      
      if (!hasRoutingModules) {
        console.log("Routing modules not available, using fallback calculation");
        
        // Create a simple direct line if ArcGIS routing is not available
        try {
          const [Point, Graphic, SimpleLineSymbol] = await loadModules([
            "esri/geometry/Point",
            "esri/Graphic",
            "esri/symbols/SimpleLineSymbol"
          ]);
          
          // Clear any previous graphics if the layer exists
          if (graphicsLayer) {
            // Find and remove any previous route lines
            graphicsLayer.graphics.forEach((graphic: any) => {
              if (graphic.attributes && graphic.attributes.type === 'route-line') {
                graphicsLayer.remove(graphic);
              }
            });
          }
          
          // Create start and end points
          const startPoint = {
            type: "point",
            longitude: userLocation[0],
            latitude: userLocation[1]
          };
          
          const endPoint = {
            type: "point",
            longitude: parseFloat(destinationMarker.longitude),
            latitude: parseFloat(destinationMarker.latitude)
          };
          
          // Create a simple line symbol
          const lineSymbol = {
            type: "simple-line",
            color: [0, 0, 255, 0.8],
            width: 4
          };
          
          // Create a polyline geometry between the two points
          const polyline = {
            type: "polyline",
            paths: [
              [userLocation[0], userLocation[1]],
              [parseFloat(destinationMarker.longitude), parseFloat(destinationMarker.latitude)]
            ]
          };
          
          // Create a graphic for the route line
          const routeGraphic = new Graphic({
            geometry: polyline,
            symbol: lineSymbol,
            attributes: { type: 'route-line' }
          });
          
          // Add the graphic to the map
          if (graphicsLayer) {
            graphicsLayer.add(routeGraphic);
          }
          
          // Calculate straight-line distance
          const dx = parseFloat(destinationMarker.longitude) - userLocation[0];
          const dy = parseFloat(destinationMarker.latitude) - userLocation[1];
          
          // Convert to kilometers (very rough approximation)
          const distance = Math.sqrt(dx * dx + dy * dy) * 111.32; // 1 degree ≈ 111.32 km at the equator
          
          // Estimate duration (assuming average speed of 30 km/h)
          const duration = Math.round(distance / 30 * 60);
          
          // Create a simplified route info
          const routeInfos: RouteInfo[] = [
            {
              name: "Direct Route",
              distance: Math.round(distance * 10) / 10,
              duration: duration
            }
          ];
          
          // Notify parent component about routes
          if (onRouteCalculated) {
            onRouteCalculated(routeInfos);
          }
          
          // Update internal state
          setRouteResult(routeInfos);
          
          return;
        } catch (err) {
          console.error("Error in fallback route calculation:", err);
        }
      } else {
        // Full routing implementation with ArcGIS routing service
        try {
          // Load necessary modules
          const [Point, Graphic, RouteParameters, FeatureSet, SimpleLineSymbol] = await loadModules([
            "esri/geometry/Point",
            "esri/Graphic",
            "esri/tasks/support/RouteParameters",
            "esri/tasks/support/FeatureSet",
            "esri/symbols/SimpleLineSymbol"
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
          
          // Create feature set for stops
          const stopsFeatureSet = new FeatureSet();
          stopsFeatureSet.features = [
            new Graphic({ geometry: startPoint }),
            new Graphic({ geometry: endPoint })
          ];
          
          // Set up route parameters
          const routeParams = new RouteParameters({
            stops: stopsFeatureSet,
            returnDirections: true,
            returnRoutes: true,
            returnStops: true,
            directionsLanguage: "vi",  // Vietnamese language for directions
            outSpatialReference: view.spatialReference
          });
          
          // Solve the route
          const results = await routeTask.solve(routeParams);
          const routes = results.routeResults;
          
          if (routes.length > 0) {
            // Clear previous routes
            routeGraphicsLayer.removeAll();
            
            // Process results into route info objects
            const routeInfos: RouteInfo[] = [];
            
            routes.forEach((routeResult: any, index: number) => {
              // Create a line symbol for the route
              const routeSymbol = new SimpleLineSymbol({
                color: index === 0 ? [0, 0, 255, 0.8] : [128, 128, 128, 0.8], // blue for main route, gray for alternatives
                width: index === 0 ? 4 : 2
              });
              
              // Create a graphic for the route
              const routeGraphic = new Graphic({
                geometry: routeResult.route.geometry,
                symbol: routeSymbol
              });
              
              // Add route to the layer
              routeGraphicsLayer.add(routeGraphic);
              
              // Extract route info
              const routeInfo: RouteInfo = {
                name: `Route ${index + 1}`,
                distance: Math.round(routeResult.route.attributes.Total_Kilometers * 10) / 10, // km to 1 decimal place
                duration: Math.round(routeResult.route.attributes.Total_Minutes) // minutes rounded to nearest integer
              };
              
              routeInfos.push(routeInfo);
            });
            
            // Zoom to show the entire route
            view.goTo(routes[0].route.geometry.extent.expand(1.5));
            
            // Notify parent component about routes
            if (onRouteCalculated) {
              onRouteCalculated(routeInfos);
            }
            
            // Update internal state
            setRouteResult(routeInfos);
          } else {
            console.error("No routes found");
          }
        } catch (error) {
          console.error("Error in ArcGIS route calculation:", error);
          
          // Fallback to simplified calculation if ArcGIS routing fails
          calculateRoute(destinationMarker);
        }
      }
    } catch (error) {
      console.error("Error calculating route:", error);
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