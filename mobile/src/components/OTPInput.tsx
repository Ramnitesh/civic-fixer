import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { colors } from "../utils/colors";
import { authAPI } from "../services/api";

interface OTPInputProps {
  phone: string;
  isLogin: boolean;
  name?: string;
  role?: string;
  onSuccess?: () => void;
  onBack?: () => void;
  setUserFromLogin?: (user: any) => void;
}

export default function OTPInput({
  phone,
  isLogin,
  name,
  role,
  onSuccess,
  onBack,
  setUserFromLogin,
}: OTPInputProps) {
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
        const response = await authAPI.verifyLoginOTP(phone, finalOtp);
        console.log("Login response:", response);

        // Check if response has user (success) or message (error)
        if (response.user && response.token) {
          // Set user from login response
          setUserFromLogin?.(response.user);
          // Navigate without showing alert
          onSuccess?.();
        } else {
          // Show error message
          Alert.alert(
            "Error",
            response.message || "Invalid OTP. Please try again.",
          );
        }
      } else {
        // Register with OTP
        const response = await authAPI.verifyRegisterOTP(phone, finalOtp, {
          username: phone,
          password: "",
          name: name || "",
          phone,
          role: role || "MEMBER",
        });

        // Check if response has user (success) or message (error)
        if (response.user && response.token) {
          // Set user from login response
          setUserFromLogin?.(response.user);
          // Navigate without showing alert
          onSuccess?.();
        } else {
          // Show error message
          Alert.alert(
            "Error",
            response.message || "Registration failed. Please try again.",
          );
        }
      }
    } catch (error: any) {
      // Extract error message from API response or use fallback
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Invalid OTP. Please try again.";
      Alert.alert("Error", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await authAPI.sendOTP(phone, isLogin ? "login" : "register");
      setResendTimer(30);
      setResendDisabled(true);
      setOtp(["", "", "", "", "", ""]);
      Alert.alert("Success", "OTP sent successfully!");
    } catch (error: any) {
      // Extract error message from API response or use fallback
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Failed to resend OTP";
      Alert.alert("Error", errorMessage);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backText}>← Change phone number</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Enter OTP sent to</Text>
        <Text style={styles.phoneText}>{phone}</Text>
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
        style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
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
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  header: {
    marginBottom: 8,
  },
  backButton: {
    marginBottom: 8,
  },
  backText: {
    fontSize: 14,
    color: colors.primary,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.foreground,
  },
  phoneText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: "600",
    padding: 8,
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginBottom: 16,
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
    backgroundColor: colors.background,
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
    marginTop: 8,
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
