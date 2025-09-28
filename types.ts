export interface SpaceDBMetadata {
  id: string;
  created_at: string;
  name: string;
}

export interface SpaceMetadata {
  id: string;
  key: string;
  created_at: number;
  name: string;
}

export interface SpaceMemberMetadata {
  ioId: string;
  connectedAt: string;
  userId: string;
  agent: string;
}

export interface SpaceKeysIndexedMetadata {
  id: string; // Primary key
  key: string;
}

export interface FileIndexedMetadata {
  spaceId: string;
  id: string;
  path: string;
  createdAt: number;
  usedAt: number;
  updatedAt: number;
  name: string;
  size: number;
  mime: string;
  thumbnail?: string;
  saveDone: boolean;
}

export type FileEntryMetadata = {
  type: "file";
  peerIOId: string;
} & FileIndexedMetadata;

export type DirEntryMetadata = {
  type: "dir";
  children: FileEntryMetadata[];
} & Omit<FileIndexedMetadata, "saveDone">;

export interface FileChunkIndexedMetadata {
  spaceId: string; // Primary key
  id: string; // Primary key
  index: number; // Primary key
  chunk: ArrayBuffer;
}

export interface TransferMetadata {
  id: string;
  name: string;
  basePath: string;
  peersIOIds: string[];
  list: {
    [id: string]: {
      id: string;
      entry: FileEntryMetadata;
      bytesTransferred: number;
      existingIndexes: number[];
    };
  };
  running: boolean;
}

export type ChatMessageMetadata = {
  id: string;
  from: string; // User id
  timestamp: number;
  contents: string;
};
