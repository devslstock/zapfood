export type Role = "OWNER" | "STAFF";

export type SessionData = {
  staffId: string;
  staffName: string;
  role: Role;
  storeId: string;
  storeName: string;
  storeSlug: string;
};
