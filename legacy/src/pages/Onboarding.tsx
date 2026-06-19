import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { MembershipWizard } from "@/components/onboarding/MembershipWizard";

const Onboarding = () => {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Check if user is coming from signup (new member)
  const isNewMember = searchParams.get("new") === "true";

  useEffect(() => {
    // If not authenticated, redirect to auth
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }

    // If profile already completed onboarding and not forcing new, redirect
    if (!profileLoading && profile?.onboarding_completed && !isNewMember) {
      navigate("/espace-membre");
    }
  }, [user, authLoading, profile, profileLoading, navigate, isNewMember]);

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-[#292438] flex items-center justify-center">
        <div className="animate-pulse text-white/60">Chargement...</div>
      </div>
    );
  }

  return <MembershipWizard />;
};

export default Onboarding;
