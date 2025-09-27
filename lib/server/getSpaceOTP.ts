"use server";

import { redis } from "@/clients/server/redis";
import { SPACE_OTP_LENGTH, SPACE_OTP_TTL } from "@/constants";
import { R } from "@/redis/keys";
import { hashOTP } from "../hashOTP";
import strDecrypt from "../strDecrypt";
import strEncrypt from "../strEncrypt";

export default async function getSpaceOTP(id: string) {
  const otpCypher = await redis.get<string>(R.space(id).otp);

  if (otpCypher) {
    const otp = strDecrypt(otpCypher, process.env.SPACE_OTP_SECRET as string);
    const ttl = await redis.ttl(R.space(id).otp);

    return { otp, ttl };
  }

  const otp = generateOTP();
  const cypher = strEncrypt(otp, process.env.SPACE_OTP_SECRET as string);
  const hash = await hashOTP(otp);

  await redis.setex(R.space(id).otp, SPACE_OTP_TTL, cypher);
  await redis.setex(R.otp(hash).space, SPACE_OTP_TTL, id);

  return { otp, ttl: 60 };
}

function generateOTP() {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let key = "";

  for (let i = 0; i < SPACE_OTP_LENGTH; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    key += characters[randomIndex];
  }

  return key;
}
