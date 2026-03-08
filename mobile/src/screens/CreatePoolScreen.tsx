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
  Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors } from "../utils/colors";
import { jobsAPI, uploadAPI } from "../services/api";
import { useAuth } from "../navigation/AuthContext";
import FontAwesome from "@expo/vector-icons/FontAwesome";

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
  const [poolImage, setPoolImage] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);

  // Validation errors
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setPoolImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    // Title validation
    if (!title.trim()) {
      newErrors.title = "Title is required";
    } else if (title.trim().length < 5) {
      newErrors.title = "Title must be at least 5 characters";
    } else if (title.trim().length > 25) {
      newErrors.title = "Title must be less than 25 characters";
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
    } else if (location.trim().length > 100) {
      newErrors.location = "Location must be less than 100 characters";
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

      let imageUrl = "";

      // Upload image to Cloudinary if selected
      if (poolImage) {
        try {
          setImageUploading(true);
          const signatureData = await uploadAPI.getSignature("pool_image");

          const uploadResult = await uploadAPI.uploadToCloudinary(
            poolImage,
            signatureData.signature,
            signatureData.timestamp,
            signatureData.cloudName,
            signatureData.apiKey,
            signatureData.folder,
          );

          imageUrl = uploadResult.url;
        } catch (uploadError) {
          console.error("Error uploading image:", uploadError);
          Alert.alert("Error", "Failed to upload image. Please try again.");
          setIsLoading(false);
          setImageUploading(false);
          return;
        } finally {
          setImageUploading(false);
        }
      }

      await jobsAPI.create({
        title: title.trim(),
        description: description.trim(),
        location: location.trim(),
        targetAmount: parseFloat(targetAmount),
        isPrivateResidentialProperty: isPrivateProperty,
        isPrivateJob: isPrivateJob,
        executionMode: executionMode as any,
        imageUrl: imageUrl || undefined,
      });
      Alert.alert("Success", "Pool created successfully!");
      navigation.navigate("MyPools" as never);
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
                maxLength={25}
              />
              {errors.title && (
                <Text style={styles.errorText}>{errors.title}</Text>
              )}
              <Text style={styles.charCount}>{title.length}/25</Text>
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
                maxLength={100}
              />
              {errors.location && (
                <Text style={styles.errorText}>{errors.location}</Text>
              )}
              <Text style={styles.charCount}>{location.length}/100</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Target Amount (₹) *</Text>
              <TextInput
                style={[styles.input, errors.targetAmount && styles.inputError]}
                placeholder="e.g., 10000"
                value={targetAmount}
                maxLength={8}
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

            {/* Execution mode is always LEADER_EXECUTION - hidden from user */}

            {/* Private Pool toggle - always shown for Leader Execution */}
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

            {/* Pool Image - Optional */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Pool Image (Optional)</Text>
              <TouchableOpacity
                style={styles.imagePickerButton}
                onPress={pickImage}
              >
                {poolImage ? (
                  <View style={styles.imagePreviewContainer}>
                    <Image
                      source={{ uri: poolImage }}
                      style={styles.imagePreview}
                    />
                    <Text style={styles.imagePreviewText}>
                      Tap to change image
                    </Text>
                  </View>
                ) : (
                  <View style={styles.imagePickerContent}>
                    <FontAwesome
                      name="camera"
                      size={24}
                      color={colors.primary}
                    />
                    <Text style={styles.imagePickerText}>Add Pool Image</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.submitButton,
                (isLoading || imageUploading) && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={isLoading || imageUploading}
            >
              <Text style={styles.submitButtonText}>
                {imageUploading
                  ? "Uploading Image..."
                  : isLoading
                    ? "Creating..."
                    : "Create Pool"}
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
  imagePickerButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    borderStyle: "dashed",
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 150,
  },
  imagePreviewContainer: {
    alignItems: "center",
    width: "100%",
  },
  imagePreview: {
    width: "100%",
    height: 200,
    borderRadius: 8,
  },
  imagePreviewText: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 8,
  },
  imagePickerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  imagePickerText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "500",
  },
});
