import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { LinearGradient } from "expo-linear-gradient";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MapView from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const WEEK_DAYS = [
  { date: 26, active: true },
  { date: 27, active: true },
  { date: 28, active: false },
  { date: 29, active: false },
  { date: 30, active: true },
  { date: 1, active: false, today: true },
  { date: 2, active: false },
];

const GRAPH_DATA = [2, 4, 1, 5, 3, 5, 4, 2, 4, 3];

function MiniGraph() {
  const W = 120;
  const H = 60;
  const max = 5;
  const stepX = W / (GRAPH_DATA.length - 1);
  const points = GRAPH_DATA.map((v, i) => ({
    x: i * stepX,
    y: H - (v / max) * H,
  }));

  return (
    <View style={{ width: W, height: H }}>
      {points.slice(0, -1).map((p, i) => {
        const next = points[i + 1];
        const dx = next.x - p.x;
        const dy = next.y - p.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        return (
          <View
            key={i}
            style={{
              position: "absolute",
              left: p.x,
              top: p.y,
              width: length,
              height: 2,
              backgroundColor: "#7BA7C9",
              borderRadius: 1,
              transformOrigin: "left center",
              transform: [{ rotate: `${angle}deg` }],
            }}
          />
        );
      })}
    </View>
  );
}

function RageMeter() {
  const W = 260;
  const T = 14;
  const R = W / 2;

  return (
    <View style={{ width: W, height: R + 16, alignItems: "center" }}>
      {/* Gray track */}
      <View style={{ width: W, height: R, overflow: "hidden" }}>
        <View
          style={{
            width: W,
            height: W,
            borderRadius: R,
            borderWidth: T,
            borderColor: "#e0e0e0",
          }}
        />
      </View>

      {/* Yellow fill — left half */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: R,
          height: R,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            width: W,
            height: W,
            borderRadius: R,
            borderWidth: T,
            borderColor: "#D4B84A",
          }}
        />
      </View>

      {/* Needle */}
      <View
        style={{
          position: "absolute",
          bottom: 10,
          left: R - 2,
          width: 4,
          height: R - 24,
          backgroundColor: "#E53935",
          borderRadius: 2,
          transformOrigin: "bottom center",
          transform: [{ rotate: "-28deg" }],
        }}
      />

      {/* Center dot */}
      <View
        style={{
          position: "absolute",
          bottom: 6,
          left: R - 8,
          width: 16,
          height: 16,
          borderRadius: 8,
          backgroundColor: "#ccc",
        }}
      />
    </View>
  );
}

export default function HomeDash() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      {/* Gradient bleeds from top of screen, fades to white */}
      <LinearGradient
        colors={["#DAFF08", "#DAFF0840", "#fff0"]}
        locations={[0, 0.5, 1]}
        style={[styles.gradientBg, { height: insets.top + 200 }]}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top, paddingBottom: 100 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Drive Recap — sits on top of the gradient, no card */}
        <View style={styles.recapSection}>
          <View style={styles.recapText}>
            <Text style={styles.recapTitle}>Drive Recap</Text>
            <Text style={styles.recapDate}>4/26–5/2</Text>
          </View>
          <Image
            source={require("@/assets/images/anger.png")}
            style={styles.angerImg}
            resizeMode="contain"
          />
        </View>

        {/* Gauge */}
        <View style={styles.gaugeCard}>
          <RageMeter />
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={[styles.statDot, { backgroundColor: "#7B9EC9" }]} />
            <Text style={styles.statNum}>3</Text>
            <Text style={styles.statLabel}>honks</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statDot, { backgroundColor: "#D4B84A" }]} />
            <Text style={styles.statNum}>1</Text>
            <Text style={styles.statLabel}>slams</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statDot, { backgroundColor: "#C49BBB" }]} />
            <Text style={styles.statNum}>4</Text>
            <Text style={styles.statLabel}>outbursts</Text>
          </View>
        </View>

        {/* Weekly Activity */}
        <Text style={styles.sectionTitle}>Weekly Activity</Text>
        <View style={styles.weekCard}>
          {/* Date strip */}
          <View style={styles.dateStrip}>
            {WEEK_DAYS.map((d) => (
              <View key={d.date} style={styles.dateItem}>
                {d.today ? (
                  <>
                    <View style={{ height: 36 }} />
                    <View style={styles.todayCircle}>
                      <Text style={styles.todayNum}>{d.date}</Text>
                    </View>
                  </>
                ) : (
                  <>
                    <View
                      style={[
                        styles.activityBar,
                        !d.active && styles.activityBarEmpty,
                      ]}
                    />
                    <Text style={styles.dateNum}>{d.date}</Text>
                  </>
                )}
              </View>
            ))}
          </View>

          {/* Map + Graph thumbnails */}
          <View style={styles.thumbRow}>
            <Pressable
              style={styles.thumbCard}
              onPress={() => router.push("/(tabs)/map")}
            >
              <Text style={styles.thumbLabel}>Map</Text>
              <View style={styles.mapWrapper}>
                <MapView
                  style={StyleSheet.absoluteFillObject}
                  initialRegion={{
                    latitude: 34.0689,
                    longitude: -118.4452,
                    latitudeDelta: 0.08,
                    longitudeDelta: 0.08,
                  }}
                  scrollEnabled={false}
                  zoomEnabled={false}
                  pitchEnabled={false}
                  rotateEnabled={false}
                  pointerEvents="none"
                />
              </View>
            </Pressable>

            <Pressable
              style={styles.thumbCard}
              onPress={() => router.push("/(tabs)/graph")}
            >
              <Text style={styles.thumbLabel}>Graph</Text>
              <View style={styles.graphWrapper}>
                <MiniGraph />
              </View>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* Custom bottom bar */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 8 }]}>
        <Pressable style={styles.bottomHome}>
          <Ionicons name="home" size={22} color="#fff" />
        </Pressable>
        <Pressable
          style={styles.startDriveBtn}
          onPress={() => router.push("/(tabs)/driving")}
        >
          <Ionicons name="car" size={18} color="#fff" />
          <Text style={styles.startDriveText}>Start Drive</Text>
        </Pressable>
        <Pressable
          style={styles.bottomProfile}
          onPress={() => router.push("/profile")}
        >
          <Image
            source={require("@/assets/images/profile.png")}
            style={styles.profileImg}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scroll: { flex: 1, backgroundColor: "transparent" },
  content: {
    paddingHorizontal: 16,
    gap: 12,
  },
  pageLabel: {
    color: "#aaa",
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 2,
  },

  // Gradient — absolute, full bleed from top
  gradientBg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },

  // Drive recap — no card, content sits on gradient
  recapSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    minHeight: 140,
  },
  recapText: { gap: 2 },
  recapTitle: {
    color: "#222",
    fontSize: 15,
    fontWeight: "700",
  },
  recapDate: {
    color: "#111",
    fontSize: 36,
    fontWeight: "800",
    fontStyle: "italic",
    lineHeight: 42,
  },
  angerImg: {
    width: 120,
    height: 120,
    marginBottom: -20,
  },

  // Gauge
  gaugeCard: {
    backgroundColor: "#f5f5f5",
    borderRadius: 20,
    paddingVertical: 24,
    alignItems: "center",
  },

  // Stats
  statsRow: {
    flexDirection: "row",
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    borderRadius: 16,
    padding: 14,
    gap: 4,
  },
  statDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 8,
  },
  statNum: {
    color: "#111",
    fontSize: 26,
    fontWeight: "800",
  },
  statLabel: {
    color: "#666",
    fontSize: 12,
  },

  // Weekly Activity
  sectionTitle: {
    color: "#111",
    fontSize: 17,
    fontWeight: "800",
    marginTop: 4,
  },
  weekCard: {
    backgroundColor: "#f5f5f5",
    borderRadius: 20,
    padding: 16,
    gap: 14,
  },
  dateStrip: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: 4,
  },
  dateItem: {
    alignItems: "center",
    gap: 6,
  },
  activityBar: {
    width: 30,
    height: 40,
    borderRadius: 6,
    backgroundColor: "#2d3a4a",
  },
  activityBarEmpty: {
    backgroundColor: "#ddd",
  },
  dateNum: {
    color: "#333",
    fontSize: 12,
    fontWeight: "600",
  },
  todayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#2d3a4a",
    alignItems: "center",
    justifyContent: "center",
  },
  todayNum: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },

  // Thumbnails
  thumbRow: {
    flexDirection: "row",
    gap: 10,
  },
  thumbCard: {
    flex: 1,
    backgroundColor: "#e8eef5",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#d0d8e8",
    gap: 8,
    minHeight: 120,
  },
  thumbLabel: {
    color: "#111",
    fontSize: 14,
    fontWeight: "700",
  },
  mapWrapper: {
    flex: 1,
    borderRadius: 10,
    overflow: "hidden",
    minHeight: 80,
  },
  graphWrapper: {
    flex: 1,
    justifyContent: "flex-end",
    paddingTop: 8,
  },

  // Bottom bar
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#1a1a1a",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  bottomHome: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  startDriveBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#2d3a4a",
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 28,
  },
  startDriveText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  bottomProfile: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: "hidden",
  },
  profileImg: {
    width: 44,
    height: 44,
  },
});
