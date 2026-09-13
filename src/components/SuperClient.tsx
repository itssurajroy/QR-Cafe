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
import { HealthTab } from '../features/super-admin/tabs/HealthTab';
import { ContentTab } from '../features/super-admin/tabs/ContentTab';
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
    case 'health': return <HealthTab />;
    case 'content': return <ContentTab />;
    case 'users': return <div className="p-6 text-sm text-slate-500">Coming in a later task — section shell.</div>;
    case 'billing': return <BillingTab />;
    case 'orders': return <div className="p-6 text-sm text-slate-500">Coming in a later task — section shell.</div>;
    case 'analytics': return <div className="p-6 text-sm text-slate-500">Coming in a later task — section shell.</div>;
    case 'settings': return <div className="p-6 text-sm text-slate-500">Coming in a later task — section shell.</div>;
    case 'announcements': return <div className="p-6 text-sm text-slate-500">Coming in a later task — section shell.</div>;
    case 'support': return <div className="p-6 text-sm text-slate-500">Coming in a later task — section shell.</div>;
    case 'system-health': return <div className="p-6 text-sm text-slate-500">Coming in a later task — section shell.</div>;
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
    </SuperAdminProvider>
  );
}
