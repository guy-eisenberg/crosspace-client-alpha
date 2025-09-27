"use server";

import { createService } from "@/clients/server/service";
import type { SpaceDBMetadata } from "@/types";

export async function getSpace(id: string) {
  const service = createService();

  const { data: space, error } = await service
    .rpc("get_space", { _space_id: id })
    .select()
    .maybeSingle<SpaceDBMetadata>();

  if (error) throw new Error(error.message);

  return space;
}
