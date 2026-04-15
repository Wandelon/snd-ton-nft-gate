import { beginCell, Cell } from '@ton/core';

const OP_FORWARD = 0x6a21b4d1;

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function cellFromBase64Boc(b64: string): Cell {
  const bytes = base64ToBytes(b64);
  const cells = Cell.fromBoc(bytes);
  if (!cells.length) throw new Error('Invalid BOC');
  return cells[0];
}

export function buildFactoryForwardPayloadBase64(args: {
  forwardValue: bigint;
  forwardedBodyBase64: string;
}): string {
  const forwarded = cellFromBase64Boc(args.forwardedBodyBase64.trim());
  const body = beginCell().storeUint(OP_FORWARD, 32).storeCoins(args.forwardValue).storeRef(forwarded).endCell();
  return body.toBoc({ idx: false }).toString('base64');
}

