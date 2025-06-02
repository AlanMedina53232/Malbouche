import { View, Text, StyleSheet } from 'react-native';

export default function MovementsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Movements Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
  },
});