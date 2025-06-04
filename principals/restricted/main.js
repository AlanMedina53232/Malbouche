import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import Slider from "@react-native-community/slider";
import NavigationBar from "../../components/NavigationBar";
import AnalogClock from "../../components/analogClock";
import { Ionicons } from '@expo/vector-icons';

const MainRest = ({ navigation }) => {
  const [selectedOption, setSelectedOption] = useState("");
  const [speed, setSpeed] = useState(50);

  const currentUser = {
    id: 1,
    name: 'Almendro Isaac Medina Ramírez',
    email: 'AlmIsaMedRam@gmail.com'
  };

  const options = [
    ["Left", "Right"],
    ["Crazy", "Swing"],
    ["Customized", "Normal"]
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>MALBOUCHE</Text>
        <TouchableOpacity 
          style={styles.profileButton}
          onPress={() => navigation.navigate('UserDetail', { user: currentUser })}
        >
          <View style={styles.avatarSmall}>
            <Ionicons name="person" size={20} color="#666" />
          </View>
        </TouchableOpacity>
      </View>

      <AnalogClock />

      {options.map((row, index) => (
        <View key={index} style={styles.buttonRow}>
          {row.map((item) => (
            <TouchableOpacity
              key={item}
              style={[styles.button, selectedOption === item && styles.activeButton]}
              onPress={() => setSelectedOption(item)}
            >
              <Text
                style={[
                  styles.buttonText,
                  selectedOption === item && { color: "#fff" },
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}

      <Text style={styles.sliderLabel}>Speed</Text>
      <Slider
        style={styles.slider}
        minimumValue={1}
        maximumValue={100}
        step={1}
        value={speed}
        onSlidingComplete={setSpeed}
        minimumTrackTintColor="#000"
        maximumTrackTintColor="#aaa"
        thumbTintColor="#333"
      />

      <TouchableOpacity style={styles.turnOnButton}>
        <Text style={styles.turnOnText}>Turn On</Text>
      </TouchableOpacity>

      <NavigationBar />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
  },
  profileButton: {
    padding: 4,
  },
  avatarSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 12,
    gap: 10,
  },
  button: {
    backgroundColor: "#ddd",
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginHorizontal: 5,
    minWidth: 100,
    alignItems: "center",
  },
  activeButton: {
    backgroundColor: "#555",
  },
  buttonText: {
    color: "#000",
    fontWeight: "600",
    fontSize: 14,
  },
  sliderLabel: {
    marginTop: 30,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  slider: {
    width: "85%",
    height: 40,
    marginVertical: 10,
    alignSelf: "center",
  },
  turnOnButton: {
    backgroundColor: "#ddd",
    marginTop: 20,
    paddingVertical: 14,
    paddingHorizontal: 60,
    borderRadius: 25,
    alignItems: "center",
    alignSelf: "center",
  },
  turnOnText: {
    fontWeight: "600",
    fontSize: 16,
  },
});

export default MainRest;