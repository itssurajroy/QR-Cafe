"use client";

import React from 'react';
import { SuperSidebar } from './SuperSidebar';
import { SuperHeader } from './SuperHeader';

export function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-slate-50 dark:bg-stone-950">
      <SuperSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <SuperHeader />
        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
