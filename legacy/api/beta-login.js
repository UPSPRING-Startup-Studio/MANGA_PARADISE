export default function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { password } = req.body;
  const SECRET = process.env.BETA_PASSWORD;

  if (password === SECRET) {
    res.setHeader(
      "Set-Cookie",
      `manga_beta_auth=${SECRET}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=604800`
    );
    return res.status(200).json({ success: true });
  }

  return res.status(401).json({ success: false });
}