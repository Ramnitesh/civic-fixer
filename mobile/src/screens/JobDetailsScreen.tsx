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
} from "react-native";
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

  useEffect(() => {
    fetchJob();
  }, [jobId]);

  const handleContribute = async () => {
    if (!contributionAmount || parseFloat(contributionAmount) <= 0) {
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }

    try {
      setContributing(true);
      await contributionsAPI.create(jobId, parseFloat(contributionAmount));
      Alert.alert("Success", "Thank you for your contribution!");
      setContributionAmount("");
      fetchJob();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to contribute");
    } finally {
      setContributing(false);
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
          {/* Title & Location */}
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
              <Text style={styles.leaderLabel}>Project Leader</Text>
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
            <View style={styles.fundingCard}>
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
              <Text style={styles.targetText}>Goal: ₹{job.targetAmount}</Text>
            </View>
          </View>

          {/* Contribution Section */}
          {job.status === "FUNDING_OPEN" && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Contribute</Text>
              {user ? (
                <View style={styles.contributeCard}>
                  <TextInput
                    style={styles.contributeInput}
                    placeholder="Enter amount"
                    value={contributionAmount}
                    onChangeText={setContributionAmount}
                    keyboardType="numeric"
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
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Private Property</Text>
                <Text style={styles.detailValue}>
                  {job.isPrivateResidentialProperty ? "Yes" : "No"}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Platform Fee</Text>
                <Text style={styles.detailValue}>
                  {job.platformFeePercent}%
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Created</Text>
                <Text style={styles.detailValue}>
                  {new Date(job.createdAt).toLocaleDateString()}
                </Text>
              </View>
            </View>
          </View>

          {/* Contributors */}
          {job.contributorCount && job.contributorCount > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Contributors ({job.contributorCount})
              </Text>
              <View style={styles.contributorsList}>
                {job.contributorProfiles?.map((contributor, index) => (
                  <View key={index} style={styles.contributorItem}>
                    <View style={styles.contributorAvatar}>
                      <Text style={styles.contributorInitial}>
                        {contributor.name.charAt(0)}
                      </Text>
                    </View>
                    <View style={styles.contributorInfo}>
                      <Text style={styles.contributorName}>
                        {contributor.name}
                      </Text>
                      <Text style={styles.contributorAmount}>
                        ₹{contributor.contributionAmount}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}
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
  targetText: {
    fontSize: 14,
    color: colors.muted,
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
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
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
  contributorAmount: {
    fontSize: 14,
    fontWeight: "bold",
    color: colors.primary,
  },
});
