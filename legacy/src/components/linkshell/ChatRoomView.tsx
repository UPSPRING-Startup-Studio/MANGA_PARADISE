import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Users, Send, Paperclip, MapPin, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  ChatRoom, 
  useChatMessages, 
  useSendMessage, 
  useMarkAsRead,
  useChatParticipants 
} from "@/hooks/useLinkshell";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, differenceInDays, isPast, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface ChatRoomViewProps {
  room: ChatRoom;
  onBack: () => void;
}

export const ChatRoomView = ({ room, onBack }: ChatRoomViewProps) => {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [showParticipants, setShowParticipants] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { data: messages, isLoading } = useChatMessages(room.id);
  const { data: participants } = useChatParticipants(room.id);
  const sendMessage = useSendMessage();
  const markAsRead = useMarkAsRead();

  // Check if room is archived or event is past
  const isArchived = room.is_archived;
  const isReadOnly = isArchived;

  // Mark as read on mount and when new messages arrive
  useEffect(() => {
    if (room.id) {
      markAsRead.mutate(room.id);
    }
  }, [room.id, messages?.length]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!message.trim() || isReadOnly) return;
    
    sendMessage.mutate({
      roomId: room.id,
      content: message.trim(),
    });
    setMessage("");
  };

  const handleSendLocation = () => {
    if (isReadOnly) return;
    
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          sendMessage.mutate({
            roomId: room.id,
            content: `📍 Position partagée`,
            messageType: "location",
            metadata: { latitude, longitude },
          });
          toast.success("Position envoyée !");
        },
        () => {
          toast.error("Impossible d'obtenir la position");
        }
      );
    } else {
      toast.error("Géolocalisation non supportée");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border/50 bg-gradient-to-r from-primary/10 to-accent/10">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        <div className="flex-1 min-w-0">
          <h2 className="font-bold truncate">{room.name}</h2>
          <p className="text-xs text-muted-foreground">
            {participants?.length || 0} participants
          </p>
        </div>
        
        <Dialog open={showParticipants} onOpenChange={setShowParticipants}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon">
              <Users className="h-5 w-5" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Participants ({participants?.length})</DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-80">
              <div className="space-y-2">
                {participants?.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={p.profile?.avatar_url || ""} />
                      <AvatarFallback>
                        {(p.profile?.display_name || p.profile?.username || "?").charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">
                      {p.profile?.display_name || p.profile?.username || "Anonyme"}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>

      {/* Messages */}
      <ScrollArea 
        className="flex-1 p-4" 
        ref={scrollRef as React.RefObject<HTMLDivElement>}
      >
        <AnimatePresence mode="popLayout">
          {messages?.map((msg, index) => {
            const isMe = msg.sender_id === user?.id;
            const isSystem = msg.message_type === "system";
            const showAvatar = !isMe && !isSystem && 
              (index === 0 || messages[index - 1]?.sender_id !== msg.sender_id);

            if (isSystem) {
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-center my-4"
                >
                  <span className="text-xs text-muted-foreground bg-muted/30 px-3 py-1 rounded-full">
                    {msg.content}
                  </span>
                </motion.div>
              );
            }

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={cn(
                  "flex gap-2 mb-3",
                  isMe ? "flex-row-reverse" : "flex-row"
                )}
              >
                {/* Avatar */}
                {!isMe && (
                  <div className="w-8 flex-shrink-0">
                    {showAvatar && (
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={msg.sender?.avatar_url || ""} />
                        <AvatarFallback className="text-xs">
                          {(msg.sender?.display_name || msg.sender?.username || "?").charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                )}

                {/* Message bubble */}
                <div
                  className={cn(
                    "max-w-[75%] rounded-2xl px-4 py-2 relative",
                    isMe
                      ? "bg-gradient-to-br from-primary to-accent text-primary-foreground rounded-br-md"
                      : "bg-muted/60 backdrop-blur-sm border border-border/30 rounded-bl-md"
                  )}
                >
                  {/* Sender name for others */}
                  {!isMe && showAvatar && (
                    <p className="text-xs font-semibold text-primary mb-1">
                      {msg.sender?.display_name || msg.sender?.username}
                    </p>
                  )}
                  
                  {/* Content */}
                  {msg.message_type === "location" ? (
                    <a
                      href={`https://maps.google.com/?q=${(msg.metadata as { latitude: number; longitude: number }).latitude},${(msg.metadata as { latitude: number; longitude: number }).longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 underline"
                    >
                      <MapPin className="h-4 w-4" />
                      Voir la position
                    </a>
                  ) : msg.message_type === "image" ? (
                    <img 
                      src={msg.content} 
                      alt="Image partagée" 
                      className="rounded-lg max-w-full"
                    />
                  ) : (
                    <p className="break-words whitespace-pre-wrap">{msg.content}</p>
                  )}
                  
                  {/* Timestamp */}
                  <p className={cn(
                    "text-[10px] mt-1",
                    isMe ? "text-primary-foreground/70" : "text-muted-foreground"
                  )}>
                    {formatDistanceToNow(new Date(msg.created_at), {
                      addSuffix: true,
                      locale: fr,
                    })}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </ScrollArea>

      {/* Input */}
      {isReadOnly ? (
        <div className="p-4 border-t border-border/50 bg-muted/30">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Archive className="h-4 w-4" />
            <span className="text-sm">Canal archivé - Lecture seule</span>
          </div>
        </div>
      ) : (
        <div className="p-4 border-t border-border/50 bg-background/80 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="flex-shrink-0"
              onClick={() => toast.info("Upload d'image bientôt disponible")}
            >
              <Paperclip className="h-5 w-5" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="flex-shrink-0"
              onClick={handleSendLocation}
            >
              <MapPin className="h-5 w-5" />
            </Button>
            
            <Input
              placeholder="Votre message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 bg-muted/50 border-border/50"
            />
            
            <Button 
              size="icon" 
              onClick={handleSend}
              disabled={!message.trim() || sendMessage.isPending}
              className="flex-shrink-0 bg-primary hover:bg-primary/90"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
