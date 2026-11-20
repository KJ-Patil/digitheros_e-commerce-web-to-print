import { UserRole } from "@/types/database";

export interface SessionUser {
  id: string;
  email: string;
  full_name: string;
  company_name: string | null;
  phone?: string | null;
  role: UserRole;
}

export const DEMO_USERS: Record<string, SessionUser> = {
  customer: {
    id: "00000000-0000-0000-0000-000000000001",
    email: "customer@digitalheroes.demo",
    full_name: "Alex Miller",
    company_name: "Peak Coffee Roasters",
    role: "customer",
  },
  "customer-b": {
    id: "00000000-0000-0000-0000-000000000002",
    email: "customer-b@digitalheroes.demo",
    full_name: "Jordan Lee",
    company_name: "Alpine Enduro Club",
    role: "customer",
  },
  admin: {
    id: "00000000-0000-0000-0000-000000000099",
    email: "admin@digitalheroes.demo",
    full_name: "Sarah Connor",
    company_name: "Digital Heroes Factory Floor",
    role: "admin",
  },
};

/**
 * Server-side authorization guard
 * Validates that the active user possesses the required role before running sensitive operations.
 */
export function assertUserRole(user: SessionUser | null, requiredRole: UserRole): boolean {
  if (!user) {
    throw new Error("UNAUTHORIZED: Session authentication required.");
  }
  if (requiredRole === "admin" && user.role !== "admin") {
    throw new Error("FORBIDDEN: Administrative privileges required.");
  }
  return true;
}

/**
 * Server-side ownership validator (Simulates RLS checks)
 * Validates that customer A cannot inspect or modify customer B's resource.
 */
export function assertResourceOwnership(
  user: SessionUser | null,
  resourceCustomerId: string
): boolean {
  if (!user) {
    throw new Error("UNAUTHORIZED: Session authentication required.");
  }
  // Admins have operational access to all customer records
  if (user.role === "admin") {
    return true;
  }
  if (user.id !== resourceCustomerId) {
    throw new Error("ACCESS DENIED: You cannot view or modify another customer's records.");
  }
  return true;
}

/**
 * Production File Gate Validator
 * Production files can NEVER be accessed by customers, and can only be downloaded by staff
 * once the associated proof is confirmed approved.
 */
export function assertProductionFileAccess(
  user: SessionUser | null,
  isProofApproved: boolean
): boolean {
  if (!user) {
    throw new Error("UNAUTHORIZED: Session authentication required.");
  }
  if (user.role !== "admin") {
    throw new Error("ACCESS DENIED: Production files are strictly restricted to factory staff.");
  }
  if (!isProofApproved) {
    throw new Error("APPROVAL GATE LOCKED: Customer has not approved this proof revision.");
  }
  return true;
}
