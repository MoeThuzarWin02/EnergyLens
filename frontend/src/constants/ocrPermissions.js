
import { ROLES } from "./roles";

export const OCR_PERMISSIONS = Object.freeze({
  [ROLES.MANAGER]: {
    view: true,
    upload: true,
    review: true,
    correct: true,
    approve: true,
    reject: true,
    delete: true,
  },

  [ROLES.ANALYST]: {
    view: true,
    upload: false,
    review: true,
    correct: false,
    approve: false,
    reject: false,
    delete: false,
  },

  [ROLES.STAFF]: {
    view: true,
    upload: true,
    review: true,
    correct: true,
    approve: true,
    reject: true,
    delete: false,
  },

  [ROLES.STAKEHOLDER]: {
    view: false,
    upload: false,
    review: false,
    correct: false,
    approve: false,
    reject: false,
    delete: false,
  },
});

export function canPerformOCRAction(role, action) {
  return OCR_PERMISSIONS[role]?.[action] === true;
}
