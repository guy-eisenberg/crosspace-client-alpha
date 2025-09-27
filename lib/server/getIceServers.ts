export async function getIceServers() {
  const cloudflare = await fetchCloudflareIceServers();
  const hetzner: RTCIceServer[] = [
    { urls: `stun:${process.env.HETZNER_TURN_URL}:3478` },
    {
      urls: `turn:${process.env.HETZNER_TURN_URL}:3478?transport=udp`,
      username: process.env.HETZNER_TURN_USERNAME,
      credential: process.env.HETZNER_TURN_PASSWORD,
    },
  ];

  return {
    cloudflare,
    hetzner,
  };
}

async function fetchCloudflareIceServers() {
  const res = await fetch(
    `${process.env.CLOUDFLARE_REQUEST_URL}/${process.env.CLOUDFLARE_TURN_TOKEN_ID}/credentials/generate-ice-servers`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.CLOUDFLARE_TURN_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ttl: 86400 }),
    },
  );

  if (!res.ok)
    throw new Error("Could not fetch Cloudflare servers credentials.");

  const { iceServers } = (await res.json()) as { iceServers: RTCIceServer[] };

  return iceServers;
}
