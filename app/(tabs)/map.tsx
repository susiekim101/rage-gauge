import { RAGE_COLORS, RageIncident } from "@/types/rage";
import * as Location from "expo-location";
import React, { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import MapView, { Callout, Marker } from "react-native-maps";

const MOCK_INCIDENTS: RageIncident[] = [
  {
    id: "1",
    latitude: 34.0939,
    longitude: -118.4452,
    type: "honk",
    rageLevel: 3,
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    username: "susieekiim",
    decibels: 87,
  },
  {
    id: "2",
    latitude: 34.0725,
    longitude: -118.43,
    type: "swear",
    rageLevel: 5,
    timestamp: new Date(Date.now() - 12 * 60 * 1000),
    username: "ssharonn.c",
    decibels: 104,
  },
  {
    id: "3",
    latitude: 34.0612,
    longitude: -118.4601,
    type: "scream",
    rageLevel: 4,
    timestamp: new Date(Date.now() - 2 * 60 * 1000),
    username: "ronaldlu",
    decibels: 98,
  },
  {
    id: "4",
    latitude: 34.0754,
    longitude: -118.4721,
    type: "smack",
    rageLevel: 5,
    timestamp: new Date(Date.now() - 8 * 60 * 1000),
    username: "fionaxaria",
    decibels: 112,
  },
];

export default function MapScreen() {
  const mapRef = useRef<MapView>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null,
  );

  function centerOnMe() {
    if (!location || !mapRef.current) return;
    mapRef.current.animateToRegion({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    });
  }

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);
    })();
  }, []);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        showsUserLocation
        initialRegion={{
          latitude: 34.0689,
          longitude: -118.4452,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
      >
        {MOCK_INCIDENTS.map((incident) => (
          <Marker
            key={incident.id}
            coordinate={{
              latitude: incident.latitude,
              longitude: incident.longitude,
            }}
            pinColor={RAGE_COLORS[incident.rageLevel]}
          >
            <Callout>
              <View style={styles.callout}>
                <Text style={styles.calloutTitle}>@{incident.username}</Text>
                <Text style={styles.calloutType}>
                  {incident.type.toUpperCase()}
                </Text>
                <Text
                  style={[
                    styles.calloutRage,
                    { color: RAGE_COLORS[incident.rageLevel] },
                  ]}
                >
                  Rage level: {incident.rageLevel}/5
                </Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>
      <Pressable style={styles.locateBtn} onPress={centerOnMe}>
        <Text style={styles.locateBtnText}>📍</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  callout: {
    backgroundColor: "#1a1a1a",
    borderRadius: 10,
    padding: 10,
    minWidth: 140,
  },
  calloutTitle: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
    marginBottom: 4,
  },
  calloutType: {
    color: "#aaa",
    fontSize: 12,
    marginBottom: 2,
  },
  calloutRage: {
    color: "#FF5722",
    fontWeight: "600",
    fontSize: 13,
  },
  locateBtn: {
    position: "absolute",
    right: 16,
    bottom: 120,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(0,0,0,0.8)",
    alignItems: "center",
    justifyContent: "center",
  },
  locateBtnText: { fontSize: 22 },
});
