import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import "./Header.css";

export function Header() {
    return (
        <div className="header">
            <div className="header-title">
                <h1>Solana Token Launcher</h1>
                <div className="header-title-network">Devnet</div>
            </div>
            <WalletMultiButton />
        </div>
    );
}
