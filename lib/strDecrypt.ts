import CryptoJS from "crypto-js";

export default function strDecrypt(cypher: string, key: string) {
  const bytes = CryptoJS.AES.decrypt(cypher, key);
  const plain = bytes.toString(CryptoJS.enc.Utf8);

  return plain;
}
