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
  "type-ui inline-flex items-center rounded-full border border-[var(--color-border)] bg-warm-white px-3 py-1.5 text-sm text-ink-muted transition-colors hover:border-clay-border hover:text-clay";

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
