import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY_PREFIX = "event_schedule_favorites_";

export const useScheduleFavorites = (eventId: string | undefined) => {
  const storageKey = eventId ? `${STORAGE_KEY_PREFIX}${eventId}` : null;

  const [favorites, setFavorites] = useState<string[]>(() => {
    if (!storageKey) return [];
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (!storageKey) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(favorites));
    } catch (error) {
      console.error("Error saving schedule favorites:", error);
    }
  }, [favorites, storageKey]);

  const toggleFavorite = useCallback((slotId: string) => {
    setFavorites((prev) => {
      if (prev.includes(slotId)) {
        return prev.filter((id) => id !== slotId);
      }
      return [...prev, slotId];
    });
  }, []);

  const removeFavorite = useCallback((slotId: string) => {
    setFavorites((prev) => prev.filter((id) => id !== slotId));
  }, []);

  const isFavorite = useCallback((slotId: string) => favorites.includes(slotId), [favorites]);

  return {
    favorites,
    toggleFavorite,
    removeFavorite,
    isFavorite,
  };
};

// Hook for managing meetup participation (local storage for now)
const MEETUP_STORAGE_KEY_PREFIX = "event_meetup_joined_";

export const useMeetupParticipation = (eventId: string | undefined) => {
  const storageKey = eventId ? `${MEETUP_STORAGE_KEY_PREFIX}${eventId}` : null;

  const [joinedMeetups, setJoinedMeetups] = useState<string[]>(() => {
    if (!storageKey) return [];
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (!storageKey) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(joinedMeetups));
    } catch (error) {
      console.error("Error saving meetup participation:", error);
    }
  }, [joinedMeetups, storageKey]);

  const joinMeetup = useCallback(async (meetupId: string) => {
    setJoinedMeetups((prev) => {
      if (prev.includes(meetupId)) return prev;
      return [...prev, meetupId];
    });
  }, []);

  const leaveMeetup = useCallback(async (meetupId: string) => {
    setJoinedMeetups((prev) => prev.filter((id) => id !== meetupId));
  }, []);

  const isJoined = useCallback((meetupId: string) => joinedMeetups.includes(meetupId), [joinedMeetups]);

  return {
    joinedMeetups,
    joinMeetup,
    leaveMeetup,
    isJoined,
  };
};
