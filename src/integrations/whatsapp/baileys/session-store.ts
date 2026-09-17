// Copyright (c) 2026 QRslice. All rights reserved.
// server-only guard - only enforce in Next.js server runtime
try {
  if (process.env.NEXT_RUNTIME) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require("server-only");
  }
} catch {}
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import type { AuthenticationState } from "@whiskeysockets/baileys";
import crypto from "crypto";

const CURRENT_KEY_ID = "v1";
const SUPPORTED_KEY_IDS = ["v1"] as const;

function validateTenantId(tenantId: string): void {
  if (!tenantId || typeof tenantId !== "string" || tenantId.trim().length === 0) {
    throw new Error("Invalid tenantId: must be a non-empty string");
  }
}

function validateKeyId(keyId: string): void {
  if (!SUPPORTED_KEY_IDS.includes(keyId as typeof SUPPORTED_KEY_IDS[number])) {
    throw new Error(`Unsupported encryption key ID: ${keyId}. Supported: ${SUPPORTED_KEY_IDS.join(", ")}`);
  }
}

function getEncryptionKey(keyId: string): Buffer {
  validateKeyId(keyId);
  const secret = process.env.APP_CRYPTO_SECRET;
  if (!secret) {
    throw new Error("APP_CRYPTO_SECRET environment variable is not set");
  }
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
  if (encryptedData.length < 32) {
    throw new Error("Invalid encrypted data: too short");
  }
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
    validateTenantId(tenantId);

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
    } catch (error) {
      console.error(`[WhatsApp:${tenantId}] Failed to decrypt session data (keyId: ${data.encryption_key_id}):`, error);
      throw new Error(`Session decryption failed for tenant ${tenantId}: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async saveAuthState(tenantId: string, state: AuthenticationState): Promise<void> {
    validateTenantId(tenantId);

    const keyId = CURRENT_KEY_ID;
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
    validateTenantId(tenantId);

    const { error } = await this.supabase.from("whatsapp_sessions").delete().eq("tenant_id", tenantId);

    if (error) {
      throw new Error(`Failed to clear auth state: ${error.message}`);
    }
  }

  async rotateKey(tenantId: string, newKeyId: string): Promise<void> {
    validateTenantId(tenantId);
    validateKeyId(newKeyId);

    const { data, error: fetchError } = await this.supabase
      .from("whatsapp_sessions")
      .select("session_data, encryption_key_id")
      .eq("tenant_id", tenantId)
      .single();

    if (fetchError || !data) {
      throw new Error(`No session found for tenant ${tenantId}`);
    }

    const decrypted = decrypt(data.session_data as Buffer, data.encryption_key_id);
    const reEncrypted = encrypt(decrypted, newKeyId);

    const { error: updateError } = await this.supabase
      .from("whatsapp_sessions")
      .update({
        session_data: reEncrypted,
        encryption_key_id: newKeyId,
        updated_at: new Date().toISOString(),
      })
      .eq("tenant_id", tenantId);

    if (updateError) {
      throw new Error(`Failed to rotate key: ${updateError.message}`);
    }
  }
}
