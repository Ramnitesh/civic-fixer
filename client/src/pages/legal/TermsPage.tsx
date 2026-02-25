import { Footer } from "@/components/Footer";
import { Navigation } from "@/components/Navigation";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>

        <div className="prose prose-sm max-w-none space-y-6 text-muted-foreground">
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing and using Civic Fix, you accept and agree to be bound
              by the terms and provision of this agreement.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              2. Platform Role - Intermediary Only
            </h2>
            <p>Civic Fix operates solely as an intermediary platform. We:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Provide a marketplace for connecting users</li>
              <li>Facilitate payments between parties</li>
              <li>Do NOT employ any workers or service providers</li>
              <li>Do NOT guarantee completion of any job or project</li>
              <li>Do NOT warrant the quality of work performed</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              3. User Relationships
            </h2>
            <p>
              Users of Civic Fix are independent parties. Any agreement or
              contract formed between users is solely between those parties.
              Civic Fix is not a party to such agreements.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              4. Limitation of Liability
            </h2>
            <p>Civic Fix shall not be liable for any damages arising from:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Any transaction between users</li>
              <li>Quality of work performed by workers</li>
              <li>Non-completion of jobs or projects</li>
              <li>Any dispute between users</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              5. User Responsibilities
            </h2>
            <p>Users are solely responsible for:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Verifying the identity and reliability of other users</li>
              <li>Negotiating terms of service</li>
              <li>Resolving disputes directly with other users</li>
              <li>Complying with all applicable laws</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              6. Payment Terms
            </h2>
            <p>
              All payments are processed through our platform. Funds are held
              securely and released according to the agreed milestone completion
              terms between users.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              7. Prohibited Activities
            </h2>
            <p>
              Users must not engage in any illegal activities or any activity
              that violates the rights of others.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              8. Termination
            </h2>
            <p>
              Civic Fix reserves the right to terminate accounts that violate
              these terms without prior notice.
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
}
