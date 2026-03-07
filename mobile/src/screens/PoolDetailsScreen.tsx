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
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useRoute, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors } from "../utils/colors";
import { jobsAPI, contributionsAPI } from "../services/api";
import { Job } from "../types";
import { useAuth } from "../navigation/AuthContext";
import FontAwesome from "@expo/vector-icons/FontAwesome";

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
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseDescription, setExpenseDescription] = useState("");
  const [expenseImage, setExpenseImage] = useState<string | null>(null);
  const [addExpenseLoading, setAddExpenseLoading] = useState(false);

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
    // Check if amount exceeds remaining funding
    if (job) {
      const remaining = job.targetAmount - job.collectedAmount;
      if (numAmount > remaining) {
        return `Maximum contribution is ₹${remaining.toLocaleString("en-IN")} (remaining)`;
      }
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
    if (job?.executionMode === "LEADER_EXECUTION") {
      fetchLedger();
    }
  }, [jobId]);

  useEffect(() => {
    if (job?.executionMode === "LEADER_EXECUTION") {
      fetchLedger();
    }
  }, [job?.executionMode]);

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
    if (!expenseAmount || !expenseDescription) return;
    try {
      setAddExpenseLoading(true);
      // Use the jobsAPI.createExpense function with proofUrl from the selected image
      await jobsAPI.createExpense(jobId, {
        amount: parseFloat(expenseAmount),
        description: expenseDescription,
        proofUrl: expenseImage || "",
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

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.title}>{job.title}</Text>
          <View style={styles.locationRow}>
            <FontAwesome name="map-marker" size={16} color={colors.muted} />
            <Text style={styles.locationText}>{job.location}</Text>
          </View>
          {/* Leader Info */}
          <View style={styles.leaderCard}>
            <View style={styles.leaderAvatar}>
              <FontAwesome name="user" size={20} color={colors.primary} />
            </View>
            <View style={styles.leaderInfo}>
              <Text style={styles.leaderLabel}>Pool Owened By</Text>
              <Text style={styles.leaderName}>
                {job.leader?.name || "Unknown"}
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
          {/* Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Details</Text>
            <View style={styles.detailsCard}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Execution Mode</Text>
                <Text style={styles.detailValue}>
                  {job.executionMode === "WORKER_EXECUTION"
                    ? "Worker Execution"
                    : "Leader Execution"}
                </Text>
              </View>
              {job.executionMode === "WORKER_EXECUTION" && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Private Property</Text>
                  <Text style={styles.detailValue}>
                    {job.isPrivateResidentialProperty ? "Yes" : "No"}
                  </Text>
                </View>
              )}
              {job.executionMode === "LEADER_EXECUTION" && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Private Job</Text>
                  <Text style={styles.detailValue}>
                    {job.isPrivateJob ? "Yes (Contributors Only)" : "No"}
                  </Text>
                </View>
              )}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Platform Fee</Text>
                <Text style={styles.detailValue}>
                  {job.platformFeePercent}%
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Created</Text>
                <Text style={styles.detailValue}>
                  {new Date(job.createdAt).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </Text>
              </View>
            </View>
          </View>
          {/* Ledger Section for Leader Execution - Visible to contributors */}
          {job.executionMode === "LEADER_EXECUTION" &&
            (job.status === "IN_PROGRESS" ||
              job.status === "AWAITING_VERIFICATION" ||
              job.status === "UNDER_REVIEW" ||
              job.status === "COMPLETED") && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Pool Ledger</Text>
                {ledger && ledger.totalRaised > 0 && (
                  <View style={styles.ledgerSummary}>
                    <View style={styles.ledgerRow}>
                      <Text style={styles.ledgerLabel}>Total Raised</Text>
                      <Text style={styles.ledgerValue}>
                        ₹{Number(ledger.totalRaised).toLocaleString("en-IN")}
                      </Text>
                    </View>
                    <View style={styles.ledgerRow}>
                      <Text style={styles.ledgerLabel}>Spent</Text>
                      <Text style={styles.ledgerValue}>
                        ₹{Number(ledger.totalSpent).toLocaleString("en-IN")}
                      </Text>
                    </View>
                    <View style={styles.ledgerRow}>
                      <Text style={styles.ledgerLabel}>Remaining</Text>
                      <Text style={styles.ledgerValue}>
                        ₹
                        {Number(ledger.remainingBalance).toLocaleString(
                          "en-IN",
                        )}
                      </Text>
                    </View>
                  </View>
                )}
                {ledger?.transactions && ledger.transactions.length > 0 ? (
                  <View style={styles.expenseList}>
                    {ledger.transactions.map((tx: any, index: number) => (
                      <View key={index} style={styles.expenseItem}>
                        <View style={styles.expenseInfo}>
                          <Text style={styles.expenseDescription}>
                            {tx.description}
                          </Text>
                          <Text style={styles.expenseDate}>
                            {tx.createdAt
                              ? new Date(tx.createdAt).toLocaleDateString(
                                  "en-GB",
                                  {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  },
                                )
                              : ""}
                          </Text>
                        </View>
                        <Text style={styles.expenseAmount}>
                          ₹{Number(tx.amount).toLocaleString("en-IN")}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.noExpensesText}>
                    No expenses added yet
                  </Text>
                )}
              </View>
            )}

          {/* Add Expense Section - Only for Owner when IN_PROGRESS */}
          {job.executionMode === "LEADER_EXECUTION" &&
            job.status === "IN_PROGRESS" &&
            user?.id === job.leaderId && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Add Expense</Text>
                <View style={styles.expenseForm}>
                  <TextInput
                    style={styles.expenseInput}
                    placeholder="Expense description"
                    value={expenseDescription}
                    onChangeText={setExpenseDescription}
                  />
                  <TextInput
                    style={styles.expenseInput}
                    placeholder="Amount (₹)"
                    value={expenseAmount}
                    onChangeText={setExpenseAmount}
                    keyboardType="decimal-pad"
                  />
                  {/* Image Picker */}
                  <TouchableOpacity
                    style={styles.imagePickerButton}
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
                          Add Proof Image (Optional)
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.expenseButton,
                      (addExpenseLoading ||
                        !expenseAmount ||
                        !expenseDescription) &&
                        styles.expenseButtonDisabled,
                    ]}
                    onPress={handleAddExpense}
                    disabled={
                      addExpenseLoading || !expenseAmount || !expenseDescription
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
  statusBadge: {
    position: "absolute",
    top: 16,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
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
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.foreground,
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 16,
  },
  locationText: {
    fontSize: 14,
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
    justifyContent: "space-between",
    alignItems: "center",
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
});
