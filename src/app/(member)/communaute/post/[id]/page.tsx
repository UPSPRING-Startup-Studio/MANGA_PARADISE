import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPostDetail } from "@/features/community/server";
import { PostCard } from "@/features/community/components/post-card";
import { CommentForm } from "@/features/community/components/comment-form";
import { relativeTime } from "@/features/community/lib";

export const metadata: Metadata = { title: "Publication" };

type Params = { params: Promise<{ id: string }> };

export default async function PostDetailPage({ params }: Params) {
  const { id } = await params;
  const data = await getPostDetail(id);
  if (!data) notFound();
  const { view, comments, myId } = data;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <PostCard view={view} myId={myId} />

      <section className="flex flex-col gap-4">
        <h2 className="text-xl">Commentaires ({comments.length})</h2>
        {myId && <CommentForm postId={id} />}

        <ul className="flex flex-col gap-4">
          {comments.map(({ comment, author }) => {
            const name = author?.displayName ?? author?.username ?? "Otaku";
            return (
              <li key={comment.id} className="flex gap-3">
                {author?.username ? (
                  <Link href={`/u/${author.username}`} className="shrink-0">
                    <AvatarMini name={name} src={author.avatarUrl} />
                  </Link>
                ) : (
                  <AvatarMini name={name} src={author?.avatarUrl} />
                )}
                <div className="bg-muted/50 flex flex-1 flex-col gap-0.5 rounded-xl px-3 py-2">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-semibold">{name}</span>
                    <span className="text-muted-foreground text-xs">
                      {relativeTime(comment.created_at)}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-line">
                    {comment.content}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function AvatarMini({
  name,
  src,
}: {
  name: string;
  src: string | null | undefined;
}) {
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" className="size-9 rounded-full object-cover" />
  ) : (
    <div className="bg-mp-primary/10 text-mp-primary grid size-9 place-items-center rounded-full text-xs font-bold">
      {name.charAt(0).toUpperCase()}
    </div>
  );
}
