import React, { useState, useEffect, useMemo } from "react";
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
  Modal,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors } from "../utils/colors";
import { contributionsAPI, jobsAPI } from "../services/api";
import { Contribution, Job } from "../types";
import { useAuth } from "../navigation/AuthContext";
import FontAwesome from "@expo/vector-icons/FontAwesome";

// Interface for grouped contributions by pool
interface PoolContribution {
  jobId: number;
  totalAmount: number;
  contributionCount: number;
  latestDate: string;
}

export default function ContributionsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { user } = useAuth();
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [jobs, setJobs] = useState<{ [key: number]: Job }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPool, setSelectedPool] = useState<PoolContribution | null>(
    null,
  );
  const [showModal, setShowModal] = useState(false);

  const fetchContributions = async () => {
    if (!user) {
      setContributions([]);
      setJobs({});
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const data = await contributionsAPI.getMy();
      setContributions(
        // Fetch job details for each contribution
        data || [],
      );

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
      setContributions([]);
      setJobs({});
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchContributions();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchContributions();
  };

  // Group contributions by pool and calculate totals
  const poolContributions = useMemo(() => {
    const grouped: { [key: number]: PoolContribution } = {};

    contributions.forEach((contribution) => {
      const jobId = contribution.jobId;
      if (!grouped[jobId]) {
        grouped[jobId] = {
          jobId,
          totalAmount: 0,
          contributionCount: 0,
          latestDate: contribution.createdAt,
        };
      }
      grouped[jobId].totalAmount += contribution.amount;
      grouped[jobId].contributionCount += 1;
      // Keep the latest date
      if (
        new Date(contribution.createdAt) > new Date(grouped[jobId].latestDate)
      ) {
        grouped[jobId].latestDate = contribution.createdAt;
      }
    });

    return Object.values(grouped);
  }, [contributions]);

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

  // Get contributions for a specific pool
  const getPoolContributions = (jobId: number) => {
    return contributions.filter((c) => c.jobId === jobId);
  };

  const handlePoolPress = (item: PoolContribution) => {
    setSelectedPool(item);
    setShowModal(true);
  };

  const renderContribution = ({ item }: { item: PoolContribution }) => {
    const job = jobs[item.jobId];

    return (
      <TouchableOpacity
        style={styles.contributionCard}
        onPress={() => handlePoolPress(item)}
      >
        {/* Left side - Image and Status */}
        <View style={styles.leftSection}>
          <View style={styles.jobImageContainer}>
            {job?.imageUrl ? (
              <Image source={{ uri: job.imageUrl }} style={styles.jobImage} />
            ) : (
              <View style={styles.jobImagePlaceholder}>
                <FontAwesome name="group" size={24} color={colors.muted} />
              </View>
            )}
          </View>
          {job && (
            <View style={styles.statusBadgeContainer}>
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

        {/* Right side - Content */}
        <View style={styles.contributionContent}>
          <Text style={styles.jobTitle} numberOfLines={1}>
            {job?.title || `Job #${item.jobId}`}
          </Text>

          <View style={styles.verticalInfo}>
            <View style={styles.jobLocation}>
              <FontAwesome name="map-marker" size={12} color={colors.muted} />
              <Text style={styles.locationText} numberOfLines={1}>
                {job?.location || "Unknown location"}
              </Text>
            </View>
          </View>

          <View style={styles.contributionDetails}>
            <View style={styles.amountRow}>
              <View style={styles.amountContainer}>
                <Text style={styles.amountLabel}>Total Contributed</Text>
                <Text style={styles.amountValue}>₹{item.totalAmount}</Text>
              </View>
            </View>
            <View style={styles.countDateContainer}>
              <Text style={styles.countText}>
                {item.contributionCount} contribution
                {item.contributionCount > 1 ? "s" : ""}
              </Text>
              <Text style={styles.dateText}>
                {new Date(item.latestDate).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </Text>
            </View>
          </View>
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
      ) : poolContributions.length === 0 ? (
        <View style={styles.emptyState}>
          <FontAwesome name="heart" size={48} color={colors.muted} />
          <Text style={styles.emptyTitle}>No Contributions Yet</Text>
          <Text style={styles.emptyText}>
            You haven't contributed to any pools yet. Browse pools to find
            projects to support!
          </Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => navigation.navigate("Home")}
          >
            <Text style={styles.browseButtonText}>Browse Pools</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={poolContributions}
          keyExtractor={(item) => item.jobId.toString()}
          renderItem={renderContribution}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Modal for contribution details */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Contribution Details</Text>
              <TouchableOpacity
                onPress={() => setShowModal(false)}
                style={styles.closeButton}
              >
                <FontAwesome name="close" size={20} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {selectedPool && jobs[selectedPool.jobId] && (
                <>
                  {/* Pool Info */}
                  <View style={styles.modalPoolInfo}>
                    <Text style={styles.modalPoolTitle}>
                      {jobs[selectedPool.jobId].title}
                    </Text>
                    <View style={styles.modalLocation}>
                      <FontAwesome
                        name="map-marker"
                        size={14}
                        color={colors.muted}
                      />
                      <Text style={styles.modalLocationText}>
                        {jobs[selectedPool.jobId].location}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.modalStatusBadge,
                        {
                          backgroundColor:
                            getStatusColor(jobs[selectedPool.jobId].status) +
                            "20",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.modalStatusText,
                          {
                            color: getStatusColor(
                              jobs[selectedPool.jobId].status,
                            ),
                          },
                        ]}
                      >
                        {jobs[selectedPool.jobId].status.replace(/_/g, " ")}
                      </Text>
                    </View>
                  </View>

                  {/* Summary */}
                  <View style={styles.modalSummary}>
                    <View style={styles.modalSummaryItem}>
                      <Text style={styles.modalSummaryLabel}>
                        Total Contributed
                      </Text>
                      <Text style={styles.modalSummaryValue}>
                        ₹{selectedPool.totalAmount}
                      </Text>
                    </View>
                    <View style={styles.modalSummaryItem}>
                      <Text style={styles.modalSummaryLabel}>
                        Contributions
                      </Text>
                      <Text style={styles.modalSummaryValue}>
                        {selectedPool.contributionCount}
                      </Text>
                    </View>
                  </View>

                  {/* View Pool Details Button */}
                  <TouchableOpacity
                    style={styles.viewPoolButton}
                    onPress={() => {
                      setShowModal(false);
                      navigation.navigate("PoolDetails", {
                        jobId: selectedPool.jobId,
                      });
                    }}
                  >
                    <Text style={styles.viewPoolButtonText}>
                      View Pool Details
                    </Text>
                    <FontAwesome name="arrow-right" size={16} color="white" />
                  </TouchableOpacity>

                  {/* Individual Contributions */}
                  <Text style={styles.modalSectionTitle}>
                    All Contributions
                  </Text>
                  {getPoolContributions(selectedPool.jobId)
                    .sort(
                      (a, b) =>
                        new Date(b.createdAt).getTime() -
                        new Date(a.createdAt).getTime(),
                    )
                    .map((contribution) => (
                      <View
                        key={contribution.id}
                        style={styles.modalContributionItem}
                      >
                        <View style={styles.modalContributionLeft}>
                          <Text style={styles.modalContributionAmount}>
                            ₹{contribution.amount}
                          </Text>
                          <Text style={styles.modalContributionDate}>
                            {new Date(
                              contribution.createdAt,
                            ).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </Text>
                        </View>
                        <Text style={styles.modalContributionStatus}>
                          {(contribution as any).status?.replace(/_/g, " ") ||
                            "Completed"}
                        </Text>
                      </View>
                    ))}
                </>
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
    flexDirection: "row",
    backgroundColor: colors.card,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  leftSection: {
    width: 100,
  },
  statusBadgeContainer: {
    position: "absolute",
    bottom: 8,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  jobImageContainer: {
    flex: 1,
    width: 100,
  },
  jobImage: {
    width: "100%",
    height: "100%",
  },
  jobImagePlaceholder: {
    flex: 1,
    width: 100,
    backgroundColor: colors.secondary,
    justifyContent: "center",
    alignItems: "center",
  },
  contributionContent: {
    flex: 1,
    padding: 8,
    justifyContent: "space-between",
  },
  contentTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  titleLocationContainer: {
    flex: 1,
    marginRight: 8,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.foreground,
    marginBottom: 8,
  },
  verticalInfo: {
    gap: 4,
    marginBottom: 8,
  },
  jobLocation: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    color: colors.muted,
    flex: 1,
  },
  countDateContainer: {
    gap: 4,
  },
  countDateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  countContainer: {},
  countText: {
    fontSize: 11,
    color: colors.muted,
  },
  contributionDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  amountRow: {
    marginTop: 4,
  },
  amountContainer: {
    gap: 2,
  },
  dateContainer: {
    alignItems: "flex-end",
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
  statusRow: {
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    maxWidth: "90%",
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
  },
  dateText: {
    fontSize: 11,
    color: colors.muted,
  },
  bottomRow: {
    marginTop: 4,
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
    maxHeight: "80%",
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.foreground,
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  modalPoolInfo: {
    marginBottom: 20,
  },
  modalPoolTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.foreground,
    marginBottom: 8,
  },
  modalLocation: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 12,
  },
  modalLocationText: {
    fontSize: 14,
    color: colors.muted,
  },
  modalStatusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  modalStatusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  modalSummary: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalSummaryItem: {
    alignItems: "center",
  },
  modalSummaryLabel: {
    fontSize: 12,
    color: colors.muted,
    marginBottom: 4,
  },
  modalSummaryValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.primary,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.foreground,
    marginBottom: 12,
  },
  modalContributionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    backgroundColor: colors.card,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalContributionLeft: {
    gap: 4,
  },
  modalContributionAmount: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.foreground,
  },
  modalContributionDate: {
    fontSize: 12,
    color: colors.muted,
  },
  modalContributionStatus: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.muted,
  },
  viewPoolButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 20,
  },
  viewPoolButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
