import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

interface SettingsTabProps {
  restaurant: any;
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
      if (typeof window !== "undefined") {
        localStorage.setItem(`cafe_upi_${props.restaurant.id}`, props.settingsUpiId.trim());
      }
      
      const { error } = await supabase
        .from("restaurants")
        .update({
          name: props.settingsCafeName.trim(),
          tax_rate: props.settingsTaxRate,
          upi_id: props.settingsUpiId.trim(),
          upi_qr_url: props.settingsUpiQrUrl.trim(),
          phone: props.settingsPhone.trim(),
          address: props.settingsAddress.trim(),
        })
        .eq("id", props.restaurant.id);

      if (error) throw error;
      props.flash("ok", "Café configuration, UPI & tax settings updated successfully!");
    } catch (err: any) {
      props.flash("err", err.message || "Failed to update café settings");
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
      
      // Assume "public_assets" bucket exists or similar generic storage
      const { error, data } = await supabase.storage
        .from("images")
        .upload(`qr/${fileName}`, file, { cacheControl: "3600", upsert: true });
        
      if (error) {
        // Fallback for if "images" bucket doesn't exist just simulate or throw
        throw error;
      }
      
      const { data: { publicUrl } } = supabase.storage.from("images").getPublicUrl(`qr/${fileName}`);
      props.setSettingsUpiQrUrl(publicUrl);
      props.flash("ok", "UPI QR uploaded! Don't forget to save settings.");
    } catch (err: any) {
      console.error(err);
      props.flash("err", "Upload failed: " + err.message);
    } finally {
      setUploadingImage(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-stone-900 flex items-center gap-2">
            <span>⚙️ Café Core Settings & Financial Governance</span>
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            Global tax rules, official receipts info, and UPI payment setup.
          </p>
        </div>
      </div>

      <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8">
        <form onSubmit={handleSaveSettings} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-stone-500 uppercase tracking-wider block">
                Brand Name (Receipts & QR)
              </label>
              <input
                required
                className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-sm font-bold text-stone-900 focus:outline-none focus:border-amber-500 transition-colors"
                value={props.settingsCafeName}
                onChange={(e) => props.setSettingsCafeName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-stone-500 uppercase tracking-wider block">
                Tax Rate (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                required
                className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-sm font-bold text-stone-900 focus:outline-none focus:border-amber-500 transition-colors"
                value={props.settingsTaxRate}
                onChange={(e) => props.setSettingsTaxRate(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="space-y-2 pt-4 border-t border-stone-200/60">
            <label className="text-xs font-black text-stone-500 uppercase tracking-wider block">
              Direct-to-Bank UPI ID (Zero Commission)
            </label>
            <input
              placeholder="e.g. owner-name@okbank"
              className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-sm font-bold text-emerald-400 focus:outline-none focus:border-amber-500 transition-colors"
              value={props.settingsUpiId}
              onChange={(e) => props.setSettingsUpiId(e.target.value)}
            />
            <p className="text-[10px] text-stone-500">
              Payments sent directly to your bank. QR Café takes 0% cut.
            </p>
          </div>

          <div className="space-y-2 pt-4 border-t border-stone-200/60">
            <label className="text-xs font-black text-stone-500 uppercase tracking-wider block">
              Custom UPI QR Image (Optional)
            </label>
            <div className="flex items-center gap-4">
              {props.settingsUpiQrUrl && (
                <img src={props.settingsUpiQrUrl} alt="UPI QR" className="w-16 h-16 rounded-lg border border-stone-700 bg-white p-1" />
              )}
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                  className="w-full bg-white border border-stone-200 rounded-xl px-4 py-2 text-xs font-bold text-stone-600 focus:outline-none file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-black file:bg-stone-100 file:text-amber-400 hover:file:bg-stone-700 transition-colors cursor-pointer"
                />
                {uploadingImage && <p className="text-[10px] text-amber-500 mt-1">Uploading...</p>}
              </div>
            </div>
            <p className="text-[10px] text-stone-500">
              Upload your shop's official BharatPe / Paytm / PhonePe static QR code image to display to customers for accurate scanning.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-stone-200/60">
            <div className="space-y-2">
              <label className="text-xs font-black text-stone-500 uppercase tracking-wider block">
                Support Phone
              </label>
              <input
                className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-sm font-bold text-stone-900 focus:outline-none focus:border-amber-500 transition-colors"
                value={props.settingsPhone}
                onChange={(e) => props.setSettingsPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-stone-500 uppercase tracking-wider block">
                Address (For Receipts)
              </label>
              <input
                className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-sm font-bold text-stone-900 focus:outline-none focus:border-amber-500 transition-colors"
                value={props.settingsAddress}
                onChange={(e) => props.setSettingsAddress(e.target.value)}
              />
            </div>
          </div>

          <div className="pt-6">
            <button
              type="submit"
              disabled={savingSettings}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-sm uppercase tracking-widest shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {savingSettings ? "Saving Settings…" : "Save All Settings ✓"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
