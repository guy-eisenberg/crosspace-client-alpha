"use strict";
/// <reference lib="webworker" />
const sw = self;
const streams = {};
sw.addEventListener("install", () => {
    sw.skipWaiting();
});
sw.addEventListener("activate", (event) => {
    event.waitUntil(sw.clients.claim());
});
sw.addEventListener("message", (event) => {
    const message = event.data;
    if (message.subject === "create-stream") {
        const id = crypto.randomUUID();
        const readable = new ReadableStream({
            start(controller) {
                message.port.onmessage = (event) => {
                    const data = event.data;
                    if (data.subject === "append-stream") {
                        controller.enqueue(new Uint8Array(data.buffer));
                    }
                    else if (data.subject === "close-stream") {
                        controller.close();
                    }
                };
            },
        });
        streams[id] = {
            id,
            name: message.name,
            size: message.size,
            readable,
        };
        message.port.postMessage({ subject: "new-stream", id });
    }
});
sw.addEventListener("fetch", (event) => {
    const { url: requestUrl } = event.request;
    const { pathname } = new URL(requestUrl);
    if (pathname.startsWith("/stream")) {
        const id = pathname.split("/")[2];
        const stream = streams[id];
        if (!stream)
            return null;
        const response = new Response(stream.readable, {
            headers: {
                "Content-Type": "application/octet-stream; charset=utf-8",
                "Content-Disposition": "attachment; filename*=UTF-8''" +
                    encodeURIComponent(stream.name).replace(/['()]/g, (c) => `%${c.charCodeAt(0).toString(16)}`),
                "Content-Length": stream.size.toString(),
                "Cache-Control": "no-store",
                "X-Content-Type-Options": "nosniff",
            },
        });
        event.respondWith(response);
    }
});
