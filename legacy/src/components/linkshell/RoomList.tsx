import { useChatRooms, ChatRoom } from "@/hooks/useLinkshell";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Users, Calendar, MessageSquare } from "lucide-react";

interface RoomListProps {
  onSelectRoom: (room: ChatRoom) => void;
}

const getRoomTypeIcon = (type: ChatRoom['type']) => {
  switch (type) {
    case 'guild':
      return <span className="text-green-400">🛡️</span>;
    case 'event':
      return <span className="text-blue-400">📅</span>;
    case 'dm':
      return <span className="text-purple-400">💬</span>;
    default:
      return <MessageSquare className="h-4 w-4" />;
  }
};

const getRoomTypeColor = (type: ChatRoom['type']) => {
  switch (type) {
    case 'guild':
      return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'event':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'dm':
      return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    default:
      return 'bg-muted';
  }
};

export const RoomList = ({ onSelectRoom }: RoomListProps) => {
  const { data: rooms, isLoading } = useChatRooms();

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!rooms?.length) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
          <MessageSquare className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-lg mb-2">Aucune conversation</h3>
        <p className="text-sm text-muted-foreground">
          Rejoignez une guilde pour commencer à discuter !
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1">
      <div className="p-2">
        {rooms.map((room) => (
          <button
            key={room.id}
            onClick={() => onSelectRoom(room)}
            className={cn(
              "w-full flex items-center gap-3 p-3 rounded-lg",
              "transition-all duration-200",
              "hover:bg-muted/50",
              room.is_archived && "opacity-60"
            )}
          >
            {/* Avatar */}
            <div className="relative">
              <Avatar className="h-12 w-12 border-2 border-border">
                <AvatarImage src="" />
                <AvatarFallback className={cn(
                  "text-lg font-bold",
                  getRoomTypeColor(room.type)
                )}>
                  {room.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {/* Type indicator */}
              <span className="absolute -bottom-1 -right-1 text-sm">
                {getRoomTypeIcon(room.type)}
              </span>
            </div>

            {/* Content */}
            <div className="flex-1 text-left min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold truncate">{room.name}</span>
                {room.last_message && (
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(room.last_message.created_at), {
                      addSuffix: false,
                      locale: fr,
                    })}
                  </span>
                )}
              </div>
              
              <div className="flex items-center justify-between gap-2 mt-0.5">
                <p className="text-sm text-muted-foreground truncate">
                  {room.last_message?.message_type === 'system' 
                    ? room.last_message.content
                    : room.last_message?.content || "Aucun message"}
                </p>
                
                {/* Unread badge */}
                {(room.unread_count ?? 0) > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="min-w-[20px] h-5 px-1.5 text-xs font-bold"
                  >
                    {room.unread_count}
                  </Badge>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </ScrollArea>
  );
};
