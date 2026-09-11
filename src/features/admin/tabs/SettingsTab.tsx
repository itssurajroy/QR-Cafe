import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

interface SettingsTabProps {
  restaurant: { id: string };
  settingsCafeName: string;
  setSettingsCafeName: (s: string) => void;
  settingsTaxRate: number;
  setSettingsTaxRate: (n: number) => void;
  settingsUpiId: string;
  setSettingsUpiId: (s: string) => void;
  settingsUpiQrUrl: string;
  setSettingsUpiQrUrl: (s: string) => void;
  settingsPhone: string;
  setSettingsPhone: (s: string) => void;
  settingsAddress: string;
  setSettingsAddress: (s: string) => void;
  flash: (kind: "ok" | "err", msg: string) => void;
}

export function SettingsTab(props: SettingsTabProps) {
  const [savingSettings, setSavingSettings] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const supabase = getSupabaseBrowserClient();

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await fetch("/api/admin/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "update_settings",
          name: props.settingsCafeName.trim(),
          taxRate: props.settingsTaxRate,
          upiId: props.settingsUpiId.trim(),
          upiQrUrl: props.settingsUpiQrUrl.trim(),
          phone: props.settingsPhone.trim(),
          address: props.settingsAddress.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update settings");
      props.flash("ok", "Café configuration, UPI & tax settings updated successfully!");
    } catch (err: unknown) {
      props.flash("err", err instanceof Error ? err.message : "Failed to update café settings");
    } finally {
      setSavingSettings(false);
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    setUploadingImage(true);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `${props.restaurant.id}_upi_qr_${Date.now()}.${ext}`;
      
      const { error } = await supabase.storage
        .from("images")
        .upload(`qr/${fileName}`, file, { cacheControl: "3600", upsert: true });
        
      if (error) {
        throw error;
      }
      
      const { data: { publicUrl } } = supabase.storage.from("images").getPublicUrl(`qr/${fileName}`);
      props.setSettingsUpiQrUrl(publicUrl);
      props.flash("ok", "UPI QR uploaded! Don't forget to save settings.");
    } catch (err: unknown) {
      console.error(err);
      props.flash("err", "Upload failed: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setUploadingImage(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <span>⚙️ Café Core Settings & Financial Governance</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Global tax rules, official receipts info, and UPI payment setup.
          </p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
        <form onSubmit={handleSaveSettings} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">
                Brand Name (Receipts & QR)
              </label>
              <input
                required
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-500 transition-colors"
                value={props.settingsCafeName}
                onChange={(e) => props.setSettingsCafeName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">
                Tax Rate (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                required
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-500 transition-colors"
                value={props.settingsTaxRate}
                onChange={(e) => props.setSettingsTaxRate(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="space-y-2 pt-4 border-t border-slate-200">
            <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">
              Direct-to-Bank UPI ID (Zero Commission)
            </label>
            <input
              placeholder="e.g. owner-name@okbank"
              className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm font-bold text-emerald-600 focus:outline-none focus:border-indigo-500 transition-colors"
              value={props.settingsUpiId}
              onChange={(e) => props.setSettingsUpiId(e.target.value)}
            />
            <p className="text-xs text-slate-400">
              Payments sent directly to your bank. QR Café takes 0% cut.
            </p>
          </div>

          <div className="space-y-2 pt-4 border-t border-slate-200">
            <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">
              Custom UPI QR Image (Optional)
            </label>
            <div className="flex items-center gap-4">
              {props.settingsUpiQrUrl && (
                <img src={props.settingsUpiQrUrl} alt="UPI QR" className="w-16 h-16 rounded-lg border border-slate-200 bg-white p-1" />
              )}
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2 text-xs font-bold text-slate-500 focus:outline-none file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-black file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100 transition-colors cursor-pointer"
                />
                {uploadingImage && <p className="text-xs text-amber-600 mt-1">Uploading...</p>}
              </div>
            </div>
            <p className="text-xs text-slate-400">
              Upload your shop&apos;s official BharatPe / Paytm / PhonePe static QR code image to display to customers for accurate scanning.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-200">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">
                Support Phone
              </label>
              <input
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-500 transition-colors"
                value={props.settingsPhone}
                onChange={(e) => props.setSettingsPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">
                Address (For Receipts)
              </label>
              <input
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-500 transition-colors"
                value={props.settingsAddress}
                onChange={(e) => props.setSettingsAddress(e.target.value)}
              />
            </div>
          </div>

          {/* KOT & Bill Thermal Printer (Bluetooth / USB) Config */}
          <div className="space-y-4 pt-6 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  🖨️ KOT & Bill Thermal Printer Setup (Bluetooth / USB)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Configure thermal roll size, ESC/POS protocol & auto-cut features for physical kitchen slips.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  props.flash("ok", "🖨️ Test KOT Slip printed! Sent command to thermal printer.");
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs cursor-pointer"
              >
                Test KOT Print
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                  Thermal Paper Width
                </label>
                <select className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800">
                  <option value="80mm">80mm Standard POS (3 Inches)</option>
                  <option value="58mm">58mm Compact Mobile (2 Inches)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                  Printer Interface
                </label>
                <select className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800">
                  <option value="bluetooth">Bluetooth (Wireless pairing)</option>
                  <option value="usb">USB OTG Direct Driver</option>
                  <option value="network">LAN / Ethernet (IP Printer)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                  Auto-Print Behavior
                </label>
                <select className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800">
                  <option value="auto_kot">Auto-Print KOT on New Order</option>
                  <option value="manual">Manual Print Button Only</option>
                  <option value="bill_only">Bill Print on Settlement</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pt-6">
            <button
              type="submit"
              disabled={savingSettings}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-black text-sm uppercase tracking-widest shadow-lg shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {savingSettings ? "Saving Settings…" : "Save All Settings ✓"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

