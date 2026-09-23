// Copyright (c) 2026 QRslice. All rights reserved.

export interface DataBreachIncident {
  incidentId?: string;
  detectedAt: Date;
  affectedUserScope: "single" | "multiple" | "all";
  affectedUserIds?: string[];
  dataCategoriesCompromised: string[];
  description: string;
  severity: "low" | "medium" | "high" | "critical";
}

export class PrivacyBreachLogger {
  /**
   * Formats and logs a data breach incident.
   * Under DPDP Act, significant breaches must be reported to the DPBI (Data Protection Board of India).
   * 
   * This utility structures the payload and securely logs it. It could be extended 
   * to automatically trigger an email/webhook to the compliance team or DPBI portal.
   */
  static async logBreach(incident: DataBreachIncident): Promise<void> {
    const payload = {
      incident_id: incident.incidentId || crypto.randomUUID(),
      detected_at: incident.detectedAt.toISOString(),
      logged_at: new Date().toISOString(),
      affected_user_scope: incident.affectedUserScope,
      affected_user_count: incident.affectedUserIds?.length || 0,
      affected_user_ids: incident.affectedUserIds || [],
      data_categories_compromised: incident.dataCategoriesCompromised,
      description: incident.description,
      severity: incident.severity,
      compliance_window_expiry: new Date(incident.detectedAt.getTime() + (72 * 60 * 60 * 1000)).toISOString() // 72 hour window typical for DPAs
    };

    // In a production scenario, this might write to a secure SIEM, audit table, or trigger a PagerDuty alert.
    // For now, we output structured JSON to the application logs for the monitoring stack (Datadog/CloudWatch) to pick up.
    console.error(
      JSON.stringify({
        event: "DPDP_DATA_BREACH_LOGGED",
        ...payload
      })
    );

    // If severity is critical, we might proactively disable affected accounts or initiate an emergency lockdown
    if (incident.severity === "critical") {
      await this.triggerEmergencyLockdown(payload.incident_id);
    }
  }

  private static async triggerEmergencyLockdown(incidentId: string): Promise<void> {
    console.warn(`[EMERGENCY LOCKDOWN] Triggered for incident: ${incidentId}`);
    // Future integration: call Supabase Admin API to suspend affected users or pause the project.
  }
}
