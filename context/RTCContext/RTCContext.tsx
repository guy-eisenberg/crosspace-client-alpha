"use client";

import { closeIO, initIO, io } from "@/clients/client/ably";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { v4 as uuid } from "uuid";
import { ConnectionsManager } from "./ConnectionsManager";

type RTCConnectionState = {
  peerIOId: string;
  state: "connecting" | "connected";
};

type RTCEventCallback = (peerIOId: string, data: any) => Promise<void> | void;

type RTCBytesCallback = (
  peerIOId: string,
  data: ArrayBuffer,
) => Promise<void> | void;

const RTCContext = createContext<{
  connectionsStates: {
    [peerIOId: string]: RTCConnectionState;
  };
  connect: (peerIOId: string) => Promise<void>;
  disconnect: (peerIOId: string) => void;
  onRTCEvent: (
    event: string,
    callback: (peerIOId: string, data: any) => void,
  ) => () => void;
  onRTCBytes: (
    callback: (peerIOId: string, buffer: ArrayBuffer) => void,
  ) => () => void;
  requestTunnels: (peerIOId: string) => Promise<void>;
  releaseTunnels: (peerIOId: string) => Promise<void>;
  send: (
    peerIOId: string,
    data: object | Blob | ArrayBuffer | ArrayBufferView<ArrayBuffer>,
  ) => Promise<void>;
}>({
  connectionsStates: {},
  connect: () => {
    throw new Error("Function not implemented.");
  },
  disconnect: () => {
    throw new Error("Function not implemented.");
  },
  onRTCEvent: () => {
    throw new Error("Function not implemented.");
  },
  onRTCBytes: () => {
    throw new Error("Function not implemented.");
  },
  requestTunnels: function (): Promise<void> {
    throw new Error("Function not implemented.");
  },
  releaseTunnels: function (): Promise<void> {
    throw new Error("Function not implemented.");
  },
  send: () => {
    throw new Error("Function not implemented.");
  },
});

let manager: ConnectionsManager;

const eventListeners: {
  [event: string]: { [id: string]: RTCEventCallback };
} = {};
const bytesListeners: {
  [id: string]: RTCBytesCallback;
} = {};

export default function RTCProvider({
  iceServers,
  children,
  userId,
}: {
  iceServers: { cloudflare: RTCIceServer[]; hetzner: RTCIceServer[] };
  children: React.ReactNode;
  userId: string;
}) {
  const [initDone, setInitDone] = useState(false);
  const [connectionsStates, setConnectionsStates] = useState<{
    [peerIOId: string]: RTCConnectionState;
  }>({});

  const connect = useCallback(async (peerIOId: string) => {
    await manager.connect(peerIOId);
  }, []);

  const disconnect = useCallback((peerIOId: string) => {
    manager.disconnect(peerIOId);
  }, []);

  const onRTCEvent = useCallback(
    (event: string, callback: RTCEventCallback) => {
      if (!eventListeners[event]) eventListeners[event] = {};

      const id = uuid();

      eventListeners[event][id] = callback;

      return () => {
        delete eventListeners[event][id];
      };
    },
    [],
  );

  const onRTCBytes = useCallback((callback: RTCBytesCallback) => {
    const id = uuid();

    bytesListeners[id] = callback;

    return () => {
      delete bytesListeners[id];
    };
  }, []);

  const send = useCallback(
    (
      peerIOId: string,
      data: object | Blob | ArrayBuffer | ArrayBufferView<ArrayBuffer>,
    ) => {
      return manager.send(peerIOId, data);
    },
    [],
  );

  const requestTunnels = useCallback(async (peerIOId: string) => {
    await manager.requestTunnels(peerIOId);
  }, []);

  const releaseTunnels = useCallback(async (peerIOId: string) => {
    await manager.releaseTunnels(peerIOId);
  }, []);

  useEffect(() => {
    if (!initDone) return;

    io.connection.on("disconnected", onIODisconnected);

    return () => {
      if (io) io.connection.off("disconnected", onIODisconnected);
    };

    function onIODisconnected() {
      destroyManager();

      closeIO();

      setInitDone(false);
    }
  }, [initDone]);

  useEffect(() => {
    if (initDone) return;

    init();

    async function init() {
      const io = await initIO(userId);

      manager = new ConnectionsManager(
        io.connection.id as string,
        iceServers,
        function onEvent(peerIOId, message) {
          const { event, data } = message;

          const listeners = eventListeners[event];

          if (listeners)
            Object.values(listeners).forEach((listener) =>
              listener(peerIOId, data),
            );
        },
        function onBytes(peerIOId, data) {
          if (bytesListeners)
            Object.values(bytesListeners).forEach((listener) =>
              listener(peerIOId, data),
            );
        },
        function onConnectionInit(peerIOId) {
          setConnectionsStates((states) => ({
            ...states,
            [peerIOId]: { peerIOId, state: "connecting" },
          }));
        },
        function onConnectionOpen(peerIOId) {
          setConnectionsStates((states) => ({
            ...states,
            [peerIOId]: { peerIOId, state: "connected" },
          }));
        },
      );

      setInitDone(true);
    }
  }, [userId, iceServers, initDone]);

  return (
    <RTCContext.Provider
      value={{
        connectionsStates,
        connect,
        disconnect,
        onRTCEvent,
        onRTCBytes,
        requestTunnels,
        releaseTunnels,
        send,
      }}
    >
      {initDone ? children : null}
    </RTCContext.Provider>
  );

  function destroyManager() {
    if (manager) manager.destroy();
  }
}

export function useRTC() {
  return useContext(RTCContext);
}
