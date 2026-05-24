import { useState } from "react";

export default function TelebirrDeposit() {
  const [tab, setTab] = useState("fiat");
  const [amount, setAmount] = useState("");

  const quickAmounts = [100, 1000, 5000, 15000, 50000];

  return (
    <div className="max-w-sm mx-auto bg-white rounded-2xl shadow p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <img
          src="/telebirr-logo.png"
          alt="Telebirr"
          className="h-8 w-auto"
        />
        <span className="font-semibold text-lg">Telebirr</span>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-full p-1 mb-4">
        <button
          onClick={() => setTab("fiat")}
          className={`flex-1 py-2 rounded-full text-sm font-medium ${
            tab === "fiat"
              ? "bg-white shadow text-black"
              : "text-gray-500"
          }`}
        >
          Fiat
        </button>
        <button
          onClick={() => setTab("crypto")}
          className={`flex-1 py-2 rounded-full text-sm font-medium ${
            tab === "crypto"
              ? "bg-white shadow text-black"
              : "text-gray-500"
          }`}
        >
          Crypto
        </button>
      </div>

      {/* Amount Input */}
      <div className="mb-3">
        <label className="text-sm text-gray-600">Amount</label>
        <div className="flex items-center border rounded-lg px-3 py-2 mt-1">
          <span className="text-gray-500 mr-2">ETB</span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="100"
            className="flex-1 outline-none"
          />
        </div>
        <p className="text-xs text-gray-400 mt-1">
          from ETB 100 to ETB 75,000
        </p>
      </div>

      {/* Quick Amount Buttons */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {quickAmounts.map((value) => (
          <button
            key={value}
            onClick={() => setAmount(value)}
            className="border rounded-lg py-2 text-sm font-medium hover:bg-gray-100"
          >
            ETB {value.toLocaleString()}
          </button>
        ))}
      </div>

      {/* Deposit Button */}
      <button className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-lg">
        Deposit
      </button>
    </div>
  );
}
