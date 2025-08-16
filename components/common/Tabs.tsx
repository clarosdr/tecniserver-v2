
import React, { useState } from 'react';

interface TabConfig {
  key: string;
  label: React.ReactNode; // Changed from string to React.ReactNode
  content?: React.ReactNode; // Made content optional
  count?: number; // Optional count badge for the tab
  disabled?: boolean; // Optional: to disable a tab
}

interface TabsProps {
  tabs: TabConfig[];
  defaultActiveTabKey?: string;
  onTabChange?: (activeKey: string) => void;
  className?: string; // Allow passing custom class to the nav container
}

const Tabs: React.FC<TabsProps> = ({ tabs, defaultActiveTabKey, onTabChange, className }) => {
  const [activeTabKey, setActiveTabKey] = useState<string>(defaultActiveTabKey || (tabs.length > 0 ? tabs[0].key : ''));

  const handleTabClick = (key: string) => {
    const selectedTab = tabs.find(tab => tab.key === key);
    if (selectedTab && selectedTab.disabled) {
      return; // Do nothing if the tab is disabled
    }
    setActiveTabKey(key);
    if (onTabChange) {
      onTabChange(key);
    }
  };

  const activeTabContent = tabs.find(tab => tab.key === activeTabKey)?.content;

  return (
    <div>
      <div className={`mb-4 border-b border-slate-200 dark:border-slate-700 overflow-x-auto ${className || ''}`}>
        <nav className="-mb-px flex space-x-2 sm:space-x-4" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabClick(tab.key)}
              disabled={tab.disabled}
              className={`${
                activeTabKey === tab.key
                  ? 'border-primary text-primary dark:border-primary-light dark:text-primary-light'
                  : tab.disabled
                  ? 'border-transparent text-slate-400 dark:text-slate-500 cursor-not-allowed'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:border-slate-600'
              } whitespace-nowrap py-3 px-2 sm:px-3 border-b-2 font-medium text-sm transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-t-md`}
              aria-current={activeTabKey === tab.key ? 'page' : undefined}
            >
              {tab.label}
              {tab.count !== undefined && !tab.disabled && (
                <span className={`ml-2 px-1.5 py-0.5 rounded-full text-xs font-semibold ${
                  activeTabKey === tab.key
                    ? 'bg-primary text-white dark:bg-primary-light dark:text-primary-dark'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>
      <div className="tab-content">
        {activeTabContent !== undefined ? activeTabContent : null} 
        {/* Render content only if defined, otherwise render nothing for this part if Tabs component is used only for nav */}
      </div>
    </div>
  );
};

export default Tabs;
