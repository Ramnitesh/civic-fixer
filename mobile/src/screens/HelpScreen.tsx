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
  Linking,
} from "react-native";
import { colors } from "../utils/colors";
import FontAwesome from "@expo/vector-icons/FontAwesome";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

const faqItems: FAQItem[] = [
  {
    id: "1",
    question: "How do I create a job?",
    answer:
      "Go to the Jobs tab and click on 'Start Project' button. Fill in the required details like title, description, location, and target amount. Your job will be listed once submitted.",
  },
  {
    id: "2",
    question: "How do I contribute to a job?",
    answer:
      "Browse through the available jobs, select one you want to support, and click on the 'Contribute' button. Enter the amount you'd like to contribute.",
  },
  {
    id: "3",
    question: "How does funding work?",
    answer:
      "Jobs have a target amount. Once the target is reached, the job moves to the next phase (either worker selection or implementation). If the target isn't met, contributions can be refunded.",
  },
  {
    id: "4",
    question: "What is the difference between Leader and Worker execution?",
    answer:
      "In Leader Execution, the project leader manages and executes the work. In Worker Execution, a worker is selected through applications to complete the job.",
  },
  {
    id: "5",
    question: "How do I become a worker?",
    answer:
      "Register as a Worker role during sign up. You can then browse worker-eligible jobs and submit applications with your bid amount.",
  },
  {
    id: "6",
    question: "What happens if there's a dispute?",
    answer:
      "If there's a disagreement during the review period, either party can raise a dispute. An admin will review the evidence and make a final decision.",
  },
  {
    id: "7",
    question: "How do I add money to my wallet?",
    answer:
      "Go to your Profile, click on Wallet in the menu, and use the 'Add Money' option to deposit funds to your wallet.",
  },
  {
    id: "8",
    question: "Is my personal information secure?",
    answer:
      "Yes, we take data privacy seriously. Your personal information is encrypted and stored securely. We never share your data with third parties.",
  },
];

export default function HelpScreen() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFAQs = faqItems.filter(
    (item) =>
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleContactSupport = () => {
    Alert.alert(
      "Contact Support",
      "You can reach us at:\n\nEmail: support@civicfixer.com\nPhone: +91 9876543210",
      [
        { text: "OK", style: "cancel" },
        {
          text: "Email Us",
          onPress: () => Linking.openURL("mailto:support@civicfixer.com"),
        },
      ],
    );
  };

  const handleRateApp = () => {
    Alert.alert(
      "Rate App",
      "If you enjoy using Crowd Civic Fix, please take a moment to rate us!",
      [
        { text: "Later", style: "cancel" },
        { text: "Rate Now", onPress: () => {} },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Help & Support</Text>
          <Text style={styles.headerSubtitle}>
            Find answers or get in touch with us
          </Text>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <FontAwesome name="search" size={18} color={colors.muted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search help..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={colors.muted}
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={handleContactSupport}
            >
              <FontAwesome name="envelope" size={24} color={colors.primary} />
              <Text style={styles.quickActionText}>Contact Us</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={handleRateApp}
            >
              <FontAwesome name="star" size={24} color={colors.warning} />
              <Text style={styles.quickActionText}>Rate App</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* FAQ Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          <View style={styles.faqList}>
            {filteredFAQs.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.faqItem}
                onPress={() =>
                  setExpandedId(expandedId === item.id ? null : item.id)
                }
              >
                <View style={styles.faqQuestionRow}>
                  <Text style={styles.faqQuestion}>{item.question}</Text>
                  <FontAwesome
                    name={
                      expandedId === item.id ? "chevron-up" : "chevron-down"
                    }
                    size={14}
                    color={colors.muted}
                  />
                </View>
                {expandedId === item.id && (
                  <Text style={styles.faqAnswer}>{item.answer}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* App Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.aboutCard}>
            <Text style={styles.appName}>Crowd Civic Fix</Text>
            <Text style={styles.appVersion}>Version 1.0.0</Text>
            <Text style={styles.appDescription}>
              Crowd Civic Fix is a platform for communities to collectively
              identify, fund, and resolve local civic issues. Join thousands of
              citizens making their neighborhoods better!
            </Text>
          </View>
        </View>

        {/* Bottom padding */}
        <View style={styles.bottomPadding} />
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
    fontSize: 24,
    fontWeight: "bold",
    color: colors.foreground,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.muted,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.foreground,
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
  quickActionsGrid: {
    flexDirection: "row",
    gap: 12,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: colors.card,
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.foreground,
    marginTop: 8,
  },
  faqList: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  faqItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  faqQuestionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  faqQuestion: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: colors.foreground,
    marginRight: 8,
  },
  faqAnswer: {
    fontSize: 13,
    color: colors.muted,
    marginTop: 8,
    lineHeight: 20,
  },
  aboutCard: {
    backgroundColor: colors.card,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  appName: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 12,
    color: colors.muted,
    marginBottom: 12,
  },
  appDescription: {
    fontSize: 13,
    color: colors.muted,
    textAlign: "center",
    lineHeight: 20,
  },
  bottomPadding: {
    height: 40,
  },
});
