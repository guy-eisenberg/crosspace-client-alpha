import { CHUNK_SIZE } from "@/constants";

/*
 * WebRTC peer connection config:
 */
export const RTC_PEER_CONFIG: RTCConfiguration = {
  // iceTransportPolicy: "relay",
};

/*
 * WebRTC events data channel config:
 */
export const RTC_EVENTS_DC_CONFIG: RTCDataChannelInit = {
  ordered: true,
};

/*
 * WebRTC tunnel data channel config:
 */
export const RTC_TUNNEL_DC_CONFIG: RTCDataChannelInit = {
  ordered: false,
};

/*
 * WebRTC enable logging:
 */
export const RTC_LOGGING = true;

/*
 *  WebRTC message chunk size:
 */
export const RTC_CHUNK_SIZE = CHUNK_SIZE; // 64KB;

/*
 *  WebRTC low buffer size:
 */
export const RTC_LOW_BUFFER_SIZE = RTC_CHUNK_SIZE * 8; // 8 chunks

/*
 * WebRTC high buffer size:
 */
export const RTC_HIGH_BUFFER_SIZE = RTC_CHUNK_SIZE * 32; // 32 chunks

/*
 * WebRTC max tunnels per peer:
 */
export const RTC_MAX_PEER_TUNNELS = 6;

export const RTC_EVENT_LABELS = {
  "data-channel-open": "Data channel open ✅",
  "sending-offer": "Sending offer ⬆️📄",
  "received-offer": "Recieved offer ⬇️📄",
  "sending-answer": "Sending answer ⬆️📄",
  "received-answer": "Recieved answer ⬇️📄",
  "sending-ice-candidate": "Sending ICE candidate ⬆️🧊",
  "received-ice-candidate": "Recieved ICE candidate ⬇️🧊",
  closed: "Closed ⛔",
};
