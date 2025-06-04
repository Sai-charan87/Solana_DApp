import { useState } from "react";
import "./App.css"; // Assuming you have some basic styles in App.css
import solanaImg from "./assets/solana.png"; // adjust path as needed

import {
  Connection,
  clusterApiUrl,
  PublicKey,
  LAMPORTS_PER_SOL,
  Transaction,
  SystemProgram,
} from "@solana/web3.js";

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

function App() {
  const [walletAddress, setWalletAddress] = useState(null);
  const [balance, setBalance] = useState(null);
  const [receiver, setReceiver] = useState("");
  const [amount, setAmount] = useState("");
  const [ledger, setLedger] = useState([]);

  const connectWallet = async () => {
    if (window.solana?.isPhantom) {
      const res = await window.solana.connect();
      const address = res.publicKey.toString();
      setWalletAddress(address);
      await fetchBalance(address);
    } else {
      alert("Please install Phantom Wallet!");
    }
  };

  const fetchBalance = async (addr = walletAddress) => {
    const publicKey = new PublicKey(addr);
    const bal = await connection.getBalance(publicKey);
    setBalance(bal / LAMPORTS_PER_SOL);
  };

  const airdropSol = async () => {
    const publicKey = new PublicKey(walletAddress);
    const sig = await connection.requestAirdrop(publicKey, LAMPORTS_PER_SOL);
    await connection.confirmTransaction(sig);
    setLedger((prev) => [
      ...prev,
      { type: "Airdrop", amount: 1, to: walletAddress, signature: sig },
    ]);
    fetchBalance();
  };

  const sendSol = async () => {
    const fromPubkey = new PublicKey(walletAddress);
    const toPubkey = new PublicKey(receiver);

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey,
        toPubkey,
        lamports: parseFloat(amount) * LAMPORTS_PER_SOL,
      })
    );

    const provider = window.solana;
    transaction.feePayer = fromPubkey;
    transaction.recentBlockhash = (
      await connection.getLatestBlockhash()
    ).blockhash;

    const signed = await provider.signTransaction(transaction);
    const signature = await connection.sendRawTransaction(signed.serialize());
    await connection.confirmTransaction(signature);

    setLedger((prev) => [
      ...prev,
      { type: "Send", amount, to: receiver, signature },
    ]);
    fetchBalance();
    alert("Transfer successful!");
  };

  return (
    <div className="split-container">
      <div className="left-panel">
        <div className="container">
          <header>
            <h1>welcome !!!</h1>
          </header>

          <div className="content">
            {!walletAddress ? (
              <button onClick={connectWallet} className="primary-btn">
                Connect Phantom
              </button>
            ) : (
              <>
                <div className="wallet-info">
                  <p>
                    <strong>Wallet:</strong> {walletAddress}
                  </p>
                  <p>
                    <strong>Balance:</strong>{" "}
                    {balance !== null ? `${balance} SOL` : "Loading..."}
                  </p>
                  <div className="btn-group">
                    <button onClick={fetchBalance}>🔄 Refresh</button>
                    <button onClick={airdropSol}>💸 Airdrop 1 SOL</button>
                  </div>
                </div>

                <div className="send-section">
                  <h3>Send SOL</h3>
                  <input
                    type="text"
                    placeholder="Recipient address"
                    value={receiver}
                    onChange={(e) => setReceiver(e.target.value)}
                  />
                  <input
                    type="number"
                    placeholder="Amount (SOL)"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                  <button onClick={sendSol}>Send</button>
                </div>

                <div className="ledger">
                  <h3>Ledger</h3>
                  <table>
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Amount (SOL)</th>
                        <th>To</th>
                        <th>Tx Signature</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ledger.map((item, idx) => (
                        <tr key={idx}>
                          <td>{item.type}</td>
                          <td>{item.amount}</td>
                          <td>{item.to}</td>
                          <td>
                            <a
                              href={`https://explorer.solana.com/tx/${item.signature}?cluster=devnet`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              View
                            </a>
                          </td>
                        </tr>
                      ))}
                      {ledger.length === 0 && (
                        <tr>
                          <td colSpan="4" style={{ textAlign: "center" }}>
                            No transactions yet
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="right-panel">
        <img
          src={solanaImg}
          alt="Crypto Illustration"
          className="illustration"
        />
      </div>
    </div>
  );
}

export default App;
