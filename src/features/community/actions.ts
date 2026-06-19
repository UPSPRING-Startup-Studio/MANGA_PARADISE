"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  addLike,
  deletePostRow,
  insertComment,
  insertPost,
  isPostLiked,
  removeLike,
} from "@/features/community/api/posts";
import { commentSchema } from "@/features/community/schemas";

const uuid = z.string().uuid();

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

export async function toggleLike(postId: string): Promise<void> {
  if (!uuid.safeParse(postId).success) return;
  const userId = await requireUserId();
  const supabase = await createClient();
  const liked = await isPostLiked(supabase, postId, userId);
  if (liked) await removeLike(supabase, postId, userId);
  else await addLike(supabase, postId, userId);
  revalidatePath("/communaute");
  revalidatePath(`/communaute/post/${postId}`);
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
