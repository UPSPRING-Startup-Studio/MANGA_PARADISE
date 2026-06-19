import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'framer-motion';

interface EventTicketQRCodeProps {
  checkInToken: string;
  eventId: string;
  eventTitle: string;
  size?: number;
}

/**
 * EventTicketQRCode Component
 * Generates a scannable QR code for event check-in
 * QR code contains a URL pointing to the check-in validation page
 */
export const EventTicketQRCode = ({
  checkInToken,
  eventId,
  eventTitle,
  size = 200,
}: EventTicketQRCodeProps) => {
  // Generate the check-in URL
  const checkInUrl = `${window.location.origin}/check-in/${checkInToken}`;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center gap-3"
    >
      {/* QR Code Container with white background for scannability */}
      <div className="bg-white p-4 rounded-xl shadow-lg">
        <QRCodeSVG
          value={checkInUrl}
          size={size}
          level="H" // High error correction level for better scannability
          includeMargin={true}
        />
      </div>

      {/* Label */}
      <div className="text-center">
        <p className="text-xs text-white/60 font-medium">
          Scannez pour valider votre présence
        </p>
        <p className="text-xs text-white/40 mt-1">
          {eventTitle}
        </p>
      </div>

      {/* Debug info (hidden in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-white/30 font-mono mt-2 p-2 bg-mp-paper/50 rounded">
          Token: {checkInToken.slice(0, 8)}...
        </div>
      )}
    </motion.div>
  );
};

export default EventTicketQRCode;
