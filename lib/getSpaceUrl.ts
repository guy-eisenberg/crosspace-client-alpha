import type { SpaceMetadata } from "@/types";

export default function getSpaceUrl(space: SpaceMetadata) {
  if (typeof window === "undefined") return "";

  return window.location.origin + `/space/${space.id}#key=${space.key}`;
}
