import React from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

const DATA = [2, 4, 1, 5, 3, 5, 4, 2, 4, 3, 5, 2, 4, 5, 3];

function LineGraph({ data }: { data: number[] }) {
  const W = width - 64;
  const H = 180;
  const max = Math.max(...data);
  const stepX = W / (data.length - 1);

  const points = data.map((v, i) => ({
    x: i * stepX,
    y: H - (v / max) * H,
  }));

  return (
    <View style={{ width: W, height: H }}>
      {/* Grid lines */}
      {[0, 1, 2, 3, 4].map((i) => (
        <View
          key={i}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: (H / 4) * i,
            height: 1,
            backgroundColor: "#e8e8e8",
          }}
        />
      ))}

      {/* Line segments */}
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
              height: 2.5,
              backgroundColor: "#7BA7C9",
              borderRadius: 1,
              transformOrigin: "left center",
              transform: [{ rotate: `${angle}deg` }],
            }}
          />
        );
      })}

      {/* Dots */}
      {points.map((p, i) => (
        <View
          key={i}
          style={{
            position: "absolute",
            left: p.x - 4,
            top: p.y - 4,
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: "#5A8FBB",
          }}
        />
      ))}
    </View>
  );
}

export default function GraphScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <Text style={styles.title}>Rage Graph</Text>
      <Text style={styles.subtitle}>Weekly rage level trend</Text>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>This Week</Text>
        <LineGraph data={DATA} />
        <View style={styles.xLabels}>
          {["26", "27", "28", "29", "30", "1", "2"].map((d) => (
            <Text key={d} style={styles.xLabel}>{d}</Text>
          ))}
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statVal}>3.4</Text>
          <Text style={styles.statKey}>avg rage</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statVal}>5</Text>
          <Text style={styles.statKey}>peak level</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statVal}>7</Text>
          <Text style={styles.statKey}>incidents</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 24,
    gap: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111",
  },
  subtitle: {
    fontSize: 13,
    color: "#888",
    marginTop: -14,
  },
  card: {
    backgroundColor: "#f5f5f5",
    borderRadius: 20,
    padding: 20,
    gap: 16,
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666",
  },
  xLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 2,
  },
  xLabel: {
    fontSize: 11,
    color: "#999",
    fontWeight: "600",
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    gap: 4,
  },
  statVal: {
    fontSize: 26,
    fontWeight: "800",
    color: "#111",
  },
  statKey: {
    fontSize: 11,
    color: "#888",
  },
});
