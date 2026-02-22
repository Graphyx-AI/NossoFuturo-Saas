import { NICHOS } from './config';

const DEFAULT_GRAPHYX_ADMIN = 'graphyx.ai@gmail.com';
const DEFAULT_LUMYF_ADMIN = 'lumyf@gmail.com';

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeWorkspaceId(value) {
  return String(value || '').trim().toLowerCase();
}

const graphyxAdminEmail = normalizeEmail(
  process.env.NEXT_PUBLIC_GRAPHYX_ADMIN_EMAIL || DEFAULT_GRAPHYX_ADMIN
);

const lumyfAdminEmail = normalizeEmail(
  process.env.NEXT_PUBLIC_LUMYF_ADMIN_EMAIL ||
  process.env.NEXT_PUBLIC_LUMIFY_ADMIN_EMAIL ||
  DEFAULT_LUMYF_ADMIN
);

const LUMIFY_NICHOS = {
  reddit: 'Reddit',
  youtube: 'Youtube',
  instagram: 'Instagram',
  facebook: 'Facebook',
  twitter: 'Twitter',
  lp: 'LP',
  ommigle: 'Ommigle',
  grupos: 'Grupos',
  outros: 'Outros'
};

export const DEFAULT_WORKSPACE_ID = 'graphyx';

export const WORKSPACES = {
  graphyx: {
    id: 'graphyx',
    appLabel: 'GRAPYX CRM',
    dashboardVariant: 'graphyx',
    adminEmails: [graphyxAdminEmail],
    niches: NICHOS
  },
  lumyf: {
    id: 'lumyf',
    appLabel: 'CRM LUMYF',
    dashboardVariant: 'lumyf',
    adminEmails: [lumyfAdminEmail],
    niches: LUMIFY_NICHOS
  },
  lumify: {
    id: 'lumify',
    appLabel: 'CRM LUMYF',
    dashboardVariant: 'lumyf',
    adminEmails: [lumyfAdminEmail],
    niches: LUMIFY_NICHOS
  }
};

export function getWorkspaceById(workspaceId) {
  const id = normalizeWorkspaceId(workspaceId);
  return WORKSPACES[id] || WORKSPACES[DEFAULT_WORKSPACE_ID];
}

export function resolveWorkspaceForEmail(email) {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;

  for (const workspace of Object.values(WORKSPACES)) {
    if (workspace.adminEmails.some(allowed => normalizeEmail(allowed) === normalized)) {
      return workspace;
    }
  }

  return null;
}

export function resolveWorkspaceForUser(user) {
  const workspaceFromMetadata =
    user?.user_metadata?.workspace ||
    user?.user_metadata?.workspace_id ||
    user?.app_metadata?.workspace ||
    user?.app_metadata?.workspace_id;

  const byMetadata = workspaceFromMetadata
    ? WORKSPACES[normalizeWorkspaceId(workspaceFromMetadata)]
    : null;

  if (byMetadata) return byMetadata;
  return resolveWorkspaceForEmail(user?.email);
}
