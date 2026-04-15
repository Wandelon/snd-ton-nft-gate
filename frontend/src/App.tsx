import { useMemo, useState } from 'react';
import { TonConnectButton, useTonWallet, useTonConnectUI } from '@tonconnect/ui-react';
import { Address } from '@ton/core';
import { fetchGateStatus } from './lib/tonapi';
import { buildFactoryForwardPayloadBase64 } from './lib/ton';

const cfg = {
  factory: import.meta.env.VITE_FACTORY_ADDRESS as string,
  jetton1: import.meta.env.VITE_JETTON1_MASTER as string,
  jetton2: import.meta.env.VITE_JETTON2_MASTER as string,
  nftCollection: import.meta.env.VITE_NFT_COLLECTION as string,
  minJetton1: BigInt(import.meta.env.VITE_MIN_JETTON1 ?? '1'),
  minJetton2: BigInt(import.meta.env.VITE_MIN_JETTON2 ?? '1'),
  tonapiBase: (import.meta.env.VITE_TONAPI_BASE ?? 'https://testnet.tonapi.io') as string
};

export default function App() {
  const wallet = useTonWallet();
  const [tonConnectUI] = useTonConnectUI();

  const [gateLoading, setGateLoading] = useState(false);
  const [gateError, setGateError] = useState<string | null>(null);
  const [gateOk, setGateOk] = useState(false);
  const [gateDetails, setGateDetails] = useState<Awaited<ReturnType<typeof fetchGateStatus>> | null>(null);

  const [forwardValueTon, setForwardValueTon] = useState('0.05');
  const [mintBodyB64, setMintBodyB64] = useState('');

  const address = useMemo(() => {
    try {
      return wallet?.account.address ? Address.parse(wallet.account.address) : null;
    } catch {
      return null;
    }
  }, [wallet?.account.address]);

  async function refreshGate() {
    if (!address) return;
    setGateLoading(true);
    setGateError(null);
    try {
      const status = await fetchGateStatus({
        tonapiBase: cfg.tonapiBase,
        account: address,
        jetton1Master: Address.parse(cfg.jetton1),
        jetton2Master: Address.parse(cfg.jetton2),
        nftCollection: Address.parse(cfg.nftCollection),
        minJetton1: cfg.minJetton1,
        minJetton2: cfg.minJetton2
      });
      setGateOk(status.ok);
      setGateDetails(status);
    } catch (e: any) {
      setGateError(e?.message ?? String(e));
      setGateOk(false);
      setGateDetails(null);
    } finally {
      setGateLoading(false);
    }
  }

  async function sendMint() {
    if (!wallet?.account.address) throw new Error('Connect wallet');
    if (!gateOk) throw new Error('Access gate not passed');

    const factory = Address.parse(cfg.factory);
    const forwardValue = BigInt(Math.floor(Number(forwardValueTon) * 1e9));

    const payload = buildFactoryForwardPayloadBase64({
      forwardValue,
      forwardedBodyBase64: mintBodyB64
    });

    await tonConnectUI.sendTransaction({
      validUntil: Math.floor(Date.now() / 1000) + 300,
      messages: [
        {
          address: factory.toString(),
          amount: (forwardValue + BigInt(50_000_000)).toString(), // +0.05 TON for gas buffer
          payload
        }
      ]
    });
  }

  return (
    <div className="page">
      <div className="shell">
        <div className="topbar">
          <div className="brand">
            <h1>SND access gate</h1>
            <p>TON testnet · Требования: 2 jetton + NFT из коллекции</p>
          </div>
          <TonConnectButton />
        </div>

        <div className="card">
          <div className="grid">
            <div>
              <div className="sectionTitle">
                <span>1) Проверка доступа</span>
                <span className={`pill ${gateOk ? 'good' : address ? 'bad' : 'warn'}`}>
                  {address ? (gateOk ? 'PASS' : 'FAIL') : 'CONNECT WALLET'}
                </span>
              </div>

              <div className="kv">
                <div className="k">Wallet</div>
                <div className="v" title={wallet?.account.address ?? ''}>
                  {wallet?.account.address ?? 'not connected'}
                </div>
                <div className="k">Factory</div>
                <div className="v" title={cfg.factory}>{cfg.factory || 'VITE_FACTORY_ADDRESS missing'}</div>
                <div className="k">TonAPI</div>
                <div className="v" title={cfg.tonapiBase}>{cfg.tonapiBase}</div>
              </div>

              <div className="btnRow">
                <button className="btn" disabled={!address || gateLoading} onClick={refreshGate}>
                  {gateLoading ? 'Checking…' : 'Check access'}
                </button>
              </div>

              {gateError ? <div className="error">{gateError}</div> : null}

              {gateDetails ? (
                <div className="checks">
                  <div className="check">
                    <div>
                      <div><b>Jetton #1</b></div>
                      <small>{gateDetails.jetton1.master}</small>
                    </div>
                    <span className={`pill ${gateDetails.jetton1.ok ? 'good' : 'bad'}`}>
                      {gateDetails.jetton1.balance}
                    </span>
                  </div>
                  <div className="check">
                    <div>
                      <div><b>Jetton #2</b></div>
                      <small>{gateDetails.jetton2.master}</small>
                    </div>
                    <span className={`pill ${gateDetails.jetton2.ok ? 'good' : 'bad'}`}>
                      {gateDetails.jetton2.balance}
                    </span>
                  </div>
                  <div className="check">
                    <div>
                      <div><b>NFT in collection</b></div>
                      <small>{gateDetails.nft.collection}</small>
                    </div>
                    <span className={`pill ${gateDetails.nft.ok ? 'good' : 'bad'}`}>
                      {gateDetails.nft.count}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="note">
                  Нажмите <b>Check access</b> — проверим балансы jetton и наличие NFT через TonAPI.
                </div>
              )}
            </div>

            <div>
              <div className="sectionTitle">
                <span>2) Mint через Factory</span>
                <span className={`pill ${gateOk ? 'good' : 'bad'}`}>{gateOk ? 'READY' : 'LOCKED'}</span>
              </div>

              <div className="note">
                Factory форвардит сообщение в вашу существующую коллекцию. Вставьте base64 BOC тела mint‑сообщения
                (в формате, который понимает контракт коллекции).
              </div>

              <div className="field">
                <div className="label">Forward value (TON)</div>
                <input className="input" value={forwardValueTon} onChange={(e) => setForwardValueTon(e.target.value)} />
              </div>

              <div className="field">
                <div className="label">Mint body (base64 BOC)</div>
                <textarea
                  className="textarea"
                  value={mintBodyB64}
                  onChange={(e) => setMintBodyB64(e.target.value)}
                  placeholder="te6cckEBAQEA..."
                />
              </div>

              <div className="btnRow">
                <button className="btn btnPrimary" disabled={!gateOk || !mintBodyB64} onClick={sendMint}>
                  Send mint
                </button>
              </div>

              <div className="note">
                Если транзакция отклоняется — чаще всего это неверный формат mint body или недостаточно TON в forward value.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

