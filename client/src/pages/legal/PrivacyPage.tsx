import { Footer } from "@/components/Footer";
import { Navigation } from "@/components/Navigation";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>

        <div className="prose prose-sm max-w-none space-y-6 text-muted-foreground">
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              1. Data Collection
            </h2>
            <p>
              We collect minimal personal information necessary for platform
              functionality:
            </p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Account information (name, email, phone)</li>
              <li>
                Payment information (processed securely via third parties)
              </li>
              <li>Job-related data you provide</li>
              <li>Usage and analytics data</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              2. Data Usage
            </h2>
            <p>Your data is used solely for:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Providing platform services</li>
              <li>Processing transactions</li>
              <li>Communication about your account</li>
              <li>Platform improvement and analytics</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              3. Data Protection
            </h2>
            <p>
              We implement industry-standard security measures to protect your
              data. However, no method of transmission over the internet is 100%
              secure.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              4. Third-Party Disclosure
            </h2>
            <p>We may share data with:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Payment processors (for transaction handling)</li>
              <li>Legal authorities (when required by law)</li>
              <li>Service providers (for platform operations)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              5. Your Rights
            </h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Access your personal data</li>
              <li>Request data correction</li>
              <li>Request data deletion</li>
              <li>Opt-out of marketing communications</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              6. Cookies
            </h2>
            <p>
              We use cookies to enhance user experience. You can control cookies
              through your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              7. Data Retention
            </h2>
            <p>
              We retain your data as long as your account is active or as needed
              to provide services. You may request deletion at any time.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              8. Children's Privacy
            </h2>
            <p>Our platform is not intended for users under 18 years of age.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              9. Changes to Policy
            </h2>
            <p>
              We may update this policy periodically. We will notify users of
              any material changes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              10. Contact
            </h2>
            <p>For privacy concerns, contact us at support@civicfix.com</p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
}
