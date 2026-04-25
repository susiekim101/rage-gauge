import { SafeAreaView, StyleSheet } from "react-native";
import ProfileScreen from "../src/screens/ProfileScreen";

export default function ProfileRoute() {
  return (
    <SafeAreaView style={styles.container}>
      <ProfileScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
});
