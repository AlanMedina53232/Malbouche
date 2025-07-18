import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faHouse, faCalendarWeek, faClock, faUsers } from '@fortawesome/free-solid-svg-icons';

const NavigationBar = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState("Home");

  // Sincroniza el tab activo con la ruta actual
  useEffect(() => {
    if (route.name) {
      setActiveTab(route.name);
    }
  }, [route.name]);

  const navItems = [
    { name: "Home", icon: faHouse },
    { name: "Movements", icon: faClock },
    { name: "Events", icon: faCalendarWeek },
    { name: "Users", icon: faUsers },
  ];

  const handlePress = (tabName) => {
    setActiveTab(tabName);
    navigation.navigate(tabName);
  };

  return (
    <View style={[
      styles.navbar,
      { paddingBottom: Platform.OS === "ios" ? 34 + insets.bottom : 10 + insets.bottom }
    ]}>
      {navItems.map((item, index) => {
        const isActive = activeTab === item.name;
        return (
          <TouchableOpacity
            key={index}
            style={styles.navItem}
            onPress={() => handlePress(item.name)}
          >
            <FontAwesomeIcon
              icon={item.icon}
              size={20}
              color={isActive ? "#400135" : "rgba(64, 1, 53, 0.65)"}
            />
            <Text style={[styles.navText, isActive && { color: "#400135" }]}>
              {item.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  navbar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#ffffff",
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(224, 224, 224, 0.4)",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
    
  },
  navItem: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    paddingHorizontal: 10,
  
  },
  navText: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 4,
  },
});

export default NavigationBar;