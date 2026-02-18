import { useAuth } from "@/hooks/use-auth";
import { Navigation } from "@/components/Navigation";
import { useJobs } from "@/hooks/use-jobs";
import { JobCard } from "@/components/JobCard";
import { Loader2, PlusCircle, Wallet, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth();

  // Fetch jobs relevant to the user
  // Leader: jobs they created
  // Worker: jobs they are assigned to (status != FUNDING_OPEN)
  // Contributor: jobs they funded
  const { data: jobs, isLoading: jobsLoading } = useJobs(
    user?.role === "LEADER"
      ? { leaderId: String(user.id) }
      : user?.role === "CONTRIBUTOR"
        ? { contributorId: String(user.id) }
        : undefined,
  );

  if (authLoading || jobsLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null; // Should redirect via protected route wrapper

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold font-display">
              Welcome back, {user.name.split(" ")[0]}
            </h1>
            <p className="text-muted-foreground mt-1">
              Here's what's happening in your community today.
            </p>
          </div>
          {user.role === "LEADER" && (
            <Link href="/create-job">
              <Button className="btn-primary gap-2">
                <PlusCircle className="w-4 h-4" /> Create New Job
              </Button>
            </Link>
          )}
        </div>

        {/* Active Jobs Section */}
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-4 font-display">
            Active Jobs ({jobs?.length || 0})
          </h2>
          {jobs?.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-xl bg-muted/10">
              <p className="text-muted-foreground">No active jobs found.</p>
              {user.role === "LEADER" && (
                <Link href="/create-job">
                  <Button variant="ghost" className="text-primary">
                    Create one now
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {jobs?.map((job: any) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
