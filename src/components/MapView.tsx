"use client";

import { useState, useCallback } from "react";
import Map, { Marker, NavigationControl } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { DEFAULT_LAT, DEFAULT_LNG } from "@/lib/constants";
import type { CourtLocation, TravelTime } from "@/types";
import { CourtPin, HomePin } from "./CourtPin";
import { TravelBadgeMini } from "./TravelBadge";

interface MapViewProps {
  courts: CourtLocation[];
  selectedId: string | null;
  onSelectCourt: (id: string | null) => void;
  travelTimes: Map<string, TravelTime>;
  mapboxToken: string;
}

export function MapView({
  courts,
  selectedId,
  onSelectCourt,
  travelTimes,
  mapboxToken,
}: MapViewProps) {
  const [viewState, setViewState] = useState({
    latitude: DEFAULT_LAT,
    longitude: DEFAULT_LNG,
    zoom: 12.5,
  });

  const handleMapClick = useCallback(() => {
    onSelectCourt(null);
  }, [onSelectCourt]);

  return (
    <Map
      {...viewState}
      onMove={(evt) => setViewState(evt.viewState)}
      onClick={handleMapClick}
      mapboxAccessToken={mapboxToken}
      mapStyle="mapbox://styles/mapbox/light-v11"
      style={{ width: "100%", height: "100%" }}
      reuseMaps
    >
      <NavigationControl position="top-right" />

      {/* Home marker */}
      <Marker latitude={DEFAULT_LAT} longitude={DEFAULT_LNG} anchor="center">
        <HomePin />
      </Marker>

      {/* Court markers */}
      {courts.map((loc) => (
        <Marker
          key={loc.id}
          latitude={loc.lat}
          longitude={loc.lng}
          anchor="center"
          onClick={(e) => {
            e.originalEvent.stopPropagation();
            onSelectCourt(loc.id);
          }}
        >
          <div className="relative">
            <CourtPin
              location={loc}
              isSelected={selectedId === loc.id}
              onClick={() => onSelectCourt(loc.id)}
            />
            <TravelBadgeMini travelTime={travelTimes.get(loc.id)} />
          </div>
        </Marker>
      ))}
    </Map>
  );
}
