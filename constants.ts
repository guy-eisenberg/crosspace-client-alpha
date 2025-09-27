/*
 * Space default name:
 */
export const SPACE_DEFAULT_NAME = "My Space";

export const SPACE_OTP_LENGTH = 9;
export const SPACE_OTP_TTL = 60;

export const CHUNK_SIZE = 1024 * 64; // 64KB
export const MAX_BUFFER_SIZE = 1024 * 1024 * 64; // 64MB

export enum SpaceEvents {
  SpaceUrlReq = "SpaceUrlReq",
  SpaceUrlRes = "SpaceUrlRes",
  SpaceConnectAck = "SpaceConnectAck",
  SpaceRename = "SpaceRename",
  SpaceNewEntries = "SpaceNewEntries",
  SpaceEntriesReq = "SpaceEntriesReq",
  SpaceEntriesRes = "SpaceEntriesRes",
  SpaceEntriesDelete = "SpaceEntriesDelete",
  SpaceEntriesUpdate = "SpaceEntriesUpdate",
  SpacePathReplace = "SpacePathReplace",
}
