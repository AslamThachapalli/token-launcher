import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import "./Header.css";

export function Header() {
    return (
        <div className="header">
            <h1>Solana Token Launcher</h1>
            <WalletMultiButton />
        </div>
    );
}
