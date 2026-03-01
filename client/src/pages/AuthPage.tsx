import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type AuthMode = "login" | "register" | "otp";

export default function AuthPage() {
  const { user, login, register, isLoggingIn, isRegistering } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [mode, setMode] = useState<AuthMode>("login");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("MEMBER");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [originalMode, setOriginalMode] = useState<"login" | "register">(
    "login",
  );

  // Redirect if already logged in
  if (user) {
    setLocation("/dashboard");
    return null;
  }

  const handleSendOTP = async (forLogin: boolean) => {
    if (!phone || phone.length < 10) {
      toast({
        title: "Error",
        description: "Please enter a valid phone number",
        variant: "destructive",
      });
      return;
    }

    // Save the original mode (login or register)
    setOriginalMode(forLogin ? "login" : "register");

    try {
      setIsSendingOtp(true);
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to send OTP");
      }

      setOtpSent(true);
      setMode("otp");
      toast({
        title: "OTP Sent",
        description: `Your OTP is: ${data.devOtp || "sent to your phone"}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send OTP",
        variant: "destructive",
      });
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleLoginClick = () => {
    setMode("login");
    setOriginalMode("login");
  };

  const handleRegisterClick = () => {
    setMode("register");
    setOriginalMode("register");
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      toast({
        title: "Error",
        description: "Please enter the 6-digit OTP",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsVerifyingOtp(true);

      const isLogin = originalMode === "login";
      const endpoint = isLogin
        ? "/api/auth/verify-login-otp"
        : "/api/auth/verify-register-otp";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          otp,
          ...(isLogin ? {} : { name, role }),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to verify OTP");
      }

      // Reload the page to trigger auth state update
      window.location.href = "/dashboard";
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Invalid OTP",
        variant: "destructive",
      });
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleBackToAuth = () => {
    setOtpSent(false);
    setOtp("");
    setMode("login");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      <div className="flex-1 flex items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md border-border/50 shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-display font-bold text-primary">
              Crowd Civic Fix
            </CardTitle>
            <CardDescription>
              {mode === "otp"
                ? "Enter the OTP sent to your phone"
                : "Join the movement to improve your community"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {mode === "otp" ? (
              // OTP Verification
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <p className="text-sm text-muted-foreground">
                    OTP sent to{" "}
                    <span className="font-medium text-foreground">{phone}</span>
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Enter OTP</label>
                  <Input
                    type="text"
                    placeholder="000000"
                    value={otp}
                    onChange={(e) =>
                      setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    className="text-center text-2xl tracking-widest font-mono"
                    maxLength={6}
                  />
                </div>

                <Button
                  onClick={handleVerifyOTP}
                  className="w-full"
                  disabled={isVerifyingOtp || otp.length !== 6}
                >
                  {isVerifyingOtp ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Verifying...
                    </>
                  ) : (
                    "Verify & Login"
                  )}
                </Button>

                <div className="flex items-center justify-between text-sm">
                  <Button
                    variant="ghost"
                    onClick={handleBackToAuth}
                    disabled={isVerifyingOtp}
                  >
                    Change phone number
                  </Button>

                  <Button
                    variant="ghost"
                    onClick={() => handleSendOTP(true)}
                    disabled={isSendingOtp}
                  >
                    {isSendingOtp ? "Sending..." : "Resend OTP"}
                  </Button>
                </div>
              </div>
            ) : (
              // Login/Register Forms
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-8">
                  <TabsTrigger value="login" onClick={() => setMode("login")}>
                    Login
                  </TabsTrigger>
                  <TabsTrigger
                    value="register"
                    onClick={() => setMode("register")}
                  >
                    Register
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Phone Number
                      </label>
                      <Input
                        type="tel"
                        placeholder="+1 234 567 8900"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>

                    <Button
                      onClick={() => handleSendOTP(true)}
                      className="w-full"
                      disabled={isSendingOtp || !phone}
                    >
                      {isSendingOtp ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Sending OTP...
                        </>
                      ) : (
                        <>
                          Send OTP <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>

                    <p className="text-xs text-muted-foreground text-center mt-4">
                      We'll send a verification code to your phone
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="register">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Full Name</label>
                      <Input
                        placeholder="John Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Phone Number
                      </label>
                      <Input
                        type="tel"
                        placeholder="+1 234 567 8900"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        I want to be a...
                      </label>
                      <Select value={role} onValueChange={setRole}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MEMBER">
                            Member (Fund & Organize Jobs)
                          </SelectItem>
                          <SelectItem value="WORKER">
                            Worker (Do Jobs)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      onClick={() => {
                        setMode("register");
                        handleSendOTP(false);
                      }}
                      className="w-full"
                      disabled={isSendingOtp || !phone || !name}
                    >
                      {isSendingOtp ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Sending OTP...
                        </>
                      ) : (
                        <>
                          Send OTP <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>

                    <p className="text-xs text-muted-foreground text-center mt-4">
                      We'll verify your phone number
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}
