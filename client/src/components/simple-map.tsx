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
        // Load only the basic modules first to ensure the map displays
        const [esriConfig, Map, MapView, GraphicsLayer, Graphic, Point] = await loadModules([
          "esri/config",
          "esri/Map",
          "esri/views/MapView",
          "esri/layers/GraphicsLayer",
          "esri/Graphic",
          "esri/geometry/Point"
        ], { css: false }); // CSS is already loaded above
        
        // Configure API key
        esriConfig.apiKey = "AAPTxy8BH1VEsoebNVZXo8HurJoE9iZ23rcLOCKv4LGb2GWB9M7bDmsO8WzljuTlRGXy2NEKygbZEcMd4NYx-tHCiaqPjA9ONpdFDEffSKRJagdQr7A8hbXH0idSNA9UeafnN_wTxbonRF19Xdfrr5hzrmSsNdTQgqz0QYvTa9I4hPrd_kqlnIACRyteJaKtWhQqqnu1uwmw-NRYPsktPk-gRzfNv-09JB2MXLhU3DiEELI";
        
        // We'll load the routing modules later when needed to avoid initialization issues
        
        // Configure map
        const map = new Map({
          basemap: "osm" // OpenStreetMap basemap is more reliable
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
      
      // Clear any previous route graphics
      if (graphicsLayer) {
        // Find and remove any previous route-related graphics
        const itemsToRemove: any[] = [];
        graphicsLayer.graphics.items.forEach((graphic: any) => {
          if (graphic.attributes && 
             (graphic.attributes.type === 'route-line' || 
              graphic.attributes.type === 'route-line-outline' || 
              graphic.attributes.type === 'route-arrow')) {
            itemsToRemove.push(graphic);
          }
        });
        
        // Remove the items outside of the forEach
        itemsToRemove.forEach(graphic => {
          graphicsLayer.remove(graphic);
        });
      }
      
      // Also clear the route graphics layer if it exists
      if (routeGraphicsLayer) {
        routeGraphicsLayer.removeAll();
      }
      
      // Use a better street-following route approach
      try {
        // Load required modules
        const [Point, Graphic, esriRequest] = await loadModules([
          "esri/geometry/Point",
          "esri/Graphic",
          "esri/request"
        ]);
          
        // Start and end locations
        const startLat = userLocation[1];
        const startLng = userLocation[0];
        const endLat = parseFloat(destinationMarker.latitude);
        const endLng = parseFloat(destinationMarker.longitude);
          
        console.log(`Calculating route from [${startLat},${startLng}] to [${endLat},${endLng}]`);
          
        // Make a direct request to the ArcGIS route service
        const routeUrl = "https://route-api.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World/solve";
          
        // Set up the request parameters
        const requestOptions = {
          query: {
            f: "json",
            token: "AAPTxy8BH1VEsoebNVZXo8HurJoE9iZ23rcLOCKv4LGb2GWB9M7bDmsO8WzljuTlRGXy2NEKygbZEcMd4NYx-tHCiaqPjA9ONpdFDEffSKRJagdQr7A8hbXH0idSNA9UeafnN_wTxbonRF19Xdfrr5hzrmSsNdTQgqz0QYvTa9I4hPrd_kqlnIACRyteJaKtWhQqqnu1uwmw-NRYPsktPk-gRzfNv-09JB2MXLhU3DiEELI",
            stops: `${startLng},${startLat};${endLng},${endLat}`,
            returnDirections: true,
            directionsLanguage: "vi",
            returnRoutes: true,
            returnZ: false,
            returnM: false
          }
        };
          
        try {
          // Make the request
          const response = await esriRequest(routeUrl, requestOptions);
          
          if (response.data && response.data.routes && response.data.routes.features && response.data.routes.features.length > 0) {
            // Get the route path
            const routePath = response.data.routes.features[0].geometry;
              
            // Create symbols for the route
            const outlineSymbol = {
              type: "simple-line",
              color: [255, 255, 255, 0.5],
              width: 9,
              style: "solid",
              cap: "round",
              join: "round"
            };
              
            const lineSymbol = {
              type: "simple-line",
              color: [0, 132, 255, 0.8],
              width: 6,
              style: "solid",
              cap: "round",
              join: "round"
            };
              
            // Create graphics for the route
            const outlineGraphic = new Graphic({
              geometry: routePath,
              symbol: outlineSymbol,
              attributes: { type: 'route-line-outline' }
            });
              
            const lineGraphic = new Graphic({
              geometry: routePath,
              symbol: lineSymbol,
              attributes: { type: 'route-line' }
            });
              
            // Add to the map
            if (routeGraphicsLayer) {
              routeGraphicsLayer.add(outlineGraphic);
              routeGraphicsLayer.add(lineGraphic);
            } else if (graphicsLayer) {
              graphicsLayer.add(outlineGraphic);
              graphicsLayer.add(lineGraphic);
            }
              
            // Get route info - extract attributes from the JSON response
            const routeAttributes = response.data.routes.features[0].attributes;
            const drivingDistance = routeAttributes.Total_Kilometers || 0;
            const drivingDuration = Math.round(routeAttributes.Total_Minutes) || 0;
            const walkingDuration = Math.round(drivingDistance / 5 * 60);
              
            // Create route info
            const routeInfos: RouteInfo[] = [
              {
                name: "Driving",
                distance: Math.round(drivingDistance * 10) / 10,
                duration: drivingDuration
              },
              {
                name: "Walking",
                distance: Math.round(drivingDistance * 10) / 10,
                duration: walkingDuration
              }
            ];
              
            // Zoom to show the route
            const routeExtent = response.data.routes.features[0].geometry.extent;
            if (routeExtent) {
              view.goTo(routeExtent, {
                duration: 1000,
                easing: "ease-out"
              });
            } else {
              // Fallback extent
              const extent = {
                xmin: Math.min(startLng, endLng),
                ymin: Math.min(startLat, endLat),
                xmax: Math.max(startLng, endLng),
                ymax: Math.max(startLat, endLat),
                spatialReference: view.spatialReference
              };
              view.goTo(extent, {
                duration: 1000,
                easing: "ease-out"
              });
            }
              
            // Notify parent component
            if (onRouteCalculated) {
              onRouteCalculated(routeInfos);
            }
              
            // Update state
            setRouteResult(routeInfos);
          } else {
            throw new Error("No route data found in response");
          }
        } catch (requestError) {
          console.error("Error making route request:", requestError);
          drawFallbackRoute(destinationMarker);
        }
      } catch (error) {
        console.error("Error loading modules:", error);
        // Fall back to direct line if routing service fails
        drawFallbackRoute(destinationMarker);
      }
    } catch (error) {
      console.error("Error in main route calculation:", error);
      // Final fallback - if everything else fails
      drawFallbackRoute(destinationMarker);
    } finally {
      setIsCalculatingRoute(false);
    }
  };
  
  // Fallback route drawing function (simple direct line)
  const drawFallbackRoute = async (destinationMarker: ParkingLotMarker) => {
    if (!userLocation || !view || !graphicsLayer) return;
    
    try {
      // Load necessary modules
      const [Graphic] = await loadModules(["esri/Graphic"]);
      
      // Create a simple line geometry
      const lineGeometry = {
        type: "polyline",
        paths: [[userLocation[0], userLocation[1]], 
                [parseFloat(destinationMarker.longitude), parseFloat(destinationMarker.latitude)]]
      };
      
      // Create symbols
      const outlineSymbol = {
        type: "simple-line",
        color: [255, 255, 255, 0.5], // White outline
        width: 9,
        style: "solid",
        cap: "round",
        join: "round"
      };
      
      const lineSymbol = {
        type: "simple-line",
        color: [0, 132, 255, 0.8], // Blue line
        width: 6,
        style: "dash",  // Dashed to indicate it's an approximate route
        cap: "round",
        join: "round"
      };
      
      // Create graphics
      const outlineGraphic = new Graphic({
        geometry: lineGeometry,
        symbol: outlineSymbol,
        attributes: { type: 'route-line-outline' }
      });
      
      const lineGraphic = new Graphic({
        geometry: lineGeometry,
        symbol: lineSymbol,
        attributes: { type: 'route-line' }
      });
      
      // Add to graphics layer
      graphicsLayer.add(outlineGraphic);
      graphicsLayer.add(lineGraphic);
      
      // Calculate approximate distance and duration
      // Calculate distance using Haversine formula for more accuracy
      const destLng = parseFloat(destinationMarker.longitude);
      const destLat = parseFloat(destinationMarker.latitude);
      const R = 6371; // Radius of the Earth in km
      const dLat = (destLat - userLocation[1]) * Math.PI / 180;
      const dLon = (destLng - userLocation[0]) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(userLocation[1] * Math.PI / 180) * Math.cos(destLat * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2); 
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
      const distance = R * c;
      
      // Estimate durations
      const drivingDuration = Math.round(distance / 30 * 60); // 30 km/h average
      const walkingDuration = Math.round(distance / 5 * 60);  // 5 km/h average
      
      const routeInfos: RouteInfo[] = [
        {
          name: "Driving (estimated)",
          distance: Math.round(distance * 10) / 10,
          duration: drivingDuration
        },
        {
          name: "Walking (estimated)",
          distance: Math.round(distance * 10) / 10,
          duration: walkingDuration
        }
      ];
      
      // Zoom to show both points
      const extent = {
        xmin: Math.min(userLocation[0], destLng),
        ymin: Math.min(userLocation[1], destLat),
        xmax: Math.max(userLocation[0], destLng),
        ymax: Math.max(userLocation[1], destLat),
        spatialReference: view.spatialReference
      };
      
      view.goTo(extent, {
        duration: 1000,
        easing: "ease-out"
      }).catch(err => console.warn('Map navigation error:', err));
      
      // Notify parent component
      if (onRouteCalculated) {
        onRouteCalculated(routeInfos);
      }
      
      // Update internal state
      setRouteResult(routeInfos);
      
    } catch (error) {
      console.error("Error in fallback route:", error);
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