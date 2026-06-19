import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Scanner } from "@yudiel/react-qr-scanner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { 
  QrCode, 
  CheckCircle2, 
  XCircle,
  AlertTriangle,
  Loader2
} from "lucide-react";

const ScannerModal = () => {
  const { eventId } = useParams();
  const [scanning, setScanning] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    username?: string;
  } | null>(null);

  const handleScan = async (detectedCodes: { rawValue: string }[]) => {
    if (!detectedCodes.length || loading) return;
    setLoading(true);
    
    try {
      // Parse QR code data as JSON
      let qrData;
      try {
        qrData = JSON.parse(detectedCodes[0].rawValue);
      } catch {
        setResult({
          success: false,
          message: "Code invalide : Ce n'est pas un billet pour cet événement."
        });
        setLoading(false);
        return;
      }

      // Validate QR code format
      if (qrData.type !== "event_checkin") {
        setResult({
          success: false,
          message: "Code invalide : Ce n'est pas un billet pour cet événement."
        });
        setLoading(false);
        return;
      }

      // Validate event ID matches
      if (qrData.eventId !== eventId) {
        setResult({
          success: false,
          message: "Code invalide : Ce billet est pour un autre événement."
        });
        setLoading(false);
        return;
      }

      // Get participant data using userId and eventId
      const { data: participant, error: participantError } = await supabase
        .from("event_participants")
        .select(`
          *,
          profile:user_id(username, display_name, allow_event_checkin)
        `)
        .eq("user_id", qrData.userId)
        .eq("event_id", eventId)
        .single();

      if (participantError || !participant) {
        setResult({
          success: false,
          message: "Billet non trouvé dans la base de données."
        });
        setLoading(false);
        return;
      }

      const profile = participant.profile as any;

      // Check if user has allowed check-in
      if (!profile?.allow_event_checkin) {
        setResult({
          success: false,
          message: "L'utilisateur n'a pas activé le check-in dans ses paramètres",
          username: profile?.display_name || profile?.username
        });
        setLoading(false);
        return;
      }

      // Check if user is already checked in
      if (participant.is_present) {
        setResult({
          success: false,
          message: "L'utilisateur est déjà enregistré comme présent",
          username: profile?.display_name || profile?.username
        });
        setLoading(false);
        return;
      }

      // Update participant status
      const { error: updateError } = await supabase
        .from("event_participants")
        .update({
          is_present: true,
          checked_in_at: new Date().toISOString()
        })
        .eq("id", participant.id);

      if (updateError) throw updateError;

      // Add XP and OTK rewards
      const { error: rewardError } = await supabase
        .from("otk_transactions")
        .insert({
          user_id: participant.user_id,
          amount: 25,
          transaction_type: "event_checkin",
          description: "Bonus de présence à l'événement"
        });

      if (rewardError) {
        console.error("Error giving rewards:", rewardError);
      }

      setResult({
        success: true,
        message: "Check-in validé ! +50 XP, +25 OTK",
        username: profile?.display_name || profile?.username
      });

      // Reset after 3 seconds
      setTimeout(() => {
        setResult(null);
        setScanning(true);
      }, 3000);

    } catch (error) {
      console.error("Scan error:", error);
      setResult({
        success: false,
        message: "Une erreur est survenue lors du scan"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleError = (error: any) => {
    console.error("Scanner error:", error);
    toast.error("Erreur d'accès à la caméra");
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-2xl overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-sakura" />
              <h2 className="font-display text-lg">Scanner QR Code</h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.history.back()}
            >
              Fermer
            </Button>
          </div>

          {/* Scanner or Result */}
          <div className="aspect-square relative">
            <AnimatePresence mode="wait">
              {scanning && !result ? (
                <motion.div
                  key="scanner"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0"
                >
                  <Scanner
                    onScan={handleScan}
                    onError={handleError}
                    classNames={{ video: "h-full" }}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute inset-0 flex items-center justify-center bg-black/80"
                >
                  {loading ? (
                    <Loader2 className="w-8 h-8 text-sakura animate-spin" />
                  ) : result ? (
                    <div className="text-center p-6 space-y-4">
                      {result.success ? (
                        <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
                      ) : (
                        <XCircle className="w-16 h-16 text-destructive mx-auto" />
                      )}
                      <div>
                        {result.username && (
                          <p className="font-display text-xl mb-2">
                            {result.username}
                          </p>
                        )}
                        <p className="text-muted-foreground">
                          {result.message}
                        </p>
                      </div>
                    </div>
                  ) : null}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border">
            <p className="text-sm text-muted-foreground text-center flex items-center justify-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Placez le QR Code au centre de la caméra
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScannerModal;