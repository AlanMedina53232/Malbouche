import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native"
import { useNavigation } from "@react-navigation/native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

const NavigationBar = () => {
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()

  const navItems = [
    { name: "Schedule", icon: "🕐" },
    { name: "Events", icon: "📅" },
    { name: "Movements", icon: "👥" },
    { name: "Users", icon: "👤" },
  ]

  return (
    <View style={[
      styles.navbar,
      {
        paddingBottom: Platform.OS === "ios" ? 34 + insets.bottom : 10 + insets.bottom
      }
    ]}>
      {navItems.map((item, index) => (
        <TouchableOpacity key={index} style={styles.navItem} onPress={() => navigation.navigate(item.name)}>
          <Text style={styles.navIcon}>{item.icon}</Text>
          <Text style={styles.navText}>{item.name}</Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  navbar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#ffffff",
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
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
  navIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  navText: {
    fontSize: 12,
    color: "#666666",
    textAlign: "center",
  },
})

export default NavigationBar