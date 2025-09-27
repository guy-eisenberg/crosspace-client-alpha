import CryptoJS from "crypto-js";

export default function strEncrypt(str: string, key: string) {
  const cypher = CryptoJS.AES.encrypt(str, key).toString();

  return cypher;
}
