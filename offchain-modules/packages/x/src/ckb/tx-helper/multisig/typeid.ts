import { HashType, utils, blockchain } from '@ckb-lumos/base';

function toArrayBuffer(buf) {
  const ab = new ArrayBuffer(buf.length);
  const view = new Uint8Array(ab);
  for (let i = 0; i < buf.length; ++i) {
    view[i] = buf[i];
  }
  return ab;
}

function toBigUInt64LE(num) {
  num = BigInt(num);
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(num);
  return toArrayBuffer(buf);
}

function generateTypeID(input, outputIndex) {
  const s = blockchain.CellInput.pack(input);
  const i = toBigUInt64LE(outputIndex);
  const ckbHasher = new utils.CKBHasher();
  ckbHasher.update(s);
  ckbHasher.update(i);
  return ckbHasher.digestHex();
}

export function generateTypeIDScript(input, outputIndex) {
  const args = generateTypeID(input, outputIndex);
  return {
    codeHash: '0x00000000000000000000000000000000000000000000000000545950455f4944',
    hashType: 'type' as HashType,
    args,
  };
}
