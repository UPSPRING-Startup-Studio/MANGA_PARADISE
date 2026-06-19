import { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useIsPartner } from "@/hooks/useIsPartner";
import { Loader2 } from "lucide-react";

interface RoleBasedRouteProps {
  memberComponent: ReactNode;
  partnerComponent: ReactNode;
}

const RoleBasedRoute = ({ memberComponent, partnerComponent }: RoleBasedRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const { data: isPartner, isLoading: partnerLoading } = useIsPartner();

  // Show loading while checking auth and roles
  if (authLoading || (user && partnerLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // If user is a partner, show partner landing
  if (user && isPartner) {
    return <>{partnerComponent}</>;
  }

  // Otherwise show the member/public component
  return <>{memberComponent}</>;
};

export default RoleBasedRoute;
