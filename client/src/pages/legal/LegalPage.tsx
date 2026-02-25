import { useRoute, Route } from "wouter";
import { Footer } from "@/components/Footer";
import { Navigation } from "@/components/Navigation";

// Common legal page content templates
const legalContent: Record<
  string,
  { title: string; sections: { heading: string; content: string | string[] }[] }
> = {
  "/legal/terms": {
    title: "Terms of Service",
    sections: [
      {
        heading: "Acceptance of Terms",
        content:
          "By accessing and using Civic Fix, you accept and agree to be bound by the terms and provision of this agreement.",
      },
      {
        heading: "Platform Role - Intermediary Only",
        content: [
          "Civic Fix operates solely as an intermediary platform. We:",
          "- Provide a marketplace for connecting users",
          "- Facilitate payments between parties",
          "- Do NOT employ any workers or service providers",
          "- Do NOT guarantee completion of any job or project",
          "- Do NOT warrant the quality of work performed",
        ],
      },
      {
        heading: "User Relationships",
        content:
          "Users of Civic Fix are independent parties. Any agreement or contract formed between users is solely between those parties. Civic Fix is not a party to such agreements.",
      },
      {
        heading: "Limitation of Liability",
        content: [
          "Civic Fix shall not be liable for any damages arising from:",
          "- Any transaction between users",
          "- Quality of work performed by workers",
          "- Non-completion of jobs or projects",
          "- Any dispute between users",
        ],
      },
    ],
  },
  "/legal/privacy": {
    title: "Privacy Policy",
    sections: [
      {
        heading: "Data Collection",
        content: [
          "We collect minimal personal information necessary for platform functionality:",
          "- Account information (name, email, phone)",
          "- Payment information (processed securely via third parties)",
          "- Job-related data you provide",
          "- Usage and analytics data",
        ],
      },
      {
        heading: "Data Usage",
        content: [
          "Your data is used solely for:",
          "- Providing platform services",
          "- Processing transactions",
          "- Communication about your account",
          "- Platform improvement and analytics",
        ],
      },
      {
        heading: "Data Protection",
        content:
          "We implement industry-standard security measures to protect your data. However, no method of transmission over the internet is 100% secure.",
      },
      {
        heading: "Your Rights",
        content: [
          "You have the right to:",
          "- Access your personal data",
          "- Request data correction",
          "- Request data deletion",
          "- Opt-out of marketing communications",
        ],
      },
    ],
  },
  "/legal/refund": {
    title: "Refund Policy",
    sections: [
      {
        heading: "Refund Eligibility",
        content:
          "Refunds are available only when funds have not been released to the worker. Once a job is marked complete and verified by the community leader, funds are released and cannot be refunded.",
      },
      {
        heading: "Refund Request Process",
        content: [
          "To request a refund:",
          "- Contact support@civicfix.com within 30 days of payment",
          "- Provide your order details and reason for refund",
          "- Allow 5-7 business days for processing",
        ],
      },
      {
        heading: "Non-Refundable Items",
        content: "Processing fees and platform charges are non-refundable.",
      },
    ],
  },
  "/legal/wallet": {
    title: "Wallet & Payments",
    sections: [
      {
        heading: "Wallet Overview",
        content:
          "Your Civic Fix wallet is used to hold funds for jobs and receive payments for completed work. All funds are held in secure escrow until job completion is verified.",
      },
      {
        heading: "Adding Funds",
        content:
          "You can add funds to your wallet using credit/debit cards or bank transfers. All transactions are processed securely through our payment partners.",
      },
      {
        heading: "Withdrawing Funds",
        content:
          "Withdrawal requests are processed within 3-5 business days. You must verify your identity before withdrawing funds.",
      },
    ],
  },
  "/legal/dispute": {
    title: "Dispute Resolution",
    sections: [
      {
        heading: "Dispute Process",
        content:
          "If you have a dispute with another user, we encourage you to resolve it directly first. If resolution is not possible, you can file a dispute through our platform.",
      },
      {
        heading: "Filing a Dispute",
        content: [
          "To file a dispute:",
          "- Go to the job details page",
          "- Click 'Report Issue'",
          "- Provide detailed information about the dispute",
          "- Our team will review within 48 hours",
        ],
      },
      {
        heading: "Resolution Options",
        content:
          "Depending on the situation, we may offer mediation, partial refund, or escalate to our legal team.",
      },
    ],
  },
  "/legal/guidelines": {
    title: "Community Guidelines",
    sections: [
      {
        heading: "Respect & Professionalism",
        content:
          "All users must treat each other with respect. Harassment, discrimination, and abusive behavior are not tolerated.",
      },
      {
        heading: "Accuracy",
        content:
          "All job postings must accurately describe the work to be done. Misleading or fraudulent jobs will be removed.",
      },
      {
        heading: "Completion Standards",
        content:
          "Workers must complete jobs to the standards described in the job posting. Community leaders must verify work fairly.",
      },
    ],
  },
  "/legal/cookies": {
    title: "Cookie Policy",
    sections: [
      {
        heading: "What Are Cookies",
        content:
          "Cookies are small text files stored on your device that help us improve your experience on our platform.",
      },
      {
        heading: "How We Use Cookies",
        content: [
          "We use cookies for:",
          "- Keeping you logged in",
          "- Remembering your preferences",
          "- Analytics and improvements",
          "- Security purposes",
        ],
      },
      {
        heading: "Managing Cookies",
        content:
          "You can control or disable cookies through your browser settings. Note that some features may not work properly without cookies.",
      },
    ],
  },
  "/legal/deletion": {
    title: "Data Deletion",
    sections: [
      {
        heading: "Right to Delete",
        content:
          "You have the right to request deletion of your personal data at any time. Contact us at support@civicfix.com to request deletion.",
      },
      {
        heading: "Deletion Process",
        content:
          "Once we receive your request, we will delete your personal data within 30 days, except where we are required to retain it by law.",
      },
      {
        heading: "Data Retention",
        content:
          "We may retain certain information in anonymized form for analytics purposes.",
      },
    ],
  },
  "/legal/aml": {
    title: "AML Policy",
    sections: [
      {
        heading: "Anti-Money Laundering Commitment",
        content:
          "Civic Fix is committed to preventing money laundering and terrorist financing. We comply with all applicable AML laws and regulations.",
      },
      {
        heading: "Customer Due Diligence",
        content:
          "We verify the identity of all users and monitor transactions for suspicious activity.",
      },
      {
        heading: "Reporting",
        content:
          "We are required to report any suspicious transactions to the appropriate authorities.",
      },
    ],
  },
  "/legal/how-it-works": {
    title: "How Payments Work",
    sections: [
      {
        heading: "Payment Flow",
        content: [
          "1. Citizen posts a job and funds the escrow",
          "2. Worker completes the job",
          "3. Community leader verifies completion",
          "4. Funds are released to worker",
        ],
      },
      {
        heading: "Escrow Security",
        content:
          "All funds are held in secure escrow until job completion is verified. This protects both the citizen and the worker.",
      },
    ],
  },
  "/legal/escrow": {
    title: "Escrow Explanation",
    sections: [
      {
        heading: "What is Escrow",
        content:
          "Escrow is a financial arrangement where a third party holds funds during a transaction. On Civic Fix, we hold funds until the job is completed and verified.",
      },
      {
        heading: "Benefits of Escrow",
        content: [
          "- Protects citizens from fraud",
          "- Ensures workers get paid for completed work",
          "- Provides neutral dispute resolution",
        ],
      },
    ],
  },
  "/legal/refund-timelines": {
    title: "Refund Timelines",
    sections: [
      {
        heading: "Refund Processing Time",
        content:
          "Refunds are processed within 5-7 business days. The time may vary depending on your bank or payment provider.",
      },
    ],
  },
  "/legal/wallet-frozen": {
    title: "Wallet Freeze Policy",
    sections: [
      {
        heading: "When Wallets May Be Frozen",
        content:
          "Your wallet may be frozen if we detect suspicious activity, if you violate our terms, or if we're required to do so by law.",
      },
      {
        heading: "Unfreezing Your Wallet",
        content:
          "Contact support@civicfix.com if your wallet has been frozen. We will work with you to resolve any issues.",
      },
    ],
  },
  "/legal/fees": {
    title: "Platform Fees",
    sections: [
      {
        heading: "Fee Structure",
        content:
          "Civic Fix charges a small platform fee on each transaction to maintain and improve our services. The current fee is 10% of the job value.",
      },
    ],
  },
  "/legal/chargeback": {
    title: "Chargeback Policy",
    sections: [
      {
        heading: "Chargeback Process",
        content:
          "If you dispute a charge, contact your payment provider first. Chargebacks should be a last resort after attempting to resolve issues through our dispute process.",
      },
    ],
  },
  "/legal/verification": {
    title: "User Verification",
    sections: [
      {
        heading: "Why We Verify",
        content:
          "We verify users to ensure safety and trust on our platform. This helps protect both citizens and workers.",
      },
      {
        heading: "Verification Levels",
        content: [
          "Basic: Email and phone verification",
          "Standard: ID verification",
          "Premium: Background check",
        ],
      },
    ],
  },
  "/legal/limitation": {
    title: "Limitation of Liability",
    sections: [
      {
        heading: "Liability Disclaimer",
        content:
          "Civic Fix is not liable for any indirect, incidental, or consequential damages arising from your use of the platform.",
      },
      {
        heading: "Maximum Liability",
        content:
          "Our maximum liability is limited to the amount you have paid to Civic Fix in the last 12 months.",
      },
    ],
  },
  "/legal/disclaimer": {
    title: "Platform Disclaimer",
    sections: [
      {
        heading: "Disclaimer",
        content:
          "Civic Fix operates as an intermediary platform. We do not employ workers, guarantee job completion, or warrant the quality of work performed. Users are independent parties who contract directly with each other.",
      },
    ],
  },
};

export default function LegalPage() {
  const [match, params] = useRoute("/legal/:slug");
  const slug = match ? params?.slug : "";
  const path = `/legal/${slug}`;

  const content = legalContent[path];

  if (!content) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <h1 className="text-3xl font-bold mb-6">Page Not Found</h1>
          <p className="text-muted-foreground">
            This legal page does not exist.
          </p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">{content.title}</h1>

        <div className="prose prose-sm max-w-none space-y-6 text-muted-foreground">
          {content.sections.map((section, index) => (
            <section key={index}>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                {section.heading}
              </h2>
              {Array.isArray(section.content) ? (
                <ul className="list-disc pl-6 space-y-1">
                  {section.content.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p>{section.content}</p>
              )}
            </section>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}
