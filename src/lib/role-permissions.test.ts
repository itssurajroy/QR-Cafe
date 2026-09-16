// Copyright (c) 2026 QRslice. All rights reserved.
import { describe, expect, it } from "vitest";
import { canAccessTab, getDefaultTabForRole, getRoleBadge, ALLOWED_TABS, ROLE_BADGES } from "./role-permissions";

describe("Role Permissions & RBAC Matrix", () => {
  describe("canAccessTab", () => {
    it("allows staff to access only operational execution tabs", () => {
      expect(canAccessTab("staff", "orders")).toBe(true);
      expect(canAccessTab("staff", "kitchen")).toBe(true);
      expect(canAccessTab("staff", "tables")).toBe(true);
      expect(canAccessTab("staff", "bookings")).toBe(true);
      expect(canAccessTab("staff", "support")).toBe(true);

      // Forbidden for staff
      expect(canAccessTab("staff", "dashboard")).toBe(false);
      expect(canAccessTab("staff", "menu")).toBe(false);
      expect(canAccessTab("staff", "categories")).toBe(false);
      expect(canAccessTab("staff", "inventory")).toBe(false);
      expect(canAccessTab("staff", "analytics")).toBe(false);
      expect(canAccessTab("staff", "crm")).toBe(false);
      expect(canAccessTab("staff", "staff")).toBe(false);
      expect(canAccessTab("staff", "settings")).toBe(false);
      expect(canAccessTab("staff", "billing")).toBe(false);
      expect(canAccessTab("staff", "integrations")).toBe(false);
    });

    it("allows manager to access operations, analytics, catalog, and staff directory, but not billing or settings", () => {
      expect(canAccessTab("manager", "dashboard")).toBe(true);
      expect(canAccessTab("manager", "orders")).toBe(true);
      expect(canAccessTab("manager", "menu")).toBe(true);
      expect(canAccessTab("manager", "inventory")).toBe(true);
      expect(canAccessTab("manager", "recipes")).toBe(true);
      expect(canAccessTab("manager", "analytics")).toBe(true);
      expect(canAccessTab("manager", "crm")).toBe(true);
      expect(canAccessTab("manager", "staff")).toBe(true);

      // Forbidden for manager (Owner only)
      expect(canAccessTab("manager", "billing")).toBe(false);
      expect(canAccessTab("manager", "settings")).toBe(false);
      expect(canAccessTab("manager", "account")).toBe(false);
      expect(canAccessTab("manager", "branding")).toBe(false);
      expect(canAccessTab("manager", "integrations")).toBe(false);
      expect(canAccessTab("manager", "webhooks")).toBe(false);
    });

    it("normalizes legacy 'admin' role to manager permissions", () => {
      expect(canAccessTab("admin", "dashboard")).toBe(true);
      expect(canAccessTab("admin", "menu")).toBe(true);
      expect(canAccessTab("admin", "billing")).toBe(false);
      expect(canAccessTab("admin", "settings")).toBe(false);
    });

    it("allows owner full access to all tabs including billing and settings", () => {
      expect(canAccessTab("owner", "dashboard")).toBe(true);
      expect(canAccessTab("owner", "orders")).toBe(true);
      expect(canAccessTab("owner", "menu")).toBe(true);
      expect(canAccessTab("owner", "billing")).toBe(true);
      expect(canAccessTab("owner", "settings")).toBe(true);
      expect(canAccessTab("owner", "account")).toBe(true);
      expect(canAccessTab("owner", "branding")).toBe(true);
      expect(canAccessTab("owner", "integrations")).toBe(true);
    });

    it("defaults undefined / null roles to staff restrictions", () => {
      expect(canAccessTab(undefined, "orders")).toBe(true);
      expect(canAccessTab(undefined, "billing")).toBe(false);
      expect(canAccessTab(null, "settings")).toBe(false);
      expect(canAccessTab(null, "dashboard")).toBe(false);
    });
  });

  describe("getDefaultTabForRole", () => {
    it("returns 'orders' for staff", () => {
      expect(getDefaultTabForRole("staff")).toBe("orders");
      expect(getDefaultTabForRole(undefined)).toBe("orders");
      expect(getDefaultTabForRole(null)).toBe("orders");
    });

    it("returns 'dashboard' for manager, admin, and owner", () => {
      expect(getDefaultTabForRole("manager")).toBe("dashboard");
      expect(getDefaultTabForRole("admin")).toBe("dashboard");
      expect(getDefaultTabForRole("owner")).toBe("dashboard");
    });
  });

  describe("getRoleBadge", () => {
    it("returns correct badges and icons", () => {
      const ownerBadge = getRoleBadge("owner");
      expect(ownerBadge.label).toBe("Owner");
      expect(ownerBadge.icon).toBe("👑");

      const managerBadge = getRoleBadge("manager");
      expect(managerBadge.label).toBe("Manager");
      expect(managerBadge.icon).toBe("🛡️");

      const adminBadge = getRoleBadge("admin");
      expect(adminBadge.label).toBe("Manager");

      const staffBadge = getRoleBadge("staff");
      expect(staffBadge.label).toBe("Staff");
      expect(staffBadge.icon).toBe("👤");
    });
  });
});
