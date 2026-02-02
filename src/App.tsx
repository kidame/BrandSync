import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProjectsProvider } from "@/modules/shared/hooks/useProjects";
import Index from "./pages/Index";
import BrandDNAPage from "./pages/BrandDNA";
import DataCollection from "./pages/DataCollection";
import SEOAnalysis from "./pages/SEOAnalysis";
import LinkedInJobs from "./pages/LinkedInJobs";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ProjectsProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/kernel/dna" element={<BrandDNAPage />} />
            <Route path="/kernel/data" element={<DataCollection />} />
            <Route path="/kernel/seo" element={<SEOAnalysis />} />
            <Route path="/kernel/linkedin-jobs" element={<LinkedInJobs />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ProjectsProvider>
  </QueryClientProvider>
);

export default App;
