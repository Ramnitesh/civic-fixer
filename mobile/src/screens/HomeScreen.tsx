import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Image,
} from "react-native";
import { colors } from "../utils/colors";
import { jobsAPI } from "../services/api";
import { Job } from "../types";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import logoImage from "../../assets/icon.png";

export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRecentJobs = async () => {
    try {
      const jobs = await jobsAPI.getAll({ limit: 10 });
      // Ensure jobs is always an array
      setRecentJobs(Array.isArray(jobs) ? jobs : []);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      setRecentJobs([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRecentJobs();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRecentJobs();
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            <Image source={logoImage} style={styles.logo} />
            <Text style={{ color: colors.foreground }}>ontro</Text>Pay
          </Text>
          <Text style={styles.headerSubtitle}>
            Transform your neighborhood together
          </Text>
        </View>

        {/* Search Bar - Opens PoolsListScreen for searching */}
        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => navigation.navigate("PoolsListScreen")}
        >
          <FontAwesome name="search" size={20} color={colors.muted} />
          <Text style={styles.searchText}>Search pools...</Text>
        </TouchableOpacity>

        {/* Recent Jobs */}
        <View style={styles.section}>
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : recentJobs.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No projects found</Text>
            </View>
          ) : (
            recentJobs.slice(0, 5).map((job) => (
              <TouchableOpacity
                key={job.id}
                style={styles.jobCard}
                onPress={() =>
                  navigation.navigate("PoolDetails", { jobId: job.id })
                }
              >
                <View style={styles.jobImageContainer}>
                  {job.imageUrl ? (
                    <Image
                      source={{ uri: job.imageUrl }}
                      style={styles.jobImage}
                    />
                  ) : (
                    <View style={styles.jobImagePlaceholder}>
                      <FontAwesome
                        name="group"
                        size={24}
                        color={colors.muted}
                      />
                    </View>
                  )}
                  {/* Execution Mode Icon Badge */}
                  <View
                    style={[
                      styles.executionModeBadge,
                      {
                        backgroundColor:
                          job.executionMode === "LEADER_EXECUTION"
                            ? colors.leaderExecution
                            : colors.workerSelected,
                      },
                    ]}
                  >
                    {job.executionMode === "LEADER_EXECUTION" ? (
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
                      {job.title}
                    </Text>
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
                  <View style={styles.jobInfo}>
                    <View style={styles.infoItem}>
                      <FontAwesome
                        name="map-pin"
                        size={14}
                        color={colors.muted}
                      />
                      <Text style={styles.infoText} numberOfLines={1}>
                        {job.location}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.fundingRow}>
                    <View style={styles.progressBar}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${Math.min(
                              (job.collectedAmount / job.targetAmount) * 100,
                              100,
                            )}%`,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.fundingText}>
                      ₹{job.collectedAmount} / ₹{job.targetAmount}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
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
  header: {
    padding: 20,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.primary,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.muted,
    marginTop: 4,
  },
  logo: {
    width: 20,
    height: 20,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  searchText: {
    color: colors.muted,
    fontSize: 16,
  },
  quickActions: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.foreground,
  },
  section: {
    padding: 16,
    paddingTop: 0,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.foreground,
  },
  seeAllText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "600",
  },
  emptyState: {
    padding: 24,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: colors.muted,
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
  executionModeBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
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
