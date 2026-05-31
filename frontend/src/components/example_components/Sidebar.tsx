/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Home, ShoppingCart, History, Settings, ShieldAlert, Sparkles } from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onUpgradeClick: () => void;
}

export default function Sidebar({ currentTab, setCurrentTab, onUpgradeClick }: SidebarProps) {
  const menuItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'store', label: 'Store', icon: ShoppingCart },
    { id: 'history', label: 'History', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'admin', label: 'Admin', icon: ShieldAlert },
  ];

  return (
    <aside className="hidden md:flex h-[calc(100vh-4rem)] w-64 fixed left-0 top-16 bg-surface border-r border-outline-variant flex-col py-6 px-4 z-40">
      <div className="mb-8 px-2">
        <h2 className="font-headline text-2xl font-bold text-primary tracking-tight">MC Network</h2>
        <p className="text-secondary font-mono text-xs font-medium tracking-wider mt-0.5">PREMIUM TIER</p>
      </div>

      <nav className="flex-1 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all group duration-200 cursor-pointer text-left ${
                isActive
                  ? 'text-primary bg-primary-container/10 border-r-4 border-primary font-semibold'
                  : 'text-secondary hover:bg-surface-container-high hover:text-on-surface'
              }`}
            >
              <Icon
                size={20}
                className={isActive ? 'text-primary' : 'text-slate-400 group-hover:text-primary transition-colors'}
              />
              <span className="font-sans text-sm font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto p-4 bg-primary/5 rounded-xl border border-primary/15">
        <div className="flex items-center gap-2 mb-2 text-primary font-bold font-sans text-xs uppercase tracking-wider">
          <Sparkles size={14} />
          <span>Premium Perks</span>
        </div>
        <p className="text-on-surface-variant text-xs line-clamp-2 leading-relaxed mb-3">
          Tối ưu hóa thời gian tải, nhận x3 vàng và danh xưng VIP vĩnh viễn.
        </p>
        <button
          onClick={onUpgradeClick}
          className="w-full py-2 bg-primary text-on-primary font-mono text-xs font-semibold rounded-lg hover:bg-emerald-700 active:scale-[0.98] transition-all cursor-pointer shadow-sm shadow-primary/10"
        >
          Upgrade Plan
        </button>
      </div>
    </aside>
  );
}
