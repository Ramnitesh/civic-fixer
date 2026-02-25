import { Footer } from "@/components/Footer";
import { Navigation } from "@/components/Navigation";
import { Users, ShieldCheck, DollarSign, ArrowRight } from "lucide-react";
import { Link } from "wouter";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-6">About Civic Fix</h1>

        <div className="prose prose-lg max-w-none space-y-8 text-muted-foreground">
          {/* Mission Statement */}
          <section className="bg-gradient-to-r from-primary/10 to-primary/5 p-8 rounded-2xl">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Our Mission
            </h2>
            <p className="text-lg">
              Civic Fix empowers communities to identify, fund, and solve local
              civic issues together. We believe that neighborhoods thrive when
              citizens work collaboratively with local leaders to create
              tangible improvements.
            </p>
          </section>

          {/* What We Do */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">
              What We Do
            </h2>
            <p>
              We provide a platform that connects three key groups in community
              improvement:
            </p>
            <div className="grid md:grid-cols-3 gap-6 mt-6">
              <div className="bg-card p-6 rounded-xl border">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 mb-4">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg mb-2 text-foreground">
                  Citizens
                </h3>
                <p className="text-sm">
                  Community members who identify issues, contribute funds, and
                  vote on priorities.
                </p>
              </div>
              <div className="bg-card p-6 rounded-xl border">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center text-green-600 mb-4">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg mb-2 text-foreground">
                  Leaders
                </h3>
                <p className="text-sm">
                  Local leaders who initiate projects, manage implementations,
                  and verify completion.
                </p>
              </div>
              <div className="bg-card p-6 rounded-xl border">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center text-orange-600 mb-4">
                  <DollarSign className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg mb-2 text-foreground">
                  Workers
                </h3>
                <p className="text-sm">
                  Skilled workers who complete jobs and get paid fairly for
                  their contributions.
                </p>
              </div>
            </div>
          </section>

          {/* How It Works */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">
              How It Works
            </h2>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  1
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Post a Job</h3>
                  <p>
                    Anyone can post a civic issue that needs attention - from
                    potholes to park cleanups.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  2
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">
                    Fund the Project
                  </h3>
                  <p>
                    Community members contribute to fund the work. Funds are
                    held securely in escrow.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  3
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Get It Done</h3>
                  <p>
                    Workers complete the job with photo proof. Leaders verify
                    quality before approval.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  4
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">
                    Release Payment
                  </h3>
                  <p>
                    Once verified, funds are released to the worker. Everyone
                    wins!
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Why Choose Us */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Why Choose Civic Fix?
            </h2>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <ArrowRight className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Transparency</strong> - Every dollar is tracked and
                  accounted for
                </span>
              </li>
              <li className="flex items-start gap-3">
                <ArrowRight className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Escrow Protection</strong> - Funds only released when
                  work is verified
                </span>
              </li>
              <li className="flex items-start gap-3">
                <ArrowRight className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Community Driven</strong> - You decide what matters in
                  your neighborhood
                </span>
              </li>
              <li className="flex items-start gap-3">
                <ArrowRight className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Verified Results</strong> - Photo proof ensures work
                  actually gets done
                </span>
              </li>
            </ul>
          </section>

          {/* Platform Disclaimer */}
          <section className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-xl border border-yellow-200 dark:border-yellow-800">
            <h2 className="text-xl font-bold text-foreground mb-2">
              Important Note
            </h2>
            <p className="text-sm">
              Civic Fix is an intermediary platform. We connect users but do not
              employ workers, guarantee job completion, or warrant work quality.
              Users are independent parties who contract directly with each
              other.
            </p>
          </section>

          {/* CTA */}
          <section className="text-center py-8">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Ready to Make a Difference?
            </h2>
            <p className="text-muted-foreground mb-6">
              Join your neighbors in building a better community.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/auth?tab=register">
                <button className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition">
                  Get Started
                </button>
              </Link>
              <Link href="/jobs">
                <button className="border border-primary text-primary px-6 py-3 rounded-lg font-semibold hover:bg-primary/10 transition">
                  Browse Jobs
                </button>
              </Link>
            </div>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
}
