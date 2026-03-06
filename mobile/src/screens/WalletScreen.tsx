import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  FlatList,
  TextInput,
  Alert,
} from "react-native";
import { colors } from "../utils/colors";
import { walletAPI } from "../services/api";
import { Wallet, Transaction, Withdrawal } from "../types";
import { useAuth } from "../navigation/AuthContext";
import { useNavigation } from "@react-navigation/native";

export default function WalletScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"transactions" | "withdrawals">(
    "transactions",
  );
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [addMoneyAmount, setAddMoneyAmount] = useState("");
  const [addMoneyError, setAddMoneyError] = useState("");
  const [isAddingMoney, setIsAddingMoney] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawError, setWithdrawError] = useState("");
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const validateAmount = (amount: string) => {
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
      return "Minimum amount is ₹10";
    }
    if (numAmount > 100000) {
      return "Maximum amount is ₹1,00,000";
    }
    return "";
  };

  const fetchWallet = async () => {
    try {
      const [walletData, transactionsData, withdrawalsData] = await Promise.all(
        [
          walletAPI.get(),
          walletAPI.getTransactions(),
          walletAPI.getWithdrawals(),
        ],
      );
      setWallet(walletData);
      setTransactions(transactionsData);
      setWithdrawals(withdrawalsData);
    } catch (error) {
      console.error("Error fetching wallet:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchWallet();
    }
  }, [user]);

  const handleAddMoney = async () => {
    const error = validateAmount(addMoneyAmount);
    if (error) {
      setAddMoneyError(error);
      return;
    }

    try {
      setIsAddingMoney(true);
      await walletAPI.addMoney(parseFloat(addMoneyAmount));
      Alert.alert("Success", "Money added successfully!");
      setAddMoneyAmount("");
      setAddMoneyError("");
      setShowAddMoney(false);
      fetchWallet();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to add money");
    } finally {
      setIsAddingMoney(false);
    }
  };

  const handleWithdraw = () => {
    // Show alert that bank account needs to be set up
    Alert.alert(
      "Bank Account Required",
      "Please set up your bank account in your profile to withdraw funds.",
      [{ text: "OK" }],
    );
  };

  const getTransactionIcon = (type: string) => {
    const iconColor = getTransactionColor(type);
    switch (type) {
      case "DEPOSIT":
      case "REFUND":
        return (
          <View
            style={{
              width: 20,
              height: 20,
              backgroundColor: iconColor,
              borderRadius: 10,
            }}
          />
        );
      case "CONTRIBUTION":
      case "FEE":
        return (
          <View
            style={{
              width: 20,
              height: 20,
              backgroundColor: iconColor,
              borderRadius: 10,
            }}
          />
        );
      default:
        return (
          <View
            style={{
              width: 20,
              height: 20,
              backgroundColor: colors.muted,
              borderRadius: 10,
            }}
          />
        );
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case "DEPOSIT":
      case "REFUND":
        return colors.success;
      case "CONTRIBUTION":
      case "FEE":
        return colors.destructive;
      default:
        return colors.muted;
    }
  };

  const getWithdrawalStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
      case "PAID":
        return colors.success;
      case "PENDING":
      case "PROCESSING":
        return colors.warning;
      case "REJECTED":
      case "FAILED":
        return colors.destructive;
      default:
        return colors.muted;
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.notLoggedIn}>
          <Text style={styles.notLoggedInText}>
            Please login to view your wallet
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

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Wallet Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <View style={styles.balanceIcon}>
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: colors.primary,
                }}
              />
            </View>
            <Text style={styles.balanceLabel}>Available Balance</Text>
          </View>
          <Text style={styles.balanceAmount}>
            ₹{wallet?.availableBalance || 0}
          </Text>

          <View style={styles.balanceDetails}>
            <View style={styles.balanceDetail}>
              <Text style={styles.detailLabel}>Frozen</Text>
              <Text style={styles.detailValue}>
                ₹{wallet?.frozenBalance || 0}
              </Text>
            </View>
            <View style={styles.balanceDetail}>
              <Text style={styles.detailLabel}>Total Deposited</Text>
              <Text style={styles.detailValue}>
                ₹{wallet?.totalDeposited || 0}
              </Text>
            </View>
            <View style={styles.balanceDetail}>
              <Text style={styles.detailLabel}>Total Spent</Text>
              <Text style={styles.detailValue}>₹{wallet?.totalSpent || 0}</Text>
            </View>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.addMoneyButton}
              onPress={() => setShowAddMoney(!showAddMoney)}
            >
              <Text style={styles.addMoneyButtonText}>+ Add Money</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.withdrawButton}
              onPress={handleWithdraw}
            >
              <Text style={styles.withdrawButtonText}>Withdraw</Text>
            </TouchableOpacity>
          </View>

          {showAddMoney && (
            <View style={styles.addMoneyForm}>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[
                    styles.addMoneyInput,
                    addMoneyError && styles.addMoneyInputError,
                  ]}
                  maxLength={6}
                  placeholder="Enter amount (₹)"
                  value={addMoneyAmount}
                  onChangeText={(text) => {
                    const filtered = text.replace(/[^0-9.]/g, "");
                    setAddMoneyAmount(filtered);
                    if (addMoneyError) setAddMoneyError("");
                  }}
                  keyboardType="decimal-pad"
                />
                {addMoneyError && (
                  <Text style={styles.addMoneyErrorText}>{addMoneyError}</Text>
                )}
                {addMoneyAmount && !addMoneyError && (
                  <Text style={styles.addMoneyHint}>
                    ₹{parseFloat(addMoneyAmount).toLocaleString("en-IN")}
                  </Text>
                )}
              </View>
              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  isAddingMoney && styles.confirmButtonDisabled,
                ]}
                onPress={handleAddMoney}
                disabled={isAddingMoney}
              >
                <Text style={styles.confirmButtonText}>
                  {isAddingMoney ? "Adding..." : "Add"}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === "transactions" && styles.tabActive,
            ]}
            onPress={() => setActiveTab("transactions")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "transactions" && styles.tabTextActive,
              ]}
            >
              Transactions
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === "withdrawals" && styles.tabActive,
            ]}
            onPress={() => setActiveTab("withdrawals")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "withdrawals" && styles.tabTextActive,
              ]}
            >
              Withdrawals
            </Text>
          </TouchableOpacity>
        </View>

        {/* List */}
        {activeTab === "transactions" ? (
          transactions.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No transactions yet</Text>
            </View>
          ) : (
            transactions.map((tx) => (
              <View key={tx.id} style={styles.listItem}>
                <View style={styles.listItemIcon}>
                  {getTransactionIcon(tx.type)}
                </View>
                <View style={styles.listItemContent}>
                  <Text style={styles.listItemTitle}>{tx.type}</Text>
                  <Text style={styles.listItemDescription}>
                    {tx.description ||
                      new Date(tx.createdAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.listItemAmount,
                    { color: getTransactionColor(tx.type) },
                  ]}
                >
                  {tx.type === "DEPOSIT" || tx.type === "REFUND" ? "+" : "-"}₹
                  {tx.amount}
                </Text>
              </View>
            ))
          )
        ) : withdrawals.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No withdrawals yet</Text>
          </View>
        ) : (
          withdrawals.map((w) => (
            <View key={w.id} style={styles.listItem}>
              <View style={styles.listItemIcon}>
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 4,
                    backgroundColor: colors.muted,
                  }}
                />
              </View>
              <View style={styles.listItemContent}>
                <Text style={styles.listItemTitle}>₹{w.amount}</Text>
                <Text style={styles.listItemDescription}>
                  {w.bankAccount} •{" "}
                  {new Date(w.createdAt).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </Text>
              </View>
              <Text
                style={[
                  styles.listItemStatus,
                  { color: getWithdrawalStatusColor(w.status) },
                ]}
              >
                {w.status}
              </Text>
            </View>
          ))
        )}
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
    gap: 16,
  },
  notLoggedInText: { fontSize: 16, color: colors.muted },
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
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  balanceCard: {
    backgroundColor: colors.primary,
    margin: 16,
    borderRadius: 16,
    padding: 20,
  },
  balanceHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  balanceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  balanceLabel: { fontSize: 14, color: "rgba(255,255,255,0.8)" },
  balanceAmount: {
    fontSize: 36,
    fontWeight: "bold",
    color: "white",
    marginBottom: 16,
  },
  balanceDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  balanceDetail: { alignItems: "center" },
  detailLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    marginBottom: 4,
  },
  detailValue: { fontSize: 16, fontWeight: "600", color: "white" },
  actionButtons: { flexDirection: "row", gap: 12 },
  addMoneyButton: {
    flex: 1,
    backgroundColor: "white",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  addMoneyButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "600",
  },
  withdrawButton: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  withdrawButtonText: { color: "white", fontSize: 14, fontWeight: "600" },
  addMoneyForm: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
    alignItems: "center",
  },
  inputWrapper: {
    flex: 1,
  },
  addMoneyInput: {
    width: "100%",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: colors.foreground,
  },
  addMoneyInputError: {
    borderWidth: 2,
    borderColor: colors.destructive,
  },
  addMoneyErrorText: {
    color: colors.destructive,
    fontSize: 12,
    marginTop: 4,
  },
  addMoneyHint: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "600",
    marginTop: 4,
  },
  confirmButton: {
    backgroundColor: colors.primaryDark,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    justifyContent: "center",
    minWidth: 80,
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: { color: "white", fontSize: 14, fontWeight: "600" },
  tabs: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: colors.secondary,
    borderRadius: 12,
    padding: 4,
  },
  tab: { flex: 1, paddingVertical: 12, alignItems: "center", borderRadius: 10 },
  tabActive: { backgroundColor: colors.card },
  tabText: { fontSize: 14, fontWeight: "500", color: colors.muted },
  tabTextActive: { color: colors.foreground },
  emptyState: { padding: 40, alignItems: "center" },
  emptyText: { fontSize: 14, color: colors.muted },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  listItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.secondary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  listItemContent: { flex: 1 },
  listItemTitle: { fontSize: 14, fontWeight: "600", color: colors.foreground },
  listItemDescription: { fontSize: 12, color: colors.muted, marginTop: 2 },
  listItemAmount: { fontSize: 14, fontWeight: "600" },
  listItemStatus: { fontSize: 12, fontWeight: "600" },
});
