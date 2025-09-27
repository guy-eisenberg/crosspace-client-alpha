export function fileSizeLabel(bytes: number) {
  const thresh = 1024;

  if (Math.abs(bytes) < thresh) {
    return bytes + " B";
  }

  const units = ["kB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  let u = -1;

  do {
    bytes /= thresh;
    ++u;
  } while (
    Math.round(Math.abs(bytes) * 10) / 10 >= thresh &&
    u < units.length - 1
  );

  return bytes.toFixed(1) + " " + units[u];
}
