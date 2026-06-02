import { useState, useRef, useEffect } from "react";
import { Shell, Check, X, Bell, Calendar, Heart, MessageCircle, Loader2, Camera, CheckCircle, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { 
  useNotifications, 
  useUnreadNotificationCount, 
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  Notification 
} from "@/hooks/useNotifications";
import { useAcceptFriendRequest, useRejectFriendRequest } from "@/hooks/useFriendships";
import { TagAcceptanceSheet } from "@/components/cosplay/photos/TagAcceptanceSheet";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Link } from "react-router-dom";

const getNotificationIcon = (type: Notification["type"]) => {
  switch (type) {
    case "FRIEND_REQUEST":
      return <Shell className="w-4 h-4 text-sakura" />;
    case "PHOTO_TAG":
      return <Camera className="w-4 h-4 text-pink-400" />;
    case "PHOTO_TAG_ACCEPTED":
      return <CheckCircle className="w-4 h-4 text-green-400" />;
    case "PHOTO_TAG_DECLINED":
      return <XCircle className="w-4 h-4 text-red-400" />;
    case "EVENT_REMINDER":
      return <Calendar className="w-4 h-4 text-turquoise" />;
    case "LIKE":
      return <Heart className="w-4 h-4 text-red-400" />;
    case "COMMENT":
      return <MessageCircle className="w-4 h-4 text-accent" />;
    default:
      return <Bell className="w-4 h-4 text-muted-foreground" />;
  }
};

const NotificationItem = ({
  notification,
  onMarkRead,
  onAcceptFriend,
  onRejectFriend,
  onViewTag,
  isProcessing
}: {
  notification: Notification;
  onMarkRead: (id: string) => void;
  onAcceptFriend?: (notificationId: string, friendshipId: string) => void;
  onRejectFriend?: (notificationId: string, friendshipId: string) => void;
  onViewTag?: (tagId: string) => void;
  isProcessing: boolean;
}) => {
  const senderName = notification.sender?.display_name || notification.sender?.username || "Quelqu'un";
  const timeAgo = formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: fr });

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={cn(
        "p-3 border-b border-border/30 hover:bg-muted/30 transition-colors",
        !notification.is_read && "bg-sakura/5"
      )}
    >
      <div className="flex gap-3">
        {/* Sender avatar or icon */}
        <div className="flex-shrink-0">
          {notification.sender?.avatar_url ? (
            <img 
              src={notification.sender.avatar_url} 
              alt={senderName}
              className="w-10 h-10 rounded-full object-cover border-2 border-sakura/30"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-hero flex items-center justify-center">
              {getNotificationIcon(notification.type)}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground">{notification.content}</p>
          <p className="text-xs text-muted-foreground mt-1">{timeAgo}</p>

          {/* Friend request actions */}
          {notification.type === "FRIEND_REQUEST" && !notification.is_read && notification.related_link && (
            <div className="flex gap-2 mt-2">
              <Button
                size="sm"
                variant="default"
                className="h-7 text-xs bg-sakura hover:bg-sakura/80"
                onClick={() => onAcceptFriend?.(notification.id, notification.related_link!)}
                disabled={isProcessing}
              >
                {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3 mr-1" />}
                Accepter
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs"
                onClick={() => onRejectFriend?.(notification.id, notification.related_link!)}
                disabled={isProcessing}
              >
                <X className="w-3 h-3 mr-1" />
                Refuser
              </Button>
            </div>
          )}

          {/* Photo tag actions — toujours visible, mark as read au clic */}
          {notification.type === "PHOTO_TAG" && notification.related_link && (
            <div className="mt-2">
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs bg-white/10 hover:bg-white/20 text-foreground"
                onClick={() => {
                  // Marquer comme lu immédiatement, avant même l'ouverture de la sheet
                  onMarkRead(notification.id);
                  // related_link = tag_id (UUID de cosplay_photo_tags)
                  onViewTag?.(notification.related_link!);
                }}
              >
                Voir et répondre →
              </Button>
            </div>
          )}

          {/* Related link (only for types where related_link is a real URL path) */}
          {notification.related_link &&
            notification.type !== "FRIEND_REQUEST" &&
            notification.type !== "PHOTO_TAG" &&
            notification.type !== "PHOTO_TAG_ACCEPTED" &&
            notification.type !== "PHOTO_TAG_DECLINED" && (
            <Link 
              to={notification.related_link}
              className="text-xs text-sakura hover:underline mt-1 inline-block"
              onClick={() => onMarkRead(notification.id)}
            >
              Voir plus →
            </Link>
          )}
        </div>

        {/* Unread indicator */}
        {!notification.is_read && (
          <div className="w-2 h-2 rounded-full bg-sakura flex-shrink-0 mt-2" />
        )}
      </div>
    </motion.div>
  );
};

const DenDenMushi = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: notifications = [], isLoading } = useNotifications(user?.id);
  const { data: unreadCount = 0 } = useUnreadNotificationCount(user?.id);
  const markAllReadMutation = useMarkAllNotificationsRead();
  const markReadMutation = useMarkNotificationRead();
  const acceptFriendMutation = useAcceptFriendRequest();
  const rejectFriendMutation = useRejectFriendRequest();
  const [activeTagSheet, setActiveTagSheet] = useState<string | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkRead = (notificationId: string) => {
    if (user) {
      markReadMutation.mutate({ notificationId, userId: user.id });
    }
  };

  const handleMarkAllRead = () => {
    if (user) {
      markAllReadMutation.mutate(user.id);
    }
  };

  const handleAcceptFriend = (notificationId: string, friendshipId: string) => {
    if (user) {
      acceptFriendMutation.mutate({ friendshipId, userId: user.id });
      handleMarkRead(notificationId);
    }
  };

  const handleRejectFriend = (notificationId: string, friendshipId: string) => {
    if (user) {
      rejectFriendMutation.mutate({ friendshipId, userId: user.id });
      handleMarkRead(notificationId);
    }
  };


  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Den Den Mushi Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative p-2 rounded-lg transition-all duration-200",
          "hover:bg-muted/30",
          isOpen && "bg-muted/30"
        )}
        aria-label="Notifications"
      >
        <motion.div
          animate={unreadCount > 0 ? { 
            rotate: [0, -10, 10, -10, 10, 0],
            transition: { duration: 0.5, repeat: Infinity, repeatDelay: 5 }
          } : {}}
        >
          <Shell className={cn(
            "w-6 h-6 transition-colors",
            unreadCount > 0 ? "text-sakura" : "text-foreground/70"
          )} />
        </motion.div>

        {/* Unread badge */}
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 
                       bg-red-500 text-white text-xs font-bold rounded-full 
                       flex items-center justify-center"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </motion.span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "absolute right-0 top-full mt-2 w-80 md:w-96",
              "bg-card border border-border rounded-xl shadow-xl",
              "overflow-hidden z-50"
            )}
          >
            {/* Header */}
            <div className="px-4 py-3 bg-gradient-hero border-b border-border/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shell className="w-5 h-5 text-sakura" />
                  <h3 className="font-display text-sm tracking-wide text-foreground">
                    Appels du Den Den Mushi
                  </h3>
                </div>
                {unreadCount > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {unreadCount} non lu{unreadCount > 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>

            {/* Notifications list */}
            <ScrollArea className="max-h-[400px]">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-sakura" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center px-4">
                  <Shell className="w-12 h-12 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Aucun appel pour le moment
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    Ton Den Den Mushi est au repos... 🐌
                  </p>
                </div>
              ) : (
                <AnimatePresence>
                  {notifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkRead={handleMarkRead}
                      onAcceptFriend={(nid, fid) => handleAcceptFriend(nid, fid)}
                      onRejectFriend={(nid, fid) => handleRejectFriend(nid, fid)}
                      onViewTag={(tagId) => setActiveTagSheet(tagId)}
                      isProcessing={acceptFriendMutation.isPending || rejectFriendMutation.isPending}
                    />
                  ))}
                </AnimatePresence>
              )}
            </ScrollArea>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-4 py-2 border-t border-border/30 bg-muted/20">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs text-muted-foreground hover:text-foreground"
                  onClick={handleMarkAllRead}
                  disabled={unreadCount === 0 || markAllReadMutation.isPending}
                >
                  {markAllReadMutation.isPending ? (
                    <Loader2 className="w-3 h-3 animate-spin mr-2" />
                  ) : (
                    <Check className="w-3 h-3 mr-2" />
                  )}
                  Tout marquer comme lu
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* TagAcceptanceSheet — monté hors dropdown pour couvrir toute la page.
          La key = tagId force un remount propre à chaque nouvelle notification. */}
      {activeTagSheet && (
        <TagAcceptanceSheet
          key={activeTagSheet}
          tagId={activeTagSheet}
          open={true}
          onOpenChange={(o) => { if (!o) setActiveTagSheet(null); }}
          onResponded={() => {
            setActiveTagSheet(null);
            setIsOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default DenDenMushi;
