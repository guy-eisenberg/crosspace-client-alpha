export function decodeBytesMessage({
  message,
  headers,
}: {
  message: ArrayBuffer;
  headers: { [name: string]: { start: number; length: number } };
}) {
  const decoder = new TextDecoder();

  let totalHeadersSize = 0;

  const metadata: { [name: string]: string } = {};
  for (const [name, { start, length }] of Object.entries(headers)) {
    const decoded = decoder.decode(new Uint8Array(message, start, length));

    metadata[name] = decoded;

    totalHeadersSize += length;
  }

  const buffer = message.slice(totalHeadersSize);

  return { buffer, metadata };
}
