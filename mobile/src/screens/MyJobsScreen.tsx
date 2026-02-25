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
import { useAuth } from "../navigation/AuthContext";
import { colors } from "../utils/colors";
import { jobsAPI } from "../services/api";
import { Job } from "../types";
import FontAwesome from "@expo/vector-icons/FontAwesome";

export default function MyJobsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "leader" | "worker">(
    "all",
  );

  const fetchJobs = async () => {
    try {
      setIsLoading(true);

      // Fetch all jobs and filter by user
      const allJobs = await jobsAPI.getAll();
      const userId = user?.id;

      // Filter jobs where user is leader or worker
      const filteredJobs = (allJobs || []).filter(
        (job: Job) =>
          job.leaderId === userId || job.selectedWorkerId === userId,
      );

      setJobs(filteredJobs);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchJobs();
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

  const filteredJobs = jobs.filter((job) => {
    if (activeTab === "leader") return job.leaderId === user?.id;
    if (activeTab === "worker") return job.selectedWorkerId === user?.id;
    return true;
  });

  const renderJob = ({ item }: { item: Job }) => {
    const isLeader = item.leaderId === user?.id;
    const isWorker = item.selectedWorkerId === user?.id;
    const fundingPercent = Math.min(
      ((item.collectedAmount || 0) / (item.targetAmount || 1)) * 100,
      100,
    );

    return (
      <TouchableOpacity
        style={styles.jobCard}
        onPress={() => navigation.navigate("JobDetails", { jobId: item.id })}
      >
        <View style={styles.jobImageContainer}>
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.jobImage} />
          ) : (
            <View style={styles.jobImagePlaceholder}>
              <FontAwesome name="briefcase" size={24} color={colors.muted} />
            </View>
          )}
          <View
            style={[
              styles.roleBadge,
              { backgroundColor: isLeader ? colors.primary : colors.secondary },
            ]}
          >
            <Text style={styles.roleBadgeText}>
              {isLeader ? "Leader" : "Worker"}
            </Text>
          </View>
        </View>
        <View style={styles.jobContent}>
          <View style={styles.jobHeader}>
            <Text style={styles.jobTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(item.status) + "20" },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  { color: getStatusColor(item.status) },
                ]}
              >
                {item.status.replace(/_/g, " ")}
              </Text>
            </View>
          </View>
          <View style={styles.jobInfo}>
            <View style={styles.infoItem}>
              <FontAwesome name="map-marker" size={14} color={colors.muted} />
              <Text style={styles.infoText} numberOfLines={1}>
                {item.location}
              </Text>
            </View>
          </View>
          <View style={styles.fundingRow}>
            <View style={styles.progressBar}>
              <View
                style={[styles.progressFill, { width: `${fundingPercent}%` }]}
              />
            </View>
            <Text style={styles.fundingText}>
              ₹{item.collectedAmount} / ₹{item.targetAmount}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[
            { key: "all", label: "All" },
            { key: "leader", label: "As Leader" },
            { key: "worker", label: "As Worker" },
          ]}
          keyExtractor={(item) => item.key}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.tab, activeTab === item.key && styles.tabActive]}
              onPress={() => setActiveTab(item.key as any)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === item.key && styles.tabTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : filteredJobs.length === 0 ? (
        <View style={styles.emptyState}>
          <FontAwesome name="briefcase" size={48} color={colors.muted} />
          <Text style={styles.emptyTitle}>No Jobs Found</Text>
          <Text style={styles.emptyText}>
            {activeTab === "leader"
              ? "You haven't created any jobs as a leader."
              : activeTab === "worker"
                ? "You haven't been selected for any jobs as a worker."
                : "You don't have any jobs yet."}
          </Text>
          {activeTab === "leader" && (
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => navigation.navigate("CreateJob")}
            >
              <Text style={styles.createButtonText}>Create Job</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredJobs}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderJob}
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
  tabsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.card,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    color: colors.foreground,
    fontWeight: "500",
  },
  tabTextActive: {
    color: "white",
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
  createButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  createButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  jobCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  jobImageContainer: {
    height: 120,
    position: "relative",
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
  roleBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleBadgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "600",
  },
  jobContent: {
    padding: 12,
  },
  jobHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  jobTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: colors.foreground,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
  },
  jobInfo: {
    flexDirection: "row",
    marginBottom: 8,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
  },
  infoText: {
    fontSize: 13,
    color: colors.muted,
    flex: 1,
  },
  fundingRow: {
    gap: 4,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.secondary,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  fundingText: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: "500",
  },
});
