"use client";

import Link from "next/link";
import type { MouseEventHandler, ReactNode } from "react";

interface CommonProps {
  children: ReactNode;
}

interface LinkPillProps extends CommonProps {
  href: string;
  onClick?: never;
}

interface ButtonPillProps extends CommonProps {
  href?: never;
  onClick: MouseEventHandler<HTMLButtonElement>;
}

type WhatsNextPillProps = LinkPillProps | ButtonPillProps;

const PILL_CLASS =
  "type-ui inline-flex items-center rounded-full border border-clay-border bg-warm-white-2 px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-clay hover:bg-clay hover:text-warm-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay focus-visible:ring-offset-2 focus-visible:ring-offset-warm-white";

export function WhatsNextPill(props: WhatsNextPillProps) {
  if ("href" in props && props.href) {
    return (
      <Link href={props.href} className={PILL_CLASS}>
        {props.children}
      </Link>
    );
  }
  return (
    <button type="button" onClick={props.onClick} className={PILL_CLASS}>
      {props.children}
    </button>
  );
}
