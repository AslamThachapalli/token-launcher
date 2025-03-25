import {
    createInitializeMint2Instruction,
    getMinimumBalanceForRentExemptMint,
    MINT_SIZE,
    TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import {
    Keypair,
    SystemProgram,
    Transaction,
} from "@solana/web3.js";

function App() {
    const wallet = useWallet();
    const { connection } = useConnection();

    const handleCreateToken = async () => {
        if (!wallet.connected) {
            return;
        }

        const keypair = Keypair.generate();

        const lamports = await getMinimumBalanceForRentExemptMint(connection);

        const transaction = new Transaction().add(
            SystemProgram.createAccount({
                fromPubkey: wallet.publicKey!,
                newAccountPubkey: keypair.publicKey,
                space: MINT_SIZE,
                lamports,
                programId: TOKEN_PROGRAM_ID,
            }),
            createInitializeMint2Instruction(
                keypair.publicKey,
                6,
                wallet.publicKey!,
                null,
                TOKEN_PROGRAM_ID
            )
        );

        transaction.feePayer = wallet.publicKey!;
        transaction.recentBlockhash = (
            await connection.getLatestBlockhash()
        ).blockhash;
        transaction.partialSign(keypair);

        const txHash = await wallet.sendTransaction(transaction, connection);
        console.log(txHash);
    };

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                justifyContent: "center",
                alignItems: "center",
                height: "100vh",
                width: "100vw",
            }}
        >
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                }}
            >
                <WalletMultiButton />
                <input type="text" placeholder="Name" />
                <input type="text" placeholder="Symbol" />
                <input type="text" placeholder="Decimals" />
                <input type="text" placeholder="Supply" />
                <input type="text" placeholder="Description" />
                <input type="text" placeholder="Image URL" />
            </div>
            <div>
                <button onClick={handleCreateToken}>Create Token</button>
            </div>
        </div>
    );
}

export default App;
