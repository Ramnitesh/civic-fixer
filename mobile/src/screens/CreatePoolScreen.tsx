import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  Switch,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors } from "../utils/colors";
import { jobsAPI } from "../services/api";
import { useAuth } from "../navigation/AuthContext";

type RootStackParamList = {
  Main: undefined;
  JobDetails: { jobId: number };
  CreateJob: undefined;
  Auth: undefined;
};

export default function CreateJobScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [isPrivateProperty, setIsPrivateProperty] = useState(false);
  const [isPrivateJob, setIsPrivateJob] = useState(false);
  const [executionMode, setExecutionMode] = useState("LEADER_EXECUTION");

  // Validation errors
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    // Title validation
    if (!title.trim()) {
      newErrors.title = "Title is required";
    } else if (title.trim().length < 5) {
      newErrors.title = "Title must be at least 5 characters";
    } else if (title.trim().length > 100) {
      newErrors.title = "Title must be less than 100 characters";
    }

    // Description validation
    if (!description.trim()) {
      newErrors.description = "Description is required";
    } else if (description.trim().length < 20) {
      newErrors.description = "Description must be at least 20 characters";
    } else if (description.trim().length > 1000) {
      newErrors.description = "Description must be less than 1000 characters";
    }

    // Location validation
    if (!location.trim()) {
      newErrors.location = "Location is required";
    } else if (location.trim().length < 3) {
      newErrors.location = "Location must be at least 3 characters";
    }

    // Target amount validation
    if (!targetAmount.trim()) {
      newErrors.targetAmount = "Target amount is required";
    } else {
      const amount = parseFloat(targetAmount);
      if (isNaN(amount)) {
        newErrors.targetAmount = "Please enter a valid number";
      } else if (amount < 100) {
        newErrors.targetAmount = "Minimum target amount is ₹100";
      } else if (amount > 10000000) {
        newErrors.targetAmount = "Maximum target amount is ₹10,00,000";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);
      await jobsAPI.create({
        title: title.trim(),
        description: description.trim(),
        location: location.trim(),
        targetAmount: parseFloat(targetAmount),
        isPrivateResidentialProperty: isPrivateProperty,
        isPrivateJob: isPrivateJob,
        executionMode: executionMode as any,
      });
      Alert.alert("Success", "Pool created successfully!");
      navigation.goBack();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to create pool");
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.notLoggedIn}>
          <Text style={styles.notLoggedInText}>
            Please login to create a pool
          </Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => navigation.navigate("Auth")}
          >
            <Text style={styles.loginButtonText}>Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.headerTitle}>Create a New Pool</Text>
          <Text style={styles.headerSubtitle}>Start a community project</Text>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Pool Title *</Text>
              <TextInput
                style={[styles.input, errors.title && styles.inputError]}
                placeholder="e.g., Clean up local park"
                value={title}
                onChangeText={(text) => {
                  setTitle(text);
                  if (errors.title) setErrors({ ...errors, title: "" });
                }}
                maxLength={100}
              />
              {errors.title && (
                <Text style={styles.errorText}>{errors.title}</Text>
              )}
              <Text style={styles.charCount}>{title.length}/100</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description *</Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  errors.description && styles.inputError,
                ]}
                placeholder="Describe the work in detail. Include what needs to be done, materials needed, and expected timeline..."
                value={description}
                onChangeText={(text) => {
                  setDescription(text);
                  if (errors.description)
                    setErrors({ ...errors, description: "" });
                }}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                maxLength={1000}
              />
              {errors.description && (
                <Text style={styles.errorText}>{errors.description}</Text>
              )}
              <Text style={styles.charCount}>{description.length}/1000</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Location *</Text>
              <TextInput
                style={[styles.input, errors.location && styles.inputError]}
                placeholder="e.g., Central Park, Near Metro Station"
                value={location}
                onChangeText={(text) => {
                  setLocation(text);
                  if (errors.location) setErrors({ ...errors, location: "" });
                }}
              />
              {errors.location && (
                <Text style={styles.errorText}>{errors.location}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Target Amount (₹) *</Text>
              <TextInput
                style={[styles.input, errors.targetAmount && styles.inputError]}
                placeholder="e.g., 10000"
                value={targetAmount}
                onChangeText={(text) => {
                  // Only allow numbers and decimal point
                  const filtered = text.replace(/[^0-9.]/g, "");
                  setTargetAmount(filtered);
                  if (errors.targetAmount)
                    setErrors({ ...errors, targetAmount: "" });
                }}
                keyboardType="decimal-pad"
              />
              {errors.targetAmount && (
                <Text style={styles.errorText}>{errors.targetAmount}</Text>
              )}
              {targetAmount && !errors.targetAmount && (
                <Text style={styles.amountHint}>
                  ₹{parseFloat(targetAmount).toLocaleString("en-IN")}
                </Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Execution Mode</Text>
              <View style={styles.executionOptions}>
                <TouchableOpacity
                  style={[
                    styles.executionOption,
                    executionMode === "LEADER_EXECUTION" &&
                      styles.executionOptionActive,
                  ]}
                  onPress={() => setExecutionMode("LEADER_EXECUTION")}
                >
                  <Text
                    style={[
                      styles.executionOptionText,
                      executionMode === "LEADER_EXECUTION" &&
                        styles.executionOptionTextActive,
                    ]}
                  >
                    Leader
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.executionOption,
                    executionMode === "WORKER_EXECUTION" &&
                      styles.executionOptionActive,
                  ]}
                  onPress={() => setExecutionMode("WORKER_EXECUTION")}
                >
                  <Text
                    style={[
                      styles.executionOptionText,
                      executionMode === "WORKER_EXECUTION" &&
                        styles.executionOptionTextActive,
                    ]}
                  >
                    Worker
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {executionMode === "WORKER_EXECUTION" && (
              <View style={styles.switchGroup}>
                <View style={styles.switchInfo}>
                  <Text style={styles.switchLabel}>Private Property *</Text>
                  <Text style={styles.switchDescription}>
                    Required for worker execution mode
                  </Text>
                </View>
                <Switch
                  value={isPrivateProperty}
                  onValueChange={(value) => {
                    setIsPrivateProperty(value);
                    if (errors.privateProperty)
                      setErrors({ ...errors, privateProperty: "" });
                  }}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="white"
                />
              </View>
            )}
            {errors.privateProperty && (
              <Text style={styles.errorText}>{errors.privateProperty}</Text>
            )}

            {executionMode === "LEADER_EXECUTION" && (
              <View style={styles.switchGroup}>
                <View style={styles.switchInfo}>
                  <Text style={styles.switchLabel}>
                    Private Pool (Contributors Only)
                  </Text>
                  <Text style={styles.switchDescription}>
                    Only contributors can see this pool
                  </Text>
                </View>
                <Switch
                  value={isPrivateJob}
                  onValueChange={setIsPrivateJob}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="white"
                />
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.submitButton,
                isLoading && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              <Text style={styles.submitButtonText}>
                {isLoading ? "Creating..." : "Create Pool"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  notLoggedIn: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  notLoggedInText: { fontSize: 16, color: colors.muted },
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
  content: { padding: 16 },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.foreground,
    marginBottom: 8,
  },
  headerSubtitle: { fontSize: 14, color: colors.muted, marginBottom: 24 },
  form: { gap: 20 },
  inputGroup: { gap: 8 },
  label: { fontSize: 14, fontWeight: "500", color: colors.foreground },
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
  amountHint: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "600",
    marginTop: 4,
  },
  textArea: { height: 120, paddingTop: 14 },
  executionOptions: { flexDirection: "row", gap: 12 },
  executionOption: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  executionOptionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  executionOptionText: { fontSize: 14, fontWeight: "500", color: colors.muted },
  executionOptionTextActive: { color: "white" },
  switchGroup: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.secondary,
    padding: 16,
    borderRadius: 12,
  },
  switchInfo: { flex: 1, marginRight: 12 },
  switchLabel: { fontSize: 14, fontWeight: "500", color: colors.foreground },
  switchDescription: { fontSize: 12, color: colors.muted, marginTop: 2 },
  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: { color: "white", fontSize: 16, fontWeight: "600" },
});
