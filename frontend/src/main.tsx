import React from 'react';
import ReactDOM from 'react-dom/client';
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { Buffer } from 'buffer';
import App from './App';
import './styles.css';

// Some TON libs expect global Buffer in browser builds.
// Vite doesn't polyfill it automatically.
(globalThis as any).Buffer = (globalThis as any).Buffer ?? Buffer;

function computeManifestUrl(): string {
  const fromEnv = import.meta.env.VITE_TONCONNECT_MANIFEST_URL as string | undefined;
  if (fromEnv && fromEnv.trim()) return fromEnv.trim();

  // GitHub Pages build doesn't have runtime .env; use BASE_URL.
  // Example: origin=https://user.github.io, BASE_URL=/repo/
  const base = (import.meta.env.BASE_URL as string) || '/';
  const normalized = base.endsWith('/') ? base : `${base}/`;
  return `${window.location.origin}${normalized}tonconnect-manifest.json`;
}

class RootErrorBoundary extends React.Component<{ children: React.ReactNode }, { err?: string }> {
  state: { err?: string } = {};
  static getDerivedStateFromError(e: unknown) {
    return { err: e instanceof Error ? e.message : String(e) };
  }
  render() {
    if (this.state.err) {
      return (
        <div className="page">
          <div className="shell">
            <div className="card">
              <div style={{ fontWeight: 800, fontSize: 18 }}>App failed to start</div>
              <div className="note" style={{ marginTop: 10 }}>
                Проверьте, что `tonconnect-manifest.json` доступен и что сборка под GitHub Pages использует правильный base path.
              </div>
              <div className="error" style={{ marginTop: 12 }}>{this.state.err}</div>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const manifestUrl = computeManifestUrl();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RootErrorBoundary>
      <TonConnectUIProvider
        manifestUrl={manifestUrl}
        // Some networks block default bridges (tonapi/okx). Force a known-good bridge and wallet.
        walletsListConfiguration={{
          includeWallets: [
            {
              name: 'Tonkeeper',
              appName: 'tonkeeper',
              imageUrl: 'https://ton-connect.github.io/demo-dapp-with-wallet/images/tonkeeper.png',
              aboutUrl: 'https://tonkeeper.com',
              universalLink: 'https://app.tonkeeper.com/ton-connect',
              bridgeUrl: 'https://bridge.ton.org/bridge',
              platforms: ['ios', 'android', 'chrome', 'firefox', 'macos', 'windows', 'linux']
            }
          ]
        }}
      >
        <App />
      </TonConnectUIProvider>
    </RootErrorBoundary>
  </React.StrictMode>
);

