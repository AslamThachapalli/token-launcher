import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
    ConnectionProvider,
    WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import App from "./App.tsx";

import '@solana/wallet-adapter-react-ui/styles.css';
import "./index.css";

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <ConnectionProvider endpoint={`https://solana-devnet.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_API_KEY}`}>
            <WalletProvider wallets={[]} autoConnect>
                <WalletModalProvider>
                    <App />
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    </StrictMode>
);
