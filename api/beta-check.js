export default function handler(req, res) {
  const cookie = req.headers.cookie || "";
  const isValid = cookie.includes(`manga_beta_auth=${process.env.BETA_PASSWORD}`);
  res.status(200).json({ authenticated: isValid });
}