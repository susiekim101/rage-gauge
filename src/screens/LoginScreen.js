// src/screens/LoginScreen.js
import { useRouter } from "expo-router";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useState } from "react";
import { Alert, Button, StyleSheet, Text, TextInput, View } from "react-native";
import { auth, db } from "../config/firebase";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignUp = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const username = email.split("@")[0];
      await setDoc(doc(db, "users", userCredential.user.uid), {
        displayName: username,
        searchName: username.toLowerCase(),
        email,
        photoUrl: null,
      });
      Alert.alert(
        "Success!",
        `Account created for ${userCredential.user.email}`,
      );
    } catch (error) {
      Alert.alert("Sign Up Error", error.message);
    }
  };

  const handleLogin = async () => {
    console.log("1. Login button pressed, email:", email);
    try {
      console.log("2. Calling signInWithEmailAndPassword...");
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      console.log("3. Auth success, uid:", userCredential.user.uid);

      const userRef = doc(db, "users", userCredential.user.uid);
      console.log("4. Calling getDoc...");
      const snap = await getDoc(userRef);
      console.log("5. getDoc done, exists:", snap.exists());

      if (!snap.exists()) {
        console.log("6. Creating Firestore user doc...");
        const username = email.split("@")[0];
        await setDoc(userRef, {
          displayName: username,
          searchName: username.toLowerCase(),
          email,
          photoUrl: null,
        });
        console.log("7. Firestore doc created");
      }

      console.log("8. Navigating to profile...");
      router.replace("/profile");
    } catch (error) {
      console.error("Login error:", error.code, error.message);
      Alert.alert("Login Error", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Rage Gauge</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <View style={styles.buttonContainer}>
        <Button title="Login" onPress={handleLogin} />
      </View>
      <View style={styles.buttonContainer}>
        <Button title="Sign Up" onPress={handleSignUp} color="#841584" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    height: 50,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  buttonContainer: {
    marginTop: 10,
  },
});
