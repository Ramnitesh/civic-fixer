import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { colors } from "../utils/colors";
import { authAPI } from "../services/api";

type RouteParams = {
  OTPScreen: {
    phone: string;
    isLogin: boolean;
    name?: string;
    role?: string;
  };
};

export default function OTPScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RouteParams, "OTPScreen">>();
  const { phone, isLogin, name, role } = route.params;

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const [resendDisabled, setResendDisabled] = useState(true);

  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    // Start resend timer
    const timer = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          setResendDisabled(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Auto-focus first input
    inputRefs.current[0]?.focus();
  }, []);

  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Move to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when complete
    if (value && index === 5) {
      const fullOtp = newOtp.join("");
      if (fullOtp.length === 6) {
        verifyOTP(fullOtp);
      }
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    // Handle backspace
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const verifyOTP = async (otpCode?: string) => {
    const finalOtp = otpCode || otp.join("");
    if (finalOtp.length !== 6) {
      Alert.alert("Error", "Please enter a valid 6-digit OTP");
      return;
    }

    // Console the OTP for mobile
    console.log("OTP:", finalOtp);

    try {
      setIsLoading(true);

      if (isLogin) {
        // Login with OTP
        await authAPI.verifyLoginOTP(phone, finalOtp);
        // If successful, navigate to home
        navigation.reset({
          index: 0,
          routes: [{ name: "Dashboard" }],
        });
      } else {
        // Register with OTP
        await authAPI.verifyRegisterOTP(phone, finalOtp, {
          username: phone,
          password: "",
          name: name || "",
          phone,
          role: role || "MEMBER",
        });
        // Navigate to login after successful registration
        Alert.alert("Success", "Registration successful! Please login.", [
          {
            text: "OK",
            onPress: () => navigation.replace("Auth"),
          },
        ]);
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Invalid OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await authAPI.sendOTP(phone);
      setResendTimer(30);
      setResendDisabled(true);
      setOtp(["", "", "", "", "", ""]);
      Alert.alert("Success", "OTP sent successfully!");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to resend OTP");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Verify OTP</Text>
            <Text style={styles.subtitle}>
              We've sent a 6-digit OTP to{" "}
              <Text style={styles.phone}>{phone}</Text>
            </Text>
          </View>

          {/* OTP Input */}
          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => {
                  inputRefs.current[index] = ref;
                }}
                style={[styles.otpInput, digit && styles.otpInputFilled]}
                value={digit}
                onChangeText={(value) => {
                  // Only allow numbers
                  const numericValue = value.replace(/[^0-9]/g, "");
                  handleOtpChange(numericValue, index);
                }}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
                placeholderTextColor={colors.muted}
                placeholder="*"
              />
            ))}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              isLoading && styles.submitButtonDisabled,
            ]}
            onPress={() => verifyOTP()}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.submitButtonText}>
                {isLogin ? "Verify & Login" : "Verify & Register"}
              </Text>
            )}
          </TouchableOpacity>

          {/* Resend */}
          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>Didn't receive the code? </Text>
            <TouchableOpacity onPress={handleResend} disabled={resendDisabled}>
              <Text
                style={[
                  styles.resendButton,
                  resendDisabled && styles.resendButtonDisabled,
                ]}
              >
                {resendDisabled ? `Resend in ${resendTimer}s` : "Resend OTP"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
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
    flex: 1,
    padding: 24,
  },
  header: {
    marginTop: 40,
    marginBottom: 40,
  },
  backButton: {
    marginBottom: 20,
  },
  backText: {
    fontSize: 16,
    color: colors.primary,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.foreground,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: colors.muted,
    lineHeight: 24,
  },
  phone: {
    color: colors.primary,
    fontWeight: "600",
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginBottom: 32,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 12,
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    color: colors.foreground,
    backgroundColor: colors.card,
  },
  otpInputFilled: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + "10",
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 24,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  resendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  resendText: {
    fontSize: 14,
    color: colors.muted,
  },
  resendButton: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "600",
  },
  resendButtonDisabled: {
    color: colors.muted,
  },
});
