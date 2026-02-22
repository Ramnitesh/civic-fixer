import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useWalletBalance } from "@/hooks/use-wallet";
import { Button } from "@/components/ui/button";
import {
  Menu,
  Home,
  Briefcase,
  PlusCircle,
  LogOut,
  Wallet,
  Star,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export function Navigation() {
  const { user, logout, updateProfile, isUpdatingProfile } = useAuth();
  const { data: walletBalance } = useWalletBalance();
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [username, setUsername] = useState("");
  const [availability, setAvailability] = useState("");
  const [skillTags, setSkillTags] = useState("");

  useEffect(() => {
    if (!user) return;
    setName(user.name ?? "");
    setPhone(user.phone ?? "");
    setUsername(user.username ?? "");
    setAvailability(user.availability ?? "");
    setSkillTags(
      Array.isArray(user.skillTags) ? user.skillTags.join(", ") : "",
    );
  }, [user, isProfileOpen]);

  const NavLink = ({ href, children, icon: Icon }: any) => {
    const isActive = location === href;
    return (
      <Link href={href} onClick={() => setIsOpen(false)}>
        <div
          className={`
          flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer
          ${
            isActive
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }
        `}
        >
          {Icon && <Icon className="w-4 h-4" />}
          {children}
        </div>
      </Link>
    );
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-lg">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/">
          <div className="flex items-center gap-2 cursor-pointer">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-primary/20">
              C
            </div>
            <span className="font-display font-bold text-xl tracking-tight hidden sm:inline-block">
              CrowdCivic<span className="text-primary">Fix</span>
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6">
          {user ? (
            <>
              <NavLink href="/dashboard" icon={Home}>
                Dashboard
              </NavLink>
              <NavLink href="/jobs" icon={Briefcase}>
                Browse Jobs
              </NavLink>
            </>
          ) : (
            <NavLink href="/jobs" icon={Briefcase}>
              Browse Jobs
            </NavLink>
          )}
        </div>

        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              {/* Wallet Balance */}
              <Link href="/wallet">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-lg border border-green-200 cursor-pointer hover:bg-green-100 transition-colors">
                  <Wallet className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-semibold text-green-700">
                    ₹{walletBalance ?? 0}
                  </span>
                </div>
              </Link>
              {/* Reputation Score */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 rounded-lg border border-orange-200">
                <Star className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-semibold text-orange-700">
                  {user.rating?.toFixed(1) || "5.0"}
                </span>
              </div>

              {/* Profile */}
              <div className="flex items-center gap-3 pl-4 border-l">
                <div className="text-right hidden lg:block">
                  <p className="text-sm font-semibold leading-none">
                    {user.name}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {user.role.toLowerCase()}
                  </p>
                </div>
                <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
                  <DialogTrigger asChild>
                    <button
                      type="button"
                      className="rounded-full focus:outline-none focus:ring-2 focus:ring-primary"
                      title="View or edit profile"
                    >
                      <Avatar className="h-8 w-8 border-2 border-primary/20 cursor-pointer">
                        <AvatarFallback className="bg-primary/10 text-primary font-bold">
                          {user.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Profile</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                      <Input
                        placeholder="Username"
                        value={username}
                        disabled
                        className="bg-muted"
                      />
                      <Input
                        placeholder="Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                      <Input
                        placeholder="Phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                      {user?.role === "WORKER" && (
                        <>
                          <Input
                            placeholder="Availability"
                            value={availability}
                            onChange={(e) => setAvailability(e.target.value)}
                          />
                          <Input
                            placeholder="Skills (comma separated)"
                            value={skillTags}
                            onChange={(e) => setSkillTags(e.target.value)}
                          />
                        </>
                      )}
                      <Button
                        className="w-full"
                        disabled={isUpdatingProfile}
                        onClick={() => {
                          updateProfile(
                            {
                              name: name.trim() || undefined,
                              phone: phone.trim() || undefined,
                              ...(user?.role === "WORKER" && {
                                availability: availability.trim() || undefined,
                                skillTags: skillTags
                                  .split(",")
                                  .map((skill) => skill.trim())
                                  .filter(Boolean),
                              }),
                            },
                            {
                              onSuccess: () => setIsProfileOpen(false),
                            },
                          );
                        }}
                      >
                        Save Profile
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => logout()}
                title="Logout"
              >
                <LogOut className="w-4 h-4 text-muted-foreground hover:text-destructive" />
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Link href="/auth">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/auth?tab=register">
                <Button className="btn-primary">Get Started</Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Nav */}
        <div className="md:hidden flex items-center gap-2">
          {/* Wallet Balance - Mobile - Always visible */}
          {user && (
            <Link href="/wallet">
              <div className="flex items-center gap-1 px-2 py-1 bg-green-50 rounded-lg border border-green-200 cursor-pointer hover:bg-green-100 transition-colors">
                <Wallet className="w-4 h-4 text-green-600" />
                <span className="text-xs font-semibold text-green-700">
                  ₹{walletBalance ?? 0}
                </span>
              </div>
            </Link>
          )}
          {/* Reputation Score - Mobile - Always visible */}
          {user && (
            <div className="flex items-center gap-1 px-2 py-1 bg-orange-50 rounded-lg border border-orange-200">
              <Star className="w-4 h-4 text-orange-500" />
              <span className="text-xs font-semibold text-orange-700">
                {user.rating?.toFixed(1) || "5.0"}
              </span>
            </div>
          )}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <div className="flex flex-col gap-4 mt-4">
                {user ? (
                  <>
                    <div className="flex items-center gap-3 pb-6 border-b mb-2">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {user.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{user.name}</p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {user.role}
                        </p>
                      </div>
                    </div>
                    <NavLink href="/dashboard" icon={Home}>
                      Dashboard
                    </NavLink>
                    <NavLink href="/jobs" icon={Briefcase}>
                      Browse Jobs
                    </NavLink>
                    <NavLink href="/wallet" icon={Wallet}>
                      My Wallet
                    </NavLink>
                    {["MEMBER", "LEADER", "CONTRIBUTOR", "ADMIN"].includes(
                      user.role,
                    ) && (
                      <NavLink href="/create-job" icon={PlusCircle}>
                        Create Job
                      </NavLink>
                    )}
                    <Button
                      variant="destructive"
                      className="mt-4 w-full justify-start gap-2"
                      onClick={() => logout()}
                    >
                      <LogOut className="w-4 h-4" /> Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <NavLink href="/jobs" icon={Briefcase}>
                      Browse Jobs
                    </NavLink>
                    <div className="border-t my-2 pt-4 flex flex-col gap-2">
                      <Link href="/auth" onClick={() => setIsOpen(false)}>
                        <Button variant="outline" className="w-full">
                          Sign In
                        </Button>
                      </Link>
                      <Link
                        href="/auth?tab=register"
                        onClick={() => setIsOpen(false)}
                      >
                        <Button className="w-full btn-primary">
                          Get Started
                        </Button>
                      </Link>
                    </div>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
