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
  centerCoordinates = [106.7, 10.77], // Default to Ho Chi Minh City
  onRouteCalculated
}: SimpleMapProps) {
  const mapDiv = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Map state
  const [view, setView] = useState<any>(null);
  const [graphicsLayer, setGraphicsLayer] = useState<any>(null);
  const [routeGraphicsLayer, setRouteGraphicsLayer] = useState<any>(null);
  const [clickHandler, setClickHandler] = useState<any>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
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
        
        // Configure API key
        esriConfig.apiKey = "AAPTxy8BH1VEsoebNVZXo8HurJoE9iZ23rcLOCKv4LGb2GWB9M7bDmsO8WzljuTlRGXy2NEKygbZEcMd4NYx-tHCiaqPjA9ONpdFDEffSKRJagdQr7A8hbXH0idSNA9UeafnN_wTxbonRF19Xdfrr5hzrmSsNdTQgqz0QYvTa9I4hPrd_kqlnIACRyteJaKtWhQqqnu1uwmw-NRYPsktPk-gRzfNv-09JB2MXLhU3DiEELI";
        
        // Configure map with a basemap optimized for street navigation
        const map = new Map({
          basemap: "streets-vector" // Use the recommended streets-vector basemap
        });
        
        // Create graphics layer for markers
        const markersLayer = new GraphicsLayer();
        map.add(markersLayer);
        
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
        setGraphicsLayer(markersLayer);
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
              
              markersLayer.add(userLocationGraphic);
              
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
              
              markersLayer.add(labelGraphic);
              
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
      if (routeGraphicsLayer) {
        routeGraphicsLayer.removeAll();
      }
      
      // Make a direct route request with the ArcGIS API
      try {
        // Load required modules for routing
        const [Graphic, esriRequest] = await loadModules([
          "esri/Graphic",
          "esri/request" 
        ]);
        
        // Get coordinates
        const startLng = userLocation[0];
        const startLat = userLocation[1];
        const endLng = parseFloat(destinationMarker.longitude);
        const endLat = parseFloat(destinationMarker.latitude);
        
        console.log(`Calculating route from [${startLat},${startLng}] to [${endLat},${endLng}]`);
        
        // Direct request to the ArcGIS routing service
        const routeUrl = "https://route-api.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World/solve";
        
        const requestOptions = {
          query: {
            f: "json",
            token: "AAPTxy8BH1VEsoebNVZXo8HurJoE9iZ23rcLOCKv4LGb2GWB9M7bDmsO8WzljuTlRGXy2NEKygbZEcMd4NYx-tHCiaqPjA9ONpdFDEffSKRJagdQr7A8hbXH0idSNA9UeafnN_wTxbonRF19Xdfrr5hzrmSsNdTQgqz0QYvTa9I4hPrd_kqlnIACRyteJaKtWhQqqnu1uwmw-NRYPsktPk-gRzfNv-09JB2MXLhU3DiEELI",
            stops: `${startLng},${startLat};${endLng},${endLat}`,
            returnDirections: true,
            directionsLanguage: "vi", // Vietnamese
            returnRoutes: true,
            returnZ: false,
            returnM: false
          }
        };
        
        // Make the request
        const response = await esriRequest(routeUrl, requestOptions);
        
        // Check if we got a valid route
        if (response.data && 
            response.data.routes && 
            response.data.routes.features && 
            response.data.routes.features.length > 0) {
          
          // Get the route path from the response
          const route = response.data.routes.features[0];
          
          // Create line symbols for the route
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
            style: "solid",
            cap: "round",
            join: "round"
          };
          
          // Create graphics for the route
          const outlineGraphic = new Graphic({
            geometry: route.geometry,
            symbol: outlineSymbol,
            attributes: { type: "route-line-outline" }
          });
          
          const lineGraphic = new Graphic({
            geometry: route.geometry,
            symbol: lineSymbol,
            attributes: { type: "route-line" }
          });
          
          // Add graphics to the map
          routeGraphicsLayer.add(outlineGraphic);
          routeGraphicsLayer.add(lineGraphic);
          
          // Get route info from the response
          const routeAttribs = route.attributes;
          const drivingDistance = routeAttribs.Total_Kilometers;
          const drivingDuration = Math.round(routeAttribs.Total_Minutes);
          
          // Calculate walking time based on 5 km/h average walking speed
          const walkingDuration = Math.round(drivingDistance / 5 * 60);
          
          // Create route info objects
          const routeInfos: RouteInfo[] = [
            {
              name: "Xe máy / Ô tô",
              distance: Math.round(drivingDistance * 10) / 10,
              duration: drivingDuration
            },
            {
              name: "Đi bộ",
              distance: Math.round(drivingDistance * 10) / 10,
              duration: walkingDuration
            }
          ];
          
          // Safely zoom to show the route, handling potential geometry issues
          try {
            if (route.geometry && route.geometry.extent) {
              view.goTo({
                target: route.geometry,
                padding: {
                  top: 50,
                  bottom: 50,
                  left: 50,
                  right: 50
                }
              }, {
                duration: 1000,
                easing: "ease-out"
              });
            } else {
              // Fallback zooming to both points if extent isn't available
              view.goTo({
                target: [{
                  type: "point",
                  longitude: startLng,
                  latitude: startLat
                }, {
                  type: "point",
                  longitude: endLng,
                  latitude: endLat
                }],
                padding: {
                  top: 100,
                  bottom: 100,
                  left: 100,
                  right: 100
                }
              });
            }
          } catch (err) {
            console.warn("Error zooming to route:", err);
            // Fallback to simpler zoom method
            view.zoom = 13;
          }
          
          // Notify parent component about routes
          if (onRouteCalculated) {
            onRouteCalculated(routeInfos);
          }
          
          // Update state
          setRouteResult(routeInfos);
          
        } else {
          // Fallback to direct line if no route found
          console.warn("No route found in response");
          drawFallbackRoute(destinationMarker);
        }
        
      } catch (error) {
        console.error("Error calculating route with ArcGIS:", error);
        drawFallbackRoute(destinationMarker);
      }
      
    } catch (error) {
      console.error("Error in main route calculation:", error);
      drawFallbackRoute(destinationMarker);
    } finally {
      setIsCalculatingRoute(false);
    }
  };
  
  // Fallback route drawing (simple direct line)
  const drawFallbackRoute = async (destinationMarker: ParkingLotMarker) => {
    if (!userLocation || !view || !graphicsLayer) return;
    
    try {
      const [Graphic] = await loadModules(["esri/Graphic"]);
      
      // Get coordinates
      const startLng = userLocation[0];
      const startLat = userLocation[1];
      const endLng = parseFloat(destinationMarker.longitude);
      const endLat = parseFloat(destinationMarker.latitude);
      
      // Create a simple line geometry
      const lineGeometry = {
        type: "polyline",
        paths: [[[startLng, startLat], [endLng, endLat]]]
      };
      
      // Create line symbols
      const outlineSymbol = {
        type: "simple-line",
        color: [255, 255, 255, 0.5],
        width: 7,
        style: "dash"
      };
      
      const lineSymbol = {
        type: "simple-line",
        color: [0, 132, 255, 0.8],
        width: 4,
        style: "dash"
      };
      
      // Create graphics
      const outlineGraphic = new Graphic({
        geometry: lineGeometry,
        symbol: outlineSymbol,
        attributes: { type: "route-line-outline" }
      });
      
      const lineGraphic = new Graphic({
        geometry: lineGeometry,
        symbol: lineSymbol,
        attributes: { type: "route-line" }
      });
      
      // Add to the route layer
      if (routeGraphicsLayer) {
        routeGraphicsLayer.add(outlineGraphic);
        routeGraphicsLayer.add(lineGraphic);
      }
      
      // Calculate approximate distance and times
      const R = 6371; // Earth's radius in km
      const dLat = (endLat - startLat) * Math.PI / 180;
      const dLon = (endLng - startLng) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(startLat * Math.PI / 180) * Math.cos(endLat * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2); 
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
      const distance = R * c;
      
      // Calculate estimated times
      const drivingDuration = Math.round(distance / 30 * 60);
      const walkingDuration = Math.round(distance / 5 * 60);
      
      const routeInfos: RouteInfo[] = [
        {
          name: "Xe máy / Ô tô (ước tính)",
          distance: Math.round(distance * 10) / 10,
          duration: drivingDuration
        },
        {
          name: "Đi bộ (ước tính)",
          distance: Math.round(distance * 10) / 10,
          duration: walkingDuration
        }
      ];
      
      // Zoom to show both points
      const extent = {
        xmin: Math.min(startLng, endLng) - 0.001,
        ymin: Math.min(startLat, endLat) - 0.001,
        xmax: Math.max(startLng, endLng) + 0.001,
        ymax: Math.max(startLat, endLat) + 0.001,
        spatialReference: view.spatialReference
      };
      
      view.goTo(extent, {
        duration: 1000,
        easing: "ease-out"
      });
      
      // Notify parent component
      if (onRouteCalculated) {
        onRouteCalculated(routeInfos);
      }
      
      // Update state
      setRouteResult(routeInfos);
      
    } catch (error) {
      console.error("Error in fallback route:", error);
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
  
  // Expose the navigation method to the window object for external access
  if (typeof window !== 'undefined') {
    // @ts-ignore
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
            title="Tìm đường"
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
            <span className="text-sm">Đang tính toán tuyến đường...</span>
          </div>
        </div>
      )}
    </div>
  );
}