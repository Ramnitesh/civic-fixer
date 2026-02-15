import { Navigation } from "@/components/Navigation";
import { useJobs } from "@/hooks/use-jobs";
import { JobCard } from "@/components/JobCard";
import { Loader2, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function JobsListPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { data: jobs, isLoading } = useJobs(
    statusFilter !== "all" ? { status: statusFilter } : undefined,
  );

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="bg-muted/30 border-b">
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold font-display mb-4">
            Browse Cleanup Jobs
          </h1>
          <p className="text-muted-foreground max-w-2xl text-lg">
            Find projects in your area that need funding or helping hands.
            Filter by status to find where you can make the most impact.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filters Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-8 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search jobs (coming soon)..."
              className="pl-10"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="FUNDING_OPEN">Open for Funding</SelectItem>
                <SelectItem value="FUNDING_COMPLETE">
                  Funding Complete
                </SelectItem>
                <SelectItem value="WORKER_SELECTED">Worker Selected</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="AWAITING_VERIFICATION">
                  Awaiting Verification
                </SelectItem>
                <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="DISPUTED">Disputed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
        ) : jobs?.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed rounded-xl">
            <h3 className="text-xl font-bold text-muted-foreground">
              No jobs found
            </h3>
            <p className="text-sm text-muted-foreground mt-2">
              Try adjusting your filters.
            </p>
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
  );
}
