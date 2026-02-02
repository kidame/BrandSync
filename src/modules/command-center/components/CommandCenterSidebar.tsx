import { 
  Sidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel, 
  SidebarHeader,
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem,
  useSidebar
} from "@/components/ui/sidebar";
import { NavLink } from "@/components/NavLink";
import { Badge } from "@/components/ui/badge";
import { 
  LayoutDashboard, 
  Dna, 
  Network, 
  Sparkles, 
  Workflow, 
  Database,
  Globe,
  Briefcase
} from "lucide-react";
import { ProjectSelector } from "@/modules/shared/components";

const modules = [
  { 
    id: 'command-center',
    title: 'Command Center', 
    icon: LayoutDashboard, 
    url: '/',
    status: 'active' as const,
    description: 'Vue d\'ensemble'
  },
  { 
    id: 'kernel',
    title: 'Kernel', 
    icon: Dna, 
    url: '/kernel',
    status: 'active' as const,
    description: 'Brand DNA Reports',
    children: [
      { title: 'Data Collection', url: '/kernel/data', status: 'active' as const, icon: Database },
      { title: 'SEO Analysis', url: '/kernel/seo', status: 'active' as const, icon: Globe },
      { title: 'Offres LinkedIn', url: '/kernel/linkedin-jobs', status: 'active' as const, icon: Briefcase },
      { title: 'Explorer', url: '/kernel/explorer', status: 'coming-soon' as const },
      { title: 'Decoder', url: '/kernel/decoder', status: 'coming-soon' as const },
      { title: 'Map', url: '/kernel/map', status: 'coming-soon' as const },
      { title: 'DNA Report', url: '/kernel/dna', status: 'active' as const },
    ]
  },
  { 
    id: 'graph',
    title: 'Graph', 
    icon: Network, 
    url: '/graph',
    status: 'coming-soon' as const,
    description: 'Clusters sémantiques'
  },
  { 
    id: 'factory',
    title: 'Factory', 
    icon: Sparkles, 
    url: '/factory',
    status: 'coming-soon' as const,
    description: 'Génération d\'assets'
  },
  { 
    id: 'engine',
    title: 'Engine', 
    icon: Workflow, 
    url: '/engine',
    status: 'coming-soon' as const,
    description: 'Pipelines & automatisation'
  },
];

export function CommandCenterSidebar() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const getStatusBadge = (status: 'active' | 'coming-soon' | 'beta') => {
    if (status === 'coming-soon') {
      return <Badge variant="outline" className="text-xs ml-auto">Bientôt</Badge>;
    }
    if (status === 'beta') {
      return <Badge variant="secondary" className="text-xs ml-auto">Beta</Badge>;
    }
    return null;
  };

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="border-b px-4 py-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary text-primary-foreground">
            <Dna className="h-5 w-5" />
          </div>
          {!isCollapsed && (
            <div>
              <h2 className="font-semibold text-sm">BrandSync</h2>
              <p className="text-xs text-muted-foreground">Intelligence Platform</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Main Modules */}
        <SidebarGroup>
          <SidebarGroupLabel>Modules</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {modules.map((module) => (
                <div key={module.id}>
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      asChild 
                      disabled={module.status === 'coming-soon'}
                      tooltip={module.description}
                    >
                      <NavLink 
                        to={module.children ? module.children.find(c => c.status === 'active')?.url || module.url : module.url} 
                        end={module.url === '/'} 
                        className={module.status === 'coming-soon' ? 'opacity-50 pointer-events-none' : ''}
                        activeClassName="bg-accent text-accent-foreground"
                      >
                        <module.icon className="h-4 w-4" />
                        {!isCollapsed && (
                          <>
                            <span className="flex-1">{module.title}</span>
                            {getStatusBadge(module.status)}
                          </>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  
                  {/* Sub-menu for modules with children */}
                  {module.children && !isCollapsed && (
                    <div className="ml-6 mt-1 space-y-1 border-l pl-2">
                      {module.children.map((child) => (
                        <SidebarMenuItem key={child.url}>
                          <SidebarMenuButton 
                            asChild 
                            disabled={child.status === 'coming-soon'}
                            className="h-8"
                          >
                            <NavLink 
                              to={child.url}
                              className={child.status === 'coming-soon' ? 'opacity-50 pointer-events-none text-sm' : 'text-sm'}
                              activeClassName="bg-accent text-accent-foreground"
                            >
                              <span className="flex-1">{child.title}</span>
                              {getStatusBadge(child.status)}
                            </NavLink>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Project Selector */}
        {!isCollapsed && (
          <SidebarGroup>
            <SidebarGroupLabel>Projet actif</SidebarGroupLabel>
            <SidebarGroupContent className="px-2">
              <ProjectSelector />
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
