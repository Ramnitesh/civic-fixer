import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  TextInput,
  Alert,
} from "react-native";
import { useAuth } from "../navigation/AuthContext";
import { colors } from "../utils/colors";
import { authAPI } from "../services/api";
import { useNavigation } from "@react-navigation/native";
import FontAwesome from "@expo/vector-icons/FontAwesome";

export default function BankAccountScreen() {
  const { user, refreshUser } = useAuth();
  const navigation = useNavigation();
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [bankError, setBankError] = useState("");

  // Form fields
  const [accountHolderName, setAccountHolderName] = useState(
    user?.accountHolderName || "",
  );
  const [bankAccount, setBankAccount] = useState(user?.bankAccount || "");
  const [ifscCode, setIfscCode] = useState(user?.ifscCode || "");

  const hasBankDetails =
    user?.bankAccount && user?.ifscCode && user?.accountHolderName;

  const validateBankAccount = () => {
    if (!accountHolderName.trim()) {
      return "Account holder name is required";
    }
    if (!bankAccount.trim()) {
      return "Account number is required";
    }
    if (bankAccount.trim().length < 9) {
      return "Account number must be at least 9 digits";
    }
    if (!ifscCode.trim()) {
      return "IFSC code is required";
    }
    if (ifscCode.trim().length !== 11) {
      return "IFSC code must be 11 characters";
    }
    return "";
  };

  const handleSave = async () => {
    const error = validateBankAccount();
    if (error) {
      setBankError(error);
      return;
    }

    try {
      setIsSaving(true);
      await authAPI.updateProfile({
        bankAccount: bankAccount.trim(),
        ifscCode: ifscCode.trim().toUpperCase(),
        accountHolderName: accountHolderName.trim(),
      });
      await refreshUser();
      setIsEditing(false);
      setBankError("");
      Alert.alert("Success", "Bank account updated successfully!");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to update bank account");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setAccountHolderName(user?.accountHolderName || "");
    setBankAccount(user?.bankAccount || "");
    setIfscCode(user?.ifscCode || "");
    setIsEditing(false);
    setBankError("");
  };

  // Show bank details in view mode
  const renderViewMode = () => (
    <View style={styles.viewContainer}>
      <View style={styles.detailCard}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Account Holder Name</Text>
          <Text style={styles.detailValue}>{user?.accountHolderName}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Account Number</Text>
          <Text style={styles.detailValue}>
            ****{user?.bankAccount?.slice(-4)}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>IFSC Code</Text>
          <Text style={styles.detailValue}>{user?.ifscCode}</Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.editButton}
        onPress={() => setIsEditing(true)}
      >
        <FontAwesome name="edit" size={16} color={colors.primary} />
        <Text style={styles.editButtonText}>Edit Bank Details</Text>
      </TouchableOpacity>
    </View>
  );

  // Show bank details in edit mode
  const renderEditMode = () => (
    <View style={styles.formContainer}>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Account Holder Name</Text>
        <TextInput
          style={[styles.input, bankError && styles.inputError]}
          value={accountHolderName}
          onChangeText={(text) => {
            setAccountHolderName(text);
            if (bankError) setBankError("");
          }}
          placeholder="Enter account holder name"
        />
      </View>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Account Number</Text>
        <TextInput
          style={[styles.input, bankError && styles.inputError]}
          value={bankAccount}
          onChangeText={(text) => {
            setBankAccount(text.replace(/[^0-9]/g, ""));
            if (bankError) setBankError("");
          }}
          placeholder="Enter account number"
          keyboardType="numeric"
          maxLength={18}
        />
      </View>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>IFSC Code</Text>
        <TextInput
          style={[styles.input, bankError && styles.inputError]}
          value={ifscCode}
          onChangeText={(text) => {
            setIfscCode(text.toUpperCase());
            if (bankError) setBankError("");
          }}
          placeholder="Enter IFSC code (e.g. SBIN0001234)"
          autoCapitalize="characters"
          maxLength={11}
        />
      </View>
      {bankError ? <Text style={styles.errorText}>{bankError}</Text> : null}

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={isSaving}
        >
          <Text style={styles.saveButtonText}>
            {isSaving ? "Saving..." : "Save"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Info Text */}
        <View style={styles.infoSection}>
          <FontAwesome name="university" size={40} color={colors.primary} />
          <Text style={styles.infoTitle}>
            {hasBankDetails ? "Your Bank Account" : "Add Bank Account"}
          </Text>
          <Text style={styles.infoText}>
            {hasBankDetails
              ? "Your bank details are used for withdrawal purposes"
              : "Add your bank account details to enable withdrawals"}
          </Text>
        </View>

        {/* Content */}
        {hasBankDetails && !isEditing ? renderViewMode() : renderEditMode()}
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.foreground,
  },
  infoSection: {
    alignItems: "center",
    padding: 30,
    gap: 12,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.foreground,
  },
  infoText: {
    fontSize: 14,
    color: colors.muted,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  viewContainer: {
    padding: 20,
    gap: 20,
  },
  detailCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 16,
  },
  detailRow: {
    gap: 4,
  },
  detailLabel: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: "500",
    textTransform: "uppercase",
  },
  detailValue: {
    fontSize: 16,
    color: colors.foreground,
    fontWeight: "600",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  editButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "600",
  },
  formContainer: {
    padding: 20,
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: "500",
    textTransform: "uppercase",
  },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: colors.foreground,
  },
  inputError: {
    borderColor: colors.destructive,
    borderWidth: 2,
  },
  errorText: {
    color: colors.destructive,
    fontSize: 12,
    marginTop: 4,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: colors.secondary,
  },
  cancelBtnText: {
    color: colors.muted,
    fontSize: 16,
    fontWeight: "600",
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: colors.primary,
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
