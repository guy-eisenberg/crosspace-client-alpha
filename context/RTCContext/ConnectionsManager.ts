import { io } from "@/clients/client/ably";
import { splitStrByLength } from "@/lib/splitStrByLength";
import { v4 as uuid } from "uuid";
import {
  RTC_CHUNK_SIZE,
  RTC_EVENT_LABELS,
  RTC_EVENTS_DC_CONFIG,
  RTC_LOGGING,
  RTC_MAX_PEER_TUNNELS,
  RTC_PEER_CONFIG,
  RTC_TUNNEL_DC_CONFIG,
} from "./constants";

enum ConnectionsManagerEvent {
  NewConnectionInit = "NewConnectionInit",
  NewConnectionAck = "NewConnectionAck",
}

enum RTCConnectionEvent {
  Offer = "Offer",
  Answer = "Answer",
  IceCandidate = "IceCandidate",
}

enum RTCTunnelEvent {
  TunnelOffer = "TunnelOffer",
  TunnelAnswer = "TunnelAnswer",
  TunnelIceCandidate = "TunnelIceCandidate",
}

export type RTCTunnel = {
  id: string;
  peer: RTCPeerConnection;
  dc: RTCDataChannel | null;
  pendingCandidates: RTCIceCandidateInit[];
  ready: Promise<RTCTunnel>;
};

class RTCConnection {
  private ioId: string;
  private iceServers: { cloudflare: RTCIceServer[]; hetzner: RTCIceServer[] };

  private peerIOId: string;

  private peer: RTCPeerConnection;
  private dc: RTCDataChannel | null = null;
  private pendingCandidates: RTCIceCandidate[] = [];

  private pendingMessagesParts: { [id: string]: string[] } = {};

  private onDataChannelOpen: () => void;
  private onEvent: (event: string, data: any) => void;
  private onBytes: (data: ArrayBuffer) => void;

  private tunnels: { [tunnelId: string]: RTCTunnel } = {};
  private tunnelsUsers = 0;

  private onMessage(message: MessageEvent) {
    if (typeof message.data === "string") {
      const { id, final, part } = JSON.parse(message.data) as {
        id: string;
        final: boolean;
        part: string;
      };

      if (!this.pendingMessagesParts[id]) this.pendingMessagesParts[id] = [];

      if (!final) this.pendingMessagesParts[id].push(part);
      else {
        const finalMessageString = [
          ...this.pendingMessagesParts[id],
          part,
        ].join("");

        const { event, data } = JSON.parse(finalMessageString) as {
          event: string;
          data: any;
        };

        if (event in RTCTunnelEvent) {
          const { tunnelId, ...rest } = data as { tunnelId: string };

          this.handleTunnelEvent(tunnelId, event as RTCTunnelEvent, rest);
        } else this.onEvent(event, data);

        delete this.pendingMessagesParts[id];
      }
    } else if (message.data instanceof ArrayBuffer) this.onBytes(message.data);
  }

  private logEvent(eventLabel: string) {
    if (RTC_LOGGING) {
      console.log(`IO: "${this.peerIOId}"\nEvent: ${eventLabel}.`);
    }
  }

  private logTunnelEvent(tunnelId: string, eventLabel: string) {
    if (RTC_LOGGING) {
      console.log(
        `Tunnel: ${tunnelId}\IO: "${this.peerIOId}"\nEvent: ${eventLabel}.`,
      );
    }
  }

  private sendEvent(event: RTCConnectionEvent, data: any) {
    let eventLabel: string;
    switch (event) {
      case RTCConnectionEvent.Offer:
        eventLabel = RTC_EVENT_LABELS["sending-offer"];
        break;
      case RTCConnectionEvent.Answer:
        eventLabel = RTC_EVENT_LABELS["sending-answer"];
        break;
      case RTCConnectionEvent.IceCandidate:
        eventLabel = RTC_EVENT_LABELS["sending-ice-candidate"];
        break;
    }
    this.logEvent(eventLabel);

    const peerUserChannel = io.channels.get(`${this.peerIOId}#${this.ioId}`);
    peerUserChannel.publish(event, data);
  }

  private sendTunnelEvent(tunnelId: string, event: RTCTunnelEvent, data: any) {
    let eventLabel: string;
    switch (event) {
      case RTCTunnelEvent.TunnelOffer:
        eventLabel = RTC_EVENT_LABELS["sending-offer"];
        break;
      case RTCTunnelEvent.TunnelAnswer:
        eventLabel = RTC_EVENT_LABELS["sending-answer"];
        break;
      case RTCTunnelEvent.TunnelIceCandidate:
        eventLabel = RTC_EVENT_LABELS["sending-ice-candidate"];
        break;
    }
    this.logTunnelEvent(tunnelId, eventLabel);

    this.send({ event, data: { tunnelId, ...data } });
  }

  private async handleEvent(event: RTCConnectionEvent, data: any) {
    if (event === RTCConnectionEvent.Offer) {
      const { offer } = data as { offer: RTCSessionDescriptionInit };

      this.logEvent(RTC_EVENT_LABELS["received-offer"]);

      this.peer.ondatachannel = (event) => {
        const { channel: dc } = event;

        this.dc = dc;
        this.dc.bufferedAmountLowThreshold = 0;

        dc.onmessage = (message) => this.onMessage(message);
        dc.onopen = () => {
          this.logEvent(RTC_EVENT_LABELS["data-channel-open"]);

          this.onDataChannelOpen();
        };
      };

      await this.peer.setRemoteDescription(offer);
      await Promise.all(
        this.pendingCandidates.map((c) => this.peer.addIceCandidate(c)),
      );

      const answer = await this.peer.createAnswer();
      await this.peer.setLocalDescription(answer);

      this.sendEvent(RTCConnectionEvent.Answer, { answer });
    } else if (event === RTCConnectionEvent.Answer) {
      const { answer } = data as { answer: RTCSessionDescription };

      this.logEvent(RTC_EVENT_LABELS["received-answer"]);

      await this.peer.setRemoteDescription(answer);

      await Promise.all(
        this.pendingCandidates.map((c) => this.peer.addIceCandidate(c)),
      );
    } else if (event === RTCConnectionEvent.IceCandidate) {
      const { candidate } = data as {
        candidate: RTCIceCandidate;
      };

      this.logEvent(RTC_EVENT_LABELS["received-ice-candidate"]);

      if (this.peer.remoteDescription)
        await this.peer.addIceCandidate(candidate);
      else this.pendingCandidates.push(candidate);
    }
  }

  private async handleTunnelEvent(
    tunnelId: string,
    event: RTCTunnelEvent,
    data: any,
  ) {
    if (event === RTCTunnelEvent.TunnelOffer) {
      const { offer } = data as {
        offer: RTCSessionDescription;
      };

      this.logTunnelEvent(tunnelId, RTC_EVENT_LABELS["received-offer"]);

      const tunnel = this.initTunnel(tunnelId);

      tunnel.peer.ondatachannel = (event) => {
        const { channel: dc } = event;
        dc.bufferedAmountLowThreshold = 0;
        dc.binaryType = "arraybuffer";
        tunnel.dc = dc;

        dc.onmessage = (message) => this.onMessage(message);
        dc.onopen = () => {
          this.logTunnelEvent(tunnelId, RTC_EVENT_LABELS["data-channel-open"]);

          if (!tunnel.ready) tunnel.ready = Promise.resolve(tunnel);
        };
      };

      await tunnel.peer.setRemoteDescription(offer);

      await Promise.all(
        tunnel.pendingCandidates.map((c) => tunnel.peer.addIceCandidate(c)),
      );

      const answer = await tunnel.peer.createAnswer();
      await tunnel.peer.setLocalDescription(answer);

      this.sendTunnelEvent(tunnelId, RTCTunnelEvent.TunnelAnswer, {
        answer,
      });
    } else if (event === RTCTunnelEvent.TunnelAnswer) {
      const { answer } = data as { answer: RTCSessionDescriptionInit };

      this.logTunnelEvent(tunnelId, RTC_EVENT_LABELS["received-answer"]);

      const tunnel = this.tunnels[tunnelId];

      await tunnel.peer.setRemoteDescription(answer);

      await Promise.all(
        tunnel.pendingCandidates.map((c) => tunnel.peer.addIceCandidate(c)),
      );
    } else if (event === RTCTunnelEvent.TunnelIceCandidate) {
      const { candidate } = data as {
        candidate: RTCIceCandidate;
      };

      this.logTunnelEvent(tunnelId, RTC_EVENT_LABELS["received-ice-candidate"]);

      if (this.tunnels[tunnelId].peer.remoteDescription)
        await this.tunnels[tunnelId].peer.addIceCandidate(candidate);
      else this.tunnels[tunnelId].pendingCandidates.push(candidate);
    }
  }

  private initTunnel(tunnelId: string) {
    const tunnel: RTCTunnel = {
      id: tunnelId,
      peer: new RTCPeerConnection({
        ...RTC_PEER_CONFIG,
        iceServers: this.iceServers.hetzner,
      }),
      dc: null,
      pendingCandidates: [],
      ready: null as any,
    };

    this.tunnels[tunnelId] = tunnel;

    tunnel.peer.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendTunnelEvent(tunnelId, RTCTunnelEvent.TunnelIceCandidate, {
          candidate: event.candidate,
        });
      }
    };

    return tunnel;
  }

  private closeTunnel(tunnel: RTCTunnel) {
    tunnel.peer.onconnectionstatechange = null;
    tunnel.peer.onicegatheringstatechange = null;
    tunnel.peer.onsignalingstatechange = null;
    tunnel.peer.oniceconnectionstatechange = null;

    tunnel.peer.onicecandidate = null;
    tunnel.peer.ondatachannel = null;

    if (tunnel.dc) {
      tunnel.dc.onmessage = null;
      tunnel.dc.onopen = null;
      tunnel.dc.onbufferedamountlow = null;
    }

    tunnel.peer.close();

    this.logTunnelEvent(tunnel.id, RTC_EVENT_LABELS["closed"]);
  }

  private async createTunnel() {
    const tunnelId = uuid();

    const tunnel = this.initTunnel(tunnelId);

    const dc = tunnel.peer.createDataChannel("tunnel", RTC_TUNNEL_DC_CONFIG);
    dc.bufferedAmountLowThreshold = 0;
    dc.binaryType = "arraybuffer";
    tunnel.dc = dc;

    dc.onmessage = (message) => this.onMessage(message);
    const promise = new Promise<RTCTunnel>((res) => {
      dc.onopen = () => {
        this.logTunnelEvent(tunnelId, RTC_EVENT_LABELS["data-channel-open"]);

        if (!tunnel.ready) tunnel.ready = Promise.resolve(tunnel);

        res(tunnel);
      };
    });

    const offer = await tunnel.peer.createOffer();
    await tunnel.peer.setLocalDescription(offer);

    this.sendTunnelEvent(tunnelId, RTCTunnelEvent.TunnelOffer, { offer });

    return promise;
  }

  private async sendChunk(chunk: ArrayBuffer) {
    const tunnel = await Promise.any(
      Object.values(this.tunnels).map((t) => t.ready),
    );

    tunnel.ready = new Promise<RTCTunnel>((res) => {
      tunnel.dc!.onbufferedamountlow = () => {
        tunnel.dc!.onbufferedamountlow = null;

        res(tunnel);
      };

      tunnel.dc!.send(chunk);
    });
  }

  constructor(
    ioId: string,
    iceServers: { cloudflare: RTCIceServer[]; hetzner: RTCIceServer[] },
    peerIOId: string,
    listeners: {
      onDataChannelOpen: () => void;
      onEvent: (event: string, data: any) => void;
      onBytes: (data: ArrayBuffer) => void;
    },
  ) {
    this.ioId = ioId;
    this.iceServers = iceServers;
    this.peerIOId = peerIOId;

    this.peer = new RTCPeerConnection({
      ...RTC_PEER_CONFIG,
      iceServers: this.iceServers.cloudflare,
    });

    this.peer.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendEvent(RTCConnectionEvent.IceCandidate, {
          candidate: event.candidate,
        });
      }
    };

    const { onDataChannelOpen, onEvent, onBytes } = listeners;

    this.onDataChannelOpen = onDataChannelOpen;
    this.onEvent = onEvent;
    this.onBytes = onBytes;

    const channel = io.channels.get(`${this.ioId}#${this.peerIOId}`);
    channel.subscribe(Object.values(RTCConnectionEvent), (event) => {
      this.handleEvent(event.name as RTCConnectionEvent, event.data);
    });
  }

  public async start() {
    const dc = this.peer.createDataChannel("events", RTC_EVENTS_DC_CONFIG);
    this.dc = dc;
    dc.bufferedAmountLowThreshold = 0;

    dc.onmessage = (message) => this.onMessage(message);
    dc.onopen = () => {
      this.logEvent(RTC_EVENT_LABELS["data-channel-open"]);

      this.onDataChannelOpen();
    };

    const offer = await this.peer.createOffer();
    await this.peer.setLocalDescription(offer);

    this.sendEvent(RTCConnectionEvent.Offer, { offer });
  }

  public isConnected() {
    return this.peer.connectionState === "connected";
  }

  public async send(
    data: object | Blob | ArrayBuffer | ArrayBufferView<ArrayBuffer>,
  ) {
    if (data instanceof ArrayBuffer) await this.sendChunk(data);
    else if (typeof data === "object") {
      const id = uuid();
      const dataString = JSON.stringify(data);

      const parts = splitStrByLength(dataString, RTC_CHUNK_SIZE);

      let partNumber = 1;
      for (const part of parts) {
        this.dc!.send(
          JSON.stringify({ id, final: partNumber >= parts.length, part }),
        );

        partNumber += 1;

        await new Promise<void>((res) => {
          this.dc!.addEventListener(
            "bufferedamountlow",
            () => {
              res();
            },
            { once: true },
          );
        });
      }
    }
  }

  public async requestTunnels() {
    this.tunnelsUsers += 1;

    const existingTunnels = Object.values(this.tunnels);

    if (existingTunnels.length >= RTC_MAX_PEER_TUNNELS) return existingTunnels;

    return Promise.all(
      new Array(RTC_MAX_PEER_TUNNELS).fill(null).map(() => this.createTunnel()),
    );
  }

  public async releaseTunnels() {
    this.tunnelsUsers -= 1;

    if (this.tunnelsUsers <= 0) {
      this.tunnelsUsers = 0;

      for (const tunnelId of Object.keys(this.tunnels)) {
        const tunnel = this.tunnels[tunnelId];

        this.closeTunnel(tunnel);

        delete this.tunnels[tunnelId];
      }
    }
  }

  public destroy() {
    const channel = io.channels.get(`${this.ioId}#${this.peerIOId}`);
    channel.off();

    for (const tunnel of Object.values(this.tunnels)) {
      this.closeTunnel(tunnel);

      delete this.tunnels[tunnel.id];
    }

    this.peer.onconnectionstatechange = null;
    this.peer.onicegatheringstatechange = null;
    this.peer.onsignalingstatechange = null;
    this.peer.oniceconnectionstatechange = null;

    this.peer.onicecandidate = null;
    this.peer.ondatachannel = null;

    if (this.dc) {
      this.dc.onmessage = null;
      this.dc.onopen = null;
      this.dc.onbufferedamountlow = null;
    }

    this.peer.close();

    this.logEvent(RTC_EVENT_LABELS["closed"]);
  }
}

export class ConnectionsManager {
  private connections: {
    [peerIOId: string]: RTCConnection;
  } = {};

  private initConnection(peerIOId: string) {
    return new Promise<RTCConnection>((res) => {
      const connection = new RTCConnection(
        this.ioId,
        this.iceServers,
        peerIOId,
        {
          onEvent: (event, data) => {
            this.onEvent(peerIOId, { event, data });
          },
          onBytes: (data) => {
            this.onBytes(peerIOId, data);
          },
          onDataChannelOpen: () => {
            this.onConnectionOpen(peerIOId);

            res(connection);
          },
        },
      );

      this.connections[peerIOId] = connection;

      this.onConnectionInit(peerIOId);
    });
  }

  constructor(
    private readonly ioId: string,
    private readonly iceServers: {
      cloudflare: RTCIceServer[];
      hetzner: RTCIceServer[];
    },
    private readonly onEvent: (
      peerIOId: string,
      message: { event: string; data: any },
    ) => void,
    private readonly onBytes: (peerIOId: string, data: ArrayBuffer) => void,
    private readonly onConnectionInit: (peerIOId: string) => void,
    private readonly onConnectionOpen: (peerIOId: string) => void,
  ) {
    const channel = io.channels.get(this.ioId);
    channel.subscribe(Object.values(ConnectionsManagerEvent), async (event) => {
      if (event.name === ConnectionsManagerEvent.NewConnectionInit) {
        const { peerIOId } = event.data as {
          peerIOId: string;
        };

        this.initConnection(peerIOId);

        const peerUserChannel = io.channels.get(peerIOId);
        peerUserChannel.publish(ConnectionsManagerEvent.NewConnectionAck, {
          peerIOId: this.ioId,
        });
      } else if (event.name === ConnectionsManagerEvent.NewConnectionAck) {
        const { peerIOId } = event.data as {
          peerIOId: string;
        };

        const connection = this.connections[peerIOId];

        await connection.start();
      }
    });
  }

  public disconnect(peerIOId: string) {
    const connection = this.connections[peerIOId];

    connection.destroy();

    delete this.connections[peerIOId];
  }

  public async connect(peerIOId: string) {
    const existingConnection = this.connections[peerIOId];
    if (existingConnection && existingConnection.isConnected()) return;

    const dataChannelOpenPromise = this.initConnection(peerIOId);

    const peerUserChannel = io.channels.get(peerIOId);
    peerUserChannel.publish(ConnectionsManagerEvent.NewConnectionInit, {
      peerIOId: this.ioId,
    });

    await dataChannelOpenPromise;
  }

  public async send(
    peerIOId: string,
    data: object | Blob | ArrayBuffer | ArrayBufferView<ArrayBuffer>,
  ) {
    const connection = this.connections[peerIOId];

    await connection.send(data);
  }

  public requestTunnels(peerIOId: string) {
    const connection = this.connections[peerIOId];

    return connection.requestTunnels();
  }

  public releaseTunnels(peerIOId: string) {
    const connection = this.connections[peerIOId];

    return connection.releaseTunnels();
  }

  public destroy() {
    const channel = io.channels.get(this.ioId);
    channel.off();

    for (const connection of Object.values(this.connections))
      connection.destroy();
  }
}
