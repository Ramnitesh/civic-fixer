import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { 
  Menu, X, Home, Briefcase, PlusCircle, LogOut, User, DollarSign, Hammer
} from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function Navigation() {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const NavLink = ({ href, children, icon: Icon }: any) => {
    const isActive = location === href;
    return (
      <Link href={href} onClick={() => setIsOpen(false)}>
        <div className={`
          flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer
          ${isActive 
            ? 'bg-primary/10 text-primary' 
            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}
        `}>
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
              <NavLink href="/dashboard" icon={Home}>Dashboard</NavLink>
              <NavLink href="/jobs" icon={Briefcase}>Browse Jobs</NavLink>
              {user.role === "LEADER" && (
                <NavLink href="/create-job" icon={PlusCircle}>Create Job</NavLink>
              )}
            </>
          ) : (
            <NavLink href="/jobs" icon={Briefcase}>Browse Jobs</NavLink>
          )}
        </div>

        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 pr-4 border-r">
                <div className="text-right hidden lg:block">
                  <p className="text-sm font-semibold leading-none">{user.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{user.role.toLowerCase()}</p>
                </div>
                <Avatar className="h-8 w-8 border-2 border-primary/20">
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
                    {user.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
              <Button variant="ghost" size="icon" onClick={() => logout()} title="Logout">
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
        <div className="md:hidden">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <div className="flex flex-col gap-4 mt-8">
                {user ? (
                  <>
                    <div className="flex items-center gap-3 pb-6 border-b mb-2">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{user.name}</p>
                        <p className="text-sm text-muted-foreground capitalize">{user.role}</p>
                      </div>
                    </div>
                    <NavLink href="/dashboard" icon={Home}>Dashboard</NavLink>
                    <NavLink href="/jobs" icon={Briefcase}>Browse Jobs</NavLink>
                    {user.role === "LEADER" && (
                      <NavLink href="/create-job" icon={PlusCircle}>Create Job</NavLink>
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
                    <NavLink href="/jobs" icon={Briefcase}>Browse Jobs</NavLink>
                    <div className="border-t my-2 pt-4 flex flex-col gap-2">
                      <Link href="/auth" onClick={() => setIsOpen(false)}>
                        <Button variant="outline" className="w-full">Sign In</Button>
                      </Link>
                      <Link href="/auth?tab=register" onClick={() => setIsOpen(false)}>
                        <Button className="w-full btn-primary">Get Started</Button>
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
