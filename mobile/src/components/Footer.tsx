import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
  StyleSheet,
} from "react-native";
import { colors } from "../utils/colors";

interface FooterLink {
  title: string;
  items: { label: string; url: string }[];
}

const legalLinks: FooterLink = {
  title: "Legal",
  items: [
    { label: "Terms of Service", url: "/legal/terms" },
    { label: "Privacy Policy", url: "/legal/privacy" },
    { label: "Refund Policy", url: "/legal/refund" },
    { label: "Wallet & Payments", url: "/legal/wallet" },
    { label: "Dispute Resolution", url: "/legal/dispute" },
    { label: "Community Guidelines", url: "/legal/guidelines" },
    { label: "Cookie Policy", url: "/legal/cookies" },
    { label: "Data Deletion", url: "/legal/deletion" },
    { label: "AML Policy", url: "/legal/aml" },
  ],
};

const transparencyLinks: FooterLink = {
  title: "Transparency",
  items: [
    { label: "How Payments Work", url: "/legal/how-it-works" },
    { label: "Escrow Explanation", url: "/legal/escrow" },
    { label: "Refund Timelines", url: "/legal/refund-timelines" },
    { label: "Wallet Freeze Policy", url: "/legal/wallet-frozen" },
    { label: "Platform Fees", url: "/legal/fees" },
    { label: "Chargeback Policy", url: "/legal/chargeback" },
    { label: "User Verification", url: "/legal/verification" },
  ],
};

const companyLinks: FooterLink = {
  title: "Company",
  items: [
    { label: "About Us", url: "/about" },
    { label: "Contact Us", url: "/contact" },
    { label: "Help Center", url: "/help" },
    { label: "Careers", url: "/careers" },
    { label: "Press", url: "/press" },
    { label: "Blog", url: "/blog" },
  ],
};

const socialLinks = [
  { label: "Twitter", url: "https://twitter.com" },
  { label: "Facebook", url: "https://facebook.com" },
  { label: "Instagram", url: "https://instagram.com" },
  { label: "LinkedIn", url: "https://linkedin.com" },
];

interface FooterSectionProps {
  section: FooterLink;
}

const FooterSection: React.FC<FooterSectionProps> = ({ section }) => {
  const handleLinkPress = (url: string) => {
    if (url.startsWith("http")) {
      Linking.openURL(url);
    } else {
      Linking.openURL(`https://civicfix.com${url}`);
    }
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      {section.items.map((item) => (
        <TouchableOpacity
          key={item.url}
          style={styles.link}
          onPress={() => handleLinkPress(item.url)}
        >
          <Text style={styles.linkText}>{item.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export function Footer() {
  const currentYear = new Date().getFullYear();

  const handleLinkPress = (url: string) => {
    // In mobile app, open external browser for legal pages
    if (url.startsWith("http")) {
      Linking.openURL(url);
    } else {
      // For internal routes, open in browser (since we're in mobile app)
      Linking.openURL(`https://civicfix.com${url}`);
    }
  };

  return (
    <View style={styles.container}>
      {/* Disclaimer Banner */}
      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerTitle}>Platform Disclaimer</Text>
        <Text style={styles.disclaimerText}>
          Civic Fix operates as an intermediary platform connecting users for
          community-driven projects. We do not employ workers, guarantee job
          completion, or warrant the quality of work performed. Users are
          independent parties who contract directly with each other.
        </Text>
      </View>

      {/* Links Sections */}
      <View style={styles.linksContainer}>
        <FooterSection section={legalLinks} />
        <FooterSection section={transparencyLinks} />
        <FooterSection section={companyLinks} />
      </View>

      {/* Social Links */}
      <View style={styles.socialSection}>
        <Text style={styles.socialTitle}>Follow Us</Text>
        <View style={styles.socialLinks}>
          {socialLinks.map((link) => (
            <TouchableOpacity
              key={link.label}
              style={styles.socialButton}
              onPress={() => handleLinkPress(link.url)}
            >
              <Text style={styles.socialText}>{link.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Contact Info */}
      <View style={styles.contactSection}>
        <Text style={styles.contactText}>support@civicfix.com</Text>
        <Text style={styles.contactText}>1-800-CIVIC-FIX</Text>
      </View>

      {/* Copyright */}
      <View style={styles.copyright}>
        <Text style={styles.copyrightText}>
          © {currentYear} Civic Fix. All rights reserved.
        </Text>
        <View style={styles.legalLinks}>
          <TouchableOpacity
            onPress={() => handleLinkPress("/legal/limitation")}
          >
            <Text style={styles.legalLink}>Limitation of Liability</Text>
          </TouchableOpacity>
          <Text style={styles.legalLink}> | </Text>
          <TouchableOpacity
            onPress={() => handleLinkPress("/legal/disclaimer")}
          >
            <Text style={styles.legalLink}>Platform Disclaimer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#111827",
    padding: 20,
  },
  disclaimer: {
    backgroundColor: "#1F2937",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  disclaimerTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  disclaimerText: {
    color: "#9CA3AF",
    fontSize: 11,
    lineHeight: 16,
  },
  linksContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  section: {
    flex: 1,
    marginHorizontal: 4,
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
  },
  link: {
    paddingVertical: 4,
  },
  linkText: {
    color: "#9CA3AF",
    fontSize: 11,
  },
  socialSection: {
    marginBottom: 16,
  },
  socialTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
  },
  socialLinks: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  socialButton: {
    backgroundColor: "#1F2937",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  socialText: {
    color: "#9CA3AF",
    fontSize: 12,
  },
  contactSection: {
    marginBottom: 16,
  },
  contactText: {
    color: "#9CA3AF",
    fontSize: 12,
    marginBottom: 4,
  },
  copyright: {
    borderTopWidth: 1,
    borderTopColor: "#374151",
    paddingTop: 16,
    alignItems: "center",
  },
  copyrightText: {
    color: "#6B7280",
    fontSize: 11,
    marginBottom: 8,
  },
  legalLinks: {
    flexDirection: "row",
    justifyContent: "center",
  },
  legalLink: {
    color: "#6B7280",
    fontSize: 10,
  },
});
