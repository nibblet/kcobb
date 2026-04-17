"use client";

import { MediaGallery } from "@/components/beyond/MediaGallery";

/**
 * Client wrapper so the MediaGallery (which needs browser APIs) can be
 * embedded in the server-rendered person page.
 */
export function PersonMediaPanel({
  personId,
  canEdit,
}: {
  personId: string;
  canEdit: boolean;
}) {
  return (
    <MediaGallery ownerType="person" ownerId={personId} canEdit={canEdit} />
  );
}
