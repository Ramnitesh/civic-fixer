import { useAuth } from "@/hooks/use-auth";
import { Navigation } from "@/components/Navigation";
import { useJobs } from "@/hooks/use-jobs";
import { useMyContributions } from "@/hooks/use-contributions";
import { JobCard } from "@/components/JobCard";
import { Loader2, PlusCircle, Wallet, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMemo } from "react";

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth();

  // Fetch jobs where user is the leader (created by user)
  const { data: leaderJobs, isLoading: leaderJobsLoading } = useJobs(
    user?.role === "LEADER" || user?.role === "MEMBER"
      ? { leaderId: String(user.id) }
      : undefined,
  );

  // Fetch user's contributions to get the jobs they funded
  const { data: myContributions, isLoading: contributionsLoading } =
    useMyContributions();

  // Get unique job IDs from contributions
  const contributedJobIds = useMemo(() => {
    if (!myContributions) return [];
    return Array.from(new Set(myContributions.map((c: any) => c.jobId)));
  }, [myContributions]);

  // Fetch jobs where user is a contributor (funded by user)
  const { data: contributorJobs, isLoading: contributorJobsLoading } = useJobs(
    contributedJobIds.length > 0
      ? { status: undefined, leaderId: undefined, contributorId: undefined }
      : undefined,
  );

  // Combine and deduplicate jobs based on role
  // MEMBER: jobs they created OR funded
  // LEADER: jobs they created
  // CONTRIBUTOR: jobs they funded
  const jobs = useMemo(() => {
    if (!leaderJobs && !contributorJobs) return [];

    let allJobs = [...(leaderJobs || [])];

    // Add contributor jobs only if they match user's contributed job IDs
    if (contributorJobs && contributedJobIds.length > 0) {
      const filteredContributorJobs = (contributorJobs as any[]).filter((job) =>
        contributedJobIds.includes(job.id),
      );
      allJobs = [...allJobs, ...filteredContributorJobs];
    }

    // Deduplicate by job ID
    const uniqueJobs = Array.from(
      new Map(allJobs.map((job: any) => [job.id, job])).values(),
    );
    return uniqueJobs;
  }, [leaderJobs, contributorJobs, contributedJobIds]);

  const jobsLoading =
    leaderJobsLoading || contributorJobsLoading || contributionsLoading;

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
          {["MEMBER", "LEADER", "CONTRIBUTOR", "ADMIN"].includes(user.role) && (
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
              {["MEMBER", "LEADER", "CONTRIBUTOR", "ADMIN"].includes(
                user.role,
              ) && (
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
