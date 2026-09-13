import type { Role, PermissionFlags } from "@/lib/domain";

export type { Role };

export type SessionData = {
  staffId: string;
  staffName: string;
  role: Role;
  permissions: PermissionFlags;
  storeId: string;
  storeName: string;
  storeSlug: string;
};

export type PlatformSessionData = {
  adminId: string;
  adminName: string;
  adminEmail: string;
};
