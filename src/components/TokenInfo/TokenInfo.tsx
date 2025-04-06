import { Copy } from "lucide-react";
import "./TokenInfo.css";

export function TokenInfo({ mint, txHash }: { mint: string; txHash: string }) {
    return (
        <div className="token-info-container">
            <h5>Token created successfully!</h5>

            <div className="token-info-container-item">
                <h6>Mint Id: </h6>
                <div>
                    <p>{mint}</p>
                    <span>
                        <Copy
                            width={16}
                            height={16}
                            onClick={() => navigator.clipboard.writeText(mint)}
                        />
                    </span>
                </div>
            </div>
            <div className="token-info-container-item">
                <h6>Transaction Hash: </h6>
                <div>
                    <p>{txHash}</p>
                    <span>
                        <Copy
                            width={16}
                            height={16}
                            onClick={() =>
                                navigator.clipboard.writeText(txHash)
                            }
                        />
                    </span>
                </div>
            </div>
        </div>
    );
}
