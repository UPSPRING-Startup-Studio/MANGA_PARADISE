import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export type PostRow = Database["public"]["Tables"]["posts"]["Row"];
export type CommentRow = Database["public"]["Tables"]["post_comments"]["Row"];

export type Author = {
  id: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
};

export const POST_IMAGE_BUCKET = "showcase-photos";

async function fetchAuthors(
  supabase: SupabaseClient<Database>,
  ids: string[],
): Promise<Map<string, Author>> {
  const map = new Map<string, Author>();
  if (ids.length === 0) return map;
  const { data } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .in("id", ids);
  for (const p of data ?? []) {
    map.set(p.id, {
      id: p.id,
      username: p.username,
      displayName: p.display_name,
      avatarUrl: p.avatar_url,
    });
  }
  return map;
}

export type PostView = {
  post: PostRow;
  author: Author | null;
  likesCount: number;
  commentsCount: number;
  likedByMe: boolean;
};

export async function listFeed(
  supabase: SupabaseClient<Database>,
  myId: string | null,
  limit = 30,
): Promise<PostView[]> {
  const { data: posts } = await supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (!posts || posts.length === 0) return [];

  const ids = posts.map((p) => p.id);
  const [authors, likes, comments] = await Promise.all([
    fetchAuthors(supabase, [...new Set(posts.map((p) => p.author_id))]),
    supabase.from("post_likes").select("post_id, user_id").in("post_id", ids),
    supabase.from("post_comments").select("post_id").in("post_id", ids),
  ]);

  const likeByPost = new Map<string, { count: number; mine: boolean }>();
  for (const l of likes.data ?? []) {
    const cur = likeByPost.get(l.post_id) ?? { count: 0, mine: false };
    cur.count += 1;
    if (myId && l.user_id === myId) cur.mine = true;
    likeByPost.set(l.post_id, cur);
  }
  const commentByPost = new Map<string, number>();
  for (const c of comments.data ?? [])
    commentByPost.set(c.post_id, (commentByPost.get(c.post_id) ?? 0) + 1);

  return posts.map((post) => {
    const lk = likeByPost.get(post.id);
    return {
      post,
      author: authors.get(post.author_id) ?? null,
      likesCount: lk?.count ?? 0,
      commentsCount: commentByPost.get(post.id) ?? 0,
      likedByMe: lk?.mine ?? false,
    };
  });
}

export async function getPostView(
  supabase: SupabaseClient<Database>,
  postId: string,
  myId: string | null,
): Promise<PostView | null> {
  const { data: post } = await supabase
    .from("posts")
    .select("*")
    .eq("id", postId)
    .maybeSingle();
  if (!post) return null;

  const [authors, likes, comments] = await Promise.all([
    fetchAuthors(supabase, [post.author_id]),
    supabase.from("post_likes").select("user_id").eq("post_id", postId),
    supabase
      .from("post_comments")
      .select("id", { count: "exact", head: true })
      .eq("post_id", postId),
  ]);

  const likeRows = likes.data ?? [];
  return {
    post,
    author: authors.get(post.author_id) ?? null,
    likesCount: likeRows.length,
    commentsCount: comments.count ?? 0,
    likedByMe: myId ? likeRows.some((l) => l.user_id === myId) : false,
  };
}

export type CommentView = { comment: CommentRow; author: Author | null };

export async function listComments(
  supabase: SupabaseClient<Database>,
  postId: string,
): Promise<CommentView[]> {
  const { data } = await supabase
    .from("post_comments")
    .select("*")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });
  if (!data || data.length === 0) return [];
  const authors = await fetchAuthors(supabase, [
    ...new Set(data.map((c) => c.author_id)),
  ]);
  return data.map((comment) => ({
    comment,
    author: authors.get(comment.author_id) ?? null,
  }));
}

export function insertPost(
  supabase: SupabaseClient<Database>,
  row: {
    author_id: string;
    content: string;
    media_url: string | null;
    category: string;
  },
) {
  return supabase.from("posts").insert(row);
}

export function deletePostRow(
  supabase: SupabaseClient<Database>,
  postId: string,
) {
  return supabase.from("posts").delete().eq("id", postId);
}

export function insertComment(
  supabase: SupabaseClient<Database>,
  postId: string,
  authorId: string,
  content: string,
) {
  return supabase
    .from("post_comments")
    .insert({ post_id: postId, author_id: authorId, content });
}

export async function isPostLiked(
  supabase: SupabaseClient<Database>,
  postId: string,
  userId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("post_likes")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .maybeSingle();
  return Boolean(data);
}

export async function countPostLikes(
  supabase: SupabaseClient<Database>,
  postId: string,
): Promise<number> {
  const { count } = await supabase
    .from("post_likes")
    .select("*", { count: "exact", head: true })
    .eq("post_id", postId);
  return count ?? 0;
}

export function addLike(
  supabase: SupabaseClient<Database>,
  postId: string,
  userId: string,
) {
  return supabase
    .from("post_likes")
    .insert({ post_id: postId, user_id: userId });
}

export function removeLike(
  supabase: SupabaseClient<Database>,
  postId: string,
  userId: string,
) {
  return supabase
    .from("post_likes")
    .delete()
    .eq("post_id", postId)
    .eq("user_id", userId);
}
