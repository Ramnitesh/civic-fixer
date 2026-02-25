import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  ArrowRight,
  Users,
  ShieldCheck,
  DollarSign,
  Download,
  Smartphone,
} from "lucide-react";
import { motion } from "framer-motion";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32 lg:pt-32">
        <div className="absolute inset-0 z-0 opacity-10 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px]"></div>

        <div className="container relative z-10 mx-auto px-4 text-center max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block py-1 px-3 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6">
              Community-Led Civic Action
            </span>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 font-display bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-primary to-gray-900 dark:from-white dark:via-primary dark:to-gray-200">
              Transform Your Neighborhood Together
            </h1>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              Crowd Civic Fix empowers communities to identify, fund, and solve
              local issues through transparent collaboration and verified
              results.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/jobs">
                <Button
                  size="lg"
                  className="h-12 px-8 text-lg btn-primary rounded-full"
                >
                  Browse Jobs
                </Button>
              </Link>
              <Link href="/auth">
                <Button
                  variant="outline"
                  size="lg"
                  className="h-12 px-8 text-lg rounded-full border-2"
                >
                  Join Community
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="glass-panel p-8 rounded-2xl">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 mb-6">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Community Driven</h3>
              <p className="text-muted-foreground">
                Local leaders initiate projects, neighbors contribute, and
                everyone benefits from a cleaner environment.
              </p>
            </div>

            <div className="glass-panel p-8 rounded-2xl">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center text-green-600 mb-6">
                <DollarSign className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Transparent Funding</h3>
              <p className="text-muted-foreground">
                Secure crowdfunding ensures resources are available before work
                starts. Funds are held in escrow.
              </p>
            </div>

            <div className="glass-panel p-8 rounded-2xl">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center text-orange-600 mb-6">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Verified Results</h3>
              <p className="text-muted-foreground">
                Workers provide photo proof of completion. Community leaders
                verify quality before funds are released.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile App Download Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 font-display">
                Get the Crowd Civic Fix App
              </h2>
              <p className="text-muted-foreground text-lg">
                Take action on-the-go. Report issues, track progress, and
                contribute to projects from anywhere.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Android Download */}
              <a
                href="https://drive.google.com/file/d/1a4d9Vjj-bKsNlIfvZeLJSK3FRsL2kXYv/view"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-6 rounded-2xl border-2 border-green-500/20 hover:border-green-500/50 transition-all hover:shadow-lg hover:shadow-green-500/10 bg-card group"
              >
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center">
                  <Smartphone className="w-8 h-8 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-1">Android App</h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Download APK
                  </p>
                </div>
                <div className="text-green-600 group-hover:translate-x-1 transition-transform">
                  <ArrowRight className="w-6 h-6" />
                </div>
              </a>

              {/* iOS Coming Soon */}
              <div className="flex items-center gap-4 p-6 rounded-2xl border-2 border-muted bg-card opacity-60">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-900/30 rounded-2xl flex items-center justify-center">
                  <Smartphone className="w-8 h-8 text-gray-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-1">iOS App</h3>
                  <p className="text-sm text-muted-foreground">Coming Soon</p>
                </div>
                <div className="text-gray-400">
                  <ArrowRight className="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="bg-secondary rounded-3xl p-12 text-center text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

            <div className="relative z-10 max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 font-display">
                Ready to make a difference?
              </h2>
              <p className="text-blue-100 mb-8 text-lg">
                Whether you want to lead a project, fund a cleanup, or do the
                work, there's a role for you.
              </p>
              <Link href="/auth?tab=register">
                <Button
                  size="lg"
                  variant="secondary"
                  className="bg-white text-secondary hover:bg-white/90 font-bold h-12 px-8"
                >
                  Get Started Now
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
