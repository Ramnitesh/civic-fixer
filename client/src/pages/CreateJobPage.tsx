import { Navigation } from "@/components/Navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertJobSchema } from "@shared/schema";
import { useCreateJob } from "@/hooks/use-jobs";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useLocation } from "wouter";
import { Loader2, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

// Override schema for form validation to handle string -> number coercion
const formSchema = insertJobSchema.extend({
  targetAmount: z.coerce
    .number()
    .positive("Target amount must be greater than 0")
    .max(10000, "Maximum amount is ₹10,000"),
  leaderId: z.number().optional(), // Injected by backend/hook logic usually, but here we can rely on backend to assign from session
  imageUrl: z.string().url().optional(),
});

export default function CreateJobPage() {
  const { mutate: createJob, isPending } = useCreateJob();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [jobImageFile, setJobImageFile] = useState<File | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      location: "",
      targetAmount: undefined,
      isPrivateResidentialProperty: false,
      imageUrl: undefined,
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

    return String(result.secure_url);
  };

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      let imageUrl: string | undefined;
      if (jobImageFile) {
        setIsUploadingImage(true);
        imageUrl = await uploadToCloudinary(jobImageFile);
      }

      // We assume backend attaches leaderId from session
      createJob(
        {
          ...data,
          imageUrl,
        } as any,
        {
          onSuccess: () => setLocation("/dashboard"),
        },
      );
    } catch (error) {
      toast({
        title: "Image upload failed",
        description:
          error instanceof Error ? error.message : "Unable to upload image",
        variant: "destructive",
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Link href="/dashboard">
          <Button
            variant="ghost"
            className="mb-4 pl-0 hover:pl-2 transition-all gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Button>
        </Link>

        <Card className="border-border/50 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-display">
              Create a New Job
            </CardTitle>
            <CardDescription>
              Identify an issue in your community and mobilize funding to fix
              it.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Park Cleanup on 5th St."
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Be specific about the task.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Central Park, North Entrance"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="targetAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Amount (₹)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="500" {...field} />
                      </FormControl>
                      <FormDescription>
                        Maximum allowed is ₹10,000.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isPrivateResidentialProperty"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Private residential property
                        </FormLabel>
                        <FormDescription>
                          Required to indicate if this cleanup is on private
                          residential property.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe the issue and what needs to be done..."
                          className="min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={() => (
                    <FormItem>
                      <FormLabel>Job Image (optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            setJobImageFile(e.target.files?.[0] ?? null)
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        Upload a cover image to represent this job.
                      </FormDescription>
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full btn-primary"
                  disabled={isPending || isUploadingImage}
                >
                  {isPending || isUploadingImage ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  {isUploadingImage ? "Uploading image..." : "Publish Job"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
