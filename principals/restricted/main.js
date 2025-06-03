import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import NavigationBar from '../../components/NavigationBar';

export default function MainRest() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.message}>¡Hola! Este es el main restricted.</Text>
      <NavigationBar/>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',  // centra verticalmente
    alignItems: 'center',      // centra horizontalmente
    backgroundColor: '#fff',
    padding: 20,
  },
  message: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
});
