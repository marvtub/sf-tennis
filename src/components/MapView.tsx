"use client";

import { useState, useCallback } from "react";
import Map, { Marker, NavigationControl } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import type { CourtLocation, TravelTime, Friend } from "@/types";
import type { UserLocation } from "@/hooks/useUserLocation";
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
}: MapViewProps) {
  const [viewState, setViewState] = useState({
    latitude: userLocation.lat,
    longitude: userLocation.lng,
    zoom: 12.5,
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
