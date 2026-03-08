import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  TextInput,
  Image,
  Modal,
  Pressable,
  Switch,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useRoute, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors } from "../utils/colors";
import { jobsAPI, contributionsAPI, uploadAPI } from "../services/api";
import { Job } from "../types";
import { useAuth } from "../navigation/AuthContext";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

type RootStackParamList = {
  Main: undefined;
  JobDetails: { jobId: number };
  CreateJob: undefined;
  Auth: undefined;
};

export default function JobDetailsScreen() {
  const route = useRoute<any>();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { jobId } = route.params;
  const { user } = useAuth();

  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [contributing, setContributing] = useState(false);
  const [contributionAmount, setContributionAmount] = useState("");
  const [contributionError, setContributionError] = useState("");
  const [showContributorsModal, setShowContributorsModal] = useState(false);
  const [showRefundInfo, setShowRefundInfo] = useState(false);
  const [showExpensesModal, setShowExpensesModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseDescription, setExpenseDescription] = useState("");
  const [expenseImage, setExpenseImage] = useState<string | null>(null);
  const [addExpenseLoading, setAddExpenseLoading] = useState(false);
  const [expenseDescriptionError, setExpenseDescriptionError] = useState("");
  const [expenseAmountError, setExpenseAmountError] = useState("");
  const [expenseImageError, setExpenseImageError] = useState("");

  // Edit form state
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editTargetAmount, setEditTargetAmount] = useState("");
  const [editExecutionMode, setEditExecutionMode] = useState<
    "LEADER_EXECUTION" | "WORKER_EXECUTION"
  >("LEADER_EXECUTION");
  const [editIsPrivate, setEditIsPrivate] = useState<boolean>(false);
  const [editIsPrivateProperty, setEditIsPrivateProperty] =
    useState<boolean>(false);
  const [editImage, setEditImage] = useState<string | null>(null);
  const [editImageUploading, setEditImageUploading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editErrors, setEditErrors] = useState<{
    title?: string;
    description?: string;
    location?: string;
    targetAmount?: string;
  }>({});

  const validateContribution = (amount: string) => {
    if (!amount.trim()) {
      return "Amount is required";
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) {
      return "Please enter a valid number";
    }
    if (numAmount <= 0) {
      return "Amount must be greater than 0";
    }
    if (numAmount < 10) {
      return "Minimum contribution is ₹10";
    }
    if (numAmount > 100000) {
      return "Maximum contribution is ₹1,00,000";
    }
    return "";
  };

  const [ledger, setLedger] = useState<any>(null);

  const fetchJob = async () => {
    try {
      const data = await jobsAPI.getById(jobId);
      setJob(data);
    } catch (error) {
      console.error("Error fetching job:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLedger = async () => {
    try {
      const data = await jobsAPI.getLedger(jobId);
      setLedger(data);
    } catch (error) {
      console.error("Error fetching ledger:", error);
    }
  };

  useEffect(() => {
    fetchJob();
    // Note: fetchLedger will be called in the second useEffect after job is loaded
  }, [jobId]);

  useEffect(() => {
    if (job && job.executionMode === "LEADER_EXECUTION") {
      fetchLedger();
    }
  }, [job]);

  // Also fetch ledger when execution mode changes to LEADER_EXECUTION
  useEffect(() => {
    if (job?.executionMode === "LEADER_EXECUTION") {
      fetchLedger();
    }
  }, [job?.executionMode]);

  // Set up header edit button
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => {
        if (job && job.status === "FUNDING_OPEN" && user?.id === job.leaderId) {
          return (
            <TouchableOpacity
              onPress={openEditModal}
              style={styles.headerEditButton}
            >
              <FontAwesome name="pencil" size={20} color={colors.primary} />
            </TouchableOpacity>
          );
        }
        return null;
      },
    });
  }, [job, user]);

  const handleContribute = async () => {
    const error = validateContribution(contributionAmount);
    if (error) {
      setContributionError(error);
      return;
    }

    try {
      setContributing(true);
      await contributionsAPI.create(jobId, parseFloat(contributionAmount));
      Alert.alert("Success", "Thank you for your contribution!");
      setContributionAmount("");
      setContributionError("");
      fetchJob();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to contribute");
    } finally {
      setContributing(false);
    }
  };

  const openEditModal = () => {
    if (job) {
      setEditTitle(job.title);
      setEditDescription(job.description);
      setEditLocation(job.location);
      setEditTargetAmount(job.targetAmount.toString());
      setEditExecutionMode(job.executionMode || "LEADER_EXECUTION");
      setEditIsPrivate(job.isPrivateJob || false);
      setEditIsPrivateProperty(job.isPrivateResidentialProperty || false);
      setEditImage(job.imageUrl || null);
      setEditErrors({});
      setShowEditModal(true);
    }
  };

  const pickEditImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setEditImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const handleEditPool = async () => {
    const errors: typeof editErrors = {};

    // Validate
    if (!editTitle.trim()) {
      errors.title = "Title is required";
    } else if (editTitle.trim().length < 5) {
      errors.title = "Title must be at least 5 characters";
    } else if (editTitle.trim().length > 25) {
      errors.title = "Title must be less than 25 characters";
    }
    if (!editDescription.trim()) {
      errors.description = "Description is required";
    }
    if (!editLocation.trim()) {
      errors.location = "Location is required";
    } else if (editLocation.trim().length > 100) {
      errors.location = "Location must be less than 100 characters";
    }
    if (!editTargetAmount.trim()) {
      errors.targetAmount = "Target amount is required";
    } else {
      const amount = parseFloat(editTargetAmount);
      if (isNaN(amount) || amount <= 0) {
        errors.targetAmount = "Please enter a valid amount";
      } else if (job && amount < job.collectedAmount) {
        errors.targetAmount = `Target cannot be less than collected amount (₹${job.collectedAmount})`;
      }
    }

    if (Object.keys(errors).length > 0) {
      setEditErrors(errors);
      return;
    }

    try {
      setEditLoading(true);

      let imageUrl = undefined;

      // Upload new image if selected and it's different from current
      if (editImage && editImage !== job?.imageUrl) {
        try {
          setEditImageUploading(true);
          const signatureData = await uploadAPI.getSignature("pool_image");

          const uploadResult = await uploadAPI.uploadToCloudinary(
            editImage,
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
          setEditLoading(false);
          setEditImageUploading(false);
          return;
        } finally {
          setEditImageUploading(false);
        }
      }

      await jobsAPI.update(jobId, {
        title: editTitle.trim(),
        description: editDescription.trim(),
        location: editLocation.trim(),
        targetAmount: parseFloat(editTargetAmount),
        executionMode: editExecutionMode,
        isPrivateJob: editIsPrivate,
        isPrivateResidentialProperty: editIsPrivateProperty,
        imageUrl: imageUrl,
      });

      Alert.alert("Success", "Pool updated successfully!");
      setShowEditModal(false);
      fetchJob();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to update pool");
    } finally {
      setEditLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setExpenseImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const handleAddExpense = async () => {
    // Reset errors
    setExpenseDescriptionError("");
    setExpenseAmountError("");
    setExpenseImageError("");

    let hasError = false;

    // Validate expense description
    if (!expenseDescription || expenseDescription.trim().length === 0) {
      setExpenseDescriptionError("Please enter expense description");
      hasError = true;
    } else if (expenseDescription.trim().length < 3) {
      setExpenseDescriptionError("Description must be at least 3 characters");
      hasError = true;
    }

    // Validate expense amount
    if (!expenseAmount || expenseAmount.trim().length === 0) {
      setExpenseAmountError("Please enter expense amount");
      hasError = true;
    } else {
      const expenseNum = parseFloat(expenseAmount);
      if (isNaN(expenseNum)) {
        setExpenseAmountError("Please enter a valid amount");
        hasError = true;
      } else if (expenseNum <= 0) {
        setExpenseAmountError("Amount must be greater than 0");
        hasError = true;
      } else if (expenseNum < 10) {
        setExpenseAmountError("Minimum expense amount is ₹10");
        hasError = true;
      } else if (
        ledger &&
        ledger.remainingBalance !== undefined &&
        expenseNum > ledger.remainingBalance
      ) {
        setExpenseAmountError(
          `Cannot exceed remaining balance of ₹${Number(ledger.remainingBalance).toLocaleString("en-IN")}`,
        );
        hasError = true;
      }
    }

    // Validate proof image
    if (!expenseImage) {
      setExpenseImageError("Please add a proof image");
      hasError = true;
    }

    if (hasError) {
      return;
    }

    try {
      setAddExpenseLoading(true);

      let proofUrl = "";

      // Upload image to Cloudinary first
      if (expenseImage) {
        try {
          // Get signature from server
          const signatureData = await uploadAPI.getSignature("expense_proof");

          // Upload to Cloudinary
          const uploadResult = await uploadAPI.uploadToCloudinary(
            expenseImage,
            signatureData.signature,
            signatureData.timestamp,
            signatureData.cloudName,
            signatureData.apiKey,
            signatureData.folder,
          );

          proofUrl = uploadResult.url;
        } catch (uploadError) {
          console.error("Error uploading image:", uploadError);
          Alert.alert(
            "Error",
            "Failed to upload proof image. Please try again.",
          );
          return;
        }
      }

      // Create the expense with the Cloudinary URL
      await jobsAPI.createExpense(jobId, {
        amount: parseFloat(expenseAmount),
        description: expenseDescription,
        proofUrl: proofUrl,
      });
      Alert.alert("Success", "Expense added successfully!");
      setExpenseAmount("");
      setExpenseDescription("");
      setExpenseImage(null);
      fetchJob();
      fetchLedger();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to add expense");
    } finally {
      setAddExpenseLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "FUNDING_OPEN":
        return colors.fundingOpen;
      case "FUNDING_COMPLETE":
        return colors.fundingComplete;
      case "WORKER_SELECTED":
        return colors.workerSelected;
      case "IN_PROGRESS":
        return colors.inProgress;
      case "AWAITING_VERIFICATION":
        return colors.awaitingVerification;
      case "UNDER_REVIEW":
        return colors.underReview;
      case "COMPLETED":
        return colors.completed;
      case "DISPUTED":
        return colors.disputed;
      case "CANCELLED":
        return colors.cancelled;
      default:
        return colors.muted;
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!job) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Job not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const fundingPercent = Math.min(
    (job.collectedAmount / job.targetAmount) * 100,
    100,
  );
  const canContribute = job.status === "FUNDING_OPEN" && user;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Image */}
        <View style={styles.imageContainer}>
          {job.imageUrl ? (
            <Image source={{ uri: job.imageUrl }} style={styles.image} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <FontAwesome name="image" size={48} color={colors.muted} />
            </View>
          )}
          <View style={styles.headerBadges}>
            {job.isPrivateJob && (
              <View style={styles.privateBadge}>
                <FontAwesome name="lock" size={12} color="white" />
              </View>
            )}
          </View>
          <View style={styles.headerBadgesRight}>
            {job.executionMode === "LEADER_EXECUTION" && (
              <View style={styles.modeBadge}>
                <FontAwesome name="user" size={10} color="white" />
                <Text style={styles.modeBadgeText}>Leader</Text>
              </View>
            )}
            {job.executionMode === "WORKER_EXECUTION" && (
              <View style={styles.modeBadgeWorker}>
                <MaterialCommunityIcons
                  name="account-cowboy-hat"
                  size={10}
                  color="white"
                />
                <Text style={styles.modeBadgeText}>Worker</Text>
              </View>
            )}
          </View>
          <View style={styles.statusBadgeContainer}>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(job.status) },
              ]}
            >
              <Text style={styles.statusBadgeText}>
                {job.status.replace(/_/g, " ")}
              </Text>
            </View>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{job.title}</Text>
          </View>
          <View style={styles.locationRow}>
            <View style={styles.locationLeft}>
              <FontAwesome name="map-marker" size={16} color={colors.muted} />
              <Text style={styles.locationText}>{job.location}</Text>
            </View>
          </View>
          {/* Leader Info */}
          <View style={styles.leaderCard}>
            <View style={styles.leaderAvatar}>
              <FontAwesome name="user" size={20} color={colors.primary} />
            </View>
            <View style={styles.leaderInfo}>
              <Text style={styles.leaderLabel}>Pool Owned By</Text>
              <Text style={styles.leaderName}>
                {job.leader?.name || "Unknown"}
              </Text>
              <Text style={styles.leaderDate}>
                {new Date(job.createdAt).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </Text>
            </View>
          </View>
          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{job.description}</Text>
          </View>
          {/* Funding Progress */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Funding Progress</Text>
            <TouchableOpacity
              style={styles.fundingCard}
              onPress={() => setShowContributorsModal(true)}
              disabled={
                !job.contributorCount || Number(job.contributorCount) === 0
              }
            >
              <View style={styles.fundingHeader}>
                <Text style={styles.fundingAmount}>
                  ₹{job.collectedAmount} raised
                </Text>
                <Text style={styles.fundingPercent}>
                  {fundingPercent.toFixed(0)}%
                </Text>
              </View>
              <View style={styles.progressBar}>
                <View
                  style={[styles.progressFill, { width: `${fundingPercent}%` }]}
                />
              </View>
              <View style={styles.fundingFooter}>
                <Text style={styles.targetText}>Goal: ₹{job.targetAmount}</Text>
                {job.contributorCount != null &&
                  Number(job.contributorCount) > 0 && (
                    <Text style={styles.contributorCountText}>
                      {job.contributorCount} contributor
                      {Number(job.contributorCount) !== 1 ? "s" : ""}
                    </Text>
                  )}
              </View>
            </TouchableOpacity>
          </View>
          {/* Contribution Section */}
          {job.status === "FUNDING_OPEN" && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Contribute</Text>
              {user ? (
                <View>
                  <View style={styles.contributeCard}>
                    <TextInput
                      style={[
                        styles.contributeInput,
                        contributionError && styles.contributeInputError,
                      ]}
                      maxLength={6}
                      placeholder="Enter amount (₹)"
                      value={contributionAmount}
                      onChangeText={(text) => {
                        const filtered = text.replace(/[^0-9.]/g, "");
                        setContributionAmount(filtered);
                        if (contributionError) setContributionError("");
                      }}
                      keyboardType="decimal-pad"
                    />
                    <TouchableOpacity
                      style={[
                        styles.contributeButton,
                        contributing && styles.contributeButtonDisabled,
                      ]}
                      onPress={handleContribute}
                      disabled={contributing}
                    >
                      {contributing ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <Text style={styles.contributeButtonText}>
                          Contribute
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                  {contributionError ? (
                    <Text style={styles.contributionErrorText}>
                      {contributionError}
                    </Text>
                  ) : (
                    contributionAmount && (
                      <Text style={styles.contributionHint}>
                        ₹
                        {parseFloat(contributionAmount).toLocaleString("en-IN")}
                      </Text>
                    )
                  )}
                </View>
              ) : (
                <View style={styles.loginPrompt}>
                  <Text style={styles.loginPromptText}>
                    Please login to contribute
                  </Text>
                  <TouchableOpacity
                    style={styles.loginButton}
                    onPress={() => navigation.navigate("Auth")}
                  >
                    <Text style={styles.loginButtonText}>Login</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
          {/* Ledger Section for Leader Execution - Visible to contributors */}
          {job.executionMode === "LEADER_EXECUTION" &&
            (job.status === "IN_PROGRESS" ||
              job.status === "AWAITING_VERIFICATION" ||
              job.status === "UNDER_REVIEW" ||
              job.status === "COMPLETED") && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Pool Ledger</Text>
                {ledger && ledger.totalRaised > 0 && (
                  <TouchableOpacity
                    style={styles.ledgerSummary}
                    onPress={() => setShowExpensesModal(true)}
                  >
                    <View style={styles.ledgerRowCompact}>
                      <View style={styles.ledgerCompactItem}>
                        <Text style={styles.ledgerCompactLabel}>Raised</Text>
                        <Text style={styles.ledgerCompactValue}>
                          ₹{Number(ledger.totalRaised).toLocaleString("en-IN")}
                        </Text>
                      </View>
                      <View style={styles.ledgerDivider} />
                      <View style={styles.ledgerCompactItem}>
                        <Text style={styles.ledgerCompactLabel}>Spent</Text>
                        <Text style={styles.ledgerCompactValue}>
                          ₹{Number(ledger.totalSpent).toLocaleString("en-IN")}
                        </Text>
                      </View>
                      <View style={styles.ledgerDivider} />
                      <View style={styles.ledgerCompactItem}>
                        <Text style={styles.ledgerCompactLabel}>Left</Text>
                        <Text style={styles.ledgerCompactValue}>
                          ₹
                          {Number(ledger.remainingBalance).toLocaleString(
                            "en-IN",
                          )}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                )}
                {ledger?.transactions && ledger.transactions.length > 0 && (
                  <TouchableOpacity
                    style={styles.viewAllButton}
                    onPress={() => setShowExpensesModal(true)}
                  >
                    <Text style={styles.viewAllText}>
                      View all {ledger.transactions.length} expenses
                    </Text>
                  </TouchableOpacity>
                )}
                {(!ledger?.transactions ||
                  ledger.transactions.length === 0) && (
                  <Text style={styles.noExpensesText}>
                    No expenses added yet
                  </Text>
                )}
              </View>
            )}

          {/* Leader Execution Mode - Start Work (when funding is complete) */}
          {job.executionMode === "LEADER_EXECUTION" &&
            job.status === "FUNDING_COMPLETE" &&
            user?.id === job.leaderId && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Start Execution</Text>
                <View style={styles.actionCard}>
                  <Text style={styles.actionDescription}>
                    Start working on this pool. You can add expenses as you
                    complete the work.
                  </Text>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={async () => {
                      try {
                        setIsLoading(true);
                        await jobsAPI.update(jobId, { status: "IN_PROGRESS" });
                        Alert.alert("Success", "Pool execution started!");
                        fetchJob();
                      } catch (error: any) {
                        Alert.alert(
                          "Error",
                          error.message || "Failed to start execution",
                        );
                      } finally {
                        setIsLoading(false);
                      }
                    }}
                  >
                    <Text style={styles.actionButtonText}>Start Work</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

          {/* Leader Execution Mode - Mark as Completed (when in progress) */}
          {job.executionMode === "LEADER_EXECUTION" &&
            job.status === "IN_PROGRESS" &&
            user?.id === job.leaderId && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Mark as Completed</Text>
                <View style={styles.actionCard}>
                  <Text style={styles.actionDescription}>
                    Once you mark as completed, contributors will have 24 hours
                    to review and raise disputes if needed. After 24 hours,
                    refunds will be processed automatically.
                  </Text>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => {
                      Alert.alert(
                        "Confirm Completion",
                        "Are you sure you want to mark this pool as completed? Contributors will have 24 hours to review and raise disputes.",
                        [
                          { text: "Cancel", style: "cancel" },
                          {
                            text: "Confirm",
                            onPress: async () => {
                              try {
                                setIsLoading(true);
                                await jobsAPI.update(jobId, {
                                  status: "UNDER_REVIEW",
                                });
                                Alert.alert(
                                  "Success",
                                  "Pool marked as completed! Contributors can now review.",
                                );
                                fetchJob();
                              } catch (error: any) {
                                Alert.alert(
                                  "Error",
                                  error.message ||
                                    "Failed to mark as completed",
                                );
                              } finally {
                                setIsLoading(false);
                              }
                            },
                          },
                        ],
                      );
                    }}
                  >
                    <Text style={styles.actionButtonText}>
                      Mark as Completed
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

          {/* Leader Execution Mode - Add Expense (when in progress) */}
          {job.executionMode === "LEADER_EXECUTION" &&
            job.status === "IN_PROGRESS" &&
            user?.id === job.leaderId && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Add Expense</Text>
                <View style={styles.expenseForm}>
                  <TextInput
                    style={[
                      styles.expenseInput,
                      expenseDescriptionError && styles.expenseInputError,
                    ]}
                    placeholder="Expense description"
                    value={expenseDescription}
                    onChangeText={(text) => {
                      setExpenseDescription(text);
                      if (expenseDescriptionError)
                        setExpenseDescriptionError("");
                    }}
                  />
                  {expenseDescriptionError ? (
                    <Text style={styles.expenseErrorText}>
                      {expenseDescriptionError}
                    </Text>
                  ) : null}
                  <TextInput
                    style={[
                      styles.expenseInput,
                      expenseAmountError && styles.expenseInputError,
                    ]}
                    placeholder="Amount (₹)"
                    value={expenseAmount}
                    maxLength={6}
                    onChangeText={(text) => {
                      const filtered = text.replace(/[^0-9.]/g, "");
                      setExpenseAmount(filtered);
                      if (expenseAmountError) setExpenseAmountError("");
                    }}
                    keyboardType="decimal-pad"
                  />
                  {expenseAmountError ? (
                    <Text style={styles.expenseErrorText}>
                      {expenseAmountError}
                    </Text>
                  ) : null}
                  {/* Image Picker - Required */}
                  <TouchableOpacity
                    style={[
                      styles.imagePickerButton,
                      expenseImageError && styles.imagePickerButtonError,
                    ]}
                    onPress={pickImage}
                  >
                    {expenseImage ? (
                      <View style={styles.imagePreviewContainer}>
                        <Image
                          source={{ uri: expenseImage }}
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
                        <Text style={styles.imagePickerText}>
                          Add Proof Image *
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                  {expenseImageError ? (
                    <Text style={styles.expenseErrorText}>
                      {expenseImageError}
                    </Text>
                  ) : null}
                  <TouchableOpacity
                    style={[
                      styles.expenseButton,
                      (addExpenseLoading ||
                        !expenseAmount ||
                        !expenseDescription ||
                        !expenseImage) &&
                        styles.expenseButtonDisabled,
                    ]}
                    onPress={handleAddExpense}
                    disabled={
                      addExpenseLoading ||
                      !expenseAmount ||
                      !expenseDescription ||
                      !expenseImage
                    }
                  >
                    {addExpenseLoading ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text style={styles.expenseButtonText}>Add Expense</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

          {/* Refund Section for Completed Pools */}
          {job.status === "COMPLETED" && user && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Your Refund</Text>
              {job.contributorProfiles?.some((c) => c.id === user.id) ? (
                <View style={styles.refundCard}>
                  {/* Use ledger-based calculation: (Remaining ÷ Total Raised) × Contribution = Refund */}
                  {(() => {
                    const totalRaised = Number(
                      job.metadata?.totalRaised ?? job.collectedAmount,
                    );
                    const remainingBalance = Number(
                      job.metadata?.remainingBalance ?? 0,
                    );
                    const refundRatio =
                      totalRaised > 0 ? remainingBalance / totalRaised : 0;
                    const myContribution = Number(
                      job.contributorProfiles?.find((c) => c.id === user.id)
                        ?.contributionAmount ?? 0,
                    );
                    const refundAmount = myContribution * refundRatio;
                    return (
                      <>
                        <View style={styles.refundRow}>
                          <Text style={styles.refundLabel}>
                            Your Contribution
                          </Text>
                          <Text style={styles.refundValue}>
                            ₹{myContribution.toLocaleString("en-IN")}
                          </Text>
                        </View>
                        <View style={styles.refundRow}>
                          <Text style={styles.refundLabel}>Platform Fee</Text>
                          <Text style={styles.refundValue}>
                            ₹
                            {Number(
                              myContribution * (job.platformFeePercent / 100),
                            ).toLocaleString("en-IN")}
                          </Text>
                        </View>
                        <View style={[styles.refundRow, styles.refundTotalRow]}>
                          <Text style={styles.refundTotalLabel}>
                            Refund Amount
                          </Text>
                          <Text style={styles.refundTotalValue}>
                            ₹{refundAmount.toLocaleString("en-IN")}
                          </Text>
                        </View>
                      </>
                    );
                  })()}
                </View>
              ) : (
                <View style={styles.refundCard}>
                  <Text style={styles.noRefundText}>
                    You did not contribute to this pool
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Contributors Modal */}
      <Modal
        visible={showContributorsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowContributorsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Contributors ({job.contributorCount || 0})
              </Text>
              <TouchableOpacity
                onPress={() => setShowContributorsModal(false)}
                style={styles.modalCloseButton}
              >
                <FontAwesome name="close" size={20} color={colors.foreground} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScrollView}>
              {/* Refund Calculation Info - shown only for COMPLETED/UNDER_REVIEW */}
              {(job.status === "COMPLETED" ||
                job.status === "UNDER_REVIEW") && (
                <View style={styles.refundInfoCard}>
                  <View style={styles.refundInfoHeader}>
                    <Text style={styles.refundInfoTitle}>
                      Refund Calculation
                    </Text>
                    <TouchableOpacity
                      onPress={() => setShowRefundInfo(!showRefundInfo)}
                      style={styles.infoIconButton}
                    >
                      <FontAwesome
                        name="info-circle"
                        size={18}
                        color={colors.primary}
                      />
                    </TouchableOpacity>
                  </View>
                  {showRefundInfo && (
                    <View style={styles.refundInfoContent}>
                      <Text style={styles.refundInfoText}>
                        Total Raised: ₹
                        {Number(
                          job.metadata?.totalRaised ?? job.collectedAmount,
                        ).toLocaleString("en-IN")}
                      </Text>
                      <Text style={styles.refundInfoText}>
                        Spent: ₹
                        {Number(
                          (job.metadata?.totalRaised ?? job.collectedAmount) -
                            (job.metadata?.remainingBalance ?? 0),
                        ).toLocaleString("en-IN")}
                      </Text>
                      <Text style={styles.refundInfoText}>
                        Remaining: ₹
                        {Number(
                          job.metadata?.remainingBalance ?? 0,
                        ).toLocaleString("en-IN")}
                      </Text>
                      <Text style={styles.refundInfoFormula}>
                        Calculation: (Remaining ÷ Total Raised) × Your
                        Contribution = Your Refund
                      </Text>
                    </View>
                  )}
                  {job.status === "UNDER_REVIEW" && job.reviewDeadline && (
                    <View style={styles.refundDeadlineContainer}>
                      <Text style={styles.refundDeadlineText}>
                        Refunds will be credited after:{" "}
                        {new Date(job.reviewDeadline).toLocaleString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Text>
                    </View>
                  )}
                </View>
              )}
              {job.contributorProfiles && job.contributorProfiles.length > 0 ? (
                job.contributorProfiles.map((contributor, index) => {
                  // Show refund only for COMPLETED or UNDER_REVIEW status
                  const isRefundVisible =
                    job.status === "COMPLETED" || job.status === "UNDER_REVIEW";
                  // Use ledger-based calculation: (Remaining ÷ Total Raised) × Contribution = Refund
                  const totalRaised = Number(
                    job.metadata?.totalRaised ?? job.collectedAmount,
                  );
                  const remainingBalance = Number(
                    job.metadata?.remainingBalance ?? 0,
                  );
                  const refundRatio =
                    totalRaised > 0 ? remainingBalance / totalRaised : 0;
                  const refundAmount =
                    Number(contributor?.contributionAmount ?? 0) * refundRatio;
                  return (
                    <View key={index} style={styles.contributorItem}>
                      <View style={styles.contributorRow}>
                        <View style={styles.contributorAvatar}>
                          <Text style={styles.contributorInitial}>
                            {contributor?.name?.charAt(0) || ""}
                          </Text>
                        </View>
                        <View style={styles.contributorInfo}>
                          <Text style={styles.contributorName}>
                            {contributor?.name}
                          </Text>
                          {isRefundVisible && (
                            <Text style={styles.refundAmountText}>
                              Refund: ₹{refundAmount.toLocaleString("en-IN")}
                            </Text>
                          )}
                        </View>
                        <View style={styles.contributorAmountContainer}>
                          <Text style={styles.contributorAmount}>
                            ₹
                            {Number(
                              contributor?.contributionAmount ?? 0,
                            ).toLocaleString("en-IN")}
                          </Text>
                          {contributor?.contributionDate && (
                            <Text style={styles.contributorDate}>
                              {new Date(
                                contributor.contributionDate,
                              ).toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </Text>
                          )}
                        </View>
                      </View>
                    </View>
                  );
                })
              ) : (
                <Text style={styles.noContributorsText}>
                  No contributors yet
                </Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Expenses Modal */}
      <Modal
        visible={showExpensesModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowExpensesModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Pool Expenses ({ledger?.transactions?.length || 0})
              </Text>
              <TouchableOpacity
                onPress={() => setShowExpensesModal(false)}
                style={styles.modalCloseButton}
              >
                <FontAwesome name="close" size={20} color={colors.foreground} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScrollView}>
              {ledger?.transactions && ledger.transactions.length > 0 ? (
                ledger.transactions.map((tx: any, index: number) => (
                  <View key={index} style={styles.expenseItem}>
                    {tx.proofUrl ? (
                      <Image
                        source={{ uri: tx.proofUrl }}
                        style={styles.expenseImage}
                      />
                    ) : null}
                    <View style={styles.expenseInfo}>
                      <Text style={styles.expenseDescription}>
                        {tx.description}
                      </Text>
                      <Text style={styles.expenseDate}>
                        {tx.createdAt
                          ? new Date(tx.createdAt).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : ""}
                      </Text>
                    </View>
                    <Text style={styles.expenseAmount}>
                      ₹{Number(tx.amount).toLocaleString("en-IN")}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.noExpensesText}>No expenses found</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Edit Pool Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Pool</Text>
              <TouchableOpacity
                onPress={() => setShowEditModal(false)}
                style={styles.modalCloseButton}
              >
                <FontAwesome name="close" size={20} color={colors.foreground} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScrollView}>
              <View style={styles.expenseForm}>
                <Text style={styles.fieldLabel}>Title</Text>
                <TextInput
                  style={[
                    styles.expenseInput,
                    editErrors.title && styles.expenseInputError,
                  ]}
                  placeholder="Pool title"
                  value={editTitle}
                  onChangeText={(text) => {
                    setEditTitle(text);
                    if (editErrors.title) {
                      setEditErrors({ ...editErrors, title: undefined });
                    }
                  }}
                  maxLength={25}
                />
                {editErrors.title ? (
                  <Text style={styles.expenseErrorText}>
                    {editErrors.title}
                  </Text>
                ) : null}

                <Text style={styles.fieldLabel}>Description</Text>
                <TextInput
                  style={[
                    styles.expenseInput,
                    styles.textArea,
                    editErrors.description && styles.expenseInputError,
                  ]}
                  placeholder="Pool description"
                  value={editDescription}
                  multiline
                  numberOfLines={4}
                  onChangeText={(text) => {
                    setEditDescription(text);
                    if (editErrors.description) {
                      setEditErrors({ ...editErrors, description: undefined });
                    }
                  }}
                />
                {editErrors.description ? (
                  <Text style={styles.expenseErrorText}>
                    {editErrors.description}
                  </Text>
                ) : null}

                <Text style={styles.fieldLabel}>Location</Text>
                <TextInput
                  style={[
                    styles.expenseInput,
                    editErrors.location && styles.expenseInputError,
                  ]}
                  placeholder="Location"
                  value={editLocation}
                  onChangeText={(text) => {
                    setEditLocation(text);
                    if (editErrors.location) {
                      setEditErrors({ ...editErrors, location: undefined });
                    }
                  }}
                  maxLength={100}
                />
                {editErrors.location ? (
                  <Text style={styles.expenseErrorText}>
                    {editErrors.location}
                  </Text>
                ) : null}

                <Text style={styles.fieldLabel}>Target Amount (₹)</Text>
                <TextInput
                  style={[
                    styles.expenseInput,
                    editErrors.targetAmount && styles.expenseInputError,
                  ]}
                  placeholder="Target amount"
                  value={editTargetAmount}
                  keyboardType="decimal-pad"
                  maxLength={8}
                  onChangeText={(text) => {
                    const filtered = text.replace(/[^0-9.]/g, "");
                    setEditTargetAmount(filtered);
                    if (editErrors.targetAmount) {
                      setEditErrors({ ...editErrors, targetAmount: undefined });
                    }
                  }}
                />
                {editErrors.targetAmount ? (
                  <Text style={styles.expenseErrorText}>
                    {editErrors.targetAmount}
                  </Text>
                ) : null}

                {/* Execution mode is always LEADER_EXECUTION - hidden from user */}

                {/* Private Pool Toggle - always shown */}
                <View style={styles.privateToggleContainer}>
                  <View style={styles.privateToggleLeft}>
                    <FontAwesome name="lock" size={16} color={colors.primary} />
                    <Text style={styles.privateToggleText}>
                      Private Pool (Contributors Only)
                    </Text>
                  </View>
                  <Switch
                    value={editIsPrivate}
                    onValueChange={setEditIsPrivate}
                    trackColor={{
                      false: colors.border,
                      true: colors.primary,
                    }}
                    thumbColor="white"
                  />
                </View>
                {editIsPrivate && (
                  <Text style={styles.privateHintText}>
                    Only contributors can see this pool
                  </Text>
                )}

                {/* Pool Image - Optional */}
                <Text style={styles.fieldLabel}>Pool Image (Optional)</Text>
                <TouchableOpacity
                  style={styles.imagePickerButton}
                  onPress={pickEditImage}
                >
                  {editImage ? (
                    <View style={styles.imagePreviewContainer}>
                      <Image
                        source={{ uri: editImage }}
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

                <TouchableOpacity
                  style={[
                    styles.expenseButton,
                    editLoading && styles.expenseButtonDisabled,
                  ]}
                  onPress={handleEditPool}
                  disabled={editLoading}
                >
                  {editLoading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={styles.expenseButtonText}>Save Changes</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 16,
    color: colors.muted,
  },
  imageContainer: {
    height: 200,
    backgroundColor: colors.secondary,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  headerBadges: {
    position: "absolute",
    top: 16,
    left: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerBadgesRight: {
    position: "absolute",
    top: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusBadgeContainer: {
    position: "absolute",
    bottom: 16,
    right: 16,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgesLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  badgesRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  privateBadge: {
    backgroundColor: colors.primary,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  modeBadge: {
    backgroundColor: colors.leaderExecution,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 4,
  },
  modeBadgeWorker: {
    backgroundColor: colors.workerSelected,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 4,
  },
  modeBadgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "600",
  },
  statusBadgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  content: {
    padding: 16,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.foreground,
    flex: 1,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  editButtonText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "600",
  },
  locationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  locationLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
  },
  locationText: {
    fontSize: 14,
    color: colors.muted,
  },
  dateText: {
    fontSize: 12,
    color: colors.muted,
  },
  leaderCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.secondary,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  leaderAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + "20",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  leaderInfo: {
    flex: 1,
  },
  leaderLabel: {
    fontSize: 12,
    color: colors.muted,
  },
  leaderName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.foreground,
  },
  leaderDate: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.foreground,
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: colors.muted,
    lineHeight: 22,
  },
  fundingCard: {
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fundingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  fundingAmount: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.foreground,
  },
  fundingPercent: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.primary,
  },
  progressBar: {
    height: 12,
    backgroundColor: colors.secondary,
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: 6,
  },
  fundingFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  targetText: {
    fontSize: 14,
    color: colors.muted,
  },
  contributorCountText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "600",
  },
  contributeCard: {
    flexDirection: "row",
    gap: 12,
  },
  contributeInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  },
  contributeInputError: {
    borderColor: colors.destructive,
    borderWidth: 2,
  },
  contributionErrorText: {
    color: colors.destructive,
    fontSize: 12,
    marginTop: 4,
  },
  contributionHint: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "600",
    marginTop: 4,
  },
  contributeButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    borderRadius: 12,
    justifyContent: "center",
  },
  contributeButtonDisabled: {
    opacity: 0.6,
  },
  contributeButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  loginPrompt: {
    backgroundColor: colors.secondary,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  loginPromptText: {
    fontSize: 14,
    color: colors.muted,
    marginBottom: 12,
  },
  loginButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  loginButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  detailsCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.muted,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.foreground,
  },
  contributorsList: {
    gap: 8,
  },
  contributorItem: {
    backgroundColor: colors.card,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
  },
  contributorRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  contributorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + "20",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  contributorInitial: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.primary,
  },
  contributorInfo: {
    flex: 1,
  },
  contributorName: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.foreground,
  },
  contributorPhone: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  contributorDate: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  contributorAmountContainer: {
    alignItems: "flex-end",
  },
  contributorAmount: {
    fontSize: 14,
    fontWeight: "bold",
    color: colors.primary,
  },
  refundAmountText: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.foreground,
  },
  modalCloseButton: {
    padding: 8,
  },
  modalScrollView: {
    padding: 16,
  },
  noContributorsText: {
    fontSize: 14,
    color: colors.muted,
    textAlign: "center",
    paddingVertical: 20,
  },
  // Refund section styles
  refundCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  refundRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  refundLabel: {
    fontSize: 14,
    color: colors.muted,
  },
  refundValue: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.foreground,
  },
  refundTotalRow: {
    backgroundColor: colors.secondary,
    borderBottomWidth: 0,
  },
  refundTotalLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.foreground,
  },
  refundTotalValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.primary,
  },
  noRefundText: {
    fontSize: 14,
    color: colors.muted,
    textAlign: "center",
    padding: 16,
  },
  // Refund Info styles
  refundInfoCard: {
    backgroundColor: colors.secondary,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  refundInfoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  refundInfoTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.foreground,
  },
  infoIconButton: {
    padding: 4,
  },
  refundInfoContent: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  refundInfoText: {
    fontSize: 12,
    color: colors.muted,
    marginBottom: 4,
  },
  refundInfoFormula: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: "500",
    marginTop: 8,
  },
  refundDeadlineContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  refundDeadlineText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: "600",
  },
  // Ledger styles
  ledgerSummary: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    marginBottom: 12,
  },
  ledgerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  ledgerRowCompact: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  ledgerCompactItem: {
    flex: 1,
    alignItems: "center",
  },
  ledgerCompactLabel: {
    fontSize: 12,
    color: colors.muted,
    marginBottom: 4,
  },
  ledgerCompactValue: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.foreground,
  },
  ledgerDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.border,
  },
  ledgerLabel: {
    fontSize: 14,
    color: colors.muted,
  },
  ledgerValue: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.foreground,
  },
  expenseList: {
    gap: 8,
  },
  expenseItem: {
    backgroundColor: colors.card,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 5,
  },
  expenseImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseDescription: {
    fontSize: 14,
    color: colors.foreground,
  },
  expenseDate: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  expenseAmount: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },
  noExpensesText: {
    fontSize: 14,
    color: colors.muted,
    textAlign: "center",
    paddingVertical: 16,
  },
  viewAllButton: {
    backgroundColor: colors.secondary,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 4,
  },
  viewAllText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "600",
  },
  expenseForm: {
    gap: 12,
  },
  expenseInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  },
  expenseInputError: {
    borderColor: colors.destructive,
    borderWidth: 2,
  },
  expenseErrorText: {
    color: colors.destructive,
    fontSize: 12,
    marginTop: -8,
    marginBottom: 8,
  },
  imagePickerButtonError: {
    borderColor: colors.destructive,
    borderWidth: 2,
  },
  expenseButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  expenseButtonDisabled: {
    opacity: 0.6,
  },
  expenseButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  // Image Picker styles
  imagePickerButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    borderStyle: "dashed",
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 100,
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
  imagePreviewContainer: {
    alignItems: "center",
    width: "100%",
  },
  imagePreview: {
    width: "100%",
    height: 150,
    borderRadius: 8,
    marginBottom: 8,
  },
  imagePreviewText: {
    fontSize: 12,
    color: colors.muted,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.foreground,
    marginBottom: 8,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  headerEditButton: {
    padding: 8,
  },
  executionModeContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  executionModeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.background,
  },
  executionModeButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  executionModeText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },
  executionModeTextActive: {
    color: "white",
  },
  // Private toggle styles
  privateToggleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
  },
  privateToggleLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  privateToggleText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.foreground,
  },
  privateHintText: {
    fontSize: 12,
    color: colors.muted,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  // Action card styles
  actionCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  actionDescription: {
    fontSize: 14,
    color: colors.muted,
    marginBottom: 16,
    lineHeight: 20,
  },
  actionButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  actionButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
