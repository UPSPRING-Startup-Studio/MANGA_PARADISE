import Link from "next/link";
import { MapPin } from "lucide-react";
import type { Member } from "@/features/directory/api/members";

export function MemberCard({ member }: { member: Member }) {
  const name = member.displayName ?? member.username;
  return (
    <Link
      href={`/u/${member.username}`}
      className="border-border bg-card flex flex-col items-center gap-2 rounded-xl border p-4 text-center"
    >
      {member.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={member.avatarUrl}
          alt=""
          className="size-16 rounded-full object-cover"
        />
      ) : (
        <div className="bg-mp-primary/10 text-mp-primary grid size-16 place-items-center rounded-full text-xl font-bold">
          {name.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{name}</p>
        <p className="text-muted-foreground truncate text-xs">
          @{member.username}
        </p>
      </div>
      <div className="text-muted-foreground flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs">
        {member.level != null && (
          <span className="bg-mp-primary/10 text-mp-primary rounded-full px-2 py-0.5 font-semibold">
            Niv. {member.level}
          </span>
        )}
        {member.otakuClass && <span>{member.otakuClass}</span>}
        {member.city && (
          <span className="flex items-center gap-0.5">
            <MapPin className="size-3" /> {member.city}
          </span>
        )}
      </div>
    </Link>
  );
}
