// Copyright (c) 2026 QRslice. All rights reserved.
import { createSupabaseServerClient } from "@/lib/supabase/server";

export class AgeVerificationHelper {
  /**
   * Checks if a user is marked as a minor and if they have verified parental consent.
   * If they are a minor without parental consent, tracking and profiling should be disabled.
   */
  static async canProcessMinorData(userId: string): Promise<boolean> {
    try {
      const supabase = await createSupabaseServerClient();
      
      const { data, error } = await supabase
        .from("dpdp_privacy_profiles")
        .select("is_minor, parent_consent_verified, parent_user_id")
        .eq("user_id", userId)
        .maybeSingle();

      if (error || !data) {
        return false; // Default to fail-safe if privacy profile cannot be loaded
      }

      // If they are not a minor, we can process their data
      if (!data.is_minor) {
        return true;
      }

      // If they are a minor, parental consent must be verified and linked
      if (data.parent_consent_verified && data.parent_user_id) {
        return true;
      }

      return false; // Minor without verified parental consent
    } catch (error) {
      console.error("Error in AgeVerificationHelper:", error);
      return false; // Fail secure
    }
  }

  /**
   * Updates a user's privacy profile with verified parental consent details.
   */
  static async registerParentalConsent(userId: string, parentUserId: string): Promise<boolean> {
    try {
      const supabase = await createSupabaseServerClient();
      
      const { error } = await supabase
        .from("dpdp_privacy_profiles")
        .update({
          parent_consent_verified: true,
          parent_user_id: parentUserId,
        })
        .eq("user_id", userId);

      return !error;
    } catch (error) {
      console.error("Error registering parental consent:", error);
      return false;
    }
  }
}
