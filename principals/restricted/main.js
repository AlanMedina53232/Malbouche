import React, { useState, useMemo } from "react";
import { BottomNavigation, Text } from 'react-native-paper';
import { View, StyleSheet } from 'react-native';

const ClockRoute = () => (
  <View style={styles.scene}>
    <Text style={styles.text}>Clock</Text>
  </View>
);

const eventsRoute = () => (
  <View style={styles.scene}>
    <Text style={styles.text}>Events</Text>
  </View>
);

const movementsRoute = () => (
  <View style={styles.scene}>
    <Text style={styles.text}>Movements</Text>
  </View>
);

const usersRoute = () => (
  <View style={styles.scene}>
    <Text style={styles.text}>Users</Text>
  </View>
);

export default function MainRest() {
  const [index, setIndex] = useState(0);

  const routes = useMemo(() => [
    { key: 'clock', title: 'Clock', focusedIcon: 'clock-outline', unfocusedIcon: 'clock' },
    { key: 'events', title: 'Events', focusedIcon: 'calendar', unfocusedIcon: 'calendar-outline' },
    { key: 'movements', title: 'Movements', focusedIcon: 'swap-horizontal', unfocusedIcon: 'swap-horizontal' },
    { key: 'users', title: 'Users', focusedIcon: 'account-group', unfocusedIcon: 'account-group-outline' },
  ], []);

  const renderScene = BottomNavigation.SceneMap({
    clock: ClockRoute,
    events: eventsRoute,
    movements: movementsRoute,
    users: usersRoute,
  });

  return (
    <BottomNavigation
      navigationState={{ index, routes }}
      onIndexChange={setIndex}
      renderScene={renderScene}
      barStyle={styles.bottomBar}
      activeColor="#ffffff"
      inactiveColor="#cfd8dc"
      shifting={false} // puedes ponerlo en true para animación más fluida
    />
  );
}

const styles = StyleSheet.create({
  bottomBar: {
    backgroundColor: '#6200ee',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  scene: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  text: {
    fontSize: 24,
    color: '#333',
  },
});
