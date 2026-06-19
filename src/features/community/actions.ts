"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { uuid } from "@/lib/validation";
import {
  addLike,
  countPostLikes,
  deletePostRow,
  insertComment,
  insertPost,
  isPostLiked,
  removeLike,
} from "@/features/community/api/posts";
import { commentSchema } from "@/features/community/schemas";

async function requireUserId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return user.id;
}

export async function createPost(
  content: string,
  mediaUrl?: string,
): Promise<{ error: string } | void> {
  const text = content.trim();
  if (!text && !mediaUrl) return { error: "Ajoute un texte ou une image." };
  if (text.length > 2000) return { error: "Texte trop long." };

  const userId = await requireUserId();
  const supabase = await createClient();
  const { error } = await insertPost(supabase, {
    author_id: userId,
    content: text,
    media_url: mediaUrl ?? null,
    category: "general",
  });
  if (error) return { error: "Publication impossible, réessaie." };
  revalidatePath("/communaute");
}

export async function deletePost(postId: string): Promise<void> {
  if (!uuid.safeParse(postId).success) return;
  await requireUserId();
  const supabase = await createClient();
  await deletePostRow(supabase, postId);
  revalidatePath("/communaute");
}

export async function toggleLike(
  postId: string,
): Promise<{ liked: boolean; count: number } | { error: string }> {
  if (!uuid.safeParse(postId).success) return { error: "Post invalide" };
  const userId = await requireUserId();
  const supabase = await createClient();
  const liked = await isPostLiked(supabase, postId, userId);
  const { error } = liked
    ? await removeLike(supabase, postId, userId)
    : await addLike(supabase, postId, userId);
  if (error) return { error: "Action impossible, réessaie" };

  // Rafraîchit le feed / le détail. L'état du bouton est piloté côté client
  // par la valeur renvoyée (le useState survit au re-render).
  const count = await countPostLikes(supabase, postId);
  revalidatePath("/communaute");
  revalidatePath(`/communaute/post/${postId}`);
  return { liked: !liked, count };
}

export async function addComment(
  postId: string,
  content: string,
): Promise<{ error: string } | void> {
  if (!uuid.safeParse(postId).success) return { error: "Post invalide" };
  const parsed = commentSchema.safeParse({ content });
  if (!parsed.success) return { error: "Commentaire invalide" };

  const userId = await requireUserId();
  const supabase = await createClient();
  const { error } = await insertComment(
    supabase,
    postId,
    userId,
    parsed.data.content,
  );
  if (error) return { error: "Commentaire impossible, réessaie." };
  revalidatePath(`/communaute/post/${postId}`);
}
