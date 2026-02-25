import { Footer } from "@/components/Footer";
import { Navigation } from "@/components/Navigation";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  MessageSquare,
  HeadphonesIcon,
  ArrowRight,
} from "lucide-react";
import { Link } from "wouter";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-6">Contact Us</h1>

        <div className="prose prose-lg max-w-none space-y-8 text-muted-foreground">
          {/* Get in Touch */}
          <section>
            <p className="text-lg mb-6">
              We'd love to hear from you! Whether you have a question about our
              platform, need help with a job, or want to report an issue, we're
              here to help.
            </p>
          </section>

          {/* Contact Options */}
          <section className="grid md:grid-cols-2 gap-6">
            <div className="bg-card p-6 rounded-xl border">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 mb-4">
                <Mail className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg mb-2 text-foreground">
                Email Us
              </h3>
              <p className="text-sm mb-4">For general inquiries and support</p>
              <a
                href="mailto:support@civicfix.com"
                className="text-primary hover:underline font-medium"
              >
                support@civicfix.com
              </a>
            </div>

            <div className="bg-card p-6 rounded-xl border">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center text-green-600 mb-4">
                <Phone className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg mb-2 text-foreground">
                Call Us
              </h3>
              <p className="text-sm mb-4">Mon-Fri, 9am-6pm EST</p>
              <a
                href="tel:1-800-CIVIC-FIX"
                className="text-primary hover:underline font-medium"
              >
                1-800-CIVIC-FIX
              </a>
            </div>

            <div className="bg-card p-6 rounded-xl border">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center text-orange-600 mb-4">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg mb-2 text-foreground">
                Live Chat
              </h3>
              <p className="text-sm mb-4">Available 24/7 for quick support</p>
              <button className="text-primary hover:underline font-medium">
                Start Chat
              </button>
            </div>

            <div className="bg-card p-6 rounded-xl border">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center text-purple-600 mb-4">
                <HeadphonesIcon className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg mb-2 text-foreground">
                Help Center
              </h3>
              <p className="text-sm mb-4">Browse FAQs and guides</p>
              <Link
                href="/help"
                className="text-primary hover:underline font-medium flex items-center gap-1"
              >
                Visit Help Center <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </section>

          {/* Business Hours */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Business Hours
            </h2>
            <div className="bg-card p-6 rounded-xl border">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                <div>
                  <p className="font-medium text-foreground">
                    Monday - Friday: 9:00 AM - 6:00 PM (EST)
                  </p>
                  <p className="text-foreground">
                    Saturday: 10:00 AM - 2:00 PM (EST)
                  </p>
                  <p className="text-foreground">Sunday: Closed</p>
                </div>
              </div>
            </div>
          </section>

          {/* Response Time */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Response Times
            </h2>
            <div className="bg-card p-6 rounded-xl border">
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <ArrowRight className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Email</strong> - We typically respond within 24
                    hours
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <ArrowRight className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Phone</strong> - Average wait time is less than 5
                    minutes
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <ArrowRight className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Live Chat</strong> - Instant response during
                    business hours
                  </span>
                </li>
              </ul>
            </div>
          </section>

          {/* Platform Disclaimer */}
          <section className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-xl border border-yellow-200 dark:border-yellow-800">
            <h2 className="text-xl font-bold text-foreground mb-2">
              Important Note
            </h2>
            <p className="text-sm">
              For disputes regarding jobs, please use our{" "}
              <Link
                href="/legal/dispute"
                className="text-primary hover:underline"
              >
                Dispute Resolution
              </Link>{" "}
              process. Our support team is here to help facilitate communication
              but is not a party to any agreement between users.
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
}
