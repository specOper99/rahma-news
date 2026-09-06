type IconName =
  | "search"
  | "menu"
  | "close"
  | "lock"
  | "staff"
  | "verified"
  | "stream"
  | "arrow"
  | "link"
  | "print"
  | "share"
  | "plus"
  | "bolt"
  | "inbox"
  | "users"
  | "shield"
  | "image";

const paths: Record<IconName, string> = {
  search:
    "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Zm9 2-3.5-3.5",
  menu: "M4 7h16M4 12h16M4 17h16",
  close: "M6 6l12 12M18 6L6 18",
  lock: "M8 11V8a4 4 0 1 1 8 0v3M7 11h10v9H7z",
  staff: "M12 12a3.5 3.5 0 1 0-3.5-3.5A3.5 3.5 0 0 0 12 12Zm-7 8a7 7 0 0 1 14 0",
  verified:
    "M12 3 14.5 5.2 17.8 5l.8 3.2L21 10.5 19.4 13.4 21 16.5l-2.4 2.3-.8 3.2-3.3-.2L12 21l-2.5-2.2-3.3.2-.8-3.2L3 16.5l1.6-3.1L3 10.5l2.4-2.3.8-3.2 3.3.2L12 3Z",
  stream: "M4 7h11M4 12h16M4 17h8",
  arrow: "M5 12h14M13 6l6 6-6 6",
  link: "M10 13a5 5 0 0 0 7.07 0l1.41-1.41a5 5 0 0 0-7.07-7.07L10 5.93M14 11a5 5 0 0 0-7.07 0L5.5 12.41a5 5 0 0 0 7.07 7.07L14 18.07",
  print:
    "M7 8V4h10v4M7 17H5a2 2 0 0 1-2-2v-5h18v5a2 2 0 0 1-2 2h-2M7 13h10v7H7z",
  share:
    "M16 8a3 3 0 1 0-2.8-4M8 12a3 3 0 1 0 0-.1M16 20a3 3 0 1 0-2.2-1M13.2 9.2 9.8 11.2M13.3 16.7 9.8 13.5",
  plus: "M12 5v14M5 12h14",
  bolt: "M13 3 5 14h7l-1 7 8-11h-7l1-7z",
  inbox: "M4 6h16v12H4zM4 12h4l2 3h4l2-3h4",
  users:
    "M9 11a3 3 0 1 0-3-3 3 3 0 0 0 3 3Zm9 0a2.5 2.5 0 1 0-2.5-2.5A2.5 2.5 0 0 0 18 11ZM4 19a5 5 0 0 1 10 0M16 19a4 4 0 0 1 5 0",
  shield: "M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6z",
  image: "M4 6h16v12H4zM8 10.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM4 16l5-5 3 3 3-4 5 6",
};

export function Icon({
  name,
  size = 18,
  className,
}: {
  name: IconName;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}
