"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [password, setPassword] = useState("");
  const [phoneCodeHash, setPhoneCodeHash] = useState("");
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSendCode = async () => {
    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phoneNumber }),
      });
      const data = await res.json();
      if (data.phoneCodeHash) {
        setPhoneCodeHash(data.phoneCodeHash);
        setStep(2);
      } else {
        setError(data.error || "Something went wrong.");
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleLogin = async () => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber,
          phoneCode,
          password,
          phoneCodeHash,
        }),
      });
      const data = await res.json();
      if (data.success) {
        router.push("/");
      } else {
        setError(data.error || "Something went wrong.");
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="p-8 bg-white rounded-lg shadow-md w-96">
        <h1 className="mb-4 text-2xl font-bold text-center">Kaustav Box</h1>
        {error && <p className="mb-4 text-red-500">{error}</p>}
        {step === 1 && (
          <div>
            <input
              type="text"
              placeholder="Phone Number"
              className="w-full p-2 mb-4 border rounded"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
            <button
              onClick={handleSendCode}
              className="w-full p-2 text-white bg-blue-500 rounded"
            >
              Send Code
            </button>
          </div>
        )}
        {step === 2 && (
          <div>
            <input
              type="text"
              placeholder="Phone Code"
              className="w-full p-2 mb-4 border rounded"
              value={phoneCode}
              onChange={(e) => setPhoneCode(e.target.value)}
            />
            <input
              type="password"
              placeholder="Password (if 2FA is enabled)"
              className="w-full p-2 mb-4 border rounded"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              onClick={handleLogin}
              className="w-full p-2 text-white bg-blue-500 rounded"
            >
              Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
