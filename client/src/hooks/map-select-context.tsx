import React, { createContext, useContext, useState, ReactNode, useCallback } from "react";

interface MapSelectContextProps {
  isSelecting: boolean;
  startSelecting: (onSelect: (lat: number, lng: number) => void) => void;
  stopSelecting: () => void;
  onSelect: ((lat: number, lng: number) => void) | null;
}

const MapSelectContext = createContext<MapSelectContextProps | undefined>(undefined);

export function MapSelectProvider({ children }: { children: ReactNode }) {
  const [isSelecting, setIsSelecting] = useState(false);
  const [onSelect, setOnSelect] = useState<((lat: number, lng: number) => void) | null>(null);

  const startSelecting = useCallback((cb: (lat: number, lng: number) => void) => {
    setIsSelecting(true);
    setOnSelect(() => cb);
  }, []);

  const stopSelecting = useCallback(() => {
    setIsSelecting(false);
    setOnSelect(null);
  }, []);

  return (
    <MapSelectContext.Provider value={{ isSelecting, startSelecting, stopSelecting, onSelect }}>
      {children}
    </MapSelectContext.Provider>
  );
}

export function useMapSelect() {
  const ctx = useContext(MapSelectContext);
  if (!ctx) throw new Error("useMapSelect must be used within a MapSelectProvider");
  return ctx;
}
