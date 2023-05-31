'use client';

import { toast, Toaster } from "react-hot-toast";
import {
  Connection,
  SystemProgress,
  Transaction,
  PublicKey,
  LAMPORTS_PER_SOL,
  SendTransactionError,
  clusterApiUrl,
  SystemProgram,
} from "@solana/web3.js"
import { useState, useEffect } from "react";

import { useStorageUpload } from "@thirdweb-dev/react";

const SOLANA_NETWORK = "devnet";

export default function Home() {
  const [publicKey, setPublicKey] = useState(null);
  const [balance, setBalance] = useState(0);
  const [destinationWallet, setDestinationWallet] = useState("");
  const [amount, setAmount] = useState(0);
  const [explorerLink, setExplorerLink] = useState("");
  const [uploadUrl, setUploadUrl] = useState(null);
  const [url, setUrl] = useState(null);
  const [statusText, setStatusText] = useState("");

  useEffect(() => {
    let key = window.localStorage.getItem("publicKey");

    // if key is null dont do anything
    if(!key) return;
    setPublicKey(key);
    getBalance(key);
    if(explorerLink) setExplorerLink(null);
  }, []);

  const signIn = async () => {
    const provider = window?.phantom?.solana;
    const {solana} = window;

    if(!provider?.isPhantom || !solana.isPhantom) {
      toast.error("Phantom no esta instalado");
      setTimeout(() => {
        window.open("https://phantom.app/", "_blank");
      }, 2000);
      return;
    }   

    let phantom;
    if(provider?.isPhantom) phantom = provider;

    const {publicKey} = await phantom.connect();
    // console.log("publicKey", publicKey.toString());
    setPublicKey(publicKey);
    window.localStorage.setItem("publicKey", publicKey.toString() );

    getBalance(publicKey.toString());

    toast.success("Conectado a Phantom");
  }

  const signOut = async () => {
    const provider = window?.phantom?.solana;
    const {solana} = window;
    
    if(!provider?.isPhantom || !solana.isPhantom) {
      toast.error("Phantom no esta instalado");
      setTimeout(() => {
        window.open("https://phantom.app/", "_blank");
      }, 2000);
      return;
    }

    let phantom;
    if(provider?.isPhantom) phantom = provider;

    await phantom.disconnect();
    setPublicKey(null);
    window.localStorage.removeItem("publicKey");

    toast.success("Desconectado de Phantom");
  }

  const getBalance = async(publicKey) => {
    try{ 
    const connection = new Connection(
      clusterApiUrl(SOLANA_NETWORK),
      "confirmed"
    );

    const balance = await connection.getBalance(
      new PublicKey(publicKey)
    );
    
    setBalance(balance / LAMPORTS_PER_SOL);
    // console.log(balance/LAMPORTS_PER_SOL);
    }catch(error){
    console.error("ERROR GET BALANCE", error);
    toast.error("Something went wrong getting the balance");
    }
  }

  const handleDestinationWalletChange = (e) => {
    setDestinationWallet(e.target.value);
  }

  const handleAmountChange = (e) => {
    setAmount(e.target.value);
  }

  const handleSubmit = async () => {
    sendTransaction();
  }

  const sendTransaction = async() => {
    try{
      getBalance(publicKey.toString());
      
      if(balance < amount){
        toast.error("No tienes suficiente SOL para enviar");
        return;
      }

      const provider = window?.phantom?.solana;
      const connection = new Connection(
        clusterApiUrl(SOLANA_NETWORK),
        "confirmed"
      );

      const fromPubKey = new PublicKey(publicKey.toString());
      const toPubKey = new PublicKey(destinationWallet.toString());

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: fromPubKey,
          toPubkey: toPubKey,
          lamports: amount * LAMPORTS_PER_SOL,
        })
      );

      const {blockhash} = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = fromPubKey;

      const signed = await provider.signTransaction(transaction);

      const signature = await connection.sendRawTransaction(signed.serialize());

      const confirmation = await connection.confirmTransaction(signature,{
        commitment: "singleGossip",
      });

      const slot = confirmation.value?.slot;
      
      const solanaExplorerLink = `https://explorer.solana.com/tx/${signature}?cluster=${SOLANA_NETWORK}`;
      setExplorerLink(solanaExplorerLink);
      toast.success(`Transacción enviada con éxito en el bloque ${slot}`)

      getBalance(publicKey.toString())
      setAmount(0)
      setDestinationWallet("")
    }catch(error){
      console.error("ERROR SEND TRANSACTION", error);
      toast.error("Something went wrong sending the transaction");
    }
  }

  const handleUrlChange = (e) => {
    setUrl(e.target.value);
  }

  const {mutateAsync: upload} = useStorageUpload();

  const uploadToIPFS = async (file) => {
    try{
      setStatusText("Subiendo a IPFS...");
      const uploadUrl = await upload({
        data: [file],
        options: {
          uploadWithGatewayUrl: true,
          uploadWithoutDirectory: true,
        },
      });
      return uploadUrl[0];
    }catch(error){
      console.error("ERROR UPLOAD TO IPFS", error);
      toast.error("Something went wrong uploading to IPFS");
    }
  }

  const urlToBlob = async (file) => {
    try{
      await fetch(url)
      .then((res) => res.blob())
      .then((myBlob) => {
        myBlob.name = "blob.png";

        file = new File([myBlob], "image.png", {
            type: myBlob.type,
        });
      });

      const uploadUrl = await uploadToIPFS(file);
      console.log("uploadUrl", uploadUrl);

      setStatusText(`La url de tu archivo es: ${uploadUrl} `);
      setUploadUrl(uploadUrl);

      return uploadUrl;
    }catch(error){
      console.error("ERROR URL TO BLOB", error);
      toast.error("Something went wrong converting the url to blob");
    }
  }

  return (
    <div className="flex flex-col w-screen h-screen bg-black">
      <div className="flex flex-col py-24 place-items-center justify-center">
        <h1 className="text-5xl font-bold pb-10 text-emerald-300">
          Superteach Starter        
        </h1>

        { publicKey ? (
          <div className="flex flex-col place-items-center justify-center space-y-10">
            <h2 className="text-2xl font-bold text-white">
              Tu dirección de wallet es {publicKey.toString()}
            </h2>

            <h3 className="text-xl font-bold text-white">
              Tu balance es de {balance} SOL
            </h3>

            <div className="grid grid-cols-1 gap-4 place-items-center">
              <input
                type="text"
                className="p-2 text-black rounded-2xl"
                placeholder="Ingresa la dirección de la wallet de destino"
                onChange={handleDestinationWalletChange}
              />

              <h4 className="text-lg font-bold text-white">
                Cantidad de SOL a enviar:
              </h4>

              <input
                type="number"
                className="p-2 text-black rounded-2xl"
                placeholder="Ingresa la cantidad de SOL a enviar"
                onChange={handleAmountChange}
              />

              <button
                type="submit"
                className="transition ease-in-out hover:-translate-y-1 hover:scale-110 duration-300 delay-150 inline-flex h-8 w-52 justify-center bg-green-500 font-bold text-white rounded-2xl items-center"
                onClick={handleSubmit}
                >
                  Enviar ⚡
                </button>
              
              {explorerLink && (
                <a href={explorerLink} target="_blank">
                  <span>
                    Ver transacción en Solana Explorer 🚀
                  </span> 
                </a>
              )}

              <input 
                className="p-2 text-black rounded-2xl"
                type="text" 
                onChange={handleUrlChange}
              />

              <button
                className="transition ease-in-out hover:-translate-y-1 hover:scale-110 duration-300 delay-150 inline-flex h-8 w-52 justify-center bg-orange-500 font-bold text-black rounded-2xl items-center"
                onClick={() => urlToBlob()}
              >
                {""} Subir a IPFS 🌌
              </button>

              <h3 className="text-md font-bold">
                {statusText}
              </h3>
            </div>

            <div className="flex flex-col place-items-center justify-center">
              <button
                type="submit"
                className="transition ease-in-out hover:-translate-y-1 hover:scale-110 duration-300 delay-150 inline-flex h-8 w-52 justify-center bg-purple-500 font-bold text-white rounded-2xl items-center"
                onClick={signOut}
              >
                  Desconectar Wallet 🛑
                </button>
            </div>
          </div>
        ) : (
        <div className="flex flex-col place-items-center justify-center">
          <button
            type="submit"
            className="transition ease-in-out hover:-translate-y-1 hover:scale-110 duration-300 delay-150 inline-flex h-8 w-52 justify-center bg-purple-500 font-bold text-white rounded-2xl items-center"
            onClick={signIn}
          >
              Conecta tu Wallet 👻
            </button>
        </div>
        )}

        <Toaster position="bottom-center" />

      </div>
    </div>
  )
}
