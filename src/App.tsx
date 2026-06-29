import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { clearLocalCacheSync } from "@/lib/storage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import AdminTeam from "@/components/AdminTeam";
import { GlobalThemeEditor } from "@/components/GlobalThemeEditor";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/admin" component={AdminTeam} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useEffect(() => {
    // Clear local cache to ensure localhost syncs perfectly with Vercel defaults
    clearLocalCacheSync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
        <GlobalThemeEditor />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
