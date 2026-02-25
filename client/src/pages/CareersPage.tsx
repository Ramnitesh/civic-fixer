import { Footer } from "@/components/Footer";
import { Navigation } from "@/components/Navigation";
import {
  Briefcase,
  MapPin,
  Clock,
  ArrowRight,
  Users,
  TrendingUp,
  HeartHandshake,
} from "lucide-react";
import { Link } from "wouter";

interface JobPosition {
  id: string;
  title: string;
  department: string;
  type: string;
  location: string;
  description: string;
  requirements: string[];
  icon: React.ReactNode;
}

const openPositions: JobPosition[] = [
  {
    id: "1",
    title: "Marketing Manager",
    department: "Marketing",
    type: "Full-time",
    location: "Remote / India",
    description:
      "Lead our marketing initiatives to grow the Civic Fix community. You'll develop and execute strategies to increase user acquisition and brand awareness.",
    requirements: [
      "3+ years of experience in digital marketing",
      "Experience with social media and content marketing",
      "Strong analytical skills",
      "Excellent communication skills",
      "Experience in fintech or marketplace platforms is a plus",
    ],
    icon: <TrendingUp className="w-6 h-6" />,
  },
  {
    id: "2",
    title: "Customer Support Specialist",
    department: "Support",
    type: "Full-time",
    location: "Remote / India",
    description:
      "Help our community of users get the most out of Civic Fix. You'll handle customer inquiries, resolve issues, and ensure a great user experience.",
    requirements: [
      "1+ years of customer support experience",
      "Excellent problem-solving skills",
      "Strong written and verbal communication",
      "Patient and empathetic attitude",
      "Experience with helpdesk software is a plus",
    ],
    icon: <HeartHandshake className="w-6 h-6" />,
  },
];

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-6">Careers at Civic Fix</h1>

        <div className="prose prose-lg max-w-none space-y-8 text-muted-foreground">
          {/* Hero Section */}
          <section className="bg-gradient-to-r from-primary/10 to-primary/5 p-8 rounded-2xl">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Join Our Mission
            </h2>
            <p className="text-lg">
              Help us transform communities across India! We're looking for
              passionate individuals to join our team and make a real difference
              in people's lives.
            </p>
          </section>

          {/* Why Work With Us */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Why Work With Us?
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-card p-6 rounded-xl border">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 mb-4">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg mb-2 text-foreground">
                  Impact
                </h3>
                <p className="text-sm">
                  Work on a platform that directly improves communities and
                  people's daily lives.
                </p>
              </div>
              <div className="bg-card p-6 rounded-xl border">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center text-green-600 mb-4">
                  <Briefcase className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg mb-2 text-foreground">
                  Growth
                </h3>
                <p className="text-sm">
                  Fast-paced startup environment with plenty of learning
                  opportunities.
                </p>
              </div>
              <div className="bg-card p-6 rounded-xl border">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center text-purple-600 mb-4">
                  <HeartHandshake className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg mb-2 text-foreground">
                  Balance
                </h3>
                <p className="text-sm">
                  Flexible work arrangements and competitive benefits.
                </p>
              </div>
            </div>
          </section>

          {/* Open Positions */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Open Positions
            </h2>
            <p className="mb-6">
              We're currently looking for talented individuals to join our team:
            </p>

            <div className="space-y-6">
              {openPositions.map((position) => (
                <div
                  key={position.id}
                  className="bg-card border rounded-xl p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                        {position.icon}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-foreground">
                          {position.title}
                        </h3>
                        <div className="-4 mt-flex flex-wrap gap1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Briefcase className="w-4 h-4" />
                            {position.department}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {position.type}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {position.location}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm mb-4">{position.description}</p>

                  <div className="mb-4">
                    <h4 className="font-semibold text-foreground mb-2">
                      Requirements:
                    </h4>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      {position.requirements.map((req, index) => (
                        <li key={index}>{req}</li>
                      ))}
                    </ul>
                  </div>

                  <Link
                    href="/auth?tab=register"
                    className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
                  >
                    Apply Now <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ))}
            </div>
          </section>

          {/* Culture */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Our Culture
            </h2>
            <div className="bg-card p-6 rounded-xl border">
              <p className="mb-4">At Civic Fix, we believe in:</p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <ArrowRight className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Transparency</strong> - Open communication at all
                    levels
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <ArrowRight className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Collaboration</strong> - Working together to solve
                    problems
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <ArrowRight className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Innovation</strong> - Always looking for better
                    solutions
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <ArrowRight className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>User Focus</strong> - Putting our community first
                  </span>
                </li>
              </ul>
            </div>
          </section>

          {/* Application Process */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">
              How to Apply
            </h2>
            <div className="bg-card p-6 rounded-xl border">
              <ol className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">
                      Apply Online
                    </h4>
                    <p className="text-sm">
                      Create an account and submit your application
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">
                      Initial Screening
                    </h4>
                    <p className="text-sm">
                      Our team will review your application
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">Interview</h4>
                    <p className="text-sm">
                      We'll schedule a call to learn more about you
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                    4
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">Offer</h4>
                    <p className="text-sm">Extended to the right candidate!</p>
                  </div>
                </li>
              </ol>
            </div>
          </section>

          {/* Contact */}
          <section className="bg-gradient-to-r from-primary/10 to-primary/5 p-8 rounded-2xl">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Questions?
            </h2>
            <p className="mb-4">
              If you have any questions about working at Civic Fix, we'd love to
              hear from you!
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
            >
              Contact Us <ArrowRight className="w-4 h-4" />
            </Link>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
}
