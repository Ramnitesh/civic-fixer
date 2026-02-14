import { Navigation } from "@/components/Navigation";
import { useParams, Link } from "wouter";
import { useJob, useUpdateJob } from "@/hooks/use-jobs";
import { useAuth } from "@/hooks/use-auth";
import { useCreateContribution } from "@/hooks/use-contributions";
import { useApplications, useApplyForJob } from "@/hooks/use-applications";
import { Loader2, MapPin, Calendar, User, DollarSign, CheckCircle, ShieldAlert, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";

export default function JobDetailsPage() {
  const params = useParams();
  const id = Number(params.id);
  const { data: job, isLoading } = useJob(id);
  const { user } = useAuth();
  const { mutate: contribute, isPending: isContributing } = useCreateContribution();
  const { mutate: apply, isPending: isApplying } = useApplyForJob();
  const { mutate: updateJob } = useUpdateJob();
  const { data: applications } = useApplications(id);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [bidAmount, setBidAmount] = useState<string>("");
  const [contributionAmount, setContributionAmount] = useState<string>("50");

  const proofMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(api.proofs.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to upload proof");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.jobs.get.path, id] });
      // Also update job status to UNDER_REVIEW
      updateJob({ id, status: "UNDER_REVIEW" });
      toast({ title: "Proof Uploaded", description: "Leader will verify shortly." });
    }
  });
  
  // Application acceptance logic
  const acceptApplicationMutation = useMutation({
    mutationFn: async (appId: number) => {
      await fetch(api.applications.update.path.replace(":id", String(appId)), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ACCEPTED" }),
      });
    },
    onSuccess: (_, appId) => {
      const app = applications?.find(a => a.id === appId);
      if (app) {
        updateJob({ id, selectedWorkerId: app.workerId, status: "IN_PROGRESS" });
        toast({ title: "Worker Selected", description: "Job is now in progress." });
      }
    }
  });


  if (isLoading || !job) {
    return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>;
  }

  const percentFunded = Math.min((job.collectedAmount || 0) / job.targetAmount * 100, 100);
  const isLeader = user?.id === job.leaderId;
  const isWorker = user?.role === "WORKER";
  const hasApplied = applications?.some(app => app.workerId === user?.id);

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navigation />
      
      {/* Hero Header */}
      <div className="bg-muted/30 border-b">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-wrap gap-3 mb-4">
              <Badge variant="outline" className="bg-background">{job.status.replace("_", " ")}</Badge>
              <div className="flex items-center text-sm text-muted-foreground gap-1">
                <MapPin className="w-4 h-4" /> {job.location}
              </div>
              <div className="flex items-center text-sm text-muted-foreground gap-1">
                <Calendar className="w-4 h-4" /> {job.createdAt && format(new Date(job.createdAt), "MMM d, yyyy")}
              </div>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold font-display mb-6">{job.title}</h1>
            
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border border-border">
                <AvatarFallback>{job.leader?.name.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">Organized by {job.leader?.name}</p>
                <p className="text-xs text-muted-foreground">Reputation: {job.leader?.rating?.toFixed(1)}/5.0</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid md:grid-cols-3 gap-8">
          
          {/* Main Content */}
          <div className="md:col-span-2 space-y-8">
            <section>
              <h2 className="text-2xl font-bold font-display mb-4">About this Job</h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{job.description}</p>
            </section>

            {/* Proof Section (Visible if completed or under review) */}
            {(job.status === "UNDER_REVIEW" || job.status === "COMPLETED") && job.proof && (
              <section className="bg-muted/20 p-6 rounded-xl border">
                <h3 className="text-xl font-bold mb-4">Proof of Work</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-semibold">Before</p>
                    <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                       <img src={job.proof.beforePhoto} alt="Before" className="w-full h-full object-cover" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold">After</p>
                    <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                       <img src={job.proof.afterPhoto} alt="After" className="w-full h-full object-cover" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold">Disposal</p>
                    <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                       <img src={job.proof.disposalPhoto} alt="Disposal" className="w-full h-full object-cover" />
                    </div>
                  </div>
                </div>
                {isLeader && job.status === "UNDER_REVIEW" && (
                  <div className="mt-6 flex gap-4">
                    <Button 
                      className="w-full btn-primary"
                      onClick={() => {
                        updateJob({ id, status: "COMPLETED" });
                        toast({ title: "Job Verified", description: "Funds have been released to the worker." });
                      }}
                    >
                      Verify & Release Funds
                    </Button>
                    <Button variant="outline" className="w-full border-destructive text-destructive">
                      Raise Dispute
                    </Button>
                  </div>
                )}
              </section>
            )}

            {/* Applications List (Leader Only) */}
            {isLeader && job.status === "FUNDING_COMPLETE" && (
              <section>
                <h3 className="text-xl font-bold mb-4">Worker Applications</h3>
                <div className="space-y-3">
                  {applications?.map(app => (
                    <div key={app.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>{app.worker?.name.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">{app.worker?.name}</p>
                          <p className="text-sm text-muted-foreground">Bid: ${app.bidAmount}</p>
                        </div>
                      </div>
                      <Button size="sm" onClick={() => acceptApplicationMutation.mutate(app.id)}>
                        Accept
                      </Button>
                    </div>
                  ))}
                  {applications?.length === 0 && <p className="text-muted-foreground">No applications yet.</p>}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="border-2 border-primary/10 shadow-lg">
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span className="text-3xl font-bold text-primary">${job.collectedAmount}</span>
                  <span className="text-sm text-muted-foreground font-normal">of ${job.targetAmount}</span>
                </CardTitle>
                <Progress value={percentFunded} className="h-3" />
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Funding Logic */}
                {job.status === "FUNDING_OPEN" ? (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Join {job.contributions?.length || 0} others in supporting this cleanup.
                    </p>
                    {user ? (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button className="w-full btn-primary text-lg h-12">
                            Contribute Now
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Make a Contribution</DialogTitle>
                            <DialogDescription>Mock payment integration via Razorpay</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                             <div className="space-y-2">
                               <label className="text-sm font-medium">Amount ($)</label>
                               <Input 
                                 type="number" 
                                 value={contributionAmount} 
                                 onChange={e => setContributionAmount(e.target.value)} 
                               />
                             </div>
                             <Button 
                               className="w-full" 
                               onClick={() => contribute({ 
                                 jobId: id, 
                                 userId: user.id, 
                                 amount: Number(contributionAmount) 
                               })}
                               disabled={isContributing}
                             >
                               {isContributing && <Loader2 className="mr-2 animate-spin" />}
                               Pay with Razorpay
                             </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    ) : (
                      <Link href="/auth">
                        <Button variant="outline" className="w-full">Sign in to Contribute</Button>
                      </Link>
                    )}
                  </>
                ) : (
                  <div className="bg-green-50 p-4 rounded-lg text-green-700 text-center font-medium border border-green-200">
                    <CheckCircle className="w-6 h-6 mx-auto mb-2" />
                    Funding Complete!
                  </div>
                )}

                {/* Worker Application Logic */}
                {isWorker && job.status === "FUNDING_COMPLETE" && !hasApplied && (
                  <div className="pt-4 border-t">
                     <p className="text-sm font-medium mb-2">Want to do this job?</p>
                     <div className="flex gap-2">
                       <Input 
                         type="number" 
                         placeholder="Bid Amount ($)" 
                         value={bidAmount} 
                         onChange={e => setBidAmount(e.target.value)}
                         className="w-32"
                       />
                       <Button 
                         className="flex-1"
                         onClick={() => apply({ jobId: id, workerId: user.id, bidAmount: Number(bidAmount) })}
                         disabled={isApplying || !bidAmount}
                       >
                         Apply
                       </Button>
                     </div>
                  </div>
                )}

                {/* Worker Upload Proof Logic */}
                {user?.id === job.selectedWorkerId && job.status === "IN_PROGRESS" && (
                   <div className="pt-4 border-t">
                      <p className="font-semibold mb-2">Upload Proof</p>
                      <Button 
                        className="w-full gap-2" 
                        variant="secondary"
                        onClick={() => proofMutation.mutate({
                          jobId: id,
                          beforePhoto: "https://images.unsplash.com/photo-1611288870280-4a331dd8636d?w=400", // Mock URL
                          afterPhoto: "https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?w=400", // Mock URL
                          disposalPhoto: "https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=400" // Mock URL
                        })}
                        disabled={proofMutation.isPending}
                      >
                        <UploadCloud className="w-4 h-4" /> 
                        {proofMutation.isPending ? "Uploading..." : "Upload Photos (Mock)"}
                      </Button>
                      <p className="text-xs text-muted-foreground mt-2 text-center">Simulates uploading 3 required photos.</p>
                   </div>
                )}

              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contributors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {job.contributions && job.contributions.length > 0 ? (
                    job.contributions.map((c, i) => (
                      <div key={i} className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2">
                           <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                             {/* Ideally we fetch user name, but minimal schema prevents full join here effortlessly */}
                             U{c.userId}
                           </div>
                           <span className="font-medium">User #{c.userId}</span>
                        </div>
                        <span className="font-bold text-green-600">+${c.amount}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Be the first to contribute!</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
}
