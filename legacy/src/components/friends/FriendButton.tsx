import { Button } from "@/components/ui/button";
import { 
  UserPlus, 
  Clock, 
  UserCheck, 
  Check,
  Loader2
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { 
  useSendFriendRequest, 
  useAcceptFriendRequest 
} from "@/hooks/useFriendships";
import { useFriendshipStatus } from "@/hooks/useFriendshipExtras";
import { cn } from "@/lib/utils";

interface FriendButtonProps {
  targetUserId: string;
  size?: "sm" | "default" | "lg" | "icon";
  variant?: "default" | "outline" | "ghost";
  showLabel?: boolean;
  className?: string;
}

const FriendButton = ({ 
  targetUserId, 
  size = "sm", 
  variant = "outline",
  showLabel = true,
  className 
}: FriendButtonProps) => {
  const { user } = useAuth();
  const { data: statusData, isLoading } = useFriendshipStatus(user?.id, targetUserId);
  
  const sendRequest = useSendFriendRequest();
  const acceptRequest = useAcceptFriendRequest();

  if (!user || user.id === targetUserId) return null;
  if (isLoading) {
    return (
      <Button size={size} variant={variant} disabled className={className}>
        <Loader2 className="w-4 h-4 animate-spin" />
      </Button>
    );
  }

  const status = statusData?.status || "none";
  const friendship = statusData?.friendship;

  const handleClick = async () => {
    if (status === "none") {
      await sendRequest.mutateAsync({
        requesterId: user.id,
        addresseeId: targetUserId,
      });
    } else if (status === "pending_received" && friendship) {
      await acceptRequest.mutateAsync({
        friendshipId: friendship.id,
        userId: user.id,
      });
    }
  };

  const isPending = sendRequest.isPending || acceptRequest.isPending;

  if (status === "friends") {
    return (
      <Button
        size={size}
        variant="ghost"
        disabled
        className={cn(
          "text-turquoise border-turquoise/30 bg-turquoise/10 cursor-default",
          className
        )}
      >
        <UserCheck className="w-4 h-4" />
        {showLabel && <span className="ml-1">Ami</span>}
      </Button>
    );
  }

  if (status === "pending_sent") {
    return (
      <Button
        size={size}
        variant="ghost"
        disabled
        className={cn(
          "text-muted-foreground bg-muted/50 cursor-default",
          className
        )}
      >
        <Clock className="w-4 h-4" />
        {showLabel && <span className="ml-1">En attente</span>}
      </Button>
    );
  }

  if (status === "pending_received") {
    return (
      <Button
        size={size}
        onClick={handleClick}
        disabled={isPending}
        className={cn(
          "bg-turquoise hover:bg-turquoise/90 text-tokyo-night",
          className
        )}
      >
        {isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            <Check className="w-4 h-4" />
            {showLabel && <span className="ml-1">Accepter</span>}
          </>
        )}
      </Button>
    );
  }

  // Status is "none"
  return (
    <Button
      size={size}
      variant={variant}
      onClick={handleClick}
      disabled={isPending}
      className={cn(
        "hover:bg-sakura/10 hover:text-sakura hover:border-sakura/50",
        className
      )}
    >
      {isPending ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <>
          <UserPlus className="w-4 h-4" />
          {showLabel && <span className="ml-1">Ajouter</span>}
        </>
      )}
    </Button>
  );
};

export default FriendButton;
