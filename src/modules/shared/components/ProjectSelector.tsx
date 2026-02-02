import { useState } from "react";
import { Check, ChevronsUpDown, Plus, FolderKanban, Archive, Trash2, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useProjects, Project } from "../hooks/useProjects";
import { supabase } from "@/integrations/supabase/client";

export function ProjectSelector() {
  const { projects, selectedProject, setSelectedProject, refresh } = useProjects();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [projectToModify, setProjectToModify] = useState<Project | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [newProject, setNewProject] = useState({
    name: "",
    region: "",
    country: "Suisse",
    description: "",
  });

  const handleCreateProject = async () => {
    if (!newProject.name.trim() || !newProject.region.trim()) {
      toast({
        title: "Erreur",
        description: "Le nom et la région sont requis",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      const { data, error } = await supabase
        .from("territories")
        .insert({
          name: newProject.name.trim(),
          region: newProject.region.trim(),
          country: newProject.country.trim(),
          description: newProject.description.trim() || null,
          status: "active",
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Projet créé",
        description: `${newProject.name} a été créé avec succès`,
      });

      await refresh();
      
      if (data) {
        setSelectedProject(data as Project);
      }

      setDialogOpen(false);
      setNewProject({ name: "", region: "", country: "Suisse", description: "" });
    } catch (error) {
      console.error("Error creating project:", error);
      toast({
        title: "Erreur",
        description: "Impossible de créer le projet",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleArchiveProject = async () => {
    if (!projectToModify) return;
    
    setIsArchiving(true);
    try {
      const newStatus = projectToModify.status === "inactive" ? "active" : "inactive";
      const { error } = await supabase
        .from("territories")
        .update({ status: newStatus })
        .eq("id", projectToModify.id);

      if (error) throw error;

      toast({
        title: newStatus === "inactive" ? "Projet archivé" : "Projet réactivé",
        description: `${projectToModify.name} a été ${newStatus === "inactive" ? "archivé" : "réactivé"}`,
      });

      await refresh();
      
      if (selectedProject?.id === projectToModify.id && newStatus === "inactive") {
        const activeProject = projects.find(p => p.id !== projectToModify.id && p.status === "active");
        setSelectedProject(activeProject || null);
      }

      setArchiveDialogOpen(false);
      setProjectToModify(null);
    } catch (error) {
      console.error("Error archiving project:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'archiver le projet",
        variant: "destructive",
      });
    } finally {
      setIsArchiving(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!projectToModify) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("territories")
        .delete()
        .eq("id", projectToModify.id);

      if (error) throw error;

      toast({
        title: "Projet supprimé",
        description: `${projectToModify.name} a été supprimé définitivement`,
      });

      await refresh();
      
      if (selectedProject?.id === projectToModify.id) {
        const remainingProject = projects.find(p => p.id !== projectToModify.id);
        setSelectedProject(remainingProject || null);
      }

      setDeleteDialogOpen(false);
      setProjectToModify(null);
    } catch (error) {
      console.error("Error deleting project:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le projet. Il contient peut-être des données liées.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const openArchiveDialog = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    setProjectToModify(project);
    setArchiveDialogOpen(true);
  };

  const openDeleteDialog = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    setProjectToModify(project);
    setDeleteDialogOpen(true);
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            <div className="flex items-center gap-2 truncate">
              <FolderKanban className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="truncate">
                {selectedProject?.name || "Sélectionner un projet"}
              </span>
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-0">
          <Command>
            <CommandInput placeholder="Rechercher un projet..." />
            <CommandList>
              <CommandEmpty>Aucun projet trouvé.</CommandEmpty>
              <CommandGroup heading="Projets">
                {projects.map((project) => (
                  <CommandItem
                    key={project.id}
                    value={project.name}
                    onSelect={() => {
                      setSelectedProject(project);
                      setOpen(false);
                    }}
                    className="group"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <span
                        className={cn(
                          "w-2 h-2 rounded-full shrink-0",
                          project.status === "active"
                            ? "bg-emerald-500"
                            : project.status === "pending"
                            ? "bg-amber-500"
                            : "bg-muted-foreground"
                        )}
                      />
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="truncate">{project.name}</span>
                        <span className="text-xs text-muted-foreground truncate">
                          {project.region}, {project.country}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Check
                        className={cn(
                          "h-4 w-4 shrink-0",
                          selectedProject?.id === project.id
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover">
                          <DropdownMenuItem onClick={(e) => openArchiveDialog(project, e as unknown as React.MouseEvent)}>
                            <Archive className="mr-2 h-4 w-4" />
                            {project.status === "inactive" ? "Réactiver" : "Archiver"}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={(e) => openDeleteDialog(project, e as unknown as React.MouseEvent)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    setOpen(false);
                    setDialogOpen(true);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nouveau projet
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouveau projet</DialogTitle>
            <DialogDescription>
              Créez un nouveau projet pour collecter et analyser des données
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom du projet *</Label>
              <Input
                id="name"
                placeholder="Ex: Val-de-Travers"
                value={newProject.name}
                onChange={(e) =>
                  setNewProject({ ...newProject, name: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="region">Région *</Label>
                <Input
                  id="region"
                  placeholder="Ex: Neuchâtel"
                  value={newProject.region}
                  onChange={(e) =>
                    setNewProject({ ...newProject, region: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Pays</Label>
                <Input
                  id="country"
                  placeholder="Ex: Suisse"
                  value={newProject.country}
                  onChange={(e) =>
                    setNewProject({ ...newProject, country: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Description du projet (optionnel)"
                value={newProject.description}
                onChange={(e) =>
                  setNewProject({ ...newProject, description: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreateProject} disabled={isCreating}>
              {isCreating ? "Création..." : "Créer le projet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Archive Confirmation Dialog */}
      <AlertDialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {projectToModify?.status === "inactive" ? "Réactiver" : "Archiver"} le projet ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {projectToModify?.status === "inactive" 
                ? `Le projet "${projectToModify?.name}" sera réactivé et visible dans la liste des projets actifs.`
                : `Le projet "${projectToModify?.name}" sera archivé. Vous pourrez le réactiver à tout moment.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isArchiving}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchiveProject} disabled={isArchiving}>
              {isArchiving 
                ? "En cours..." 
                : projectToModify?.status === "inactive" 
                  ? "Réactiver" 
                  : "Archiver"
              }
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer définitivement ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le projet "{projectToModify?.name}" et toutes ses données 
              (collectes, rapports) seront supprimés définitivement.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteProject} 
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
