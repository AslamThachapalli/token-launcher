import { TokenInfo } from "../TokenInfo/TokenInfo";
import { useLaunchToken } from "./useLaunchToken";
import { toast } from "sonner";

import "./LauncherForm.css";

export function LauncherForm() {
    const {
        formData,
        handleInputChange,
        handleCreateToken,
        isCreating,
        wallet,
    } = useLaunchToken({
        successCallback: (mint, txHash) => {
            toast.success(<TokenInfo mint={mint} txHash={txHash} />, {
                duration: 60000,
                closeButton: true,
            });
        },
    });

    return (
        <div className="launcher-form-container">
            <div className="launcher-form-header">
                <h1>Solana Token Launcher</h1>
                <p>Easily create your own Solana SPL Token without coding</p>
            </div>
            <div className="launcher-form">
                <div className="launcher-form-input-grid">
                    <input
                        className="launcher-form-input-grid-item"
                        type="text"
                        name="name"
                        placeholder="Name"
                        maxLength={32}
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                    />
                    <input
                        className="launcher-form-input-grid-item"
                        type="text"
                        name="symbol"
                        placeholder="Symbol"
                        maxLength={8}
                        value={formData.symbol}
                        onChange={handleInputChange}
                        required
                    />
                </div>
                <div className="launcher-form-input-grid">
                    <input
                        className="launcher-form-input-grid-item"
                        type="number"
                        name="decimals"
                        placeholder="Decimals"
                        value={formData.decimals}
                        onChange={handleInputChange}
                        min="1"
                        max="9"
                        required
                    />
                    <input
                        className="launcher-form-input-grid-item"
                        type="text"
                        name="description"
                        placeholder="Description"
                        value={formData.description}
                        onChange={handleInputChange}
                        required
                    />
                </div>
                <input
                    className="launcher-form-input-image"
                    type="file"
                    name="image"
                    accept="image/*"
                    placeholder="Attach image"
                    onChange={handleInputChange}
                    required
                />
                <button
                    onClick={handleCreateToken}
                    disabled={!wallet.connected || isCreating}
                >
                    {wallet.connected ? "Create Token" : "Connect Wallet"}
                </button>
            </div>
        </div>
    );
}
