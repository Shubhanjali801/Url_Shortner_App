import { randomInt } from "node:crypto";

// Base62 alphabet from 02_HLD/03_url_encoding_algorithms.md.
// We generate codes RANDOMLY (not from a sequential counter) so they are
// unguessable — the security NFR warns against enumerable codes.
const ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

export function generateCode(length: number): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += ALPHABET[randomInt(ALPHABET.length)];
  }
  return out;
}
