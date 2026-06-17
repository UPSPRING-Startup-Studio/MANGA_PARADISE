import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, Facebook, Instagram, MapPin, X } from "lucide-react";
import { categories, Partner, CategoryKey } from "./partnersData";

interface PartnerModalProps {
  partner: Partner | null;
  isOpen: boolean;
  onClose: () => void;
}

const PartnerModal = ({ partner, isOpen, onClose }: PartnerModalProps) => {
  if (!partner) return null;

  const category = categories[partner.category as CategoryKey] || categories.tous;
  const hasAddress = partner.address && partner.ville;

  const openMaps = () => {
    const query = encodeURIComponent(`${partner.address}, ${partner.codePostal} ${partner.ville}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-mp-paper border-mp-border text-white p-0 overflow-hidden">
        {/* Header with gradient */}
        <div className={`relative p-6 pb-8 ${category.bgColor}`}>
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-mp-paper/50 hover:bg-mp-paper/80 transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>

          {/* Logo */}
          <div className="flex justify-center mb-4">
            {partner.logo ? (
              <div className="w-28 h-28 rounded-xl bg-white/10 backdrop-blur-sm p-3 flex items-center justify-center">
                <img
                  src={partner.logo}
                  alt={partner.name}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            ) : (
              <div className={`w-28 h-28 rounded-xl ${category.bgColor} flex items-center justify-center`}>
                <span className="text-5xl">{category.emoji}</span>
              </div>
            )}
          </div>

          <DialogHeader className="space-y-2">
            <DialogTitle className="text-2xl font-display text-center text-white">
              {partner.name}
            </DialogTitle>
            <div className="flex justify-center">
              <span className={`text-sm px-4 py-1.5 rounded-full bg-mp-paper/50 ${category.textColor} border ${category.borderColor}`}>
                {partner.type}
              </span>
            </div>
          </DialogHeader>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Description */}
          <div>
            <h4 className="text-sm font-semibold text-mp-ink-muted uppercase tracking-wider mb-2">
              Description
            </h4>
            <p className="text-slate-300 leading-relaxed">
              {partner.description}
            </p>
          </div>

          {/* Member benefit */}
          {partner.member_benefit && (
            <div className="rounded-lg bg-pink-500/10 border border-pink-500/20 p-3">
              <h4 className="text-sm font-semibold text-pink-400 uppercase tracking-wider mb-1">
                Avantage membre
              </h4>
              <p className="text-slate-300 text-sm">
                {partner.member_benefit}
              </p>
            </div>
          )}

          {/* Address if available */}
          {hasAddress && (
            <div>
              <h4 className="text-sm font-semibold text-mp-ink-muted uppercase tracking-wider mb-2">
                Adresse
              </h4>
              <p className="text-slate-300">
                {partner.address}<br />
                {partner.codePostal} {partner.ville}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            {partner.siteInternet && (
              <Button
                variant="outline"
                className="bg-white border-slate-600 hover:bg-mp-cloud hover:border-pink-500/50 text-white"
                onClick={() => window.open(partner.siteInternet, '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Site web
              </Button>
            )}

            {partner.facebook && (
              <Button
                variant="outline"
                className="bg-white border-slate-600 hover:bg-blue-600/20 hover:border-blue-500/50 text-white"
                onClick={() => window.open(partner.facebook, '_blank')}
              >
                <Facebook className="w-4 h-4 mr-2" />
                Facebook
              </Button>
            )}

            {partner.instagram && (
              <Button
                variant="outline"
                className="bg-white border-slate-600 hover:bg-pink-600/20 hover:border-pink-500/50 text-white"
                onClick={() => window.open(partner.instagram, '_blank')}
              >
                <Instagram className="w-4 h-4 mr-2" />
                Instagram
              </Button>
            )}

            {hasAddress && (
              <Button
                variant="outline"
                className="bg-white border-slate-600 hover:bg-emerald-600/20 hover:border-emerald-500/50 text-white"
                onClick={openMaps}
              >
                <MapPin className="w-4 h-4 mr-2" />
                Y aller
              </Button>
            )}
          </div>

          {/* Category badge */}
          <div className="flex justify-center pt-4 border-t border-mp-border">
            <span className={`text-xs flex items-center gap-2 ${category.textColor}`}>
              <span>{category.emoji}</span>
              {category.label}
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PartnerModal;
