"use client";

import { cn } from "@/lib/utils";
import {
  Search,
  MessageCircle,
  Bell,
  ChevronDown,
  Menu,
  Home,
  Package,
  ShoppingBag,
  Shirt,
  Megaphone,
  BarChart3,
  PieChart,
  Plus,
  HelpCircle,
  ChevronRight,
} from "lucide-react";

function SallaLogo() {
  return (
    <svg width="96" height="60" viewBox="0 0 96 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-10 w-auto">
      <g clipPath="url(#clip0_header)">
        <path d="M95.1221 38.4126L92.8085 19.1257C92.1863 13.9329 87.7723 10.0157 82.5415 10.0157H60.4443C55.2135 10.0157 50.7995 13.9329 50.1771 19.1257L47.8659 38.4126C47.5143 41.3462 48.4363 44.2966 50.3983 46.5064C52.3579 48.7178 55.1777 49.9842 58.1331 49.9842H84.8551C87.8079 49.9842 90.6279 48.7178 92.5899 46.5064C94.5493 44.2972 95.4739 41.3468 95.1221 38.4126ZM88.7845 43.1546C87.7343 44.3378 86.2853 44.9886 84.7059 44.9886H58.2829C56.7011 44.9886 55.2515 44.3378 54.2043 43.1546C53.1541 41.9716 52.6817 40.4562 52.8689 38.8858L55.1541 19.8151C55.4823 17.0785 57.8097 15.0115 60.5681 15.0115H82.4183C85.1759 15.0115 87.5041 17.0779 87.8321 19.8151L90.1197 38.8858C90.3071 40.4562 89.8315 41.9716 88.7845 43.1546Z" fill="#A4FFE5"/>
        <path d="M84.7695 32.491C84.4057 31.9334 83.8469 31.5508 83.1955 31.4138C82.5429 31.2766 81.8783 31.4016 81.3205 31.7648C74.6673 36.1038 68.1925 36.1032 61.5267 31.7642C60.9689 31.401 60.3025 31.276 59.6517 31.4144C59.0003 31.552 58.4421 31.9352 58.0789 32.4928C57.7157 33.0506 57.5913 33.7164 57.7291 34.3678C57.8667 35.0192 58.2499 35.5774 58.8075 35.9406C62.9731 38.6524 67.2197 40.027 71.4293 40.027C75.6397 40.027 79.8831 38.6518 84.0427 35.9394C84.6003 35.5756 84.9827 35.0168 85.1199 34.3654C85.2577 33.7146 85.1333 33.0488 84.7695 32.491Z" fill="#A4FFE5"/>
        <path d="M39.4435 22.0812L37.0797 22.8957C37.3377 23.7302 37.6555 24.9217 37.6555 25.6166C37.6555 26.3713 37.1787 26.8281 36.2651 26.8281C35.3317 26.8281 34.7757 26.6093 34.7757 25.3779V23.2528H32.2731V25.3779C32.2731 26.6093 31.7171 26.8281 30.7237 26.8281C29.7503 26.8281 29.1945 26.6093 29.1945 25.3779V23.2528H26.6719V25.358C26.6719 26.6093 25.9963 26.8274 24.5467 26.8274C23.0573 26.8274 22.5407 26.5296 22.5407 24.9006V15.7852H19.899V25.0407C19.899 26.5501 19.3824 26.8281 17.8936 26.8281H17.893C16.7208 26.8281 16.0265 26.5906 16.0265 25.1006V18.2673H13.5431V19.6788C8.83557 20.6504 7.14795 22.6172 7.14795 25.0806C7.14795 27.4232 8.69659 28.9338 10.9606 28.9338C12.6501 28.9338 13.5026 28.0794 13.8809 26.9271C14.2186 28.9731 15.4084 30.1635 17.7304 30.1647L17.734 30.1653C19.502 30.1653 20.4947 29.3706 20.9117 28.1592C21.4283 29.5096 22.5999 30.1653 24.3873 30.1653C26.0355 30.1653 27.1081 29.5694 27.5249 28.338C27.9419 29.5894 28.9353 30.1653 30.3455 30.1653C31.7559 30.1653 32.7293 29.5694 33.1261 28.3181C33.5431 29.5694 34.5565 30.1653 36.1849 30.1653C38.6477 30.1653 40.1571 28.5561 40.1571 25.6365C40.1583 24.564 39.8603 23.0939 39.4435 22.0812ZM13.5437 25.0202C13.1473 25.338 12.3915 25.5773 11.2791 25.5773C10.2658 25.5773 9.25369 25.3 9.25369 24.6238C9.25369 23.8879 10.3057 23.1537 13.5431 22.6172V25.0202H13.5437Z" fill="#A4FFE5"/>
        <path d="M14.8842 17.6492C15.6903 17.6492 16.3537 17.0643 16.3537 16.2426C16.3537 15.3737 15.6583 14.8359 14.8842 14.8359C14.0782 14.8359 13.3984 15.3888 13.3984 16.2426C13.3984 17.1121 14.1253 17.6492 14.8842 17.6492Z" fill="#A4FFE5"/>
        <path d="M11.5625 17.6492C12.3685 17.6492 13.0319 17.0643 13.0319 16.2426C13.0319 15.3737 12.3365 14.8359 11.5625 14.8359C10.7564 14.8359 10.0767 15.3888 10.0767 16.2426C10.0767 17.1121 10.8035 17.6492 11.5625 17.6492Z" fill="#A4FFE5"/>
        <path d="M0.0317383 44.3845L0.422675 42.2607C1.18702 42.8045 2.54653 43.2969 3.68431 43.2969C4.66981 43.2969 5.24745 42.9743 5.24745 42.4305C5.24745 40.9525 0.116934 42.3283 0.116934 38.7441C0.116934 36.8753 1.66316 35.6523 4.16043 35.6523C5.50243 35.6523 6.74291 36.0263 7.62629 36.4849L7.20153 38.5575C6.36889 38.1157 5.31573 37.7079 4.29639 37.7079C3.36225 37.7079 2.78461 38.0643 2.78461 38.5743C2.78461 40.1205 7.91511 38.7955 7.91511 42.1417C7.91511 43.9767 6.16527 45.2673 3.58279 45.2673C2.03657 45.2679 0.796087 44.8093 0.0317383 44.3845Z" fill="#A4FFE5"/>
        <path d="M16.5101 35.9575H19.1941V45.0123H16.5101V43.5175C15.7796 44.6045 14.7434 45.2335 13.4014 45.2335C11.1246 45.2335 8.93311 43.6197 8.93311 40.4765C8.93311 37.3333 11.0225 35.6855 13.4014 35.6855C14.7264 35.6855 15.7627 36.1779 16.5101 37.1635V35.9575ZM16.5101 40.4427C16.0177 38.7605 15.0322 37.9115 13.9107 37.9115C12.7047 37.9115 11.7699 38.8117 11.7699 40.4427C11.7699 42.0565 12.721 43.0081 13.9277 43.0081C15.1005 43.0075 16.0684 41.9713 16.5101 40.4427Z" fill="#A4FFE5"/>
        <path d="M21.165 45.0135V33.0703H23.849V45.0135H21.165Z" fill="#A4FFE5"/>
        <path d="M25.8198 45.0135V33.0703H28.5038V45.0135H25.8198Z" fill="#A4FFE5"/>
        <path d="M37.6097 35.9575H40.2937V45.0123H37.6097V43.5175C36.8793 44.6045 35.8429 45.2335 34.5009 45.2335C32.2243 45.2335 30.0327 43.6197 30.0327 40.4765C30.0327 37.3333 32.1221 35.6855 34.5009 35.6855C35.8261 35.6855 36.8623 36.1779 37.6097 37.1635V35.9575ZM37.6097 40.4427C37.1173 38.7605 36.1319 37.9115 35.0103 37.9115C33.8043 37.9115 32.8695 38.8117 32.8695 40.4427C32.8695 42.0565 33.8207 43.0081 35.0273 43.0081C36.1995 43.0075 37.1681 41.9713 37.6097 40.4427Z" fill="#A4FFE5"/>
      </g>
      <defs>
        <clipPath id="clip0_header">
          <rect width="95.4" height="40" fill="white" transform="translate(0 10)"/>
        </clipPath>
      </defs>
    </svg>
  );
}

const PRIMARY_TABS = [
  { label: "All", icon: Menu },
  { label: "Home", icon: Home, active: true },
  { label: "Orders", icon: Package },
  { label: "Products", icon: Shirt },
  { label: "Marketing", icon: Megaphone },
  { label: "Sales Channels", icon: BarChart3 },
  { label: "Reports", icon: PieChart },
];

const SECONDARY_TABS = [
  { label: "Dashboard", active: true },
  { label: "Ad Management" },
  { label: "Media Library" },
  { label: "Invoices" },
  { label: "Settings" },
];

export function GlobalHeader() {
  return (
    <header className="shrink-0">
      {/* Top bar — dark teal */}
      <div className="bg-[#004956] px-14 py-4">
        <div className="flex items-center gap-5">
          {/* Logo */}
          <SallaLogo />

          {/* Primary nav tabs */}
          <nav className="flex flex-1 items-center gap-2.5">
            {PRIMARY_TABS.map((tab) => (
              <button
                key={tab.label}
                type="button"
                className={cn(
                  "flex items-center gap-1 rounded px-4 py-2 text-base font-medium transition-colors",
                  tab.active
                    ? "bg-[#a4ffe5] text-[#004956] font-bold"
                    : "text-white hover:bg-white/10"
                )}
              >
                <tab.icon className="size-5" />
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Right: search, messages, notifications, avatar */}
          <div className="flex items-center gap-4">
            <button type="button" className="text-white hover:text-[#a4ffe5]">
              <Search className="size-5" />
            </button>
            <button type="button" className="text-white hover:text-[#a4ffe5]">
              <MessageCircle className="size-5" />
            </button>
            <button type="button" className="text-white hover:text-[#a4ffe5]">
              <Bell className="size-5" />
            </button>

            {/* User */}
            <button type="button" className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-white/10">
              <div className="size-10 rounded-full bg-white/20" />
              <div className="text-right">
                <p className="text-sm text-white">Abdullah</p>
                <span className="rounded-full border border-[#a4ffe5] px-2 py-0.5 text-xs text-[#a4ffe5]">
                  Special
                </span>
              </div>
              <ChevronDown className="size-4 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Sub-header — white */}
      <div className="flex h-16 items-center gap-6 border-b border-border bg-white px-14">
        {/* Secondary tabs */}
        <nav className="flex flex-1 items-center gap-4">
          {SECONDARY_TABS.map((tab) => (
            <button
              key={tab.label}
              type="button"
              className={cn(
                "px-0.5 py-2 text-base font-medium transition-colors",
                tab.active
                  ? "border-b-2 border-[#004956] font-bold text-[#004956]"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Action buttons */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="flex h-10 items-center gap-1 rounded-lg border-2 border-[#a4ffe5] bg-[#a4ffe5] px-3 text-sm font-medium text-[#004956]"
          >
            <Plus className="size-4" />
            Create Ad
          </button>
          <button
            type="button"
            className="flex h-10 items-center gap-1 rounded-lg border border-[#a4ffe5] bg-white px-3 text-sm font-medium text-[#004956]"
          >
            <HelpCircle className="size-4" />
            Help Center
          </button>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 px-14 py-3">
        <span className="text-sm text-muted-foreground">Marketing</span>
        <ChevronRight className="size-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Advertisements</span>
        <ChevronRight className="size-4 text-muted-foreground" />
        <span className="text-sm font-medium text-[#004956]">Ad Management</span>
      </div>
    </header>
  );
}
