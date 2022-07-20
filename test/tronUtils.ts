import { BytesLike } from "ethers";
import { ethers } from "hardhat";

export function tronSign(message: BytesLike, privateKey: BytesLike) {
  const prefixedMessage = ethers.utils.solidityKeccak256(
    ["string", "bytes"],
    ["\x19TRON Signed Message:\n32", message]
  );

  const signingKey = new ethers.utils.SigningKey(privateKey);
  const { r, s, v } = signingKey.signDigest(prefixedMessage);
  const signature = [
    "0x",
    r.substring(2),
    s.substring(2),
    Number(v).toString(16),
  ].join("");

  return signature;
}
