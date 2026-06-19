/**
 * API Route — POST /api/admin/invite-member
 *
 * Endpoint serveur sécurisé pour inviter un membre par email.
 * Utilise SUPABASE_SERVICE_ROLE_KEY pour appeler inviteUserByEmail.
 *
 * Déployé en tant que Vercel Serverless Function (compatible avec le projet Vite).
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || "";

// Client admin (service_role) — JAMAIS exposé côté client
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Client anon pour vérifier le JWT de l'appelant
const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

interface InviteBody {
  email: string;
  prenom?: string;
  nom?: string;
  associationId: string;
  associationRole?: string;
  noteInterne?: string;
}

export default async function handler(req: any, res: any) {
  // Méthode POST uniquement
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  // Vérifier la configuration
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({
      error: "Configuration serveur manquante. Contacte un administrateur.",
    });
  }

  // 1. Authentifier l'appelant via son JWT
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Non authentifié" });
  }

  const token = authHeader.replace("Bearer ", "");
  const {
    data: { user: caller },
    error: authError,
  } = await supabaseAnon.auth.getUser(token);

  if (authError || !caller) {
    return res.status(401).json({ error: "Session invalide" });
  }

  // 2. Vérifier les droits de l'appelant (admin plateforme ou leader asso)
  const { data: callerProfile } = await supabaseAdmin
    .from("profiles")
    .select("role, role_function")
    .eq("id", caller.id)
    .single();

  const isGlobalAdmin =
    callerProfile?.role === "admin" ||
    callerProfile?.role_function === "admin" ||
    callerProfile?.role === "bureau" ||
    callerProfile?.role === "superadmin" ||
    callerProfile?.role === "tresorier";

  // Parse body
  const body: InviteBody = req.body;
  const {
    email: rawEmail,
    prenom,
    nom,
    associationId,
    associationRole = "membre",
    noteInterne,
  } = body;

  if (!rawEmail || !associationId) {
    return res.status(400).json({ error: "Email et association requis" });
  }

  const email = rawEmail.toLowerCase().trim();

  // Validation email basique
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Adresse email invalide" });
  }

  // Vérifier que l'appelant est leader de cette association (si pas admin global)
  if (!isGlobalAdmin) {
    const { data: callerMembership } = await supabaseAdmin
      .from("association_memberships")
      .select("role")
      .eq("association_id", associationId)
      .eq("user_id", caller.id)
      .eq("is_active", true)
      .in("role", ["president", "vice_president", "secretaire", "tresorier"])
      .limit(1)
      .maybeSingle();

    if (!callerMembership) {
      return res.status(403).json({
        error: "Tu n'as pas les droits pour inviter dans cette association.",
      });
    }
  }

  // 3. Vérifier si une invitation pending existe déjà
  const { data: existingInvite } = await supabaseAdmin
    .from("association_invitations")
    .select("id")
    .eq("association_id", associationId)
    .eq("status", "pending")
    .or(`email.eq.${email},invited_email.eq.${email}`)
    .limit(1)
    .maybeSingle();

  if (existingInvite) {
    return res.status(409).json({
      error: "Une invitation est déjà en attente pour cet email.",
    });
  }

  // 4. Chercher si un profil/user existe déjà
  const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
  const existingUser = (existingUsers?.users as any[])?.find(
    (u: any) => u.email?.toLowerCase() === email
  );

  let existingProfileId: string | null = null;
  if (existingUser) {
    existingProfileId = existingUser.id;

    // Vérifier s'il est déjà membre actif
    const { data: existingMember } = await supabaseAdmin
      .from("association_memberships")
      .select("id")
      .eq("association_id", associationId)
      .eq("user_id", existingUser.id)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    if (existingMember) {
      return res.status(409).json({
        error: "Cette personne est déjà membre actif de l'association.",
      });
    }
  }

  // 5. Créer l'invitation locale en base
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  const { data: invitation, error: insertError } = await supabaseAdmin
    .from("association_invitations")
    .insert({
      association_id: associationId,
      invited_by: caller.id,
      user_id: existingProfileId,
      invited_user_id: existingProfileId,
      email,
      invited_email: email,
      prenom: prenom || null,
      nom: nom || null,
      role: associationRole,
      status: "pending",
      message: noteInterne || null,
      expires_at: expiresAt.toISOString(),
    })
    .select("id")
    .single();

  if (insertError) {
    console.error("Insert invitation error:", insertError);
    return res.status(500).json({
      error: "Erreur lors de la création de l'invitation.",
    });
  }

  // 6. Envoyer l'invitation Supabase Auth
  const redirectTo = `${req.headers.origin || "https://manga-paradise.fr"}/auth/activate`;

  const { data: authInvite, error: authInviteError } =
    await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: {
        prenom,
        nom,
        association_role: associationRole,
        association_id: associationId,
        invitation_id: invitation.id,
        source: "association_invitation",
      },
      redirectTo,
    });

  if (authInviteError) {
    // L'invitation locale est créée, mais l'email n'a pas pu être envoyé.
    // Ce n'est pas bloquant si l'utilisateur existe déjà (il est déjà inscrit).
    if (existingProfileId) {
      // Utilisateur existant — pas besoin d'email d'activation
      return res.status(200).json({
        success: true,
        invitationId: invitation.id,
        existingProfile: true,
        message: `Invitation créée pour ${email}. Cet utilisateur a déjà un compte et pourra l'accepter depuis son espace.`,
      });
    }

    console.error("Auth invite error:", authInviteError);
    // Marquer l'invitation en base comme envoyée partiellement
    await supabaseAdmin
      .from("association_invitations")
      .update({ sent_at: new Date().toISOString() })
      .eq("id", invitation.id);

    return res.status(200).json({
      success: true,
      invitationId: invitation.id,
      existingProfile: false,
      warning: "L'invitation a été créée mais l'envoi d'email a échoué. L'invité peut créer son compte manuellement.",
      message: `Invitation enregistrée pour ${email}.`,
    });
  }

  // 7. Mettre à jour l'invitation avec sent_at
  await supabaseAdmin
    .from("association_invitations")
    .update({ sent_at: new Date().toISOString() })
    .eq("id", invitation.id);

  return res.status(200).json({
    success: true,
    invitationId: invitation.id,
    existingProfile: !!existingProfileId,
    message: existingProfileId
      ? `Invitation envoyée à ${email}. Ce membre pourra l'accepter depuis son espace.`
      : `Email d'invitation envoyé à ${email}. La personne recevra un lien pour créer son compte.`,
  });
}
