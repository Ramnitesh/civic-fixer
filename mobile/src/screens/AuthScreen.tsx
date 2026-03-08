import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import { useAuth } from "../navigation/AuthContext";
import { colors } from "../utils/colors";
import { useNavigation } from "@react-navigation/native";
import { authAPI } from "../services/api";
import OTPInput from "../components/OTPInput";
import logoImage from "../../assets/icon.png";
import FontAwesome from "@expo/vector-icons/FontAwesome";

export default function AuthScreen() {
  const { setUserFromLogin } = useAuth();
  const navigation = useNavigation<any>();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Form fields
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("MEMBER");

  // Validation errors
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // OTP fields
  const [otpSent, setOtpSent] = useState(false);

  const validatePhone = (phoneNumber: string) => {
    if (!phoneNumber.trim()) {
      return "Phone number is required";
    }
    // Remove all non-digit characters
    const digitsOnly = phoneNumber.replace(/\D/g, "");
    if (digitsOnly.length < 10) {
      return "Phone number must be at least 10 digits";
    }
    if (digitsOnly.length > 15) {
      return "Phone number must be less than 15 digits";
    }
    return "";
  };

  const validateName = (nameValue: string) => {
    if (!nameValue.trim()) {
      return "Name is required";
    }
    if (nameValue.trim().length < 2) {
      return "Name must be at least 2 characters";
    }
    if (nameValue.trim().length > 50) {
      return "Name must be less than 50 characters";
    }
    if (!/^[a-zA-Z\s'-]+$/.test(nameValue.trim())) {
      return "Name can only contain letters, spaces, hyphens, and apostrophes";
    }
    return "";
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    // Phone validation (required for both login and register)
    const phoneError = validatePhone(phone);
    if (phoneError) {
      newErrors.phone = phoneError;
    }

    // Name validation (only required for registration)
    if (!isLogin) {
      const nameError = validateName(name);
      if (nameError) {
        newErrors.name = nameError;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSendOTP = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);
      // Send OTP to phone number
      const response = await authAPI.sendOTP(
        phone,
        isLogin ? "login" : "register",
      );

      // Console the OTP for mobile
      console.log("OTP:", response.devOtp);

      // Show OTP input field
      setOtpSent(true);
    } catch (error: any) {
      // Extract error message from API response or use fallback
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Failed to send OTP";
      Alert.alert("Error", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    await handleSendOTP();
  };

  const handleOTPSuccess = () => {
    // Navigate back to previous screen after successful login/register
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const handleBackToPhone = () => {
    setOtpSent(false);
  };

  const handlePhoneChange = (text: string) => {
    setPhone(text);
    if (errors.phone) {
      setErrors({ ...errors, phone: "" });
    }
  };

  const handleNameChange = (text: string) => {
    setName(text);
    if (errors.name) {
      setErrors({ ...errors, name: "" });
    }
  };

  // Check if we can go back (meaning user navigated here from another screen)
  const canGoBack = navigation.canGoBack();

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            {/* Back Button */}
            {canGoBack && (
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <FontAwesome
                  name="arrow-left"
                  size={20}
                  color={colors.primary}
                />
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>
            )}

            {/* Header */}
            <View style={styles.header}>
              <Image source={logoImage} style={styles.logo} />
              <Text style={styles.title}>
                <Text style={{ color: colors.foreground }}>Kontro</Text>Pay
              </Text>
              <Text style={styles.subtitle}>
                Join the movement to improve your community
              </Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              {/* Tabs */}
              {!otpSent && (
                <View style={styles.tabs}>
                  <TouchableOpacity
                    style={[styles.tab, isLogin && styles.tabActive]}
                    onPress={() => {
                      setIsLogin(true);
                      setErrors({});
                    }}
                  >
                    <Text
                      style={[styles.tabText, isLogin && styles.tabTextActive]}
                    >
                      Login
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.tab, !isLogin && styles.tabActive]}
                    onPress={() => {
                      setIsLogin(false);
                      setErrors({});
                    }}
                  >
                    <Text
                      style={[styles.tabText, !isLogin && styles.tabTextActive]}
                    >
                      Register
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {otpSent ? (
                // OTP Verification Form - using OTPInput component
                <OTPInput
                  phone={phone}
                  isLogin={isLogin}
                  name={name}
                  role={role}
                  onSuccess={handleOTPSuccess}
                  onBack={handleBackToPhone}
                  setUserFromLogin={setUserFromLogin}
                />
              ) : isLogin ? (
                // Login Form - OTP based
                <View style={styles.formFields}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Phone Number *</Text>
                    <TextInput
                      style={[styles.input, errors.phone && styles.inputError]}
                      placeholder="+1 234 567 8900"
                      value={phone}
                      onChangeText={handlePhoneChange}
                      keyboardType="phone-pad"
                      maxLength={15}
                    />
                    {errors.phone && (
                      <Text style={styles.errorText}>{errors.phone}</Text>
                    )}
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.submitButton,
                      isLoading && styles.submitButtonDisabled,
                    ]}
                    onPress={handleSubmit}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text style={styles.submitButtonText}>Send OTP</Text>
                    )}
                  </TouchableOpacity>
                </View>
              ) : (
                // Register Form
                <View style={styles.formFields}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Full Name *</Text>
                    <TextInput
                      style={[styles.input, errors.name && styles.inputError]}
                      placeholder="John Doe"
                      value={name}
                      onChangeText={handleNameChange}
                      maxLength={50}
                      autoCapitalize="words"
                    />
                    {errors.name && (
                      <Text style={styles.errorText}>{errors.name}</Text>
                    )}
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Phone Number *</Text>
                    <TextInput
                      style={[styles.input, errors.phone && styles.inputError]}
                      placeholder="+1 234 567 8900"
                      value={phone}
                      onChangeText={handlePhoneChange}
                      keyboardType="phone-pad"
                      maxLength={15}
                    />
                    {errors.phone && (
                      <Text style={styles.errorText}>{errors.phone}</Text>
                    )}
                  </View>
                  {/* Role selection hidden - default to MEMBER */}
                  <TouchableOpacity
                    style={[
                      styles.submitButton,
                      isLoading && styles.submitButtonDisabled,
                    ]}
                    onPress={handleSubmit}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text style={styles.submitButtonText}>
                        Create Account
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: "600",
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
    marginTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.muted,
    textAlign: "center",
  },
  form: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabs: {
    flexDirection: "row",
    marginBottom: 24,
    backgroundColor: colors.secondary,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.muted,
  },
  tabTextActive: {
    color: "white",
  },
  formFields: {
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.foreground,
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
  roleButtons: {
    flexDirection: "row",
    gap: 12,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  roleButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  roleButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.muted,
  },
  roleButtonTextActive: {
    color: "white",
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
