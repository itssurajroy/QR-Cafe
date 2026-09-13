// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

function paise(n: number) {
  return `₹${(n / 100).toLocaleString("en-IN")}`;
}

export default function ReceiptPage({
  params,
}: {
  params: Promise<{ statusToken: string }>;
}) {
  const [token, setToken] = useState<string>("");
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    params.then((p) => setToken(p.statusToken));
  }, [params]);

  useEffect(() => {
    if (!token) return;
    async function fetchReceipt() {
      try {
        const res = await fetch(`/api/order-status/${token}`, { cache: "no-store" });
        const json = await res.json();
        if (res.ok) {
          setData(json);
        } else {
          setError(json.error || "Order not found");
        }
      } catch {
        setError("Failed to load receipt");
      }
    }
    fetchReceipt();
  }, [token]);

  if (error) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 shadow-2xl">
          <h2 className="text-xl font-black text-slate-900">Receipt Not Found</h2>
          <p className="text-sm text-slate-600 mt-2">{error}</p>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-6">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </main>
    );
  }

  const isUnpaid = data.payment_status === "unpaid";
  const dateStr = new Date(data.created_at).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const timeStr = new Date(data.created_at).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900 flex flex-col items-center py-10 px-4 font-mono antialiased">
      <div className="w-full max-w-sm bg-white border border-slate-200 shadow-xl rounded-sm">
        {/* Receipt Header */}
        <div className="p-6 border-b-2 border-dashed border-slate-300 text-center space-y-2">
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-widest">{data.restaurant_name}</h1>
          <p className="text-xs text-slate-500 uppercase">Order Receipt</p>
        </div>

        {/* Receipt Meta */}
        <div className="p-6 border-b-2 border-dashed border-slate-300 space-y-1.5 text-xs text-slate-700">
          <div className="flex justify-between">
            <span>Order No:</span>
            <span className="font-bold">#{data.order_number}</span>
          </div>
          <div className="flex justify-between">
            <span>Date:</span>
            <span>{dateStr}</span>
          </div>
          <div className="flex justify-between">
            <span>Time:</span>
            <span>{timeStr}</span>
          </div>
          <div className="flex justify-between">
            <span>Table:</span>
            <span className="font-bold">{data.table}</span>
          </div>
        </div>

        {/* Itemized List */}
        <div className="p-6 border-b-2 border-dashed border-slate-300 space-y-3">
          <div className="flex justify-between text-xs font-bold uppercase text-slate-400 mb-2">
            <span>Item</span>
            <span>Total</span>
          </div>
          
          {data.items?.map((it: any) => (
            <div key={it.id} className="flex justify-between items-start text-sm">
              <span className="text-slate-800 pr-4">
                {it.quantity}x {it.item_name}
              </span>
              <span className="text-slate-900 font-bold whitespace-nowrap">{paise(it.line_total_paise)}</span>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="p-6 border-b-2 border-slate-900 space-y-2">
          <div className="flex justify-between items-center text-lg font-black">
            <span>TOTAL</span>
            <span>{paise(data.total_paise)}</span>
          </div>
          <div className="flex justify-between items-center text-xs font-bold">
            <span>Status</span>
            <span className={`uppercase px-2 py-0.5 rounded ${isUnpaid ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>
              {isUnpaid ? "Unpaid" : "Paid"}
            </span>
          </div>
        </div>

        {/* UPI Payment Section (if unpaid and UPI available) */}
        {isUnpaid && data.upi_qr_url && (
          <div className="p-6 border-b-2 border-dashed border-slate-300 text-center space-y-3 bg-slate-50">
            <h3 className="text-xs font-bold uppercase text-slate-600">Scan to Pay via UPI</h3>
            <div className="flex justify-center">
              <Image 
                src={data.upi_qr_url} 
                alt="UPI QR Code" 
                width={150} 
                height={150} 
                className="border border-slate-200 rounded p-2 bg-white"
              />
            </div>
            {data.upi_id && (
              <p className="text-[10px] text-slate-500 font-sans">{data.upi_id}</p>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="p-6 text-center space-y-4">
          <p className="text-xs text-slate-500 font-medium">Thank you for your visit!</p>
          
          {data.google_review_url && (
            <a
              href={data.google_review_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block border border-slate-300 rounded px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              Leave a Review ★
            </a>
          )}
        </div>
      </div>
      
      {/* Powered by tag */}
      <div className="mt-8 text-[10px] text-slate-400 font-sans font-medium">
        Powered by QRslice
      </div>
    </main>
  );
}
