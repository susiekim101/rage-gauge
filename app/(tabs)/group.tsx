import { SafeAreaView, StyleSheet } from "react-native";
import GroupScreen from "../../src/screens/GroupScreen";

export default function GroupRoute() {
  return (
    <SafeAreaView style={styles.container}>
      <GroupScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F8F5",
  },
});
