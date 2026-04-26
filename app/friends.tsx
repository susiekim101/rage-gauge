import { StyleSheet, View } from "react-native";
import FriendsScreen from "../src/screens/FriendsScreen";

export default function FriendsRoute() {
  return (
    <View style={styles.container}>
      <FriendsScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F8F5",
  },
});
