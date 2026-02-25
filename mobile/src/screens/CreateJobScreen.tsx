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
import {
  useNavigation,
  CompositeNavigationProp,
} from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
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
  const [executionMode, setExecutionMode] = useState("WORKER_EXECUTION");

  const handleSubmit = async () => {
    if (!title || !description || !location || !targetAmount) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    try {
      setIsLoading(true);
      await jobsAPI.create({
        title,
        description,
        location,
        targetAmount: parseFloat(targetAmount),
        isPrivateResidentialProperty: isPrivateProperty,
        executionMode: executionMode as any,
      });
      Alert.alert("Success", "Job created successfully!");
      navigation.goBack();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to create job");
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.notLoggedIn}>
          <Text style={styles.notLoggedInText}>
            Please login to create a job
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
          <Text style={styles.headerTitle}>Create a New Job</Text>
          <Text style={styles.headerSubtitle}>Start a community project</Text>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Job Title *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Clean up local park"
                value={title}
                onChangeText={setTitle}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe the work..."
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Location *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Central Park"
                value={location}
                onChangeText={setLocation}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Target Amount (₹) *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 10000"
                value={targetAmount}
                onChangeText={setTargetAmount}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Execution Mode</Text>
              <View style={styles.executionOptions}>
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
              </View>
            </View>

            <View style={styles.switchGroup}>
              <View style={styles.switchInfo}>
                <Text style={styles.switchLabel}>Private Property</Text>
              </View>
              <Switch
                value={isPrivateProperty}
                onValueChange={setIsPrivateProperty}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="white"
              />
            </View>

            <TouchableOpacity
              style={[
                styles.submitButton,
                isLoading && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              <Text style={styles.submitButtonText}>
                {isLoading ? "Creating..." : "Create Job"}
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
  switchInfo: { flex: 1 },
  switchLabel: { fontSize: 14, fontWeight: "500", color: colors.foreground },
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
