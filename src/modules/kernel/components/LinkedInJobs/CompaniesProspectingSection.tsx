import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Building2, ExternalLink, Mail, CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Company {
  id: string;
  territory_id: string;
  name: string;
  linkedin_url: string | null;
  website_url: string | null;
  website_checked: boolean;
  website_checked_at: string | null;
  created_at: string;
}

interface Prospecting {
  id: string;
  company_id: string;
  proposal_title: string | null;
  proposal_text: string;
  status: string;
  updated_at: string;
}

interface CompaniesProspectingSectionProps {
  territoryId: string;
}

export function CompaniesProspectingSection({ territoryId }: CompaniesProspectingSectionProps) {
  const { toast } = useToast();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [prospectingByCompany, setProspectingByCompany] = useState<Record<string, Prospecting>>({});
  const [loading, setLoading] = useState(true);
  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null);
  const [proposalTitle, setProposalTitle] = useState("");
  const [proposalText, setProposalText] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    if (!territoryId) {
      setLoading(false);
      return;
    }
    const { data: companiesData } = await supabase
      .from("linkedin_companies")
      .select("*")
      .eq("territory_id", territoryId)
      .order("name");

    setCompanies((companiesData as Company[]) || []);

    const { data: prospectingData } = await supabase
      .from("linkedin_prospecting")
      .select("*")
      .in("company_id", (companiesData || []).map((c: Company) => c.id));

    const map: Record<string, Prospecting> = {};
    (prospectingData || []).forEach((p: Prospecting) => {
      map[p.company_id] = p;
    });
    setProspectingByCompany(map);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [territoryId]);

  const openEdit = (company: Company) => {
    setEditingCompanyId(company.id);
    const p = prospectingByCompany[company.id];
    setProposalTitle(p?.proposal_title || "");
    setProposalText(p?.proposal_text || "");
  };

  const saveProposal = async () => {
    if (!editingCompanyId) return;
    setSaving(true);
    const p = prospectingByCompany[editingCompanyId];
    if (p?.id) {
      const { error } = await supabase
        .from("linkedin_prospecting")
        .update({
          proposal_title: proposalTitle || null,
          proposal_text: proposalText,
          updated_at: new Date().toISOString(),
        })
        .eq("id", p.id);
      if (error) {
        toast({ title: "Erreur", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Proposition mise à jour" });
        setProspectingByCompany((prev) => ({
          ...prev,
          [editingCompanyId]: { ...p, proposal_title: proposalTitle, proposal_text: proposalText },
        }));
        setEditingCompanyId(null);
      }
    } else {
      const { data, error } = await supabase
        .from("linkedin_prospecting")
        .insert({
          company_id: editingCompanyId,
          proposal_title: proposalTitle || null,
          proposal_text: proposalText,
          status: "draft",
        })
        .select("id, company_id, proposal_title, proposal_text, status, updated_at")
        .single();
      if (error) {
        toast({ title: "Erreur", description: error.message, variant: "destructive" });
      } else if (data) {
        toast({ title: "Proposition enregistrée" });
        setProspectingByCompany((prev) => ({
          ...prev,
          [editingCompanyId]: data as Prospecting,
        }));
        setEditingCompanyId(null);
      }
    }
    setSaving(false);
  };

  const markWebsiteChecked = async (companyId: string) => {
    const { error } = await supabase
      .from("linkedin_companies")
      .update({
        website_checked: true,
        website_checked_at: new Date().toISOString(),
      })
      .eq("id", companyId);
    if (!error) {
      setCompanies((prev) =>
        prev.map((c) =>
          c.id === companyId
            ? { ...c, website_checked: true, website_checked_at: new Date().toISOString() }
            : c
        )
      );
      toast({ title: "Site marqué comme vérifié" });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Entreprises & prospection
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Vérifiez le site des entreprises et rédigez une proposition à leur proposer.
        </p>
      </CardHeader>
      <CardContent>
        {companies.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucune entreprise. Les entreprises sont extraites automatiquement après une recherche LinkedIn terminée.
          </p>
        ) : (
          <ul className="space-y-4 max-h-[500px] overflow-y-auto">
            {companies.map((c) => {
              const p = prospectingByCompany[c.id];
              const isEditing = editingCompanyId === c.id;
              return (
                <li key={c.id} className="p-4 rounded-lg border bg-card space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{c.name}</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {c.linkedin_url && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={c.linkedin_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-3 w-3 mr-1" />
                              LinkedIn
                            </a>
                          </Button>
                        )}
                        {c.website_url && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={c.website_url.startsWith("http") ? c.website_url : `https://${c.website_url}`} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Site web
                            </a>
                          </Button>
                        )}
                        {c.website_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markWebsiteChecked(c.id)}
                            disabled={c.website_checked}
                          >
                            {c.website_checked ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            ) : (
                              "Marquer site vérifié"
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                    <Badge variant={p?.status === "sent" ? "default" : "secondary"}>{p?.status || "draft"}</Badge>
                  </div>

                  <Dialog open={editingCompanyId === c.id} onOpenChange={(open) => !open && setEditingCompanyId(null)}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="mt-2" onClick={() => openEdit(c)}>
                        <Mail className="h-4 w-4 mr-1" />
                        {p?.proposal_text ? "Modifier la proposition" : "Rédiger une proposition"}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                      <DialogHeader>
                        <DialogTitle>Proposition — {c.name}</DialogTitle>
                        <DialogDescription>
                          Rédigez un message de prospection à envoyer à cette entreprise (email, LinkedIn, etc.).
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-2">
                        <Label className="text-xs">Titre</Label>
                        <Input
                          placeholder="Objet : collaboration..."
                          value={proposalTitle}
                          onChange={(e) => setProposalTitle(e.target.value)}
                          disabled={saving}
                        />
                        <Label className="text-xs">Message</Label>
                        <Textarea
                          placeholder="Votre proposition..."
                          value={proposalText}
                          onChange={(e) => setProposalText(e.target.value)}
                          rows={6}
                          disabled={saving}
                        />
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingCompanyId(null)}>
                          Annuler
                        </Button>
                        <Button onClick={saveProposal} disabled={saving}>
                          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enregistrer"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  {p?.proposal_text && !isEditing && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{p.proposal_text}</p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
