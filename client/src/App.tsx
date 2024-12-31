import { Switch, Route, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Loader2 } from "lucide-react";
import AuthPage from "./pages/AuthPage";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { useUser } from "./hooks/use-user";
import { lazy, Suspense } from "react";

// Lazy load pages
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const HRPage = lazy(() => import("./pages/HRPage"));
const FinancePage = lazy(() => import("./pages/FinancePage"));
const ProjectsPage = lazy(() => import("./pages/ProjectsPage"));
const VendorsPage = lazy(() => import("./pages/VendorsPage"));
const QuotationsPage = lazy(() => import("./pages/QuotationsPage"));
const DesignsPage = lazy(() => import("./pages/DesignsPage"));
const HandoversPage = lazy(() => import("./pages/HandoversPage"));
const SupportPage = lazy(() => import("./pages/SupportPage"));
const KnowledgePage = lazy(() => import("./pages/KnowledgePage"));
const SustainabilityPage = lazy(() => import("./pages/SustainabilityPage"));
const ReportsPage = lazy(() => import("./pages/ReportsPage"));

// Loading component for lazy-loaded pages
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

function App() {
  const { user, isLoading } = useUser();
  const [location] = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <DashboardLayout>
      <Suspense fallback={<PageLoader />}>
        <Switch location={location}>
          <Route path="/" component={DashboardPage} />
          <Route path="/hr" component={HRPage} />
          <Route path="/finance" component={FinancePage} />
          <Route path="/projects" component={ProjectsPage} />
          <Route path="/vendors" component={VendorsPage} />
          <Route path="/quotations" component={QuotationsPage} />
          <Route path="/designs" component={DesignsPage} />
          <Route path="/handovers" component={HandoversPage} />
          <Route path="/support" component={SupportPage} />
          <Route path="/knowledge" component={KnowledgePage} />
          <Route path="/sustainability" component={SustainabilityPage} />
          <Route path="/reports" component={ReportsPage} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </DashboardLayout>
  );
}

function NotFound() {
  return (
    <div className="w-full p-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <h1 className="text-2xl font-bold">404 Page Not Found</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            The page you are looking for doesn't exist or has been moved.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default App;