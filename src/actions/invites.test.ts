import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createWorkspaceInvite,
  acceptWorkspaceInvite,
  cancelWorkspaceInvite,
  removeWorkspaceMember,
  getWorkspaceInvites,
  getWorkspaceMembersWithProfiles,
} from "./invites";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn().mockReturnValue({
    from: () => ({
      insert: () => Promise.resolve({ error: null }),
      delete: () => ({ eq: () => Promise.resolve({ error: null }) }),
    }),
    auth: {
      admin: {
        getUserById: () =>
          Promise.resolve({
            data: { user: { email: "member@test.com" } },
            error: null,
          }),
      },
    },
  }),
}));
vi.mock("@/lib/email/resend", () => ({
  sendWorkspaceInviteEmail: vi.fn().mockResolvedValue({ ok: true }),
}));

const mockCreateClient = vi.mocked((await import("@/lib/supabase/server")).createClient);

function baseFrom(table: string) {
  if (table === "workspaces") {
    return {
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: { id: "ws-1", name: "Workspace" }, error: null }),
        }),
      }),
    };
  }

  if (table === "workspace_members") {
    return {
      select: () => ({
        eq: () => ({
          eq: () => ({
            not: () => ({
              single: () => Promise.resolve({ data: { role: "owner" }, error: null }),
            }),
            single: () => Promise.resolve({ data: { role: "editor" }, error: null }),
          }),
          not: () => Promise.resolve({ data: [{ user_id: "u2" }], error: null }),
        }),
      }),
      delete: () => ({
        eq: () => ({
          eq: () => Promise.resolve({ error: null }),
        }),
      }),
    };
  }

  if (table === "workspace_invites") {
    return {
      select: () => ({
        eq: () => ({
          eq: () => ({
            limit: () => Promise.resolve({ data: [], error: null }),
          }),
        }),
        order: () => Promise.resolve({ data: [], error: null }),
      }),
      insert: () => Promise.resolve({ error: null }),
      delete: () => ({ eq: () => Promise.resolve({ error: null }) }),
    };
  }

  if (table === "profiles") {
    return {
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: { full_name: "Owner" }, error: null }),
        }),
      }),
    };
  }

  return {
    select: () => ({
      eq: () => ({
        single: () => Promise.resolve({ data: null, error: null }),
      }),
    }),
  };
}

describe("invites actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("createWorkspaceInvite retorna erro sem usuario", async () => {
    mockCreateClient.mockResolvedValue({
      auth: { getUser: () => Promise.resolve({ data: { user: null } }) },
      from: () => ({}),
    } as never);

    const result = await createWorkspaceInvite("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11", "new@test.com", "editor");
    expect(result.ok).toBe(false);
  });

  it("createWorkspaceInvite valida email", async () => {
    mockCreateClient.mockResolvedValue({
      auth: { getUser: () => Promise.resolve({ data: { user: { id: "u1" } } }) },
      from: baseFrom,
    } as never);

    const result = await createWorkspaceInvite("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11", "invalid-email", "editor");
    expect(result.ok).toBe(false);
  });

  it("acceptWorkspaceInvite retorna erro com token invalido", async () => {
    mockCreateClient.mockResolvedValue({
      auth: { getUser: () => Promise.resolve({ data: { user: { id: "u2", email: "invited@test.com" } } }) },
      rpc: () => Promise.resolve({ data: [], error: null }),
    } as never);

    const result = await acceptWorkspaceInvite("bad-token");
    expect(result.ok).toBe(false);
  });

  it("cancelWorkspaceInvite retorna erro sem usuario", async () => {
    mockCreateClient.mockResolvedValue({
      auth: { getUser: () => Promise.resolve({ data: { user: null } }) },
      from: () => ({}),
    } as never);

    const result = await cancelWorkspaceInvite("inv-1");
    expect(result.ok).toBe(false);
  });

  it("removeWorkspaceMember bloqueia auto-remocao", async () => {
    mockCreateClient.mockResolvedValue({
      auth: { getUser: () => Promise.resolve({ data: { user: { id: "u1" } } }) },
      from: baseFrom,
    } as never);

    const result = await removeWorkspaceMember("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11", "u1");
    expect(result.ok).toBe(false);
  });

  it("getWorkspaceInvites retorna [] com workspace nulo", async () => {
    const result = await getWorkspaceInvites(null);
    expect(result).toEqual([]);
  });

  it("getWorkspaceMembersWithProfiles retorna [] com workspace nulo", async () => {
    const result = await getWorkspaceMembersWithProfiles(null);
    expect(result).toEqual([]);
  });
});
