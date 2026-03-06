import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, ActivityIndicator, StyleSheet } from "react-native";

// Screens
import HomeScreen from "../screens/HomeScreen";
import PoolsListScreen from "../screens/PoolsListScreen";
import PoolDetailsScreen from "../screens/PoolDetailsScreen";
import AuthScreen from "../screens/AuthScreen";
import ProfileScreen from "../screens/ProfileScreen";
import CreatePoolScreen from "../screens/CreatePoolScreen";
import WalletScreen from "../screens/WalletScreen";
import ContributionsScreen from "../screens/ContributionsScreen";
import MyPoolsScreen from "../screens/MyPoolsScreen";
import HelpScreen from "../screens/HelpScreen";
import BankAccountScreen from "../screens/BankAccountScreen";

// Auth Context - import from AuthContext
import { useAuth, AuthProvider } from "./AuthContext";

// Icons
import FontAwesome from "@expo/vector-icons/FontAwesome";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { colors } from "../utils/colors";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Loading Screen
function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

// Tab Navigator for authenticated users
function TabNavigator() {
  const { user } = useAuth();

  // Consistent icon size for all tabs
  const ICON_SIZE = 22;

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
        },
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.foreground,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <FontAwesome name="home" color={color} size={ICON_SIZE} />
          ),
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="My Pools"
        component={MyPoolsScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <FontAwesome name="group" color={color} size={ICON_SIZE - 3} />
          ),
          headerTitle: "My Pools",
        }}
      />
      <Tab.Screen
        name="New Pool"
        component={CreatePoolScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons
              name="account-multiple-plus"
              color={color}
              size={ICON_SIZE + 5} // Slightly larger icon for emphasis
            />
          ),
          headerTitle: "Create Pool",
        }}
      />
      <Tab.Screen
        name="Contributions"
        component={ContributionsScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <FontAwesome name="heart" color={color} size={ICON_SIZE} />
          ),
          headerTitle: "Contributed Pools",
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <FontAwesome name="user" color={color} size={ICON_SIZE} />
          ),
          headerTitle: "Profile",
        }}
      />
    </Tab.Navigator>
  );
}

// Main Stack Navigator - always shows main app, auth is accessible via navigation
function MainNavigator() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.foreground,
      }}
    >
      <Stack.Screen
        name="Main"
        component={TabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PoolsListScreen"
        component={PoolsListScreen}
        options={{ headerTitle: "Search Pools" }}
      />
      <Stack.Screen
        name="PoolDetails"
        component={PoolDetailsScreen}
        options={{ headerTitle: "Pool Details" }}
      />
      <Stack.Screen
        name="CreatePool"
        component={CreatePoolScreen}
        options={{ headerTitle: "Create Pool" }}
      />
      <Stack.Screen
        name="Wallet"
        component={WalletScreen}
        options={{ headerTitle: "My Wallet" }}
      />
      <Stack.Screen
        name="Contributions"
        component={ContributionsScreen}
        options={{ headerTitle: "My Contributions" }}
      />
      <Stack.Screen
        name="MyPools"
        component={MyPoolsScreen}
        options={{ headerTitle: "My Pools" }}
      />
      <Stack.Screen
        name="Help"
        component={HelpScreen}
        options={{ headerTitle: "Help & Support" }}
      />
      <Stack.Screen
        name="BankAccount"
        component={BankAccountScreen}
        options={{ headerTitle: "Bank Account" }}
      />
      <Stack.Screen
        name="Auth"
        component={AuthScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <MainNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
});

// Re-export for backwards compatibility
export { useAuth, AuthProvider } from "./AuthContext";
