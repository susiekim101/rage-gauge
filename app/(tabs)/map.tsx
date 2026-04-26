import { BottomNav } from "@/components/bottom-nav";
import { db } from "@/src/config/firebase";
import { RAGE_COLORS, RageIncident } from "@/types/rage";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { collection, onSnapshot } from "firebase/firestore";
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
    timestamp: new Date("2026-04-24T13:09:00"),
    username: "susieekiim",
    decibels: 87,
  },
  {
    id: "2",
    latitude: 34.0725,
    longitude: -118.43,
    type: "swear",
    rageLevel: 5,
    timestamp: new Date("2026-04-24T15:30:00"),
    username: "ssharonn.c",
    decibels: 104,
  },
  {
    id: "3",
    latitude: 34.0612,
    longitude: -118.4601,
    type: "scream",
    rageLevel: 4,
    timestamp: new Date("2026-04-25T14:15:00"),
    username: "ronaldlu",
    decibels: 98,
  },
  {
    id: "4",
    latitude: 34.0784,
    longitude: -118.4501,
    type: "smack",
    rageLevel: 5,
    timestamp: new Date("2026-04-25T09:00:00"),
    username: "fionaxaria",
    decibels: 112,
  },
  {
    id: "5",
    latitude: 34.0844,
    longitude: -118.4421,
    type: "scream",
    rageLevel: 5,
    timestamp: new Date("2026-04-23T11:00:00"),
    username: "fionaxaria",
    decibels: 112,
  },
];

const CURRENT_USER = "fionaxaria";
const DAY_LABELS = ["S", "M", "T", "W", "R", "F", "S"];

function getWeekDays(incidents: RageIncident[]) {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    const active = incidents.some(
      (inc) =>
        inc.timestamp.getDate() === d.getDate() &&
        inc.timestamp.getMonth() === d.getMonth(),
    );
    return { day: DAY_LABELS[i], date: d.getDate(), active };
  });
}

export default function MapScreen() {
  const mapRef = useRef<MapView>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null,
  );
  const [incidents, setIncidents] = useState<RageIncident[]>([]);
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [showFriends, setShowFriends] = useState(false);

  const today = new Date();
  const dateHeader = `${today.getMonth() + 1}/${today.getDate()}`;
  const visibleIncidents = MOCK_INCIDENTS.filter((i) =>
    showFriends ? i.username !== CURRENT_USER : i.username === CURRENT_USER,
  );
  const week = getWeekDays(visibleIncidents);
  const filteredIncidents = selectedDate
    ? visibleIncidents.filter((i) => i.timestamp.getDate() === selectedDate)
    : visibleIncidents;

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
      const unsub = onSnapshot(collection(db, "incidents"), (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate() ?? new Date(),
        })) as RageIncident[];
        setIncidents(data);
      });
      return unsub;
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
        {filteredIncidents.map((incident) => (
          <Marker
            key={incident.id}
            coordinate={{
              latitude: incident.latitude,
              longitude: incident.longitude,
            }}
            pinColor={RAGE_COLORS[incident.rageLevel]}
          >
            <View style={{ alignItems: "center" }}>
              <View style={styles.markerBubble}>
                <View
                  style={[
                    styles.markerDot,
                    { backgroundColor: RAGE_COLORS[incident.rageLevel] },
                  ]}
                />
                <Text style={styles.markerTime}>
                  {incident.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </View>
              <View
                style={[
                  styles.markerPin,
                  { backgroundColor: RAGE_COLORS[incident.rageLevel] },
                ]}
              />
            </View>
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
      <View style={styles.weekStrip}>
        {week.map((item) => (
          <Pressable
            key={item.date}
            style={styles.weekDay}
            onPress={() =>
              setSelectedDate(selectedDate === item.date ? null : item.date)
            }
          >
            <View
              style={[styles.weekDot, item.active && styles.weekDotActive]}
            />
            <Text style={styles.weekDayLabel}>{item.day}</Text>
            <Text
              style={[
                styles.weekDateLabel,
                selectedDate === item.date && { color: "#F44336" },
              ]}
            >
              {item.date}
            </Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.dateHeader}>{dateHeader}</Text>
      <Pressable
        style={styles.toggleBtn}
        onPress={() => setShowFriends(!showFriends)}
      >
        <Text style={styles.toggleText}>{showFriends ? "friends" : "me"}</Text>
      </Pressable>
      <Pressable style={styles.locateBtn} onPress={centerOnMe}>
        <Ionicons name="locate" size={24} color="#fff" />
      </Pressable>
      <BottomNav />
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
    bottom: 210,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(0,0,0,0.8)",
    alignItems: "center",
    justifyContent: "center",
  },
  locateBtnText: { fontSize: 22 },
  toggleBtn: {
    position: "absolute",
    top: 60,
    left: 16,
    backgroundColor: "rgba(0,0,0,0.75)",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  toggleText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  dateHeader: {
    position: "absolute",
    top: 60,
    right: 16,
    color: "#000",
    fontSize: 40,
    fontWeight: "700",
  },
  markerBubble: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#333",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  markerTime: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },
  markerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  markerPin: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 3,
  },
  weekStrip: {
    position: "absolute",
    bottom: 130,
    left: 16,
    right: 16,
    backgroundColor: "rgba(0,0,0,0.75)",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  weekDay: {
    alignItems: "center",
    gap: 4,
  },
  weekDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#555",
  },
  weekDotActive: {
    backgroundColor: "#F44336",
  },
  weekDayLabel: {
    color: "#aaa",
    fontSize: 11,
    fontWeight: "600",
  },
  weekDateLabel: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
});
