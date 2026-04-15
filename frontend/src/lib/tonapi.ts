import { Address } from '@ton/core';

export type GateStatus = {
  ok: boolean;
  jetton1: { master: string; balance: string; ok: boolean };
  jetton2: { master: string; balance: string; ok: boolean };
  nft: { collection: string; count: number; ok: boolean };
};

async function tonapiGet<T>(base: string, path: string): Promise<T> {
  const res = await fetch(`${base}${path}`, {
    headers: { Accept: 'application/json' }
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`tonapi error ${res.status}: ${txt || res.statusText}`);
  }
  return (await res.json()) as T;
}

function getJettonBalanceFromResponse(jettons: any, master: Address): bigint {
  const list = jettons?.balances ?? jettons?.jettons ?? jettons?.items ?? [];
  for (const it of list) {
    const masterAddr = it?.jetton?.address ?? it?.jetton?.master ?? it?.master ?? it?.jetton_address;
    if (!masterAddr) continue;
    try {
      if (Address.parse(masterAddr).equals(master)) {
        const b = it?.balance ?? it?.amount ?? '0';
        return BigInt(b);
      }
    } catch {
      // ignore parse errors
    }
  }
  return 0n;
}

function getNftCountFromResponse(nfts: any, collection: Address): number {
  const list = nfts?.nft_items ?? nfts?.items ?? nfts?.nfts ?? [];
  let cnt = 0;
  for (const it of list) {
    const colAddr = it?.collection?.address ?? it?.collection_address ?? it?.collection;
    if (!colAddr) continue;
    try {
      if (Address.parse(colAddr).equals(collection)) cnt += 1;
    } catch {
      // ignore
    }
  }
  return cnt;
}

export async function fetchGateStatus(args: {
  tonapiBase: string;
  account: Address;
  jetton1Master: Address;
  jetton2Master: Address;
  nftCollection: Address;
  minJetton1: bigint;
  minJetton2: bigint;
}): Promise<GateStatus> {
  const a = args.account.toString({ urlSafe: true, bounceable: true });

  const [jettons, nfts] = await Promise.all([
    tonapiGet<any>(args.tonapiBase, `/v2/accounts/${a}/jettons`),
    tonapiGet<any>(args.tonapiBase, `/v2/accounts/${a}/nfts`)
  ]);

  const b1 = getJettonBalanceFromResponse(jettons, args.jetton1Master);
  const b2 = getJettonBalanceFromResponse(jettons, args.jetton2Master);
  const nftCount = getNftCountFromResponse(nfts, args.nftCollection);

  const ok1 = b1 >= args.minJetton1;
  const ok2 = b2 >= args.minJetton2;
  const okN = nftCount > 0;

  return {
    ok: ok1 && ok2 && okN,
    jetton1: { master: args.jetton1Master.toString(), balance: b1.toString(), ok: ok1 },
    jetton2: { master: args.jetton2Master.toString(), balance: b2.toString(), ok: ok2 },
    nft: { collection: args.nftCollection.toString(), count: nftCount, ok: okN }
  };
}

