export function encodeBytesMessage({
  buffer,
  headers,
}: {
  buffer: ArrayBuffer;
  headers: string[];
}) {
  const encoder = new TextEncoder();

  const encodedHeaders: Uint8Array<ArrayBuffer>[] = [];

  for (const header of headers) {
    const encoded = encoder.encode(header);

    encodedHeaders.push(encoded);
  }

  const headersSize = encodedHeaders.reduce(
    (sum, header) => sum + header.byteLength,
    0,
  );

  const totalSize = headersSize + buffer.byteLength; // [metadata + buffer] bytes length

  const message = new ArrayBuffer(totalSize);

  let offset = 0;

  for (const header of encodedHeaders) {
    new Uint8Array(message, offset, header.byteLength).set(header);
    offset += header.byteLength;
  }

  new Uint8Array(message, offset, buffer.byteLength).set(
    new Uint8Array(buffer),
  );
  offset += buffer.byteLength;

  return message;
}
