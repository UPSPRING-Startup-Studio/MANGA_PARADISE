import { motion } from "framer-motion";
import { FileText, Download, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { AssociationDocument } from "@/hooks/useAssociationDocuments";

interface FicheDocumentsSectionProps {
  documents: AssociationDocument[];
  featuredDocumentIds: string[];
}

const CATEGORY_LABELS: Record<string, string> = {
  general: "Général",
  legal: "Juridique",
  finance: "Finance",
  event: "Événement",
  communication: "Communication",
};

const CATEGORY_COLORS: Record<string, string> = {
  general: "bg-muted text-muted-foreground",
  legal: "bg-turquoise/20 text-turquoise",
  finance: "bg-accent/20 text-accent",
  event: "bg-purple-500/20 text-purple-400",
  communication: "bg-orange-500/20 text-orange-400",
};

const FicheDocumentsSection = ({
  documents,
  featuredDocumentIds,
}: FicheDocumentsSectionProps) => {
  // Show only approved documents. If featured IDs are set, filter to those.
  // Otherwise show all approved documents.
  const approvedDocs = documents.filter((d) => d.status === "approved");
  const displayDocs =
    featuredDocumentIds.length > 0
      ? approvedDocs.filter((d) => featuredDocumentIds.includes(d.id))
      : approvedDocs;

  if (displayDocs.length === 0) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h2 className="text-2xl font-display text-foreground mb-6 text-center">
          Ressources & Documents
        </h2>
        <Card className="bg-card/30 border-dashed border-muted-foreground/20">
          <CardContent className="p-8 text-center">
            <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">
              Aucun document n'est disponible pour le moment.
            </p>
          </CardContent>
        </Card>
      </motion.section>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      <h2 className="text-2xl font-display text-foreground mb-6 text-center">
        Ressources & Documents
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayDocs.map((doc, index) => (
          <motion.div
            key={doc.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 + index * 0.05 }}
          >
            <Card className="h-full bg-card/50 border-border/50 hover:border-sakura/30 transition-all duration-300 group">
              <CardContent className="p-5 flex items-start gap-4">
                <div className="p-3 rounded-xl bg-turquoise/10 text-turquoise group-hover:bg-turquoise/20 transition-colors flex-shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground text-sm mb-1 truncate group-hover:text-sakura transition-colors">
                    {doc.title}
                  </h3>
                  {doc.description && (
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                      {doc.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2">
                    <Badge
                      className={`text-xs ${
                        CATEGORY_COLORS[doc.category] || CATEGORY_COLORS.general
                      }`}
                    >
                      {CATEGORY_LABELS[doc.category] || doc.category}
                    </Badge>
                    {doc.file_size && (
                      <span className="text-xs text-muted-foreground">
                        {formatFileSize(doc.file_size)}
                      </span>
                    )}
                  </div>
                </div>
                {doc.file_url && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    asChild
                  >
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Télécharger"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export default FicheDocumentsSection;
