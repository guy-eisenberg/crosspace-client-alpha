"use server";

import { ably } from "@/clients/server/ably";
import { redis } from "@/clients/server/redis";
import { SpaceEvents } from "@/constants";
import { R } from "@/redis/keys";
import { v4 as uuid } from "uuid";
import { hashOTP } from "../hashOTP";

export async function submitSpaceOTP(otp: string, ioId: string) {
  const hash = await hashOTP(otp);
  const spaceId = await redis.get<string>(R.otp(hash).space);

  if (!spaceId) return null;

  const requestId = uuid();

  const spaceChannel = ably.channels.get(`space#${spaceId}`);
  spaceChannel.publish(SpaceEvents.SpaceUrlReq, {
    requestId,
    peerIOId: ioId,
  });

  return requestId;
}
