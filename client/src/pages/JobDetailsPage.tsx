import { Navigation } from "@/components/Navigation";
import { useParams, Link } from "wouter";
import { useJob, useUpdateJob } from "@/hooks/use-jobs";
import { useAuth } from "@/hooks/use-auth";
import { useCreateContribution } from "@/hooks/use-contributions";
import { useApplications, useApplyForJob } from "@/hooks/use-applications";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useMemo, useState } from "react";
import { formatDistanceStrict } from "date-fns";
import {
  Loader2,
  MapPin,
  Calendar,
  UploadCloud,
  Share2,
  Clock3,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";

export default function JobDetailsPage() {
  const { id: idParam } = useParams();
  const id = Number(idParam);
  const { user } = useAuth();
  const { data: job, isLoading } = useJob(id);
  const { data: applications = [] } = useApplications(id);
  const { mutate: updateJob, isPending: isUpdatingJob } = useUpdateJob();
  const { mutate: contribute, isPending: isContributing } =
    useCreateContribution();
  const { mutate: apply, isPending: isApplying } = useApplyForJob();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [contributionAmount, setContributionAmount] = useState("100");
  const [bidAmount, setBidAmount] = useState("");
  const [beforeFile, setBeforeFile] = useState<File | null>(null);
  const [afterFile, setAfterFile] = useState<File | null>(null);
  const [disposalFile, setDisposalFile] = useState<File | null>(null);
  const [disputeReason, setDisputeReason] = useState("");

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editTargetAmount, setEditTargetAmount] = useState("");
  const [editPrivateProperty, setEditPrivateProperty] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!job) return;
    setEditTitle(job.title);
    setEditDescription(job.description);
    setEditLocation(job.location);
    setEditTargetAmount(String(job.targetAmount));
    setEditPrivateProperty(Boolean(job.isPrivateResidentialProperty));
  }, [job]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const proofMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(api.proofs.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const message =
          (await res.json().catch(() => null))?.message ??
          "Failed to upload proof";
        throw new Error(message);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.jobs.get.path, id] });
      toast({
        title: "Proof uploaded",
        description: "Leader has been notified.",
      });
    },
    onError: (err: Error) => {
      toast({
        title: "Proof upload failed",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const disputeMutation = useMutation({
    mutationFn: async (payload: { jobId: number; reason: string }) => {
      const res = await fetch(api.disputes.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const message =
          (await res.json().catch(() => null))?.message ??
          "Failed to raise dispute";
        throw new Error(message);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.jobs.get.path, id] });
      setDisputeReason("");
      toast({
        title: "Dispute raised",
        description: "Admin will resolve this dispute.",
      });
    },
    onError: (err: Error) => {
      toast({
        title: "Dispute failed",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const acceptMutation = useMutation({
    mutationFn: async (applicationId: number) => {
      const res = await fetch(
        api.applications.update.path.replace(":id", String(applicationId)),
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "ACCEPTED" }),
        },
      );
      if (!res.ok) {
        const message =
          (await res.json().catch(() => null))?.message ??
          "Unable to select worker";
        throw new Error(message);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.jobs.get.path, id] });
      queryClient.invalidateQueries({
        queryKey: [api.applications.list.path, id],
      });
      toast({
        title: "Worker selected",
        description: "Job status moved to WORKER_SELECTED.",
      });
    },
    onError: (err: Error) => {
      toast({
        title: "Selection failed",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const toDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`Help fund this cleanup job: ${shareUrl}`)}`;
  const xShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Support this cleanup job: ${shareUrl}`)}`;

  const reviewRemainingMs = useMemo(() => {
    if (!job?.reviewDeadline) return 0;
    return new Date(job.reviewDeadline).getTime() - now;
  }, [job?.reviewDeadline, now]);

  const reviewText =
    reviewRemainingMs > 0
      ? formatDistanceStrict(0, reviewRemainingMs)
      : "Review window ended";

  if (isLoading || !job) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const isCreator = user?.id === job.leaderId;
  const isAdmin = user?.role === "ADMIN";
  const isWorker = user?.role === "WORKER";
  const isContributor = user?.role === "CONTRIBUTOR";
  const canManageWorkerSelection = isCreator || isAdmin;
  const canViewApplications = isCreator || isAdmin || isContributor;
  const canContribute =
    user &&
    ["LEADER", "CONTRIBUTOR", "ADMIN"].includes(user.role) &&
    !job.selectedWorkerId;
  const canEditJob =
    isCreator &&
    !job.selectedWorkerId &&
    !["COMPLETED", "DISPUTED"].includes(job.status);
  const hasApplied = applications.some((a: any) => a.workerId === user?.id);

  const fundingPercent = Math.min(
    ((job.collectedAmount || 0) / job.targetAmount) * 100,
    100,
  );
  const workerProgress =
    job.status === "WORKER_SELECTED"
      ? 33
      : job.status === "AWAITING_VERIFICATION"
        ? 66
        : job.status === "UNDER_REVIEW"
          ? 85
          : job.status === "COMPLETED"
            ? 100
            : 0;

  return (
    <div className="min-h-screen bg-background pb-16">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-5xl space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">{job.title}</h1>
            <div className="text-sm text-muted-foreground flex items-center gap-3 mt-2">
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {job.location}
              </span>
              <span className="inline-flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {job.createdAt
                  ? new Date(job.createdAt).toLocaleDateString()
                  : ""}
              </span>
            </div>
          </div>
          <Badge>{job.status}</Badge>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Job Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                  {job.description}
                </p>
                <p className="text-sm">
                  Private residential property:{" "}
                  <b>{job.isPrivateResidentialProperty ? "Yes" : "No"}</b>
                </p>

                {canEditJob && (
                  <div className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold">Edit Job</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing((v) => !v)}
                      >
                        {isEditing ? "Cancel" : "Edit"}
                      </Button>
                    </div>
                    {isEditing && (
                      <div className="space-y-2">
                        <Input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          placeholder="Title"
                        />
                        <Textarea
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          placeholder="Description"
                        />
                        <Input
                          value={editLocation}
                          onChange={(e) => setEditLocation(e.target.value)}
                          placeholder="Location"
                        />
                        <Input
                          type="number"
                          value={editTargetAmount}
                          onChange={(e) => setEditTargetAmount(e.target.value)}
                          placeholder="Target amount"
                        />
                        <div className="flex items-center justify-between rounded border p-3">
                          <span className="text-sm">
                            Private residential property
                          </span>
                          <Switch
                            checked={editPrivateProperty}
                            onCheckedChange={setEditPrivateProperty}
                          />
                        </div>
                        <Button
                          disabled={isUpdatingJob}
                          onClick={() => {
                            updateJob(
                              {
                                id,
                                title: editTitle,
                                description: editDescription,
                                location: editLocation,
                                targetAmount: Number(editTargetAmount),
                                isPrivateResidentialProperty:
                                  editPrivateProperty,
                              },
                              {
                                onSuccess: () => {
                                  setIsEditing(false);
                                },
                              },
                            );
                          }}
                        >
                          Save Changes
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {isCreator &&
                  (job.status === "AWAITING_VERIFICATION" ||
                    job.status === "UNDER_REVIEW") && (
                    <div className="border rounded-lg p-4 space-y-3">
                      <h3 className="font-semibold">Verify completion</h3>
                      <Button
                        onClick={() =>
                          updateJob({ id, status: "UNDER_REVIEW" })
                        }
                        disabled={
                          isUpdatingJob || job.status === "UNDER_REVIEW"
                        }
                      >
                        Start 24-hour review window
                      </Button>
                      {job.status === "UNDER_REVIEW" && (
                        <p className="text-sm text-muted-foreground inline-flex items-center gap-1">
                          <Clock3 className="w-4 h-4" /> {reviewText}
                        </p>
                      )}
                    </div>
                  )}

                {job.proof && (
                  <div className="grid grid-cols-3 gap-3">
                    <img
                      className="rounded border aspect-square object-cover"
                      src={job.proof.beforePhoto}
                      alt="before"
                    />
                    <img
                      className="rounded border aspect-square object-cover"
                      src={job.proof.afterPhoto}
                      alt="after"
                    />
                    <img
                      className="rounded border aspect-square object-cover"
                      src={job.proof.disposalPhoto}
                      alt="disposal"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {(canViewApplications || job.selectedWorker) && (
              <Card>
                <CardHeader>
                  <CardTitle>Worker Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {job.selectedWorker &&
                    (isCreator || isContributor || isAdmin) && (
                      <div className="border rounded p-3 bg-muted/20">
                        <p className="font-semibold mb-1">Selected Worker</p>
                        <p className="text-sm font-medium">
                          {job.selectedWorker.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Phone: {job.selectedWorker.phone}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Availability:{" "}
                          {job.selectedWorker.availability || "Not specified"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Skills:{" "}
                          {Array.isArray(job.selectedWorker.skillTags) &&
                          job.selectedWorker.skillTags.length > 0
                            ? job.selectedWorker.skillTags.join(", ")
                            : "Not specified"}
                        </p>
                      </div>
                    )}

                  {canViewApplications && (
                    <>
                      <p className="text-sm font-medium">
                        All Worker Applications
                      </p>
                      {applications.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No applications yet.
                        </p>
                      ) : (
                        applications.map((app: any) => (
                          <div
                            key={app.id}
                            className="border rounded p-3 flex items-center justify-between"
                          >
                            <div>
                              <p className="font-medium">
                                {app.worker?.name || `Worker #${app.workerId}`}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Bid: ₹{app.bidAmount}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Phone: {app.worker?.phone || "N/A"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Availability:{" "}
                                {app.worker?.availability || "Not specified"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Skills:{" "}
                                {Array.isArray(app.worker?.skillTags) &&
                                app.worker.skillTags.length > 0
                                  ? app.worker.skillTags.join(", ")
                                  : "Not specified"}
                              </p>
                            </div>
                            {canManageWorkerSelection ? (
                              <Button
                                size="sm"
                                disabled={
                                  acceptMutation.isPending ||
                                  (Boolean(job.selectedWorkerId) && !isAdmin)
                                }
                                onClick={() => acceptMutation.mutate(app.id)}
                              >
                                {isAdmin &&
                                job.selectedWorkerId &&
                                job.selectedWorkerId !== app.workerId
                                  ? "Reassign"
                                  : "Select"}
                              </Button>
                            ) : (
                              <Badge variant="outline">Readonly</Badge>
                            )}
                          </div>
                        ))
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Funding Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm font-medium">
                  ₹{job.collectedAmount || 0} / ₹{job.targetAmount}
                </p>
                <Progress value={fundingPercent} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  Contributors:{" "}
                  {job.contributorCount ?? job.contributions?.length ?? 0}
                </p>
                {canContribute && (
                  <div className="space-y-2">
                    <Input
                      type="number"
                      value={contributionAmount}
                      onChange={(e) => setContributionAmount(e.target.value)}
                    />
                    <Button
                      className="w-full"
                      disabled={isContributing}
                      onClick={() =>
                        contribute({
                          jobId: id,
                          amount: Number(contributionAmount),
                        })
                      }
                    >
                      Razorpay: Contribute
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Worker Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Progress value={workerProgress} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  Current state: {job.status}
                </p>
              </CardContent>
            </Card>

            {isWorker && (
              <Card>
                <CardHeader>
                  <CardTitle>Worker Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {!hasApplied &&
                    ["FUNDING_OPEN", "FUNDING_COMPLETE"].includes(
                      job.status,
                    ) && (
                      <>
                        <Input
                          type="number"
                          value={bidAmount}
                          onChange={(e) => setBidAmount(e.target.value)}
                          placeholder="Bid amount"
                        />
                        <Button
                          disabled={isApplying || !bidAmount}
                          onClick={() =>
                            apply({ jobId: id, bidAmount: Number(bidAmount) })
                          }
                        >
                          Apply for Job
                        </Button>
                      </>
                    )}

                  {user?.id === job.selectedWorkerId &&
                    ["WORKER_SELECTED", "IN_PROGRESS"].includes(job.status) && (
                      <div className="space-y-2">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            setBeforeFile(e.target.files?.[0] ?? null)
                          }
                        />
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            setAfterFile(e.target.files?.[0] ?? null)
                          }
                        />
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            setDisposalFile(e.target.files?.[0] ?? null)
                          }
                        />
                        <Button
                          className="w-full"
                          disabled={proofMutation.isPending}
                          onClick={async () => {
                            if (!beforeFile || !afterFile || !disposalFile) {
                              toast({
                                title: "All photos required",
                                variant: "destructive",
                              });
                              return;
                            }
                            const [beforePhoto, afterPhoto, disposalPhoto] =
                              await Promise.all([
                                toDataUrl(beforeFile),
                                toDataUrl(afterFile),
                                toDataUrl(disposalFile),
                              ]);
                            proofMutation.mutate({
                              jobId: id,
                              beforePhoto,
                              afterPhoto,
                              disposalPhoto,
                              metadata: {
                                source: "web",
                                timestamp: new Date().toISOString(),
                              },
                              capturedAt: new Date().toISOString(),
                            });
                          }}
                        >
                          <UploadCloud className="w-4 h-4 mr-2" /> Upload Proof
                        </Button>
                      </div>
                    )}
                </CardContent>
              </Card>
            )}

            {job.status === "UNDER_REVIEW" && (
              <Card>
                <CardHeader>
                  <CardTitle>Raise Dispute</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Textarea
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                    placeholder="Provide reason"
                  />
                  <Button
                    variant="destructive"
                    disabled={!disputeReason || disputeMutation.isPending}
                    onClick={() =>
                      disputeMutation.mutate({
                        jobId: id,
                        reason: disputeReason,
                      })
                    }
                  >
                    Submit Dispute
                  </Button>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Share Job</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <a href={whatsappUrl} target="_blank" rel="noreferrer">
                  <Button className="w-full" variant="outline">
                    <Share2 className="w-4 h-4 mr-2" />
                    Share on WhatsApp
                  </Button>
                </a>
                <a href={xShareUrl} target="_blank" rel="noreferrer">
                  <Button className="w-full" variant="outline">
                    Share on Social
                  </Button>
                </a>
              </CardContent>
            </Card>

            {!user && (
              <Link href="/auth">
                <Button className="w-full">Sign in to participate</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
