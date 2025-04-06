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
import { toast } from "sonner";

const pinata = new PinataSDK({
    pinataJwt: import.meta.env.VITE_PINATA_JWT,
    pinataGateway: import.meta.env.VITE_PINATA_GATEWAY,
});

import "./LauncherForm.css";
import { TokenInfo } from "../TokenInfo/TokenInfo";

export function LauncherForm() {
    const [formData, setFormData] = useState({
        name: "",
        symbol: "",
        decimals: "",
        description: "",
        image: null as File | null,
    });
    const [isCreating, setIsCreating] = useState(false);

    const wallet = useWallet();
    const { connection } = useConnection();

    const validateForm = () => {
        if (!formData.name.trim()) {
            toast.error("Token name is required");
            return false;
        }
        if (!formData.symbol.trim()) {
            toast.error("Token symbol is required");
            return false;
        }
        if (!formData.decimals) {
            toast.error("Decimals value is required");
            return false;
        }
        if (!formData.description.trim()) {
            toast.error("Token description is required");
            return false;
        }
        if (!formData.image) {
            toast.error("Token image is required");
            return false;
        }
        if (formData.image.size > 5 * 1024 * 1024) {
            // 5MB limit
            toast.error("Image size should be less than 5MB");
            return false;
        }
        return true;
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, files } = e.target;

        if (type === "file" && files) {
            const file = files[0];
            if (!file.type.startsWith("image/")) {
                toast.error("Please upload an image file");
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                toast.error("Image size should be less than 5MB");
                return;
            }
            setFormData((prev) => ({
                ...prev,
                image: file,
            }));
            return;
        }

        if (name === "decimals") {
            const numValue = parseInt(value);
            if (value && (isNaN(numValue) || numValue < 1 || numValue > 9)) {
                toast.error("Decimals must be between 1 and 9");
                return;
            }
            setFormData((prev) => ({
                ...prev,
                [name]: value,
            }));
            return;
        }

        if (name === "symbol" && value.length > 8) {
            toast.error("Symbol cannot exceed 8 characters");
            return;
        }

        if (name === "name" && value.length > 32) {
            toast.error("Name cannot exceed 32 characters");
            return;
        }

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const uploadToIpfs = async (
        data: any,
        type: "file" | "json"
    ): Promise<string> => {
        const loadingId = toast.loading(`Uploading ${type} to IPFS...`);
        try {
            const upload =
                type === "file"
                    ? await pinata.upload.public.file(data)
                    : await pinata.upload.public.json(data);

            const ipfsLink = await pinata.gateways.public.convert(upload.cid);
            toast.success(`Successfully uploaded ${type} to IPFS`, {
                id: loadingId,
            });
            return ipfsLink;
        } catch (error) {
            console.error(`Failed to upload ${type}:`, error);
            toast.error(`Failed to upload ${type} to IPFS`, {
                id: loadingId,
            });
            throw new Error(`Failed to upload ${type}`);
        }
    };

    const createMetadata = (imageUrl: string) => ({
        name: formData.name.trim(),
        symbol: formData.symbol.trim(),
        description: formData.description.trim(),
        image: imageUrl,
        attributes: [],
        properties: {
            files: [
                {
                    uri: imageUrl,
                    type: formData.image?.type || "image/jpeg",
                },
            ],
        },
    });

    const buildTransaction = async (
        mintKeypair: Keypair,
        metadataIpfsLink: string
    ): Promise<Transaction> => {
        const metadata: TokenMetadata = {
            mint: mintKeypair.publicKey,
            name: formData.name.trim(),
            symbol: formData.symbol.trim(),
            uri: metadataIpfsLink,
            additionalMetadata: [["description", formData.description.trim()]],
        };

        const mintLen = getMintLen([ExtensionType.MetadataPointer]);
        const metadataLen = TYPE_SIZE + LENGTH_SIZE + pack(metadata).length;

        const lamports = await connection.getMinimumBalanceForRentExemption(
            mintLen + metadataLen
        );

        return new Transaction().add(
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
                Number(formData.decimals),
                wallet.publicKey!,
                null,
                TOKEN_2022_PROGRAM_ID
            ),
            createInitializeInstruction({
                programId: TOKEN_2022_PROGRAM_ID,
                mint: mintKeypair.publicKey,
                metadata: mintKeypair.publicKey,
                name: formData.name.trim(),
                symbol: formData.symbol.trim(),
                uri: metadataIpfsLink,
                mintAuthority: wallet.publicKey!,
                updateAuthority: wallet.publicKey!,
            })
        );
    };

    const handleCreateToken = async () => {
        if (!wallet.connected) {
            toast.error("Please connect your wallet first");
            return;
        }

        if (!validateForm()) return;

        setIsCreating(true);
        const loadingId = toast.loading("Creating your token...");
        try {
            const imageIpfsLink = await uploadToIpfs(formData.image, "file");
            const metadata = createMetadata(imageIpfsLink);
            const metadataIpfsLink = await uploadToIpfs(metadata, "json");

            const mintKeypair = Keypair.generate();
            const transaction = await buildTransaction(
                mintKeypair,
                metadataIpfsLink
            );

            transaction.feePayer = wallet.publicKey!;
            transaction.recentBlockhash = (
                await connection.getLatestBlockhash()
            ).blockhash;
            transaction.partialSign(mintKeypair);

            const txHash = await wallet.sendTransaction(
                transaction,
                connection
            );

            toast.success(
                <TokenInfo
                    mint={mintKeypair.publicKey.toBase58()}
                    txHash={txHash}
                />,
                {
                    id: loadingId,
                    duration: 60000,
                    closeButton: true,
                }
            );

            // Reset form after successful creation
            setFormData({
                name: "",
                symbol: "",
                decimals: "",
                description: "",
                image: null,
            });
        } catch (error) {
            console.error("Token creation failed:", error);
            toast.error("Failed to create token. Please try again.", {
                id: loadingId,
            });
        } finally {
            setIsCreating(false);
        }
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
