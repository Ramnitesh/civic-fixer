import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Image,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors } from "../utils/colors";
import { contributionsAPI, jobsAPI } from "../services/api";
import { Contribution, Job } from "../types";
import FontAwesome from "@expo/vector-icons/FontAwesome";

export default function ContributionsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [jobs, setJobs] = useState<{ [key: number]: Job }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchContributions = async () => {
    try {
      setIsLoading(true);
      const data = await contributionsAPI.getMy();
      setContributions(data || []);

      // Fetch job details for each contribution
      const jobIds = [
        ...new Set(data?.map((c: Contribution) => c.jobId) || []),
      ];
      const jobsData: { [key: number]: Job } = {};
      for (const jobId of jobIds) {
        try {
          const job = await jobsAPI.getById(jobId);
          jobsData[jobId] = job;
        } catch (e) {
          console.error("Error fetching job:", jobId);
        }
      }
      setJobs(jobsData);
    } catch (error) {
      console.error("Error fetching contributions:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchContributions();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchContributions();
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

  const renderContribution = ({ item }: { item: Contribution }) => {
    const job = jobs[item.jobId];

    return (
      <TouchableOpacity
        style={styles.contributionCard}
        onPress={() => navigation.navigate("JobDetails", { jobId: item.jobId })}
      >
        <View style={styles.jobImageContainer}>
          {job?.imageUrl ? (
            <Image source={{ uri: job.imageUrl }} style={styles.jobImage} />
          ) : (
            <View style={styles.jobImagePlaceholder}>
              <FontAwesome name="briefcase" size={24} color={colors.muted} />
            </View>
          )}
        </View>
        <View style={styles.contributionContent}>
          <Text style={styles.jobTitle} numberOfLines={1}>
            {job?.title || `Job #${item.jobId}`}
          </Text>
          <View style={styles.jobLocation}>
            <FontAwesome name="map-marker" size={12} color={colors.muted} />
            <Text style={styles.locationText} numberOfLines={1}>
              {job?.location || "Unknown location"}
            </Text>
          </View>
          <View style={styles.contributionDetails}>
            <View style={styles.amountContainer}>
              <Text style={styles.amountLabel}>Contributed</Text>
              <Text style={styles.amountValue}>₹{item.amount}</Text>
            </View>
            {job && (
              <View style={styles.statusContainer}>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(job.status) + "20" },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      { color: getStatusColor(job.status) },
                    ]}
                  >
                    {job.status.replace(/_/g, " ")}
                  </Text>
                </View>
              </View>
            )}
          </View>
          <Text style={styles.dateText}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : contributions.length === 0 ? (
        <View style={styles.emptyState}>
          <FontAwesome name="heart" size={48} color={colors.muted} />
          <Text style={styles.emptyTitle}>No Contributions Yet</Text>
          <Text style={styles.emptyText}>
            You haven't contributed to any jobs yet. Browse jobs to find
            projects to support!
          </Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => navigation.navigate("Jobs")}
          >
            <Text style={styles.browseButtonText}>Browse Jobs</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={contributions}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderContribution}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
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
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.foreground,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.muted,
    textAlign: "center",
    marginBottom: 24,
  },
  browseButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  browseButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  listContent: {
    padding: 16,
  },
  contributionCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  jobImageContainer: {
    height: 100,
  },
  jobImage: {
    width: "100%",
    height: "100%",
  },
  jobImagePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: colors.secondary,
    justifyContent: "center",
    alignItems: "center",
  },
  contributionContent: {
    padding: 12,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.foreground,
    marginBottom: 4,
  },
  jobLocation: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 8,
  },
  locationText: {
    fontSize: 12,
    color: colors.muted,
    flex: 1,
  },
  contributionDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  amountContainer: {
    gap: 2,
  },
  amountLabel: {
    fontSize: 10,
    color: colors.muted,
    textTransform: "uppercase",
  },
  amountValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.primary,
  },
  statusContainer: {
    alignItems: "flex-end",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
  },
  dateText: {
    fontSize: 11,
    color: colors.muted,
  },
});
