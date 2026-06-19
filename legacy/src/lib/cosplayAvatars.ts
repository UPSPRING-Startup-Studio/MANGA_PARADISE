// Real cosplay avatars for realistic mock data
export const cosplayAvatars = [
  "https://res.cloudinary.com/dkw8snibz/image/upload/v1768044479/Capture_d_%C3%A9cran_2026-01-10_%C3%A0_12.27.53_lvsgmb.png",
  "https://res.cloudinary.com/dkw8snibz/image/upload/v1768044489/Capture_d_%C3%A9cran_2026-01-10_%C3%A0_12.28.06_c4x9tj.png",
  "https://res.cloudinary.com/dkw8snibz/image/upload/v1768044556/Capture_d_%C3%A9cran_2026-01-10_%C3%A0_12.29.13_fdbjcy.png",
  "https://res.cloudinary.com/dkw8snibz/image/upload/v1768044546/Capture_d_%C3%A9cran_2026-01-10_%C3%A0_12.29.03_bup3qv.png",
  "https://res.cloudinary.com/dkw8snibz/image/upload/v1768044522/Capture_d_%C3%A9cran_2026-01-10_%C3%A0_12.28.38_aclsfk.png",
  "https://res.cloudinary.com/dkw8snibz/image/upload/v1768044508/Capture_d_%C3%A9cran_2026-01-10_%C3%A0_12.28.25_zewu3q.png",
  "https://res.cloudinary.com/dkw8snibz/image/upload/v1768044618/Capture_d_%C3%A9cran_2026-01-10_%C3%A0_12.30.14_o1gvtf.png",
  "https://res.cloudinary.com/dkw8snibz/image/upload/v1768044594/Capture_d_%C3%A9cran_2026-01-10_%C3%A0_12.29.51_hlxinj.png",
  "https://res.cloudinary.com/dkw8snibz/image/upload/v1768044570/Capture_d_%C3%A9cran_2026-01-10_%C3%A0_12.29.26_rbptp3.png",
  "https://res.cloudinary.com/dkw8snibz/image/upload/v1768044690/Cosplay-Tanjiro-Lucas-P_eqtjer.jpg",
  "https://res.cloudinary.com/dkw8snibz/image/upload/v1768044754/Capture_d_%C3%A9cran_2026-01-10_%C3%A0_12.32.29_pc5acn.png",
  "https://res.cloudinary.com/dkw8snibz/image/upload/v1768044816/Capture_d_%C3%A9cran_2026-01-10_%C3%A0_12.33.29_del6by.png",
  "https://res.cloudinary.com/dkw8snibz/image/upload/v1768044962/Capture_d_%C3%A9cran_2026-01-10_%C3%A0_12.35.37_c8xqpu.png",
  "https://res.cloudinary.com/dkw8snibz/image/upload/v1768044940/Capture_d_%C3%A9cran_2026-01-10_%C3%A0_12.35.25_ts7q9x.png",
  "https://res.cloudinary.com/dkw8snibz/image/upload/v1768044927/Capture_d_%C3%A9cran_2026-01-10_%C3%A0_12.35.09_tkpunv.png",
  "https://res.cloudinary.com/dkw8snibz/image/upload/v1768044905/Capture_d_%C3%A9cran_2026-01-10_%C3%A0_12.34.35_yzqkt6.png",
  "https://res.cloudinary.com/dkw8snibz/image/upload/v1768044964/Capture_d_%C3%A9cran_2026-01-10_%C3%A0_12.35.58_eqr0e3.png",
  "https://res.cloudinary.com/dkw8snibz/image/upload/v1768045062/Capture_d_%C3%A9cran_2026-01-10_%C3%A0_12.37.18_ee7n7k.png",
  "https://res.cloudinary.com/dkw8snibz/image/upload/v1768045091/Capture_d_%C3%A9cran_2026-01-10_%C3%A0_12.37.53_uhot2v.png",
  "https://res.cloudinary.com/dkw8snibz/image/upload/v1768045071/Capture_d_%C3%A9cran_2026-01-10_%C3%A0_12.37.39_pfid8z.png"
];

// Helper function to get random avatars from the list
export function getRandomAvatars(count: number, startIndex?: number): string[] {
  const shuffled = [...cosplayAvatars];
  if (startIndex !== undefined) {
    // Use deterministic selection based on startIndex for consistency
    const result: string[] = [];
    for (let i = 0; i < count; i++) {
      result.push(shuffled[(startIndex + i) % shuffled.length]);
    }
    return result;
  }
  // Random shuffle
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}

// Generate participant objects with real avatars
export function generateParticipants(count: number, startIndex: number = 0): { id: string; name: string; avatarUrl: string }[] {
  const names = [
    "Yuki", "Sakura", "Hiro", "Mei", "Ren", "Aiko", "Kaito", "Hana", 
    "Sora", "Miku", "Akira", "Luna", "Kenji", "Nami", "Ryu", "Emi",
    "Taro", "Yui", "Kazu", "Momo"
  ];
  
  return Array.from({ length: count }, (_, i) => ({
    id: `participant-${startIndex + i}`,
    name: names[(startIndex + i) % names.length],
    avatarUrl: cosplayAvatars[(startIndex + i) % cosplayAvatars.length],
  }));
}
