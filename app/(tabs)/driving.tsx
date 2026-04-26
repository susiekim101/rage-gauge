import React, { useCallback, useRef, useState } from "react";
import {
  Animated,
  Image,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as ScreenOrientation from "expo-screen-orientation";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import CarPlay from "@/assets/images/carplay-bg.png";
import CarIcon from "@/assets/images/car-icon.png";
import EliPfp from "@/assets/images/eli-pfp.png";
import { IconSymbol } from "@/components/ui/icon-symbol";

type DrivingState = "idle" | "countdown" | "driving" | "rage";

const LOADING_BAR_WIDTH = 220;

export default function DrivingScreen() {
  const router = useRouter();
  const [state, setState] = useState<DrivingState>("idle");
  const [visibleCount, setVisibleCount] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useFocusEffect(
    useCallback(() => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
      return () => {
        ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
        timers.current.forEach(clearTimeout);
      };
    }, [])
  );

  const handleStart = () => {
    timers.current.forEach(clearTimeout);
    progressAnim.setValue(0);
    setVisibleCount(1);
    setState("countdown");

    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 3000,
      useNativeDriver: false,
    }).start();

    timers.current = [
      setTimeout(() => setVisibleCount(2), 1000),
      setTimeout(() => setVisibleCount(3), 2000),
      setTimeout(() => setState("rage"), 3000),
    ];
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, LOADING_BAR_WIDTH],
  });

  const getBreatheText = () => {
    let text = "Breathe in 1..";
    if (visibleCount >= 2) text += " 2...";
    if (visibleCount >= 3) text += " 3..";
    return text;
  };

  return (
    <ImageBackground source={CarPlay} style={styles.container} resizeMode="cover">
      <Pressable style={styles.homeBtn} onPress={() => router.replace("/")}>
        <IconSymbol name="house.fill" size={20} color="#fff" />
      </Pressable>

      {(state === "idle" || state === "countdown") && (
        <View style={styles.content}>
          <Text style={styles.greeting}>
            {state === "idle" ? (
              <>
                {"Have a safe drive, "}
                <Text style={styles.greetingName}>Fiona</Text>
              </>
            ) : (
              getBreatheText()
            )}
          </Text>
          {state === "idle" ? (
            <Pressable style={styles.startBtn} onPress={handleStart}>
              <Text style={styles.startBtnText}>▶ Start</Text>
            </Pressable>
          ) : (
            <View style={styles.loadingBar}>
              <Animated.View style={[styles.loadingFill, { width: progressWidth }]} />
            </View>
          )}
        </View>
      )}

      {state === "driving" && (
        <View style={styles.content}>
          <Text style={styles.greeting}>Breathe in 1...2...3</Text>
          <Pressable style={styles.startBtn} onPress={() => setState("rage")}>
            <Text style={styles.startBtnText}>▶ Start</Text>
          </Pressable>
        </View>
      )}

      {state === "rage" && (
        <View style={styles.rageContent}>
          <View style={styles.rageLeft}>
            <View style={styles.waveform}>
              {Array.from({ length: 44 }).map((_, i) => {
                const mid = 22;
                const dist = Math.abs(i - mid) / mid;
                const envelope = 1 - dist * 0.6;
                return (
                  <View
                    key={i}
                    style={[styles.waveBar, { height: Math.max(6, envelope * (40 + Math.random() * 70)) }]}
                  />
                );
              })}
            </View>
            <View style={styles.pfpWrapper}>
              <Image source={EliPfp} style={styles.pfpImg} />
            </View>
          </View>

          <View style={styles.rageRight}>
            <View style={styles.etaInfo}>
              <Text style={styles.arrivingLabel}>Arriving at</Text>
              <Text style={styles.arrivingTime}>9:41</Text>
              <Text style={styles.arrivingMins}>9 mins left</Text>
              <View style={styles.progressBar}>
                <View style={styles.progressFill} />
              </View>
            </View>
            <View style={styles.carPanel}>
              <Image source={CarIcon} style={styles.carIconImg} />
            </View>
          </View>
        </View>
      )}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  homeBtn: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  label: {
    position: "absolute",
    top: 16,
    left: 16,
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    opacity: 0.7,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
  },
  greeting: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
    paddingHorizontal: 32,
  },
  greetingName: {
    fontStyle: "italic",
    fontWeight: "400",
  },
  startBtn: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 40,
    paddingVertical: 16,
    paddingHorizontal: 60,
  },
  startBtnText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  loadingBar: {
    width: LOADING_BAR_WIDTH,
    height: 52,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 40,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  loadingFill: {
    height: "100%",
    backgroundColor: "rgba(255,255,255,0.75)",
    borderRadius: 40,
  },

  // rage state
  rageContent: {
    flex: 1,
    flexDirection: "row",
  },
  rageLeft: {
    flex: 1,
    padding: 20,
    justifyContent: "space-between",
  },
  waveform: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  waveBar: {
    width: 3,
    backgroundColor: "#fff",
    borderRadius: 2,
    opacity: 0.85,
  },
  pfpWrapper: {
    alignSelf: "flex-start",
  },
  carIconImg: {
    width: 150,
    height: 150,
    resizeMode: "contain",
  },
  rageRight: {
    width: 210,
    justifyContent: "space-between",
    padding: 20,
  },
  etaInfo: {
    gap: 2,
  },
  arrivingLabel: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  arrivingTime: {
    color: "#fff",
    fontSize: 56,
    fontWeight: "800",
    lineHeight: 60,
  },
  arrivingMins: {
    color: "#fff",
    fontSize: 14,
    opacity: 0.75,
  },
  progressBar: {
    height: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 2,
    marginTop: 8,
  },
  progressFill: {
    width: "20%",
    height: 4,
    backgroundColor: "#CDDC39",
    borderRadius: 2,
  },
  carPanel: {
    // backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  pfpImg: {
    width: 200,
    height: 200,
  },
});
