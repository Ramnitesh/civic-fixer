import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, ActivityIndicator, StyleSheet } from "react-native";

// Screens
import HomeScreen from "../screens/HomeScreen";
import JobsListScreen from "../screens/JobsListScreen";
import JobDetailsScreen from "../screens/JobDetailsScreen";
import AuthScreen from "../screens/AuthScreen";
import ProfileScreen from "../screens/ProfileScreen";
import CreateJobScreen from "../screens/CreateJobScreen";
import WalletScreen from "../screens/WalletScreen";
import ContributionsScreen from "../screens/ContributionsScreen";
import MyJobsScreen from "../screens/MyJobsScreen";
import HelpScreen from "../screens/HelpScreen";

// Auth Context - import from AuthContext
import { useAuth, AuthProvider } from "./AuthContext";

// Icons
import FontAwesome from "@expo/vector-icons/FontAwesome";
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
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="home" color={color} size={size} />
          ),
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Jobs"
        component={JobsListScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="briefcase" color={color} size={size} />
          ),
          headerTitle: "Browse Jobs",
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="user" color={color} size={size} />
          ),
          headerTitle: "Profile",
        }}
      />
    </Tab.Navigator>
  );
}

// Main Stack Navigator
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
        name="Back"
        component={TabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="JobDetails"
        component={JobDetailsScreen}
        options={{ headerTitle: "Job Details" }}
      />
      <Stack.Screen
        name="CreateJob"
        component={CreateJobScreen}
        options={{ headerTitle: "Create Job" }}
      />
      <Stack.Screen
        name="Auth"
        component={AuthScreen}
        options={{ headerShown: false }}
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
        name="MyJobs"
        component={MyJobsScreen}
        options={{ headerTitle: "My Jobs" }}
      />
      <Stack.Screen
        name="Help"
        component={HelpScreen}
        options={{ headerTitle: "Help & Support" }}
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
