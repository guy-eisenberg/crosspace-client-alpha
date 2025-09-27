"use server";

import { createService } from "@/clients/server/service";
import type { SpaceDBMetadata } from "@/types";

export async function createSpace({ nameCypher }: { nameCypher: string }) {
  const service = createService();

  const { data: space, error } = await service
    .rpc("create_space", {
      _name: nameCypher,
    })
    .select()
    .single<SpaceDBMetadata>();

  if (error) throw new Error(error.message);

  return space;
}
