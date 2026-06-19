import Link from "next/link";
import { MessageCircle } from "lucide-react";
import type { PostView } from "@/features/community/api/posts";
import { relativeTime } from "@/features/community/lib";
import { LikeButton } from "@/features/community/components/like-button";
import { DeletePostButton } from "@/features/community/components/delete-post-button";

export function PostCard({
  view,
  myId,
}: {
  view: PostView;
  myId: string | null;
}) {
  const { post, author, likesCount, commentsCount, likedByMe } = view;
  const name = author?.displayName ?? author?.username ?? "Otaku";
  const isMine = myId != null && post.author_id === myId;
  const profileHref = author?.username ? `/u/${author.username}` : null;

  return (
    <article className="border-border bg-card flex flex-col gap-3 rounded-xl border p-4">
      <div className="flex items-center gap-3">
        <Avatar name={name} src={author?.avatarUrl} href={profileHref} />
        <div className="flex min-w-0 flex-col">
          {profileHref ? (
            <Link
              href={profileHref}
              className="truncate text-sm font-semibold hover:underline"
            >
              {name}
            </Link>
          ) : (
            <span className="truncate text-sm font-semibold">{name}</span>
          )}
          <span className="text-muted-foreground text-xs">
            {relativeTime(post.created_at)}
          </span>
        </div>
        {isMine && (
          <div className="ml-auto">
            <DeletePostButton postId={post.id} />
          </div>
        )}
      </div>

      {post.content && (
        <p className="text-sm whitespace-pre-line">{post.content}</p>
      )}
      {post.media_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.media_url}
          alt=""
          className="max-h-[28rem] w-full rounded-xl object-cover"
        />
      )}

      <div className="flex items-center gap-5 pt-1">
        <LikeButton postId={post.id} liked={likedByMe} count={likesCount} />
        <Link
          href={`/communaute/post/${post.id}`}
          className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-sm"
        >
          <MessageCircle className="size-4" /> {commentsCount}
        </Link>
      </div>
    </article>
  );
}

function Avatar({
  name,
  src,
  href,
}: {
  name: string;
  src: string | null | undefined;
  href: string | null;
}) {
  const inner = src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" className="size-10 rounded-full object-cover" />
  ) : (
    <div className="bg-mp-primary/10 text-mp-primary grid size-10 place-items-center rounded-full text-sm font-bold">
      {name.charAt(0).toUpperCase()}
    </div>
  );
  return href ? (
    <Link href={href} className="shrink-0">
      {inner}
    </Link>
  ) : (
    <div className="shrink-0">{inner}</div>
  );
}
