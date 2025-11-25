export type UserRole = "OWNER" | "CR_MANAGMENT" | "TEAMLEAD" | "USER" | "WORKER";

export interface User {
  id: string;
  email: string;
  name: string | null;
  role?: string;
}

// For database user objects that might only have role property
export interface DBUser {
  role: UserRole;
}

export const hasAdminAccess = (user: User | DBUser | null): boolean => {
  if (!user || !user.role) return false;
  
  return ["OWNER", "CR_MANAGMENT", "TEAMLEAD"].includes(user.role);
};

export const hasOwnerOrCRManagementAccess = (user: User | DBUser | null): boolean => {
  if (!user || !user.role) return false;
  
  return ["OWNER", "CR_MANAGMENT"].includes(user.role);
};

export const hasOwnerAccess = (user: User | DBUser | null): boolean => {
  if (!user || !user.role) return false;
  
  return user.role === "OWNER";
};

export const hasTeamLeadAccess = (user: User | DBUser | null): boolean => {
  if (!user || !user.role) return false;
  
  return user.role === "TEAMLEAD";
};