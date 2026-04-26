import { auth, db } from "../config/firebase";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!email || !password) return;
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const username = email.split("@")[0];
      await setDoc(doc(db, "users", userCredential.user.uid), {
        displayName: username,
        searchName: username.toLowerCase(),
        email,
        photoUrl: null,
      });
      router.replace("/(tabs)");
    } catch (error) {
      Alert.alert("Sign Up Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      router.replace("/(tabs)");
      try {
        const userRef = doc(db, "users", userCredential.user.uid);
        const snap = await getDoc(userRef);
        if (!snap.exists()) {
          const username = email.split("@")[0];
          await setDoc(userRef, {
            displayName: username,
            searchName: username.toLowerCase(),
            email,
            photoUrl: null,
          });
        }
      } catch (e) {
        console.warn("Firestore backfill skipped:", e.message);
      }
    } catch (error) {
      Alert.alert("Login Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#DAFF08", "#DAFF0860", "#DAFF0800"]}
        style={styles.gradient}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.inner}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 40 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Branding */}
          <Image
            source={require("../../assets/images/anger.png")}
            style={styles.angerImg}
            resizeMode="contain"
          />
          <Text style={styles.appName}>Rage Gauge</Text>
          <Text style={styles.tagline}>Track your road rage, own your drive.</Text>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{isLogin ? "Log in" : "Sign up"}</Text>

            <View style={styles.inputGroup}>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#A0A19A"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
              />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#A0A19A"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <Pressable
              style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
              onPress={isLogin ? handleLogin : handleSignUp}
              disabled={loading}
            >
              <Text style={styles.primaryBtnText}>
                {loading ? "..." : isLogin ? "Log in" : "Create account"}
              </Text>
            </Pressable>

            <Pressable
              style={styles.switchBtn}
              onPress={() => setIsLogin(!isLogin)}
            >
              <Text style={styles.switchText}>
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <Text style={styles.switchLink}>
                  {isLogin ? "Sign up" : "Log in"}
                </Text>
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F8F5",
  },
  gradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 340,
  },
  inner: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 28,
    paddingBottom: 60,
    alignItems: "center",
  },
  angerImg: {
    width: 100,
    height: 100,
    marginBottom: 12,
  },
  appName: {
    fontSize: 40,
    fontWeight: "800",
    color: "#000",
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 14,
    color: "#68695F",
    marginTop: 6,
    marginBottom: 36,
    textAlign: "center",
  },
  card: {
    width: "100%",
    backgroundColor: "white",
    borderRadius: 28,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
    gap: 20,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111",
  },
  inputGroup: {
    gap: 12,
  },
  input: {
    backgroundColor: "rgba(228, 228, 228, 0.85)",
    borderRadius: 44,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 16,
    color: "#1a1a1a",
  },
  primaryBtn: {
    backgroundColor: "rgba(9, 9, 9, 0.85)",
    borderRadius: 44,
    paddingVertical: 17,
    alignItems: "center",
  },
  primaryBtnDisabled: {
    opacity: 0.5,
  },
  primaryBtnText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
  switchBtn: {
    alignItems: "center",
  },
  switchText: {
    fontSize: 14,
    color: "#A0A19A",
  },
  switchLink: {
    color: "#68695F",
    fontWeight: "700",
  },
});
