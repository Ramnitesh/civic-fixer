import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { MapPin, Users, DollarSign, Calendar, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import type { JobResponse } from "@shared/schema";
import { format } from "date-fns";

interface JobCardProps {
  job: JobResponse;
}

export function JobCard({ job }: JobCardProps) {
  const percentFunded = Math.min(
    ((job.collectedAmount || 0) / job.targetAmount) * 100,
    100,
  );
  const jobImageUrl = (job as any)?.imageUrl as string | null | undefined;

  const statusColors: Record<string, string> = {
    FUNDING_OPEN: "bg-blue-500/10 text-blue-600 border-blue-200",
    FUNDING_COMPLETE: "bg-green-500/10 text-green-600 border-green-200",
    IN_PROGRESS: "bg-orange-500/10 text-orange-600 border-orange-200",
    COMPLETED: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
    DISPUTED: "bg-red-500/10 text-red-600 border-red-200",
  };

  return (
    <Card className="card-hover group border-border/50 overflow-hidden flex flex-col h-full">
      <CardHeader className="p-0">
        <div className="h-40 bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
          {jobImageUrl ? (
            <img
              src={jobImageUrl}
              alt={job.title}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/30 font-display font-bold text-4xl transform -rotate-12 select-none group-hover:scale-110 transition-transform duration-500">
              CLEANUP
            </div>
          )}
          <div className="absolute top-4 right-4">
            <Badge
              variant="outline"
              className={`${statusColors[job.status] || "bg-gray-100"} backdrop-blur-md font-semibold px-3 py-1`}
            >
              {job.status.replace("_", " ")}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 flex-1 flex flex-col gap-4">
        <div>
          <h3 className="text-xl font-bold font-display mb-2 group-hover:text-primary transition-colors line-clamp-1">
            {job.title}
          </h3>
          <div className="flex items-center text-muted-foreground text-sm gap-1 mb-3">
            <MapPin className="w-4 h-4" />
            <span className="line-clamp-1">{job.location}</span>
          </div>
          <p className="text-muted-foreground text-sm line-clamp-2 leading-relaxed">
            {job.description}
          </p>
        </div>

        <div className="mt-auto space-y-3">
          <div className="flex justify-between text-sm font-medium">
            <span>₹{job.collectedAmount || 0} raised</span>
            <span className="text-muted-foreground">
              Goal: ₹{job.targetAmount}
            </span>
          </div>
          <Progress value={percentFunded} className="h-2 bg-secondary/10" />
        </div>
      </CardContent>

      <CardFooter className="p-6 pt-0 border-t bg-muted/20 mt-auto flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-4">
          <Calendar className="w-3 h-3" />
          {job.createdAt
            ? format(new Date(job.createdAt), "MMM d, yyyy")
            : "Recent"}
        </div>
        <Link href={`/jobs/${job.id}`}>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 hover:text-primary hover:bg-primary/5 mt-4"
          >
            View Details <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
