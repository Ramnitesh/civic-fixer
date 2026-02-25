import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/HomePage";
import AuthPage from "@/pages/AuthPage";
import DashboardPage from "@/pages/DashboardPage";
import JobsListPage from "@/pages/JobsListPage";
import JobDetailsPage from "@/pages/JobDetailsPage";
import CreateJobPage from "@/pages/CreateJobPage";
import WalletPage from "@/pages/WalletPage";
import LegalPage from "@/pages/legal/LegalPage";
import AboutPage from "@/pages/AboutPage";
import ContactPage from "@/pages/ContactPage";
import HelpPage from "@/pages/HelpPage";
import CareersPage from "@/pages/CareersPage";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { ScrollToTop } from "@/components/ScrollToTop";

function ProtectedRoute({ component: Component, ...rest }: any) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    // Redirect to login handled by wouter simply by rendering AuthPage or using hook
    window.location.href = "/auth";
    return null;
  }

  return <Component {...rest} />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/jobs" component={JobsListPage} />
      <Route path="/jobs/:id" component={JobDetailsPage} />

      {/* Protected Routes */}
      <Route path="/dashboard">
        {() => <ProtectedRoute component={DashboardPage} />}
      </Route>
      <Route path="/create-job">
        {() => <ProtectedRoute component={CreateJobPage} />}
      </Route>
      <Route path="/wallet">
        {() => <ProtectedRoute component={WalletPage} />}
      </Route>

      {/* Legal Routes - handles all /legal/* routes */}
      <Route path="/legal/:slug" component={LegalPage} />

      {/* Company Routes */}
      <Route path="/about" component={AboutPage} />
      <Route path="/contact" component={ContactPage} />
      <Route path="/help" component={HelpPage} />
      <Route path="/careers" component={CareersPage} />
      <Route path="/press">
        {() => (
          <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-12 max-w-4xl">
              <h1 className="text-3xl font-bold mb-6">Press</h1>
              <p className="text-muted-foreground">Coming soon...</p>
            </div>
          </div>
        )}
      </Route>
      <Route path="/blog">
        {() => (
          <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-12 max-w-4xl">
              <h1 className="text-3xl font-bold mb-6">Blog</h1>
              <p className="text-muted-foreground">Coming soon...</p>
            </div>
          </div>
        )}
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ScrollToTop />
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
