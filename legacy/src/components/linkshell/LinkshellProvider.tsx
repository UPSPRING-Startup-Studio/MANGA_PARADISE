import { createContext, useContext, useState, ReactNode } from "react";
import { useLinkshellState, ChatRoom } from "@/hooks/useLinkshell";
import { LinkshellFAB } from "./LinkshellFAB";
import { LinkshellDrawer } from "./LinkshellDrawer";
import { useAuth } from "@/contexts/AuthContext";

interface LinkshellContextType {
  isOpen: boolean;
  openLinkshell: () => void;
  closeLinkshell: () => void;
  selectRoom: (room: ChatRoom) => void;
  suppressFAB: () => void;
  restoreFAB: () => void;
}

const LinkshellContext = createContext<LinkshellContextType | null>(null);

export const useLinkshellContext = () => {
  const context = useContext(LinkshellContext);
  if (!context) {
    throw new Error("useLinkshellContext must be used within LinkshellProvider");
  }
  return context;
};

interface LinkshellProviderProps {
  children: ReactNode;
}

export const LinkshellProvider = ({ children }: LinkshellProviderProps) => {
  const { user } = useAuth();
  const [fabSuppressed, setFabSuppressed] = useState(false);
  const {
    isOpen,
    selectedRoom,
    openLinkshell,
    closeLinkshell,
    selectRoom,
    backToList,
  } = useLinkshellState();

  // Only show for authenticated users
  if (!user) {
    return <>{children}</>;
  }

  return (
    <LinkshellContext.Provider
      value={{
        isOpen,
        openLinkshell,
        closeLinkshell,
        selectRoom,
        suppressFAB: () => setFabSuppressed(true),
        restoreFAB: () => setFabSuppressed(false),
      }}
    >
      {children}

      {!fabSuppressed && <LinkshellFAB onClick={openLinkshell} isOpen={isOpen} />}

      <LinkshellDrawer
        isOpen={isOpen}
        onClose={closeLinkshell}
        selectedRoom={selectedRoom}
        onSelectRoom={selectRoom}
        onBack={backToList}
      />
    </LinkshellContext.Provider>
  );
};
