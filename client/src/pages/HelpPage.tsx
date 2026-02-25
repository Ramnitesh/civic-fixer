import { Footer } from "@/components/Footer";
import { Navigation } from "@/components/Navigation";
import { useState } from "react";
import {
  Mail,
  Phone,
  MessageSquare,
  Search,
  ChevronDown,
  ChevronUp,
  ArrowRight,
} from "lucide-react";
import { Link } from "wouter";

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
  {
    id: "9",
    question: "How do I withdraw my earnings?",
    answer:
      "Go to your Wallet section and click 'Withdraw'. Enter the amount and your bank details. Withdrawals are processed within 3-5 business days.",
  },
  {
    id: "10",
    question: "What payment methods are accepted?",
    answer:
      "We accept all major credit cards, debit cards, UPI, and bank transfers. All transactions are secure and encrypted.",
  },
];

export default function HelpPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFAQs = faqItems.filter(
    (item) =>
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-6">Help Center</h1>

        <div className="prose prose-lg max-w-none space-y-8 text-muted-foreground">
          {/* Search */}
          <section>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search for help..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-card border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </section>

          {/* Quick Actions */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Quick Actions
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              <a
                href="mailto:support@civicfix.com"
                className="bg-card p-6 rounded-xl border hover:border-primary transition group"
              >
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 mb-4">
                  <Mail className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg mb-2 text-foreground">
                  Email Support
                </h3>
                <p className="text-sm">Get help via email within 24 hours</p>
              </a>

              <a
                href="tel:1-800-CIVIC-FIX"
                className="bg-card p-6 rounded-xl border hover:border-primary transition group"
              >
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center text-green-600 mb-4">
                  <Phone className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg mb-2 text-foreground">
                  Call Us
                </h3>
                <p className="text-sm">Mon-Fri, 9am-6pm EST</p>
              </a>

              <Link
                href="/contact"
                className="bg-card p-6 rounded-xl border hover:border-primary transition group"
              >
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center text-orange-600 mb-4">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg mb-2 text-foreground">
                  Live Chat
                </h3>
                <p className="text-sm">Chat with us for quick help</p>
              </Link>
            </div>
          </section>

          {/* FAQ Section */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Frequently Asked Questions
            </h2>
            <div className="space-y-3">
              {filteredFAQs.map((item) => (
                <div
                  key={item.id}
                  className="bg-card border rounded-xl overflow-hidden"
                >
                  <button
                    onClick={() =>
                      setExpandedId(expandedId === item.id ? null : item.id)
                    }
                    className="w-full px-6 py-4 flex items-center justify-between text-left"
                  >
                    <span className="font-medium text-foreground pr-4">
                      {item.question}
                    </span>
                    {expandedId === item.id ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    )}
                  </button>
                  {expandedId === item.id && (
                    <div className="px-6 pb-4 pt-0 text-sm text-muted-foreground border-t">
                      <p className="pt-4">{item.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {filteredFAQs.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>No results found for "{searchQuery}"</p>
                <p className="text-sm mt-2">
                  Try a different search term or contact support
                </p>
              </div>
            )}
          </section>

          {/* Popular Topics */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Popular Topics
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Link
                href="/legal/terms"
                className="bg-card p-4 rounded-xl border hover:border-primary transition flex items-center justify-between group"
              >
                <span className="font-medium text-foreground">
                  Terms of Service
                </span>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition" />
              </Link>
              <Link
                href="/legal/privacy"
                className="bg-card p-4 rounded-xl border hover:border-primary transition flex items-center justify-between group"
              >
                <span className="font-medium text-foreground">
                  Privacy Policy
                </span>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition" />
              </Link>
              <Link
                href="/legal/wallet"
                className="bg-card p-4 rounded-xl border hover:border-primary transition flex items-center justify-between group"
              >
                <span className="font-medium text-foreground">
                  Wallet & Payments
                </span>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition" />
              </Link>
              <Link
                href="/legal/refund"
                className="bg-card p-4 rounded-xl border hover:border-primary transition flex items-center justify-between group"
              >
                <span className="font-medium text-foreground">
                  Refund Policy
                </span>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition" />
              </Link>
              <Link
                href="/legal/dispute"
                className="bg-card p-4 rounded-xl border hover:border-primary transition flex items-center justify-between group"
              >
                <span className="font-medium text-foreground">
                  Dispute Resolution
                </span>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition" />
              </Link>
              <Link
                href="/legal/escrow"
                className="bg-card p-4 rounded-xl border hover:border-primary transition flex items-center justify-between group"
              >
                <span className="font-medium text-foreground">
                  How Escrow Works
                </span>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition" />
              </Link>
            </div>
          </section>

          {/* Still Need Help */}
          <section className="bg-gradient-to-r from-primary/10 to-primary/5 p-8 rounded-2xl">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Still Need Help?
            </h2>
            <p className="mb-6">
              Can't find what you're looking for? Our support team is here to
              help.
            </p>
            <div className="flex gap-4">
              <a
                href="mailto:support@civicfix.com"
                className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition"
              >
                Email Support
              </a>
              <Link
                href="/contact"
                className="border border-primary text-primary px-6 py-3 rounded-lg font-semibold hover:bg-primary/10 transition"
              >
                Contact Us
              </Link>
            </div>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
}
