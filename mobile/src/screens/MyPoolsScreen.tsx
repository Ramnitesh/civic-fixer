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
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

export default function MyPoolsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { user } = useAuth();

  // All hooks must be called at the top level, before any early returns
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [executionModeFilter, setExecutionModeFilter] = useState<string | null>(
    null,
  );

  const fetchJobs = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
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
      console.error("Error fetching pools:", error);
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

  // Only filter jobs if user is logged in
  const filteredJobs = user
    ? jobs.filter((job) => {
        // Apply execution mode filter
        if (executionModeFilter === "LEADER_EXECUTION")
          return job.executionMode === "LEADER_EXECUTION";
        if (executionModeFilter === "WORKER_EXECUTION")
          return job.executionMode === "WORKER_EXECUTION";
        return true;
      })
    : [];

  const executionModeFilters = [
    { label: "All Modes", value: null, icon: null },
    { label: "Leader", value: "LEADER_EXECUTION", icon: "user" },
    { label: "Worker", value: "WORKER_EXECUTION", icon: "account-cowboy-hat" },
  ];

  const renderJob = ({ item }: { item: Job }) => {
    const isLeader = item.leaderId === user?.id;
    const isLeaderMode = item.executionMode === "LEADER_EXECUTION";
    const fundingPercent =
      ((item.collectedAmount || 0) / (item.targetAmount || 1)) * 100;

    return (
      <TouchableOpacity
        style={styles.jobCard}
        onPress={() => navigation.navigate("PoolDetails", { jobId: item.id })}
      >
        <View style={styles.jobImageContainer}>
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.jobImage} />
          ) : (
            <View style={styles.jobImagePlaceholder}>
              <FontAwesome name="group" size={24} color={colors.muted} />
            </View>
          )}
          {/* Execution Mode Icon on Right Side */}
          <View
            style={[
              styles.executionModeBadge,
              {
                backgroundColor: isLeaderMode
                  ? colors.leaderExecution
                  : colors.workerSelected,
              },
            ]}
          >
            {isLeaderMode ? (
              <FontAwesome name="user" size={10} color="white" />
            ) : (
              <MaterialCommunityIcons
                name="account-cowboy-hat"
                size={10}
                color="white"
              />
            )}
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
      {/* Execution Mode Filter */}
      <View style={styles.executionFilterContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={executionModeFilters}
          keyExtractor={(item) => item.label || "all"}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.executionFilterButton,
                executionModeFilter === item.value &&
                  styles.executionFilterButtonActive,
              ]}
              onPress={() => setExecutionModeFilter(item.value)}
            >
              {item.icon === "user" && (
                <FontAwesome
                  name="user"
                  size={12}
                  color={
                    executionModeFilter === item.value
                      ? "white"
                      : colors.primary
                  }
                  style={{ marginRight: 4 }}
                />
              )}
              {item.icon === "account-cowboy-hat" && (
                <MaterialCommunityIcons
                  name="account-cowboy-hat"
                  size={12}
                  color={
                    executionModeFilter === item.value
                      ? "white"
                      : colors.primary
                  }
                  style={{ marginRight: 4 }}
                />
              )}
              <Text
                style={[
                  styles.executionFilterText,
                  executionModeFilter === item.value &&
                    styles.executionFilterTextActive,
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
      ) : !user ? (
        <View style={styles.emptyState}>
          <FontAwesome name="group" size={48} color={colors.muted} />
          <Text style={styles.emptyTitle}>Login Required</Text>
          <Text style={styles.emptyText}>Please login to view your pools</Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => navigation.navigate("Auth")}
          >
            <Text style={styles.createButtonText}>Login</Text>
          </TouchableOpacity>
        </View>
      ) : filteredJobs.length === 0 ? (
        <View style={styles.emptyState}>
          <FontAwesome name="group" size={48} color={colors.muted} />
          <Text style={styles.emptyTitle}>No Pools Found</Text>
          <Text style={styles.emptyText}>You don't have any pools yet.</Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => navigation.navigate("CreatePool")}
          >
            <Text style={styles.createButtonText}>Create Pool</Text>
          </TouchableOpacity>
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
  executionFilterContainer: {
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  executionFilterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.card,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
  },
  executionFilterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  executionFilterText: {
    fontSize: 14,
    color: colors.foreground,
    fontWeight: "500",
  },
  executionFilterTextActive: {
    color: "white",
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
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
  executionModeBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  roleBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
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
    overflow: "visible",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: 3,
    maxWidth: "100%",
  },
  fundingText: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: "500",
  },
});
