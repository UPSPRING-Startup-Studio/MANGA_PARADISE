import { createClient } from "@/lib/supabase/server";
import {
  getPostView,
  listComments,
  listFeed,
  type CommentView,
  type PostView,
} from "@/features/community/api/posts";

export async function getFeed(): Promise<{
  posts: PostView[];
  isAuthed: boolean;
  myId: string | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const posts = await listFeed(supabase, user?.id ?? null);
  return { posts, isAuthed: Boolean(user), myId: user?.id ?? null };
}

export async function getPostDetail(id: string): Promise<{
  view: PostView;
  comments: CommentView[];
  myId: string | null;
} | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const view = await getPostView(supabase, id, user?.id ?? null);
  if (!view) return null;
  const comments = await listComments(supabase, id);
  return { view, comments, myId: user?.id ?? null };
}
