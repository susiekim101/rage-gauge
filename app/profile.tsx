import { StyleSheet, View } from "react-native";
import ProfileScreen from "../src/screens/ProfileScreen";

export default function ProfileRoute() {
  return (
    <View style={styles.container}>
      <ProfileScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F8F5",
  },
});
