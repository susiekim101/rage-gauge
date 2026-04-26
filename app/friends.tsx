import { SafeAreaView, StyleSheet } from "react-native";
import FriendsScreen from "../src/screens/FriendsScreen";

export default function FriendsRoute() {
  return (
    <SafeAreaView style={styles.container}>
      <FriendsScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F8F5",
  },
});
