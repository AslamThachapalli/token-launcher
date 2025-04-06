import {
    createInitializeMetadataPointerInstruction,
    createInitializeMint2Instruction,
    ExtensionType,
    getMintLen,
    LENGTH_SIZE,
    TOKEN_2022_PROGRAM_ID,
    TYPE_SIZE,
} from "@solana/spl-token";
import {
    createInitializeInstruction,
    pack,
    TokenMetadata,
} from "@solana/spl-token-metadata";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Keypair, SystemProgram, Transaction } from "@solana/web3.js";
import { PinataSDK } from "pinata";
import { useState } from "react";

const pinata = new PinataSDK({
    pinataJwt: import.meta.env.VITE_PINATA_JWT,
    pinataGateway: import.meta.env.VITE_PINATA_GATEWAY,
});

import "./LauncherForm.css";

export function LauncherForm() {
    const [name, setName] = useState("");
    const [symbol, setSymbol] = useState("");
    const [decimals, setDecimals] = useState("");
    const [description, setDescription] = useState("");
    const [image, setImage] = useState<File | null>(null);

    const wallet = useWallet();
    const { connection } = useConnection();

    const handleImageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setImage(e.target.files[0]);
        }
    };

    const uploadImage = async (file: File): Promise<string | undefined> => {
        try {
            const upload = await pinata.upload.public.file(file);
            return upload.cid;
        } catch (error) {
            console.error(error);
            return;
        }
    };

    const uploadMetadata = async (imageUrl: string) => {
        try {
            const metadata = {
                name,
                symbol,
                description,
                image: imageUrl,
                attributes: [],
                properties: {
                    files: [
                        {
                            uri: imageUrl,
                            type: "image/jpeg",
                        },
                    ],
                },
            };

            const upload = await pinata.upload.public.json(metadata);
            return upload.cid;
        } catch (error) {
            console.error(error);
            return;
        }
    };

    const handleCreateToken = async () => {
        if (!wallet.connected) {
            return;
        }

        if (!image) {
            alert("Please attach an image");
            return;
        }

        const cid = await uploadImage(image);

        if (!cid) {
            alert("Failed to upload image");
            return;
        }

        const imageIpfsLink = await pinata.gateways.public.convert(cid);

        const metadataCid = await uploadMetadata(imageIpfsLink);

        if (!metadataCid) {
            alert("Failed to upload metadata");
            return;
        }

        const metadataIpfsLink = await pinata.gateways.public.convert(
            metadataCid
        );

        console.log("metadata ipfs link: " + metadataIpfsLink);

        const mintKeypair = Keypair.generate();

        const metadata: TokenMetadata = {
            mint: mintKeypair.publicKey,
            name: name,
            symbol: symbol,
            uri: metadataIpfsLink,
            additionalMetadata: [["description", description]],
        };

        const mintLen = getMintLen([ExtensionType.MetadataPointer]);
        const metadataLen = TYPE_SIZE + LENGTH_SIZE + pack(metadata).length;

        const lamports = await connection.getMinimumBalanceForRentExemption(
            mintLen + metadataLen
        );

        const transaction = new Transaction().add(
            SystemProgram.createAccount({
                fromPubkey: wallet.publicKey!,
                newAccountPubkey: mintKeypair.publicKey,
                space: mintLen,
                lamports,
                programId: TOKEN_2022_PROGRAM_ID,
            }),
            createInitializeMetadataPointerInstruction(
                mintKeypair.publicKey,
                wallet.publicKey!,
                mintKeypair.publicKey,
                TOKEN_2022_PROGRAM_ID
            ),
            createInitializeMint2Instruction(
                mintKeypair.publicKey,
                Number(decimals),
                wallet.publicKey!,
                null,
                TOKEN_2022_PROGRAM_ID
            ),
            createInitializeInstruction({
                programId: TOKEN_2022_PROGRAM_ID,
                mint: mintKeypair.publicKey,
                metadata: mintKeypair.publicKey,
                name,
                symbol,
                uri: metadataIpfsLink,
                mintAuthority: wallet.publicKey!,
                updateAuthority: wallet.publicKey!,
            })
        );

        transaction.feePayer = wallet.publicKey!;
        transaction.recentBlockhash = (
            await connection.getLatestBlockhash()
        ).blockhash;
        transaction.partialSign(mintKeypair);

        const txHash = await wallet.sendTransaction(transaction, connection);
        console.log("mint address: " + mintKeypair.publicKey.toBase58());
        console.log("tx hash: " + txHash);
    };

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
                        placeholder="Name"
                        maxLength={32}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                    <input
                        className="launcher-form-input-grid-item"
                        type="text"
                        placeholder="Symbol"
                        maxLength={8}
                        value={symbol}
                        onChange={(e) => setSymbol(e.target.value)}
                    />
                </div>
                <div className="launcher-form-input-grid">
                    <input
                        className="launcher-form-input-grid-item"
                        type="number"
                        placeholder="Decimals"
                        value={decimals}
                        onChange={(e) => {
                            const value = parseInt(e.target.value);
                            if (value >= 1 && value <= 9) {
                                setDecimals(e.target.value);
                            }
                        }}
                    />
                    <input
                        className="launcher-form-input-grid-item"
                        type="text"
                        placeholder="Description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>
                <input
                    className="launcher-form-input-image"
                    type="file"
                    accept="image/*"
                    placeholder="Attach image"
                    onChange={handleImageInputChange}
                />
                <button
                    onClick={wallet.connected ? handleCreateToken : () => {}}
                >
                    {wallet.connected ? "Create Token" : "Connect Wallet"}
                </button>
            </div>
        </div>
    );
}
