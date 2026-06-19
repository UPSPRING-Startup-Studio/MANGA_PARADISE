import Link from "next/link";
import type { Person } from "@/features/friends/api/friendships";

export function PersonRow({
  person,
  action,
}: {
  person: Person;
  action?: React.ReactNode;
}) {
  const name = person.displayName ?? person.username ?? "Otaku";
  const href = person.username ? `/u/${person.username}` : null;
  const avatar = person.avatarUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={person.avatarUrl}
      alt=""
      className="size-10 rounded-full object-cover"
    />
  ) : (
    <div className="bg-mp-primary/10 text-mp-primary grid size-10 place-items-center rounded-full text-sm font-bold">
      {name.charAt(0).toUpperCase()}
    </div>
  );

  return (
    <div className="flex items-center gap-3">
      {href ? (
        <Link href={href} className="shrink-0">
          {avatar}
        </Link>
      ) : (
        <div className="shrink-0">{avatar}</div>
      )}
      <div className="min-w-0 flex-1">
        {href ? (
          <Link
            href={href}
            className="block truncate text-sm font-semibold hover:underline"
          >
            {name}
          </Link>
        ) : (
          <span className="block truncate text-sm font-semibold">{name}</span>
        )}
        {person.username && (
          <span className="text-muted-foreground text-xs">
            @{person.username}
          </span>
        )}
      </div>
      {action}
    </div>
  );
}
