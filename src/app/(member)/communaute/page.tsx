import type { Metadata } from "next";
import { getFeed } from "@/features/community/server";
import { PostComposer } from "@/features/community/components/post-composer";
import { PostCard } from "@/features/community/components/post-card";

export const metadata: Metadata = { title: "Communauté" };

export default async function CommunautePage() {
  const { posts, myId } = await getFeed();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <h1 className="text-4xl">Communauté</h1>
      {myId && <PostComposer userId={myId} />}

      {posts.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center text-sm">
          Aucune publication pour l&apos;instant. Sois le premier à poster !
        </p>
      ) : (
        posts.map((v) => <PostCard key={v.post.id} view={v} myId={myId} />)
      )}
    </div>
  );
}
