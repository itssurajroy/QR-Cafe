// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import React from 'react';
import { SuperAdminProvider, useSuperAdmin } from '../features/super-admin/SuperAdminContext';
import { SuperAdminLayout } from '../features/super-admin/SuperAdminLayout';
import { DashboardTab } from '../features/super-admin/tabs/DashboardTab';
import { TenantsTab } from '../features/super-admin/tabs/TenantsTab';
import { ConfigTab } from '../features/super-admin/tabs/ConfigTab';
import { AuditTab } from '../features/super-admin/tabs/AuditTab';
import { StaffTab } from '../features/super-admin/tabs/StaffTab';
import { SubscriptionsTab } from '../features/super-admin/tabs/SubscriptionsTab';
import { BillingTab } from '../features/super-admin/tabs/BillingTab';
import { BroadcastTab } from '../features/super-admin/tabs/BroadcastTab';
import { ContentTab } from '../features/super-admin/tabs/ContentTab';
import { AnnouncementsTab } from '../features/super-admin/tabs/AnnouncementsTab';
import { SupportTab } from '../features/super-admin/tabs/SupportTab';
import { AnalyticsTab } from '../features/super-admin/tabs/AnalyticsTab';
import { SystemHealthTab } from '../features/super-admin/tabs/SystemHealthTab';
import { ApiKeysTab } from '../features/super-admin/tabs/ApiKeysTab';
import { CommandPalette } from '../features/super-admin/CommandPalette';
import { UsersTab } from '../features/super-admin/tabs/UsersTab';
import { OrdersTab } from '../features/super-admin/tabs/OrdersTab';
import { SettingsTab } from '../features/super-admin/tabs/SettingsTab';
import { TenantSlideOver } from '../features/super-admin/overlays/TenantSlideOver';
import { ProvisionTenantModal } from '../features/super-admin/overlays/ProvisionTenantModal';
import { SuperClientProps } from '../features/super-admin/types';

function TabRenderer() {
  const { tab } = useSuperAdmin();

  switch (tab) {
    case 'dashboard': return <DashboardTab />;
    case 'cafes': return <TenantsTab />;
    case 'config': return <ConfigTab />;
    case 'audit': return <AuditTab />;
    case 'staff': return <StaffTab />;
    case 'subscriptions': return <SubscriptionsTab />;
    case 'broadcast': return <BroadcastTab />;
    case 'content': return <ContentTab />;
    case 'users': return <UsersTab />;
    case 'billing': return <BillingTab />;
    case 'orders': return <OrdersTab />;
    case 'analytics': return <AnalyticsTab />;
    case 'settings': return <SettingsTab />;
    case 'announcements': return <AnnouncementsTab />;
    case 'support': return <SupportTab />;
    case 'system-health': return <SystemHealthTab />;
    case 'api-keys': return <ApiKeysTab />;
    default: return <DashboardTab />;
  }
}

export default function SuperClient(props: SuperClientProps) {
  return (
    <SuperAdminProvider initialData={props}>
      <SuperAdminLayout>
        <TabRenderer />
      </SuperAdminLayout>
      <TenantSlideOver />
      <ProvisionTenantModal />
      <CommandPalette />
    </SuperAdminProvider>
  );
}

