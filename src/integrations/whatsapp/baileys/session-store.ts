// Copyright (c) 2026 QRslice. All rights reserved.
// server-only guard - only enforce in Next.js server runtime
try {
  if (process.env.NEXT_RUNTIME) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require("server-only");
  }
} catch {}
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import type { AuthenticationState, AuthenticationCreds, SignalDataTypeMap } from "@whiskeysockets/baileys";
import crypto from "crypto";

// Encryption key derived from APP_CRYPTO_SECRET
function getEncryptionKey(keyId: string): Buffer {
  const secret = process.env.APP_CRYPTO_SECRET!;
  return crypto.createHash("sha256").update(`${secret}:${keyId}`).digest();
}

function encrypt(data: string, keyId: string): Buffer {
  const key = getEncryptionKey(keyId);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(data, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]);
}

function decrypt(encryptedData: Buffer, keyId: string): string {
  const key = getEncryptionKey(keyId);
  const iv = encryptedData.subarray(0, 16);
  const authTag = encryptedData.subarray(16, 32);
  const encrypted = encryptedData.subarray(32);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

export class BaileysSessionStore {
  private supabase = createSupabaseAdmin();

  async getAuthState(tenantId: string): Promise<AuthenticationState | null> {
    const { data, error } = await this.supabase
      .from("whatsapp_sessions")
      .select("session_data, encryption_key_id")
      .eq("tenant_id", tenantId)
      .single();

    if (error || !data) {
      return null;
    }

    try {
      const decrypted = decrypt(data.session_data as Buffer, data.encryption_key_id);
      const parsed = JSON.parse(decrypted) as AuthenticationState;
      return parsed;
    } catch {
      return null;
    }
  }

  async saveAuthState(tenantId: string, state: AuthenticationState): Promise<void> {
    const keyId = "default";
    const serialized = JSON.stringify(state);
    const encrypted = encrypt(serialized, keyId);

    const { error } = await this.supabase.from("whatsapp_sessions").upsert({
      tenant_id: tenantId,
      session_data: encrypted,
      encryption_key_id: keyId,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      throw new Error(`Failed to save auth state: ${error.message}`);
    }
  }

  async clearAuthState(tenantId: string): Promise<void> {
    const { error } = await this.supabase.from("whatsapp_sessions").delete().eq("tenant_id", tenantId);

    if (error) {
      throw new Error(`Failed to clear auth state: ${error.message}`);
    }
  }
}