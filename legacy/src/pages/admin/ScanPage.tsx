import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import ScannerModal from "@/components/events/ScannerModal";

const ScanPage = () => {
  const { eventId } = useParams();

  // Fetch event details
  const { data: event } = useQuery({
    queryKey: ["event", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select()
        .eq("id", eventId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!eventId,
  });

  return (
    <div className="min-h-screen bg-header-bg">
      <ScannerModal />
    </div>
  );
};

export default ScanPage;