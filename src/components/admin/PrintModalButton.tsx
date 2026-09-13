"use client";

import { useState } from "react";
import { IframeModal } from "./IframeModal";

export function PrintModalButton({
  url,
  label = "Imprimir",
  className,
}: {
  url: string;
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {label}
      </button>
      {open && <IframeModal url={url} title={label} onClose={() => setOpen(false)} />}
    </>
  );
}
