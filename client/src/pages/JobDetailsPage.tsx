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
  FileText,
  ArrowLeft,
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
  const [beforeUploadedUrl, setBeforeUploadedUrl] = useState<string | null>(
    null,
  );
  const [afterUploadedUrl, setAfterUploadedUrl] = useState<string | null>(null);
  const [disposalUploadedUrl, setDisposalUploadedUrl] = useState<string | null>(
    null,
  );
  const [isUploadingBefore, setIsUploadingBefore] = useState(false);
  const [isUploadingAfter, setIsUploadingAfter] = useState(false);
  const [isUploadingDisposal, setIsUploadingDisposal] = useState(false);
  const [workerSubmissionMessage, setWorkerSubmissionMessage] = useState("");
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeEvidenceFile, setDisputeEvidenceFile] = useState<File | null>(
    null,
  );
  const [workerDisputeMessage, setWorkerDisputeMessage] = useState("");
  const [workerDisputeFile, setWorkerDisputeFile] = useState<File | null>(null);
  const [leaderClarificationMessage, setLeaderClarificationMessage] =
    useState("");

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

  useEffect(() => {
    if (!job?.proof) return;
    setBeforeUploadedUrl(job.proof.beforePhoto);
    setAfterUploadedUrl(job.proof.afterPhoto);
    setDisposalUploadedUrl(job.proof.disposalPhoto);
  }, [job?.proof]);

  useEffect(() => {
    if (job?.proofDraft) {
      setBeforeUploadedUrl(job.proofDraft.beforePhoto ?? null);
      setAfterUploadedUrl(job.proofDraft.afterPhoto ?? null);
      setDisposalUploadedUrl(job.proofDraft.disposalPhoto ?? null);
      return;
    }

    if (job?.proof) {
      setBeforeUploadedUrl(job.proof.beforePhoto);
      setAfterUploadedUrl(job.proof.afterPhoto);
      setDisposalUploadedUrl(job.proof.disposalPhoto);
    }
  }, [job?.proofDraft, job?.proof]);

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
    mutationFn: async (payload: {
      jobId: number;
      reason: string;
      evidencePhotoUrl?: string;
    }) => {
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

  const workerDisputeResponseMutation = useMutation({
    mutationFn: async (payload: {
      disputeId: number;
      message: string;
      photoUrl?: string;
    }) => {
      const res = await fetch(
        api.disputes.workerResponse.path.replace(
          ":id",
          String(payload.disputeId),
        ),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: payload.message,
            photoUrl: payload.photoUrl,
          }),
        },
      );
      if (!res.ok) {
        const message =
          (await res.json().catch(() => null))?.message ??
          "Failed to submit worker response";
        throw new Error(message);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.jobs.get.path, id] });
      setWorkerDisputeMessage("");
      setWorkerDisputeFile(null);
      toast({
        title: "Response submitted",
        description: "Your dispute response has been shared.",
      });
    },
    onError: (err: Error) => {
      toast({
        title: "Submission failed",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const leaderClarificationMutation = useMutation({
    mutationFn: async (payload: { disputeId: number; message: string }) => {
      const res = await fetch(
        api.disputes.leaderClarification.path.replace(
          ":id",
          String(payload.disputeId),
        ),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: payload.message }),
        },
      );
      if (!res.ok) {
        const message =
          (await res.json().catch(() => null))?.message ??
          "Failed to submit clarification";
        throw new Error(message);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.jobs.get.path, id] });
      setLeaderClarificationMessage("");
      toast({
        title: "Clarification submitted",
        description: "Your clarification has been shared.",
      });
    },
    onError: (err: Error) => {
      toast({
        title: "Submission failed",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const adminDecisionMutation = useMutation({
    mutationFn: async (payload: {
      disputeId: number;
      action: "APPROVE_WORK" | "REJECT_WORK";
    }) => {
      const res = await fetch(
        api.disputes.adminDecision.path.replace(
          ":id",
          String(payload.disputeId),
        ),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: payload.action }),
        },
      );
      if (!res.ok) {
        const message =
          (await res.json().catch(() => null))?.message ??
          "Failed to submit admin decision";
        throw new Error(message);
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.jobs.get.path, id] });
      toast({
        title:
          variables.action === "APPROVE_WORK"
            ? "Work approved"
            : "Work rejected",
        description:
          variables.action === "APPROVE_WORK"
            ? "Payment released to worker."
            : "Contributors marked for refund.",
      });
    },
    onError: (err: Error) => {
      toast({
        title: "Decision failed",
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

  const uploadToCloudinary = async (file: File) => {
    const signatureResponse = await fetch("/api/uploads/cloudinary/signature", {
      method: "POST",
    });
    const signatureResult = await signatureResponse.json().catch(() => ({}));
    if (!signatureResponse.ok) {
      throw new Error(
        signatureResult?.message || "Unable to initialize Cloudinary upload",
      );
    }

    const { cloudName, apiKey, timestamp, signature } = signatureResult || {};
    const folder = signatureResult?.folder as string | undefined;
    if (!cloudName || !apiKey || !timestamp || !signature || !folder) {
      throw new Error("Invalid Cloudinary upload signature response");
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", String(apiKey));
    formData.append("timestamp", String(timestamp));
    formData.append("signature", String(signature));
    formData.append("folder", folder);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
      {
        method: "POST",
        body: formData,
      },
    );

    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result?.secure_url) {
      throw new Error(
        result?.error?.message || "Failed to upload file to Cloudinary",
      );
    }

    return {
      url: String(result.secure_url),
      resourceType: String(result.resource_type || "raw"),
      format: String(result.format || ""),
      bytes: Number(result.bytes || 0),
      originalFilename: String(result.original_filename || file.name),
      publicId: String(result.public_id || ""),
    };
  };

  const getProofMediaType = (url: string) => {
    const normalized = url.toLowerCase();
    if (normalized.includes("/video/upload/")) return "video" as const;
    if (normalized.endsWith(".pdf") || normalized.includes("/raw/upload/")) {
      return "pdf" as const;
    }
    return "image" as const;
  };

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`Help fund this cleanup job: ${shareUrl}`)}`;
  const xShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Support this cleanup job: ${shareUrl}`)}`;

  const proofMedia = [
    {
      label: "Before",
      url: job?.proof?.beforePhoto || beforeUploadedUrl,
    },
    {
      label: "After",
      url: job?.proof?.afterPhoto || afterUploadedUrl,
    },
    {
      label: "Disposal",
      url: job?.proof?.disposalPhoto || disposalUploadedUrl,
    },
  ];
  const hasAnyProofMedia = proofMedia.some((item) => Boolean(item.url));
  const jobImageUrl = (job as any)?.imageUrl as string | null | undefined;
  const beforeStepDone = Boolean(proofMedia[0]?.url);
  const afterStepDone = Boolean(proofMedia[1]?.url);
  const disposalStepDone = Boolean(proofMedia[2]?.url);
  const shouldShowStepProgress =
    hasAnyProofMedia ||
    Boolean(job?.selectedWorkerId) ||
    [
      "WORKER_SELECTED",
      "IN_PROGRESS",
      "AWAITING_VERIFICATION",
      "UNDER_REVIEW",
      "COMPLETED",
      "DISPUTED",
    ].includes(String(job?.status || ""));
  const proofMetadata =
    (job?.proof?.metadata as Record<string, unknown> | undefined) ?? {};
  const workerSubmittedNote =
    typeof proofMetadata.workerSubmissionMessage === "string"
      ? proofMetadata.workerSubmissionMessage
      : "";

  const updateJobStatusDirect = async (status: "IN_PROGRESS") => {
    const res = await fetch(api.jobs.update.path.replace(":id", String(id)), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    if (!res.ok) {
      const message =
        (await res.json().catch(() => null))?.message ??
        "Failed to update job status";
      throw new Error(message);
    }

    await queryClient.invalidateQueries({ queryKey: [api.jobs.get.path, id] });
  };

  const uploadBeforeProof = async () => {
    if (!beforeFile) {
      toast({ title: "Select before file first", variant: "destructive" });
      return;
    }

    setIsUploadingBefore(true);
    try {
      if (job.status === "WORKER_SELECTED") {
        await updateJobStatusDirect("IN_PROGRESS");
      }
      const asset = await uploadToCloudinary(beforeFile);
      setBeforeUploadedUrl(asset.url);
      await fetch(api.proofs.draftUpsert.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: id, beforePhoto: asset.url }),
      });
      await queryClient.invalidateQueries({
        queryKey: [api.jobs.get.path, id],
      });
      toast({
        title: "Before proof uploaded",
        description: "Step 1 complete. Continue with After proof.",
      });
    } catch (err) {
      toast({
        title: "Before upload failed",
        description: err instanceof Error ? err.message : "Upload failed",
        variant: "destructive",
      });
    } finally {
      setIsUploadingBefore(false);
    }
  };

  const uploadAfterProof = async () => {
    if (!beforeUploadedUrl) {
      toast({
        title: "Upload before proof first",
        variant: "destructive",
      });
      return;
    }
    if (!afterFile) {
      toast({ title: "Select after file first", variant: "destructive" });
      return;
    }

    setIsUploadingAfter(true);
    try {
      const asset = await uploadToCloudinary(afterFile);
      setAfterUploadedUrl(asset.url);
      await fetch(api.proofs.draftUpsert.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: id, afterPhoto: asset.url }),
      });
      await queryClient.invalidateQueries({
        queryKey: [api.jobs.get.path, id],
      });
      toast({
        title: "After proof uploaded",
        description: "Step 2 complete. Continue with Disposal proof.",
      });
    } catch (err) {
      toast({
        title: "After upload failed",
        description: err instanceof Error ? err.message : "Upload failed",
        variant: "destructive",
      });
    } finally {
      setIsUploadingAfter(false);
    }
  };

  const uploadDisposalProof = async () => {
    if (!beforeUploadedUrl || !afterUploadedUrl) {
      toast({
        title: "Upload before and after proof first",
        variant: "destructive",
      });
      return;
    }
    if (!disposalFile) {
      toast({ title: "Select disposal file first", variant: "destructive" });
      return;
    }

    setIsUploadingDisposal(true);
    try {
      const disposalAsset = await uploadToCloudinary(disposalFile);
      setDisposalUploadedUrl(disposalAsset.url);

      await fetch(api.proofs.draftUpsert.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: id,
          disposalPhoto: disposalAsset.url,
        }),
      });

      proofMutation.mutate({
        jobId: id,
        beforePhoto: beforeUploadedUrl,
        afterPhoto: afterUploadedUrl,
        disposalPhoto: disposalAsset.url,
        metadata: {
          source: "web",
          timestamp: new Date().toISOString(),
          cloudinary: {
            beforeUrl: beforeUploadedUrl,
            afterUrl: afterUploadedUrl,
            disposal: disposalAsset,
          },
        },
        capturedAt: new Date().toISOString(),
      });
    } catch (err) {
      toast({
        title: "Disposal upload failed",
        description: err instanceof Error ? err.message : "Upload failed",
        variant: "destructive",
      });
    } finally {
      setIsUploadingDisposal(false);
    }
  };

  const reviewRemainingMs = useMemo(() => {
    if (!job?.reviewDeadline) return 0;
    return new Date(job.reviewDeadline).getTime() - now;
  }, [job?.reviewDeadline, now]);

  const reviewText =
    reviewRemainingMs > 0
      ? formatDistanceStrict(0, reviewRemainingMs)
      : "Review window ended";

  const disputes = Array.isArray((job as any)?.disputes)
    ? ((job as any).disputes as any[])
    : [];
  const openDispute = disputes.find((item) => item?.status === "OPEN");
  const hasWorkerResponded = Boolean(
    openDispute?.details?.workerResponse?.message,
  );
  const myRaisedDispute = disputes.find(
    (item) => item?.raisedById === user?.id,
  );
  const hasContributed =
    Boolean(user?.id) &&
    Array.isArray((job as any)?.contributions) &&
    (job as any).contributions.some((c: any) => c.userId === user?.id);

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
  const isSelectedWorker = Boolean(
    user?.id && user.id === job.selectedWorkerId,
  );
  const canViewDisputeDetails = Boolean(user);
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
  const myApplication = applications.find((a: any) => a.workerId === user?.id);
  const hasApplied = Boolean(myApplication);

  const fundingPercent = Math.min(
    ((job.collectedAmount || 0) / job.targetAmount) * 100,
    100,
  );
  const workerProgress =
    job.status === "WORKER_SELECTED"
      ? 33
      : job.status === "IN_PROGRESS"
        ? 50
        : job.status === "AWAITING_VERIFICATION"
          ? 66
          : job.status === "UNDER_REVIEW"
            ? 85
            : job.status === "COMPLETED"
              ? 100
              : 0;

  const getActorName = (id: number) => {
    if (id === job.leaderId) {
      return (job as any)?.leader?.name || `Leader #${id}`;
    }
    if (id === job.selectedWorkerId) {
      return (job as any)?.selectedWorker?.name || `Worker #${id}`;
    }
    const contributorProfile = Array.isArray((job as any)?.contributorProfiles)
      ? (job as any).contributorProfiles.find(
          (profile: any) => profile.id === id,
        )
      : null;
    return contributorProfile?.name || `User #${id}`;
  };

  return (
    <div className="min-h-screen bg-background pb-16">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-5xl space-y-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (typeof window !== "undefined" && window.history.length > 1) {
              window.history.back();
              return;
            }
            if (typeof window !== "undefined") {
              window.location.href = "/jobs";
            }
          }}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

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

                {jobImageUrl && (
                  <a href={jobImageUrl} target="_blank" rel="noreferrer">
                    <img
                      src={jobImageUrl}
                      alt={`${job.title} cover`}
                      className="w-full max-h-72 object-cover rounded border"
                    />
                  </a>
                )}

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

                {hasAnyProofMedia && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {proofMedia.map((media) => {
                      if (!media.url) {
                        return (
                          <div
                            key={media.label}
                            className="rounded border p-4 text-xs text-muted-foreground"
                          >
                            <p className="font-medium text-foreground mb-1">
                              {media.label}
                            </p>
                            Not uploaded yet
                          </div>
                        );
                      }

                      const mediaType = getProofMediaType(media.url);

                      if (mediaType === "video") {
                        return (
                          <div
                            key={media.label}
                            className="rounded border p-2 space-y-2"
                          >
                            <p className="text-xs font-medium">{media.label}</p>
                            <video
                              className="rounded w-full max-h-56 bg-black"
                              controls
                              src={media.url}
                            />
                            <a
                              href={media.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs underline"
                            >
                              Open {media.label} file
                            </a>
                          </div>
                        );
                      }

                      if (mediaType === "pdf") {
                        return (
                          <a
                            key={media.label}
                            href={media.url}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded border p-4 flex flex-col items-center justify-center gap-2 text-center hover:bg-muted/40 transition-colors"
                          >
                            <FileText className="w-8 h-8" />
                            <p className="text-xs font-medium">
                              {media.label} (PDF)
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Open file
                            </p>
                          </a>
                        );
                      }

                      return (
                        <div
                          key={media.label}
                          className="rounded border p-2 space-y-2"
                        >
                          <p className="text-xs font-medium">{media.label}</p>
                          <a href={media.url} target="_blank" rel="noreferrer">
                            <img
                              className="rounded border aspect-square object-cover"
                              src={media.url}
                              alt={media.label.toLowerCase()}
                            />
                          </a>
                          <a
                            href={media.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs underline"
                          >
                            Open {media.label} file
                          </a>
                        </div>
                      );
                    })}
                  </div>
                )}

                {shouldShowStepProgress && (
                  <div className="rounded border p-3 space-y-1">
                    <p className="text-sm font-semibold">Step Progress</p>
                    <p className="text-xs text-muted-foreground">
                      Before: {beforeStepDone ? "Uploaded" : "Pending"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      After: {afterStepDone ? "Uploaded" : "Pending"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Disposal: {disposalStepDone ? "Uploaded" : "Pending"}
                    </p>
                  </div>
                )}

                {workerSubmittedNote && (
                  <div className="rounded border p-3 space-y-1 bg-muted/20">
                    <p className="text-sm font-semibold">
                      Worker submission message
                    </p>
                    <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                      {workerSubmittedNote}
                    </p>
                  </div>
                )}

                {canViewDisputeDetails && disputes.length > 0 && (
                  <div className="rounded border p-3 space-y-3">
                    <p className="text-sm font-semibold">Dispute Details</p>
                    {disputes.map((dispute: any) => {
                      const details = (dispute?.details || {}) as any;
                      return (
                        <div
                          key={dispute.id}
                          className="border rounded p-3 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">
                              Raised by {getActorName(dispute.raisedById)}
                            </p>
                            <Badge variant="outline">{dispute.status}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {dispute.createdAt
                              ? new Date(dispute.createdAt).toLocaleString()
                              : ""}
                          </p>
                          <p className="text-sm whitespace-pre-wrap">
                            {dispute.reason}
                          </p>

                          {details.raisedEvidencePhotoUrl && (
                            <a
                              href={details.raisedEvidencePhotoUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs underline"
                            >
                              View dispute evidence
                            </a>
                          )}

                          {details.workerResponse?.message && (
                            <div className="rounded border p-2 bg-muted/20 space-y-1">
                              <p className="text-xs font-medium">
                                Worker response
                              </p>
                              <p className="text-xs whitespace-pre-wrap">
                                {details.workerResponse.message}
                              </p>
                              {details.workerResponse.photoUrl && (
                                <a
                                  href={details.workerResponse.photoUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-xs underline"
                                >
                                  View worker additional proof
                                </a>
                              )}
                            </div>
                          )}

                          {details.leaderClarification?.message && (
                            <div className="rounded border p-2 bg-muted/20 space-y-1">
                              <p className="text-xs font-medium">
                                Leader clarification
                              </p>
                              <p className="text-xs whitespace-pre-wrap">
                                {details.leaderClarification.message}
                              </p>
                            </div>
                          )}

                          {details.adminDecision?.action && (
                            <div className="rounded border p-2 bg-muted/20 space-y-1">
                              <p className="text-xs font-medium">
                                Admin decision
                              </p>
                              <p className="text-xs">
                                {details.adminDecision.action === "APPROVE_WORK"
                                  ? "APPROVE_WORK (Payment released to worker)"
                                  : "REJECT_WORK (Refund contributors)"}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {!isWorker && (canViewApplications || job.selectedWorker) && (
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

            {(isCreator || isContributor || isAdmin) &&
              Array.isArray((job as any).contributorProfiles) &&
              (job as any).contributorProfiles.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Contributor Profiles</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {(job as any).contributorProfiles.map(
                      (contributor: any) => (
                        <div
                          key={contributor.id}
                          className="border rounded p-3 bg-muted/20"
                        >
                          <p className="font-medium">{contributor.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Phone: {contributor.phone}
                          </p>
                          <p className="text-xs text-muted-foreground capitalize">
                            Role:{" "}
                            {String(
                              contributor.role || "contributor",
                            ).toLowerCase()}
                          </p>
                        </div>
                      ),
                    )}
                  </CardContent>
                </Card>
              )}
          </div>

          <div className="space-y-6">
            {!isWorker && (
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
            )}

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
                  {hasApplied && (
                    <p className="text-sm text-muted-foreground">
                      Bid applied successfully for{" "}
                      <b>₹{myApplication?.bidAmount}</b>.
                    </p>
                  )}

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
                    job.status === "WORKER_SELECTED" && (
                      <Button
                        variant="secondary"
                        disabled={isUpdatingJob || Boolean(beforeUploadedUrl)}
                        onClick={() => {
                          updateJob(
                            { id, status: "IN_PROGRESS" },
                            {
                              onSuccess: () => {
                                toast({
                                  title: "Work started",
                                  description:
                                    "Job status updated to IN_PROGRESS.",
                                });
                              },
                            },
                          );
                        }}
                      >
                        Start Work
                      </Button>
                    )}

                  {user?.id === job.selectedWorkerId &&
                    ["WORKER_SELECTED", "IN_PROGRESS"].includes(job.status) &&
                    !job.proof && (
                      <div className="space-y-2">
                        <p className="text-sm font-semibold">
                          Step 1: Before Proof
                        </p>
                        <Input
                          type="file"
                          accept="image/*,video/*,application/pdf"
                          disabled={Boolean(beforeUploadedUrl)}
                          onChange={(e) =>
                            setBeforeFile(e.target.files?.[0] ?? null)
                          }
                        />
                        <Button
                          variant="secondary"
                          disabled={
                            isUploadingBefore || Boolean(beforeUploadedUrl)
                          }
                          onClick={uploadBeforeProof}
                        >
                          Upload Before (Start Work)
                        </Button>

                        <p className="text-sm font-semibold mt-3">
                          Step 2: After Proof
                        </p>
                        <Input
                          type="file"
                          accept="image/*,video/*,application/pdf"
                          disabled={
                            !beforeUploadedUrl || Boolean(afterUploadedUrl)
                          }
                          onChange={(e) =>
                            setAfterFile(e.target.files?.[0] ?? null)
                          }
                        />
                        <Button
                          variant="secondary"
                          className="w-full"
                          disabled={
                            !beforeUploadedUrl ||
                            isUploadingAfter ||
                            Boolean(afterUploadedUrl)
                          }
                          onClick={uploadAfterProof}
                        >
                          Upload After (Next)
                        </Button>

                        <p className="text-sm font-semibold mt-3">
                          Step 3: Disposal Proof
                        </p>
                        <Input
                          type="file"
                          accept="image/*,video/*,application/pdf"
                          disabled={!beforeUploadedUrl || !afterUploadedUrl}
                          onChange={(e) =>
                            setDisposalFile(e.target.files?.[0] ?? null)
                          }
                        />
                        <p className="text-xs text-muted-foreground">
                          You can upload image, video, or PDF files. Upload in
                          sequence: Before → After → Disposal.
                        </p>
                        <Button
                          className="w-full"
                          disabled={
                            !beforeUploadedUrl ||
                            !afterUploadedUrl ||
                            proofMutation.isPending ||
                            isUploadingDisposal
                          }
                          onClick={uploadDisposalProof}
                        >
                          <UploadCloud className="w-4 h-4 mr-2" />
                          Upload Disposal & Submit
                        </Button>

                        <div className="space-y-2 pt-2">
                          <p className="text-xs font-medium">Step progress</p>
                          <p className="text-xs text-muted-foreground">
                            Before: {beforeUploadedUrl ? "Uploaded" : "Pending"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            After: {afterUploadedUrl ? "Uploaded" : "Pending"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Disposal:{" "}
                            {disposalUploadedUrl ? "Uploaded" : "Pending"}
                          </p>
                        </div>
                      </div>
                    )}

                  {user?.id === job.selectedWorkerId &&
                    job.status === "IN_PROGRESS" &&
                    job.proof && (
                      <div className="space-y-2 border rounded-lg p-3">
                        <p className="text-sm font-medium">
                          All proof steps are uploaded.
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Submit this job so the leader can review and verify
                          it.
                        </p>
                        <Textarea
                          placeholder="Write message for leader (optional)"
                          value={workerSubmissionMessage}
                          onChange={(e) =>
                            setWorkerSubmissionMessage(e.target.value)
                          }
                        />
                        <Button
                          className="w-full"
                          disabled={isUpdatingJob}
                          onClick={() => {
                            updateJob(
                              {
                                id,
                                status: "AWAITING_VERIFICATION",
                                workerSubmissionMessage,
                              },
                              {
                                onSuccess: () => {
                                  setWorkerSubmissionMessage("");
                                  toast({
                                    title: "Submitted for review",
                                    description:
                                      "Leader can now review your submitted proof.",
                                  });
                                },
                              },
                            );
                          }}
                        >
                          Submit Job for Leader Review
                        </Button>
                        <p className="text-xs text-muted-foreground">
                          Message: Once you submit, the leader will be notified
                          to review your job completion proof.
                        </p>
                      </div>
                    )}
                </CardContent>
              </Card>
            )}

            {job.status === "UNDER_REVIEW" &&
              !!user &&
              user.role === "CONTRIBUTOR" &&
              hasContributed &&
              !myRaisedDispute && (
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
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        setDisputeEvidenceFile(e.target.files?.[0] ?? null)
                      }
                    />
                    <Button
                      variant="destructive"
                      disabled={!disputeReason || disputeMutation.isPending}
                      onClick={async () => {
                        let evidencePhotoUrl: string | undefined;
                        if (disputeEvidenceFile) {
                          const asset =
                            await uploadToCloudinary(disputeEvidenceFile);
                          evidencePhotoUrl = asset.url;
                        }

                        disputeMutation.mutate({
                          jobId: id,
                          reason: disputeReason,
                          evidencePhotoUrl,
                        });
                      }}
                    >
                      Submit Dispute
                    </Button>
                  </CardContent>
                </Card>
              )}

            {isWorker && openDispute && user?.id === job.selectedWorkerId && (
              <Card>
                <CardHeader>
                  <CardTitle>Dispute Response (Worker)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {hasWorkerResponded && (
                    <div className="rounded border p-2 bg-muted/20 space-y-1">
                      <p className="text-xs font-medium">
                        Your submitted response
                      </p>
                      <p className="text-xs whitespace-pre-wrap">
                        {openDispute?.details?.workerResponse?.message}
                      </p>
                      {openDispute?.details?.workerResponse?.photoUrl && (
                        <a
                          href={openDispute.details.workerResponse.photoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs underline"
                        >
                          View your uploaded proof
                        </a>
                      )}
                    </div>
                  )}
                  {hasWorkerResponded && (
                    <p className="text-xs text-muted-foreground">
                      You have already submitted a response for this dispute.
                    </p>
                  )}
                  <Textarea
                    value={workerDisputeMessage}
                    onChange={(e) => setWorkerDisputeMessage(e.target.value)}
                    placeholder="Submit your written response"
                    disabled={hasWorkerResponded}
                  />
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setWorkerDisputeFile(e.target.files?.[0] ?? null)
                    }
                    disabled={hasWorkerResponded}
                  />
                  <Button
                    disabled={
                      hasWorkerResponded ||
                      !workerDisputeMessage ||
                      workerDisputeResponseMutation.isPending
                    }
                    onClick={async () => {
                      let photoUrl: string | undefined;
                      if (workerDisputeFile) {
                        const asset =
                          await uploadToCloudinary(workerDisputeFile);
                        photoUrl = asset.url;
                      }

                      workerDisputeResponseMutation.mutate({
                        disputeId: openDispute.id,
                        message: workerDisputeMessage,
                        photoUrl,
                      });
                    }}
                  >
                    Submit Worker Response
                  </Button>
                </CardContent>
              </Card>
            )}

            {isCreator && openDispute && (
              <Card>
                <CardHeader>
                  <CardTitle>Leader Clarification</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Textarea
                    value={leaderClarificationMessage}
                    onChange={(e) =>
                      setLeaderClarificationMessage(e.target.value)
                    }
                    placeholder="Submit your clarification statement"
                  />
                  <Button
                    disabled={
                      !leaderClarificationMessage ||
                      leaderClarificationMutation.isPending
                    }
                    onClick={() =>
                      leaderClarificationMutation.mutate({
                        disputeId: openDispute.id,
                        message: leaderClarificationMessage,
                      })
                    }
                  >
                    Submit Clarification
                  </Button>
                </CardContent>
              </Card>
            )}

            {isAdmin && openDispute && (
              <Card>
                <CardHeader>
                  <CardTitle>Admin Dispute Decision</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Choose final action for this dispute.
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    <Button
                      disabled={adminDecisionMutation.isPending}
                      onClick={() =>
                        adminDecisionMutation.mutate({
                          disputeId: openDispute.id,
                          action: "APPROVE_WORK",
                        })
                      }
                    >
                      APPROVE_WORK
                    </Button>
                    <Button
                      variant="destructive"
                      disabled={adminDecisionMutation.isPending}
                      onClick={() =>
                        adminDecisionMutation.mutate({
                          disputeId: openDispute.id,
                          action: "REJECT_WORK",
                        })
                      }
                    >
                      REJECT_WORK
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {!isWorker && (
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
            )}

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
