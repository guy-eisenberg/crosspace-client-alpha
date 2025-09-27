"use server";

import { createService } from "@/clients/server/service";

export async function changeSpaceName(id: string, nameCypher: string) {
  const service = createService();

  await service.from("spaces").update({ name: nameCypher }).eq("id", id);
}
