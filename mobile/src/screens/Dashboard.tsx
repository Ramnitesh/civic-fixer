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
} from "react-native";
import { useAuth } from "../navigation/AuthContext";
import { colors } from "../utils/colors";
import { jobsAPI } from "../services/api";
import { Job } from "../types";
import {
  useNavigation,
  CompositeNavigationProp,
} from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import FontAwesome from "@expo/vector-icons/FontAwesome";

export default function DashboardScreen() {
  const { user, logout } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [myJobs, setMyJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMyJobs = async () => {
    try {
      const leaderJobs = await jobsAPI.getAll({
        leaderId: user?.id.toString(),
      });
      setMyJobs(leaderJobs);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchMyJobs();
    }
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMyJobs();
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

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.notLoggedIn}>
          <Text style={styles.notLoggedInText}>
            Please login to view your profile
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
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.profileSection}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user.name.charAt(0)}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userRole}>{user.role}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <FontAwesome name="briefcase" size={24} color={colors.primary} />
            <Text style={styles.statValue}>{myJobs.length}</Text>
            <Text style={styles.statLabel}>My Jobs</Text>
          </View>
          <View style={styles.statCard}>
            <FontAwesome name="money" size={24} color={colors.success} />
            <Text style={styles.statValue}>₹{user.totalEarnings}</Text>
            <Text style={styles.statLabel}>Earnings</Text>
          </View>
          <View style={styles.statCard}>
            <FontAwesome name="star" size={24} color={colors.warning} />
            <Text style={styles.statValue}>{user.rating}</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
        </View>

        {/* Create Job Button */}
        {user.role === "LEADER" && (
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => navigation.navigate("CreateJob")}
          >
            <Text style={styles.createButtonText}>+ Create New Job</Text>
          </TouchableOpacity>
        )}

        {/* My Jobs Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Jobs</Text>
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : myJobs.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                You haven't created any jobs yet
              </Text>
            </View>
          ) : (
            myJobs.slice(0, 5).map((job) => (
              <TouchableOpacity
                key={job.id}
                style={styles.jobCard}
                onPress={() =>
                  navigation.navigate("JobDetails", { jobId: job.id })
                }
              >
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
                      name="map-marker"
                      size={14}
                      color={colors.muted}
                    />
                    <Text style={styles.infoText}>{job.location}</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <FontAwesome name="money" size={14} color={colors.muted} />
                    <Text style={styles.infoText}>
                      ₹{job.collectedAmount} / ₹{job.targetAmount}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionText}>My Applications</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionText}>My Contributions</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionText}>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionText}>Help & Support</Text>
            </TouchableOpacity>
          </View>
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
  notLoggedIn: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  notLoggedInText: {
    fontSize: 16,
    color: colors.muted,
    marginBottom: 16,
  },
  loginButton: {
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
  profileInfo: {
    gap: 2,
  },
  userName: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.foreground,
  },
  userRole: {
    fontSize: 14,
    color: colors.muted,
  },
  logoutButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.secondary,
  },
  logoutText: {
    fontSize: 14,
    color: colors.destructive,
    fontWeight: "600",
  },
  statsContainer: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.foreground,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 4,
  },
  createButton: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  createButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  section: {
    padding: 16,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.foreground,
    marginBottom: 12,
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
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  jobHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  jobTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: colors.foreground,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  jobInfo: {
    flexDirection: "row",
    gap: 16,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  infoText: {
    fontSize: 13,
    color: colors.muted,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  actionButton: {
    width: "48%",
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.foreground,
    textAlign: "center",
  },
});
