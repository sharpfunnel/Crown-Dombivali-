"use client";

import type { AnchorHTMLAttributes } from "react";
import { recordWhatsappLead } from "@/lib/track/client/whatsappLead";

/**
 * Drop-in replacement for a plain WhatsApp `<a>` that also records the click
 * as a lead. Every project.whatsappHref link uses this, including from server
 * components that can't hold an onClick themselves.
 */
export function WhatsappLink({
  onClick,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a
      {...props}
      onClick={(e) => {
        recordWhatsappLead();
        onClick?.(e);
      }}
    />
  );
}
