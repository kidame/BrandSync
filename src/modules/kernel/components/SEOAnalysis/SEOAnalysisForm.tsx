import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Globe, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const urlSchema = z.object({
  websiteUrl: z
    .string()
    .trim()
    .min(1, "L'URL est requise")
    .refine(
      (url) => {
        try {
          const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
          return ['http:', 'https:'].includes(parsed.protocol);
        } catch {
          return false;
        }
      },
      { message: "URL invalide. Exemple: https://example.com" }
    ),
});

type FormData = z.infer<typeof urlSchema>;

interface SEOAnalysisFormProps {
  onAnalyze: (url: string) => Promise<void>;
  isLoading: boolean;
}

export function SEOAnalysisForm({ onAnalyze, isLoading }: SEOAnalysisFormProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(urlSchema),
    defaultValues: {
      websiteUrl: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    let url = data.websiteUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }
    await onAnalyze(url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          Analyse SEO
        </CardTitle>
        <CardDescription>
          Entrez l'URL d'un site web pour obtenir une analyse SEO complète via Google PageSpeed Insights
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex gap-4">
            <FormField
              control={form.control}
              name="websiteUrl"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel className="sr-only">URL du site</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://example.com"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading} className="shrink-0">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyse en cours...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Analyser
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
