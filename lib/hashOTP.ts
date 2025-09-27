import crypto from "crypto";

export async function hashOTP(otp: string) {
  return crypto
    .createHmac("sha256", process.env.SPACE_OTP_SECRET as string)
    .update(otp)
    .digest("base64");
}
