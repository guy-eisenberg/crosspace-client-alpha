"use client";

import { io } from "@/clients/client/ably";
import { indexed } from "@/clients/client/indexed";
import SeaCatIcon from "@/components/assets/SeaCatIcon";
import AutoWidthInput from "@/components/AutoWidthInput";
import FileExplorer from "@/components/FileExplorer/FileExplorer";
import ShareSpaceDialog from "@/components/ShareSpaceDialog";
import TransfersDialog from "@/components/TransfersDialog/TransfersDialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import {
  Status,
  StatusIndicator,
  StatusLabel,
} from "@/components/ui/shadcn-io/status";
import { SpaceEvents } from "@/constants";
import { useRTC } from "@/context/RTCContext/RTCContext";
import { useTransfers } from "@/context/TransfersContext/TransfersContext";
import { dateLabel } from "@/lib/dateLabel";
import { FileUtils } from "@/lib/FileUtils";
import { generateFileThumbnail } from "@/lib/generateFileThumbnail";
import getSpaceUrl from "@/lib/getSpaceUrl";
import { changeSpaceName } from "@/lib/server/updateSpaceName";
import strDecrypt from "@/lib/strDecrypt";
import strEncrypt from "@/lib/strEncrypt";
import { cn } from "@/lib/utils";
import type {
  DirEntryMetadata,
  FileEntryMetadata,
  FileIndexedMetadata,
  SpaceDBMetadata,
  SpaceMemberMetadata,
  SpaceMetadata,
} from "@/types";
import { type User } from "@supabase/supabase-js";
import { type UpdateSpec } from "dexie";
import {
  CloudDownloadIcon,
  DownloadIcon,
  MessageCircleMoreIcon,
  PencilIcon,
  PlusIcon,
  Share2Icon,
  SquarePenIcon,
  TrashIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import { v4 as uuid } from "uuid";

export default function SpacePageClient({
  auth,
  space: _space,
}: {
  auth: User;
  space: SpaceDBMetadata;
}) {
  const router = useRouter();
  const [path, setPath] = useState("/");

  const { connect, disconnect, send, onRTCEvent } = useRTC();
  const {
    incomingTransfers,
    startTransfer,
    pauseTransfer,
    resumeTransfer,
    deleteTransfer,
  } = useTransfers();
  const incomingTransferesArr = Object.values(incomingTransfers);
  const incomingTransfersCount = incomingTransferesArr.length;

  const { getRootProps, getInputProps, open, isDragActive } = useDropzone({
    noClick: true,
    onDrop: async (files) => {
      const newEntries: { [id: string]: FileEntryMetadata } = {};

      for (const file of files) {
        const entryId = uuid();

        let { path: filePath } = file as any as { path: string };
        if (filePath.startsWith(".")) filePath = filePath.slice(1);
        const pathParts = filePath.slice(1).split("/");
        const finalPath = pathParts.slice(0, -1).join("/") + "/";

        const now = new Date().getTime();

        newEntries[entryId] = {
          spaceId: _space.id,
          id: entryId,
          path: path + finalPath,
          createdAt: now,
          usedAt: now,
          updatedAt: now,
          name: file.name,
          size: file.size,
          mime: file.type,
          saveDone: false,
          type: "file",
          peerIOId: io.connection.id as string,
        };

        generateFileThumbnail(file).then(async (thumbnail) => {
          if (thumbnail) {
            const now = new Date().getTime();

            newEntries[entryId].updatedAt = now;
            newEntries[entryId].thumbnail = thumbnail;

            await FileUtils.updateFiles([
              {
                spaceId: _space.id,
                fileId: entryId,
                changes: {
                  thumbnail,
                  updatedAt: now,
                },
              },
            ]);

            await emitToMembers(SpaceEvents.SpaceNewEntries, {
              path,
            });

            setEntries((entries) => {
              if (!entries[entryId]) return entries;

              const updated = { ...entries };

              updated[entryId].updatedAt = now;
              updated[entryId].thumbnail = thumbnail;

              return updated;
            });
          }
        });

        FileUtils.saveFileChunks(_space.id, entryId, file).then(async () => {
          const now = new Date().getTime();

          newEntries[entryId].updatedAt = now;

          await emitToMembers(SpaceEvents.SpaceNewEntries, {
            path,
          });

          setEntries((entries) => {
            if (!entries[entryId]) return entries;

            const updated = { ...entries };

            updated[entryId].updatedAt = now;
            updated[entryId].saveDone = true;

            return updated;
          });
        });
      }

      await FileUtils.putFiles(Object.values(newEntries));

      await emitToMembers(SpaceEvents.SpaceNewEntries, {
        path,
      });

      const newPathEntries = await getPathEntries(path);
      setEntries((entries) => ({ ...entries, ...newPathEntries }));
    },
  });

  const [space, setSpace] = useState<SpaceMetadata | null>(null);
  const [spaceName, setSpaceName] = useState("");
  const [spaceNameUpdateLoading, setSpaceNameUpdateLoading] = useState(false);

  const [entries, setEntries] = useState<{
    [id: string]: FileEntryMetadata;
  }>({});

  const entriesWithDirs = useMemo(() => {
    const combinedEntries: (FileEntryMetadata | DirEntryMetadata)[] = [];
    const dirs: { [name: string]: DirEntryMetadata } = {};

    for (const entry of Object.values(entries).filter((e) =>
      e.path.startsWith(path),
    )) {
      const nextDir = entry.path
        .slice(path.length)
        .split("/")
        .filter(Boolean)[0];

      if (!nextDir) {
        combinedEntries.push(entry);
        continue;
      } else {
        if (!dirs[nextDir]) {
          const now = new Date().getTime();

          dirs[nextDir] = {
            spaceId: _space.id,
            id: uuid(),
            createdAt: now,
            updatedAt: now,
            usedAt: now,
            path,
            name: nextDir,
            size: entry.size,
            mime: "application/directory",
            type: "dir",
            children: [entry],
          };
        } else {
          dirs[nextDir].children.push(entry);
          dirs[nextDir].createdAt = Math.min(
            dirs[nextDir].createdAt,
            entry.createdAt,
          );

          dirs[nextDir].size = dirs[nextDir].size + entry.size;
        }
      }
    }

    for (const dir of Object.values(dirs)) combinedEntries.push(dir);

    return combinedEntries.reduce(
      (obj, entry) => ({ ...obj, [entry.id]: entry }),
      {} as { [id: string]: FileEntryMetadata | DirEntryMetadata },
    );
  }, [_space.id, entries, path]);
  const entriesWithDirsArr = Object.values(entriesWithDirs);

  const [selectedEntriesIds, setSelectedEntriesIds] = useState<{
    [id: string]: true;
  }>({});
  const selectedEntriesArr = Object.values(selectedEntriesIds);

  const [members, setMembers] = useState<{
    [peerIOId: string]: {
      peerIOId: string;
      member: SpaceMemberMetadata;
      connected: boolean;
    };
  }>({});
  const connectedMembers = Object.values(members).filter((m) => m.connected);
  const connectingMembers = Object.values(members).filter(
    (m) => m.connected === false,
  );

  const membersCount = Object.values(members).length;
  const connectedMembersCount = connectedMembers.length;
  const connectingMembersCount = connectingMembers.length;

  const [shareSpaceDialogOpen, setShareSpaceDialogOpen] = useState(false);
  const [transfersDialogOpen, setTransfersDialogOpen] = useState(false);

  const sendToMember = useCallback(
    async (
      peerIOId: string,
      { event, data }: { event: SpaceEvents; data: any },
    ) => {
      await send(peerIOId, { event, data: { ...data, spaceId: _space.id } });
    },
    [_space.id, send],
  );

  const emitToMembers = useCallback(
    async (event: SpaceEvents, data: any) => {
      const promises: Promise<void>[] = [];

      for (const peerIOId of Object.keys(members)) {
        const promise = sendToMember(peerIOId, { event, data });

        promises.push(promise);
      }

      await Promise.all(promises);
    },
    [sendToMember, members],
  );

  const getPathEntries = useCallback(
    async (path: string) => {
      const pathFilesArr = await indexed.spaces_files
        .where("[spaceId+path]")
        .between([_space.id, path], [_space.id, path + "\uffff"])
        .toArray();

      return pathFilesArr.reduce(
        (obj, file) => ({
          ...obj,
          [file.id]: {
            ...file,
            type: "file",
            peerIOId: io.connection.id,
          } as FileEntryMetadata,
        }),
        {} as { [id: string]: FileEntryMetadata },
      );
    },
    [_space.id],
  );

  const deleteEntries = useCallback(
    async (entryIds: string[]) => {
      FileUtils.deleteFiles(_space.id, entryIds);

      setEntries((entries) => {
        const updated = { ...entries };

        for (const entryId of entryIds) delete updated[entryId];

        return updated;
      });
    },
    [_space.id],
  );

  const updateEntries = useCallback(
    async (
      updates: {
        spaceId: string;
        entryId: string;
        changes: UpdateSpec<FileIndexedMetadata>;
      }[],
    ) => {
      await FileUtils.updateFiles(
        updates.map((update) => ({
          spaceId: update.spaceId,
          fileId: update.entryId,
          changes: update.changes,
        })),
      );

      setEntries((entries) => {
        const updated = { ...entries };

        for (const update of updates) {
          if (!updated[update.entryId]) continue;

          updated[update.entryId] = {
            ...entries[update.entryId],
            ...(update.changes as any),
          };
        }

        return updated;
      });
    },
    [],
  );

  useEffect(() => {
    requestPersistentStorage();

    async function requestPersistentStorage() {
      if ("storage" in navigator) {
        const isPersisted = await navigator.storage.persisted();

        if (!isPersisted) await navigator.storage.persist();
      }
    }
  }, []);

  useEffect(() => {
    loadSpace();

    async function loadSpace() {
      await loadKeyFragment();
      await decryptSpace();
    }

    async function loadKeyFragment() {
      const { hash } = window.location;

      if (hash && hash.startsWith("#key=")) {
        const key = hash.replace("#key=", "");

        try {
          await indexed.spaces_keys.add({ id: _space.id, key });
        } catch {}

        const { pathname, search } = window.location;
        const cleanUrl = pathname + search;
        window.history.replaceState(null, "", cleanUrl);
      }
    }

    async function decryptSpace() {
      const keyEntry = await indexed.spaces_keys.get(_space.id);
      if (!keyEntry) {
        console.log(`Missing keys for space "${_space.id}".`);

        return router.replace(`/not-found`);
      }

      const name = strDecrypt(_space.name, keyEntry.key);

      setSpace({
        id: _space.id,
        key: keyEntry.key,
        created_at: new Date(_space.created_at).getTime(),
        name,
      });
      setSpaceName(name);
    }
  }, [router, _space]);

  useEffect(() => {
    const spaceChannel = io.channels.get(`space#${_space.id}`);

    initPresence();

    async function initPresence() {
      const thisMember: SpaceMemberMetadata = {
        ioId: io.connection.id!,
        userId: auth.id,
        agent: navigator.userAgent,
      };

      const existingMembers = await spaceChannel.presence.get();
      for (const member of existingMembers) {
        const { connectionId: peerIOId } = member;

        setMembers((members) => ({
          ...members,
          [peerIOId]: { peerIOId, member: member.data, connected: false },
        }));
      }

      await spaceChannel.presence.enter(thisMember);

      spaceChannel.presence.subscribe(async (member) => {
        const { connectionId: peerIOId, action } = member;

        if (peerIOId === io.connection.id) return;

        if (action === "enter") {
          console.log("Enter:", peerIOId);

          setMembers((members) => ({
            ...members,
            [peerIOId]: { peerIOId, member: member.data, connected: false },
          }));

          await connect(peerIOId);

          await sendToMember(peerIOId, {
            event: SpaceEvents.SpaceConnectAck,
            data: { member: thisMember },
          });

          setMembers((members) => ({
            ...members,
            [peerIOId]: { ...members[peerIOId], connected: true },
          }));
        } else if (action === "leave") {
          console.log("Leave:", peerIOId);

          disconnect(peerIOId);

          setMembers((members) => {
            const updated = { ...members };

            delete updated[peerIOId];

            return updated;
          });
        }
      });
    }
  }, [connect, disconnect, sendToMember, auth.id, _space.id]);

  useEffect(() => {
    const spaceConnectAckReqUnsubscribe = onRTCEvent(
      SpaceEvents.SpaceConnectAck,
      (_, data) => {
        const { spaceId, member } = data as {
          spaceId: string;
          member: {
            ioId: string;
            userId: string;
            agent: string;
          };
        };

        if (spaceId !== _space.id) return;

        setMembers((members) => ({
          ...members,
          [member.ioId]: { ...members[member.ioId], connected: true },
        }));
      },
    );

    const spaceRenameUnsubscribe = onRTCEvent(
      SpaceEvents.SpaceRename,
      (_, data) => {
        const { spaceId, newName } = data as {
          spaceId: string;
          newName: string;
        };

        if (spaceId !== _space.id) return;

        setSpace((space) => ({ ...space!, name: newName }));
        setSpaceName(newName);
      },
    );

    const spaceNewEntriesUnsubscribe = onRTCEvent(
      SpaceEvents.SpaceNewEntries,
      async (peerIOId, data) => {
        const { spaceId, path: targetPath } = data as {
          spaceId: string;
          path: string;
        };

        if (spaceId !== _space.id || targetPath !== path) return;

        await sendToMember(peerIOId, {
          event: SpaceEvents.SpaceEntriesReq,
          data: { path },
        });
      },
    );

    const spaceEntriesReqUnsubscribe = onRTCEvent(
      SpaceEvents.SpaceEntriesReq,
      async (peerIOId, data) => {
        const { spaceId, path } = data as { spaceId: string; path: string };

        if (spaceId !== _space.id) return;

        const entries = await getPathEntries(path);

        await sendToMember(peerIOId, {
          event: SpaceEvents.SpaceEntriesRes,
          data: { path, entries },
        });
      },
    );

    const spaceEntriesResUnsubscribe = onRTCEvent(
      SpaceEvents.SpaceEntriesRes,
      (_, data) => {
        const {
          spaceId,
          path: targetPath,
          entries: pathEntries,
        } = data as {
          spaceId: string;
          path: string;
          entries: { [id: string]: FileEntryMetadata };
        };

        if (spaceId !== _space.id || targetPath !== path) return;

        setEntries((entries) => {
          const updated = { ...entries };

          for (const entry of Object.values(pathEntries)) {
            if (!entries[entry.id]) {
              updated[entry.id] = entry;
              continue;
            }

            if (entry.updatedAt < entries[entry.id].updatedAt) continue;

            updated[entry.id] = entry;
          }

          return updated;
        });
      },
    );

    const spaceEntriesDeleteUnsubscribe = onRTCEvent(
      SpaceEvents.SpaceEntriesDelete,
      async (_, data) => {
        const { spaceId, entryIds } = data as {
          spaceId: string;
          entryIds: string[];
        };

        if (spaceId !== _space.id) return;

        await deleteEntries(entryIds);
      },
    );

    const spaceEntriesUpdateUnsubscribe = onRTCEvent(
      SpaceEvents.SpaceEntriesUpdate,
      async (_, data) => {
        const { spaceId, updates } = data as {
          spaceId: string;
          updates: {
            spaceId: string;
            entryId: string;
            changes: UpdateSpec<FileIndexedMetadata>;
          }[];
        };

        if (spaceId !== _space.id) return;

        await updateEntries(updates);
      },
    );

    const spacePathReplaceUnsubscribe = onRTCEvent(
      SpaceEvents.SpacePathReplace,
      (_, data) => {
        const { spaceId, oldBasePath, newBasePath } = data as {
          spaceId: string;
          oldBasePath: string;
          newBasePath: string;
        };

        if (spaceId !== _space.id) return;

        console.log(oldBasePath);
        console.log(newBasePath);
        console.log(newBasePath + path.slice(oldBasePath.length));

        if (path.startsWith(oldBasePath))
          setPath(newBasePath + path.slice(oldBasePath.length));
      },
    );

    return () => {
      spaceConnectAckReqUnsubscribe();
      spaceRenameUnsubscribe();
      spaceNewEntriesUnsubscribe();
      spaceEntriesReqUnsubscribe();
      spaceEntriesResUnsubscribe();
      spaceEntriesDeleteUnsubscribe();
      spaceEntriesUpdateUnsubscribe();
      spacePathReplaceUnsubscribe();
    };
  }, [
    onRTCEvent,
    sendToMember,
    deleteEntries,
    updateEntries,
    getPathEntries,
    _space.id,
    path,
  ]);

  useEffect(() => {
    if (!space) return;

    const spaceChannel = io.channels.get(`space#${space.id}`);

    spaceChannel.subscribe(SpaceEvents.SpaceUrlReq, async (message) => {
      const { requestId, peerIOId } = message.data as {
        requestId: string;
        peerIOId: string;
      };

      await connect(peerIOId);

      // Not using sendToMember() as io is not member of space yet:
      await send(peerIOId, {
        event: SpaceEvents.SpaceUrlRes,
        data: {
          requestId,
          url: getSpaceUrl(space),
        },
      });
    });
  }, [space, connect, send]);

  useEffect(() => {
    if (connectingMembersCount > 0) return;

    loadPathEntries();

    async function loadPathEntries() {
      const pathEntries = await getPathEntries(path);
      setEntries(pathEntries);

      await emitToMembers(SpaceEvents.SpaceEntriesReq, {
        spaceId: _space.id,
        path,
      });
    }
  }, [
    _space.id,
    getPathEntries,
    emitToMembers,
    send,
    path,
    connectingMembersCount,
  ]);

  if (!space) return null;

  const createdAtLabel = dateLabel(space.created_at);

  return (
    <>
      <div className="flex flex-col gap-2 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="relative min-w-0">
            <AutoWidthInput
              value={spaceName}
              onChange={(e) => {
                setSpaceName(e.target.value);
              }}
              onBlur={async () => {
                if (spaceName === space.name) return;

                setSpaceNameUpdateLoading(true);

                await changeSpaceName(
                  space.id,
                  strEncrypt(spaceName, space.key),
                );

                emitToMembers(SpaceEvents.SpaceRename, { newName: spaceName });

                setSpace({ ...space, name: spaceName });
                setSpaceNameUpdateLoading(false);
              }}
              disabled={spaceNameUpdateLoading}
            />
            {spaceNameUpdateLoading ? (
              <Spinner className="text-muted-foreground absolute top-1/2 right-2 size-3 -translate-y-1/2" />
            ) : (
              <PencilIcon className="text-muted-foreground absolute top-1/2 right-2 size-3 -translate-y-1/2" />
            )}
          </div>
          <Button
            className="from-primary bg-gradient-to-t"
            onClick={() => setShareSpaceDialogOpen(true)}
          >
            Share <Share2Icon strokeWidth={3} />
          </Button>
        </div>
        <div className="text-muted-foreground flex items-baseline gap-2 text-xs">
          <span className="py-[4px]">
            Created{" "}
            {createdAtLabel === "Today" || createdAtLabel === "Yesterday"
              ? ""
              : "at"}{" "}
            {createdAtLabel}
          </span>
          <Status
            status={
              membersCount === 0
                ? "gray"
                : connectingMembersCount === 0
                  ? "online"
                  : "degraded"
            }
          >
            <StatusIndicator />
            {membersCount === 0 ? (
              <StatusLabel>No devices connected</StatusLabel>
            ) : connectingMembersCount === 0 ? (
              <StatusLabel>
                {connectedMembersCount > 1 ? connectedMembersCount : "One"}{" "}
                device
                {connectedMembersCount > 1 ? "s" : ""} connected
              </StatusLabel>
            ) : (
              <StatusLabel>Connecting...</StatusLabel>
            )}
          </Status>
        </div>
      </div>
      <div className="min-h-0 flex-1 sm:px-4 sm:pb-4">
        <div
          {...getRootProps()}
          className={cn(
            "relative h-full w-full flex-1 overflow-hidden bg-[#fafafa] p-4 transition sm:rounded-lg dark:bg-[#1A1A1A]",
            isDragActive && "!bg-primary-50/50",
            entriesWithDirsArr.length === 0 &&
              "border-y border-dashed sm:border-x",
          )}
        >
          <input {...getInputProps()} />
          {entriesWithDirsArr.length === 0 ? (
            <div
              className={cn(
                "flex h-full w-full flex-col items-center justify-center gap-4 rounded-lg",
              )}
            >
              <SeaCatIcon className="w-48" />
              <div className="flex flex-col items-center">
                <p className="text-sm font-bold">Add anything</p>
                <p className="text-sm">Everyone connected sees it right away</p>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-0 overflow-y-auto">
              <FileExplorer
                path={path}
                onPathChange={(path) => {
                  setPath(path);

                  setSelectedEntriesIds({});
                }}
                entries={entriesWithDirsArr}
                selectedEntryIds={selectedEntriesIds}
                onEntriesSelectChange={(entryId) => {
                  setSelectedEntriesIds((selectedEntryIds) => {
                    const updated = { ...selectedEntryIds };

                    if (selectedEntryIds[entryId]) delete updated[entryId];
                    else updated[entryId] = true;

                    return updated;
                  });
                }}
                onEntryDelete={(entryId) => onEntriesDelete([entryId])}
                onEntryDownload={(entryId) => {
                  onEntriesDownload([entryId]);
                }}
                onEntryRename={onEntryRename}
              />
            </div>
          )}
          <div className="absolute bottom-2 left-1/2 flex w-max max-w-full -translate-x-1/2 flex-wrap justify-center gap-2 rounded-lg bg-black/5 p-2 backdrop-blur-sm dark:bg-white/5">
            {selectedEntriesArr.length === 0 ? (
              <>
                <div className="border-r border-[#ccc] pr-2 dark:border-[#444]">
                  <Button
                    className="relative"
                    variant="gray"
                    size="icon"
                    onClick={() => setTransfersDialogOpen(true)}
                  >
                    {incomingTransferesArr.length > 0 && (
                      <span className="absolute top-0 right-0 h-4 w-4 translate-x-1/2 -translate-y-1/2 rounded-full bg-red-400 text-[10px] leading-4 font-bold">
                        {incomingTransfersCount}
                      </span>
                    )}
                    <CloudDownloadIcon strokeWidth={3} />
                  </Button>
                </div>
                <Button onClick={open}>
                  Add <PlusIcon strokeWidth={3} />
                </Button>
                <Button variant="secondary" disabled>
                  Chat <MessageCircleMoreIcon strokeWidth={3} />
                </Button>

                {/* <Button
                  className="text-white"
                  variant="gray"
                  size="icon"
                  disabled
                >
                  <SearchIcon strokeWidth={3} />
                </Button>
                <Button variant="gray" size="icon" disabled>
                  <SettingsIcon strokeWidth={3} />
                </Button>
                <Button variant="gray" size="icon" disabled>
                  <EllipsisVerticalIcon strokeWidth={3} />
                </Button> */}
              </>
            ) : (
              <>
                <Button
                  onClick={async () => {
                    await onEntriesDownload(Object.keys(selectedEntriesIds));

                    setSelectedEntriesIds({});
                  }}
                >
                  Download <DownloadIcon strokeWidth={3} />
                </Button>

                {selectedEntriesArr.length === 1 && (
                  <Button
                    variant="gray"
                    onClick={async () => {
                      const entryId = Object.keys(selectedEntriesIds)[0];

                      await onEntryRename(entryId);

                      setSelectedEntriesIds({});
                    }}
                  >
                    Rename <SquarePenIcon strokeWidth={3} />
                  </Button>
                )}
                <Button
                  variant="destructive"
                  onClick={async () => {
                    await onEntriesDelete(Object.keys(selectedEntriesIds));

                    setSelectedEntriesIds({});
                  }}
                >
                  Delete <TrashIcon strokeWidth={3} />
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSelectedEntriesIds(
                      Object.keys(entries).reduce(
                        (obj, k) => ({
                          ...obj,
                          [k]: true,
                        }),
                        {},
                      ),
                    );
                  }}
                >
                  Select All ({Object.keys(entries).length})
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSelectedEntriesIds({});
                  }}
                >
                  Deselect ({selectedEntriesArr.length})
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <ShareSpaceDialog
        open={shareSpaceDialogOpen}
        onOpenChange={setShareSpaceDialogOpen}
        space={space}
      />

      <TransfersDialog
        open={transfersDialogOpen}
        onOpenChange={setTransfersDialogOpen}
        transfers={incomingTransferesArr}
        onTransferPause={pauseTransfer}
        onTransferResume={resumeTransfer}
        onTransferDelete={deleteTransfer}
      />
    </>
  );

  async function onEntriesDownload(entryIds: string[]) {
    const selectedEntries = entryIds.map((id) => entriesWithDirs[id]) as (
      | FileEntryMetadata
      | DirEntryMetadata
    )[];
    if (selectedEntries.length === 0) return;

    const transferName = selectedEntries.map((e) => e.name).join(", ");

    const selectedFileEntries: FileEntryMetadata[] = [];
    for (const entry of selectedEntries) {
      if (entry.type === "file") selectedFileEntries.push(entry);
      else if (entry.type === "dir")
        selectedFileEntries.push(...entry.children);
    }

    startTransfer(transferName, path, selectedFileEntries);
  }

  async function onEntriesDelete(entryIds: string[]) {
    const confirmed = confirm("Are you sure?");
    if (!confirmed) return;

    const fileIdsToDelete: string[] = [];
    for (const entryId of entryIds) {
      const entry = entriesWithDirs[entryId];
      if (entry.type === "file") fileIdsToDelete.push(entry.id);
      else if (entry.type === "dir")
        fileIdsToDelete.push(...entry.children.map((c) => c.id));
    }

    await deleteEntries(fileIdsToDelete);

    await emitToMembers(SpaceEvents.SpaceEntriesDelete, {
      entryIds: fileIdsToDelete,
    });
  }

  async function onEntryRename(entryId: string) {
    const newName = prompt("Enter a new name:", entriesWithDirs[entryId].name);
    if (!newName) return;

    let updates: {
      spaceId: string;
      entryId: string;
      changes: UpdateSpec<FileIndexedMetadata>;
    }[] = [];

    const entry = entriesWithDirs[entryId];
    if (entry.type === "file") {
      updates = [{ spaceId: _space.id, entryId, changes: { name: newName } }];
    } else if (entry.type === "dir") {
      const oldDirName = entry.name;

      updates = entry.children.map((e) => ({
        spaceId: _space.id,
        entryId: e.id,
        changes: {
          path: path + newName + e.path.slice(path.length + oldDirName.length),
        },
      }));

      emitToMembers(SpaceEvents.SpacePathReplace, {
        oldBasePath: path + oldDirName + "/",
        newBasePath: path + newName + "/",
      });
    }

    await updateEntries(updates);

    emitToMembers(SpaceEvents.SpaceEntriesUpdate, {
      updates,
    });
  }
}
