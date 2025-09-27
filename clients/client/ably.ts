import Ably from "ably";

export let io: Ably.Realtime;

export async function initIO(userId: string) {
  if (!io) {
    await new Promise((res) => {
      io = new Ably.Realtime({
        key: process.env.NEXT_PUBLIC_ABLY_KEY as string,
        clientId: userId,
        transportParams: {
          remainPresentFor: 0,
        },
      });

      io.connection.once("connected", res);
    });
  }

  return io;
}

export function closeIO() {
  if (io) {
    io.close();
    io = undefined as any;
  }
}
