
export const ROLES = Object.freeze({
  MANAGER: "manager",
  ANALYST: "analyst",
  STAFF: "staff",
  STAKEHOLDER: "stakeholder",
});

export const ROLE_LABELS = Object.freeze({
  [ROLES.MANAGER]: "Manager",
  [ROLES.ANALYST]: "Analyst",
  [ROLES.STAFF]: "Staff",
  [ROLES.STAKEHOLDER]: "Stakeholder",
});

export const ROLE_PERMISSIONS = Object.freeze({
  [ROLES.MANAGER]: {
    view: true,
    create: true,
    update: true,
    delete: true,
    manageUsers: true,
    manageFacilities: true,
    runAnalysis: true,
  },

  [ROLES.ANALYST]: {
    view: true,
    create: false,
    update: false,
    delete: false,
    manageUsers: false,
    manageFacilities: false,
    runAnalysis: true,
  },

  [ROLES.STAFF]: {
    view: true,
    create: true,
    update: true,
    delete: false,
    manageUsers: false,
    manageFacilities: false,
    runAnalysis: false,
  },

  [ROLES.STAKEHOLDER]: {
    view: true,
    create: false,
    update: false,
    delete: false,
    manageUsers: false,
    manageFacilities: false,
    runAnalysis: false,
  },
});

export function isValidRole(role) {
  return Object.values(ROLES).includes(role);
}
