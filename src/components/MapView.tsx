"use client";

import { useState, useCallback } from "react";
import Map, { Marker, NavigationControl } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import type { CourtLocation, TravelTime, Friend } from "@/types";
import type { UserLocation } from "@/hooks/useUserLocation";
import type { CityId } from "@/lib/constants";
import { CITIES, DEFAULT_CITY } from "@/lib/constants";
import { CourtPin, HomePin, FriendPin } from "./CourtPin";
import { TravelBadgeMini } from "./TravelBadge";

interface MapViewProps {
  courts: CourtLocation[];
  friends: Friend[];
  favourites: Set<string>;
  selectedId: string | null;
  onSelectCourt: (id: string | null) => void;
  travelTimes: Map<string, TravelTime>;
  mapboxToken: string;
  userLocation: UserLocation;
  city: CityId;
}

export function MapView({
  courts,
  friends,
  favourites,
  selectedId,
  onSelectCourt,
  travelTimes,
  mapboxToken,
  userLocation,
  city,
}: MapViewProps) {
  const cityConfig = CITIES[city] ?? CITIES[DEFAULT_CITY];
  const [viewState, setViewState] = useState({
    latitude: userLocation.isDefault ? cityConfig.lat : userLocation.lat,
    longitude: userLocation.isDefault ? cityConfig.lng : userLocation.lng,
    zoom: cityConfig.zoom,
  });

  // Re-center when user location resolves from geolocation
  const [hasCentered, setHasCentered] = useState(userLocation.isDefault ? false : true);
  if (!hasCentered && !userLocation.isDefault) {
    setViewState((prev) => ({
      ...prev,
      latitude: userLocation.lat,
      longitude: userLocation.lng,
    }));
    setHasCentered(true);
  }

  // Re-center when city changes
  const [lastCity, setLastCity] = useState(city);
  if (city !== lastCity) {
    const c = CITIES[city] ?? CITIES[DEFAULT_CITY];
    setViewState((prev) => ({
      ...prev,
      latitude: c.lat,
      longitude: c.lng,
      zoom: c.zoom,
    }));
    setLastCity(city);
  }

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

      {/* User location marker */}
      <Marker latitude={userLocation.lat} longitude={userLocation.lng} anchor="center">
        <HomePin />
      </Marker>

      {/* Friend markers */}
      {friends.map((friend) => (
        <Marker
          key={`friend-${friend.id}`}
          latitude={friend.lat}
          longitude={friend.lng}
          anchor="center"
        >
          <div className="relative">
            <FriendPin emoji={friend.emoji} name={friend.name} />
            <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap px-1.5 py-0.5 bg-white/90 rounded text-[10px] font-medium text-pink-700 shadow-sm border">
              {friend.name}
            </div>
          </div>
        </Marker>
      ))}

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
              isFavourite={favourites.has(loc.id)}
              onClick={() => onSelectCourt(loc.id)}
            />
            <TravelBadgeMini travelTime={travelTimes.get(loc.id)} />
          </div>
        </Marker>
      ))}
    </Map>
  );
}
