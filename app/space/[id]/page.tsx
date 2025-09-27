import { getAuth } from "@/lib/server/getAuth";
import { getSpace } from "@/lib/server/getSpace";
import { notFound } from "next/navigation";
import SpacePageClient from "./SpacePageClient";

export default async function SpacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const auth = await getAuth();

  const { id } = await params;

  const space = await getSpace(id);
  if (!space) notFound();

  return <SpacePageClient auth={auth} space={space} />;
}
