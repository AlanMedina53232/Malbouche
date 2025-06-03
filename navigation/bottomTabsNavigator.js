// import React from 'react';
// import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
// import { Ionicons } from '@expo/vector-icons';

// import ClockScreen from '../principals/schedule'; 

// const Tab = createBottomTabNavigator();

// export default function BottomTabsNavigator() {
//   return (
//     <Tab.Navigator
//       screenOptions={({ route }) => ({
//         tabBarIcon: ({ focused, color, size }) => {
//           let iconName;

//           switch (route.name) {
//             case 'Clock':
//               iconName = 'time-outline';
//               break;
//             case 'Events':
//               iconName = 'checkmark-circle-outline';
//               break;
//             case 'Movements':
//               iconName = 'people-outline';
//               break;
//             case 'Users':
//               iconName = 'person-outline';
//               break;
//             default:
//               iconName = 'help-circle-outline';
//           }

//           return <Ionicons name={iconName} size={size} color={color} />;
//         },
//         tabBarActiveTintColor: 'black',
//         tabBarInactiveTintColor: 'gray',
//         headerShown: false,
//         tabBarStyle: { height: 60, paddingBottom: 5 },
//         tabBarLabelStyle: { fontSize: 12 },
//       })}
//     >
//       <Tab.Screen name="Clock" component={ClockScreen} />
//       <Tab.Screen name="Events" component={EventsScreen} />
//       <Tab.Screen name="Movements" component={MovementsScreen} />
//       <Tab.Screen name="Users" component={UsersScreen} />
//     </Tab.Navigator>
//   );
// }
