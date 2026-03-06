import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { useAuth } from "../navigation/AuthContext";
import { colors } from "../utils/colors";
import { authAPI } from "../services/api";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import logoImage from "../../assets/icon.png";

interface MenuItem {
  id: string;
  title: string;
  icon: string;
  onPress?: () => void;
}

export default function ProfileScreen() {
  const { user, logout, refreshUser, isLoading } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [isEditing, setIsEditing] = useState(false);

  // Editable fields
  const [name, setName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [nameError, setNameError] = useState("");

  useEffect(() => {
    if (user) {
      setName(user.name || "");
    }
  }, [user]);

  const validateName = (value: string) => {
    if (!value.trim()) {
      return "Name is required";
    }
    if (value.trim().length < 2) {
      return "Name must be at least 2 characters";
    }
    if (value.trim().length > 50) {
      return "Name must be less than 50 characters";
    }
    // Check for valid characters (letters, spaces, and common name characters)
    if (!/^[a-zA-Z\s'-]+$/.test(value.trim())) {
      return "Name can only contain letters, spaces, hyphens, and apostrophes";
    }
    return "";
  };

  const menuItems: MenuItem[] = [
    {
      id: "wallet",
      title: "Wallet",
      icon: "money",
      onPress: () => navigation.navigate("Wallet"),
    },
    {
      id: "bank",
      title: "Bank Account",
      icon: "university",
      onPress: () => navigation.navigate("BankAccount"),
    },
    {
      id: "help",
      title: "Help & Support",
      icon: "question-circle",
      onPress: () => navigation.navigate("Help"),
    },
  ];

  // Show loading while checking auth
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.notLoggedIn}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const handleSave = async () => {
    const error = validateName(name);
    if (error) {
      setNameError(error);
      return;
    }

    try {
      setIsSaving(true);
      await authAPI.updateProfile({ name: name.trim() });
      await refreshUser();
      setIsEditing(false);
      setNameError("");
      Alert.alert("Success", "Profile updated successfully!");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.notLoggedIn}>
          <Image source={logoImage} style={styles.logo} />
          <Text style={styles.notLoggedInTitle}>
            Welcome to Kontro<Text style={{ color: colors.primary }}>Pay</Text>
          </Text>
          <Text style={styles.notLoggedInText}>
            Please login to view your profile
          </Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => navigation.navigate("Auth" as never)}
          >
            <Text style={styles.loginButtonText}>Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {((user.name || "")[0] || "?").toUpperCase()}
              </Text>
            </View>
            <Text style={styles.userRole}>{user.role}</Text>
          </View>

          <View style={styles.headerActions}>
            {!isEditing ? (
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => setIsEditing(true)}
              >
                <FontAwesome name="edit" size={16} color={colors.primary} />
                <Text style={styles.editButtonText}>Edit Profile</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.editActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setName(user.name || "");
                    setIsEditing(false);
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSave}
                  disabled={isSaving}
                >
                  <Text style={styles.saveButtonText}>
                    {isSaving ? "Saving..." : "Save"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Profile Form */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Name</Text>
            {isEditing ? (
              <>
                <TextInput
                  style={[styles.input, nameError && styles.inputError]}
                  value={name}
                  onChangeText={(text) => {
                    setName(text);
                    if (nameError) setNameError("");
                  }}
                  placeholder="Enter your name"
                  maxLength={50}
                />
                {nameError ? (
                  <Text style={styles.errorText}>{nameError}</Text>
                ) : (
                  <Text style={styles.charCount}>{name.length}/50</Text>
                )}
              </>
            ) : (
              <Text style={styles.valueText}>{user.name}</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone</Text>
            <Text style={styles.valueText}>{user.phone || "Not added"}</Text>
          </View>
        </View>

        {/* Menu Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Menu</Text>
          <View style={styles.menuList}>
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.menuItem}
                onPress={item.onPress}
              >
                <View style={styles.menuItemLeft}>
                  <FontAwesome
                    name={item.icon as any}
                    size={20}
                    color={colors.primary}
                  />
                  <Text style={styles.menuItemText}>{item.title}</Text>
                </View>
                <FontAwesome
                  name="chevron-right"
                  size={14}
                  color={colors.muted}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Logout and Version */}
        <View style={styles.footerSection}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <FontAwesome name="sign-out" size={18} color={colors.destructive} />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
          <Text style={styles.versionText}>Version 1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  notLoggedIn: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    gap: 16,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  notLoggedInTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.foreground,
    marginTop: 16,
  },
  notLoggedInText: {
    fontSize: 16,
    color: colors.muted,
    textAlign: "center",
  },
  loginButton: {
    marginTop: 16,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  loginButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatarContainer: {
    alignItems: "center",
    gap: 8,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
  },
  userRole: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: "600",
  },
  headerActions: {
    flex: 1,
    alignItems: "flex-end",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  editButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "600",
  },
  editActions: {
    flexDirection: "row",
    gap: 8,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: colors.secondary,
  },
  cancelButtonText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "600",
  },
  saveButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
  },
  saveButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  form: {
    padding: 20,
    gap: 20,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: "500",
    textTransform: "uppercase",
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: colors.foreground,
  },
  inputError: {
    borderColor: colors.destructive,
    borderWidth: 2,
  },
  errorText: {
    color: colors.destructive,
    fontSize: 12,
    marginTop: 4,
  },
  charCount: {
    color: colors.muted,
    fontSize: 11,
    textAlign: "right",
    marginTop: 4,
  },
  valueText: {
    fontSize: 16,
    color: colors.foreground,
    paddingVertical: 8,
  },
  section: {
    padding: 20,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.foreground,
    marginBottom: 12,
  },
  menuList: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuItemText: {
    fontSize: 16,
    color: colors.foreground,
    fontWeight: "500",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    margin: 20,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.destructive,
  },
  logoutButtonText: {
    color: colors.destructive,
    fontSize: 16,
    fontWeight: "600",
  },
  bankSection: {
    backgroundColor: colors.card,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  bankSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  saveBankButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  saveBankButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  footerSection: {
    paddingBottom: 40,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "space-between",
  },
  versionText: {
    textAlign: "center",
    color: colors.muted,
    fontSize: 12,
    marginTop: 8,
  },
});
