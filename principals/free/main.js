import React from "react";
import { BottomNavigation, Text } from 'react-native-paper';
import { View, StyleSheet } from 'react-native';

const MusicRoute = () => (
  <View style={styles.scene}>
    <Text style={styles.text}>🎵 Music</Text>
  </View>
);

const AlbumsRoute = () => (
  <View style={styles.scene}>
    <Text style={styles.text}>💿 Albums</Text>
  </View>
);

const RecentsRoute = () => (
  <View style={styles.scene}>
    <Text style={styles.text}>🕘 Recents</Text>
  </View>
);

const NotificationsRoute = () => (
  <View style={styles.scene}>
    <Text style={styles.text}>🔔 Notifications</Text>
  </View>
);

export default function Mainfree() {
  const [index, setIndex] = React.useState(0);

  const [routes] = React.useState([
    { key: 'music', title: 'Favorites', focusedIcon: 'heart', unfocusedIcon: 'heart-outline' },
    { key: 'albums', title: 'Albums', focusedIcon: 'album' },
    { key: 'recents', title: 'Recents', focusedIcon: 'history' },
    { key: 'notifications', title: 'Notifications', focusedIcon: 'bell', unfocusedIcon: 'bell-outline' },
  ]);

  const renderScene = BottomNavigation.SceneMap({
    music: MusicRoute,
    albums: AlbumsRoute,
    recents: RecentsRoute,
    notifications: NotificationsRoute,
  });

  return (
    <BottomNavigation
      navigationState={{ index, routes }}
      onIndexChange={setIndex}
      renderScene={renderScene}
      barStyle={styles.bottomBar}
      activeColor="#ffffff"
      inactiveColor="#cfd8dc"
    />
  );
}

const styles = StyleSheet.create({
  bottomBar: {
    backgroundColor: '#6200ee', // púrpura de Material Design
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    elevation: 8, // sombra en Android
    shadowColor: '#000', // sombra en iOS
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
