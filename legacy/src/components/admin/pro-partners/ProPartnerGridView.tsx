import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, Star, MapPin } from "lucide-react";
import {
  type ProPartner,
  PRO_PARTNER_TYPE_LABELS,
  DIRECTORY_CATEGORY_LABELS,
  PARTNER_STATUS_LABELS,
  PARTNER_STATUS_COLORS,
  type DirectoryCategory,
  type PartnerStatus,
} from "@/hooks/useProPartner";
import PartnerAvatar from "./PartnerAvatar";

interface ProPartnerGridViewProps {
  partners: (ProPartner & { event_count: number })[];
  onSelect: (partner: ProPartner & { event_count: number }) => void;
}

export default function ProPartnerGridView({ partners, onSelect }: ProPartnerGridViewProps) {
  if (partners.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-mp-ink-muted">Aucun partenaire à afficher</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {partners.map((partner) => {
        const partnerStatus = (partner as any).partner_status as PartnerStatus | undefined;
        return (
          <Card
            key={partner.id}
            className={`bg-mp-paper/80 border-mp-border/50 hover:border-[#E84A2B]/30 transition-colors cursor-pointer ${
              partner.admin_status === "blocked" ? "opacity-60" : ""
            }`}
            onClick={() => onSelect(partner)}
          >
            <CardContent className="p-4">
              <div className="flex flex-col items-center text-center space-y-3">
                <PartnerAvatar
                  logoUrl={partner.logo_url}
                  name={partner.name}
                  category={partner.directory_category}
                  size="lg"
                />

                <div className="space-y-1 w-full">
                  <h3 className="font-semibold text-slate-50 text-sm truncate">
                    {partner.name}
                  </h3>

                  {partner.city && (
                    <p className="text-xs text-mp-ink-muted flex items-center justify-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {partner.city}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap justify-center gap-1.5">
                  <Badge variant="outline" className="text-[9px] text-cyan-400 border-cyan-500/30">
                    {PRO_PARTNER_TYPE_LABELS[partner.type] || partner.type}
                  </Badge>
                  {partner.directory_category && (
                    <Badge variant="outline" className="text-[9px] text-purple-400 border-purple-500/30">
                      {DIRECTORY_CATEGORY_LABELS[partner.directory_category as DirectoryCategory] || partner.directory_category}
                    </Badge>
                  )}
                  {partnerStatus && partnerStatus !== "opportunite" && (
                    <Badge variant="outline" className={`text-[9px] ${PARTNER_STATUS_COLORS[partnerStatus] || ""}`}>
                      {PARTNER_STATUS_LABELS[partnerStatus] || partnerStatus}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {partner.is_public && <Globe className="h-3.5 w-3.5 text-cyan-400" />}
                  {partner.is_featured && <Star className="h-3.5 w-3.5 text-yellow-400" />}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
