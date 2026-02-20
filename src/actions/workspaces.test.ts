import { describe, it, expect, vi, beforeEach } from "vitest";
import { getWorkspacesForUser, getWorkspaceById } from "./workspaces";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

const mockCreateClient = vi.mocked(
  (await import("@/lib/supabase/server")).createClient
);

describe("workspaces actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getWorkspacesForUser", () => {
    it("retorna [] quando usuário não está logado", async () => {
      mockCreateClient.mockResolvedValue({
        auth: { getUser: () => Promise.resolve({ data: { user: null } }) },
        from: () => ({}),
      } as never);

      const result = await getWorkspacesForUser();
      expect(result).toEqual([]);
    });

    it("retorna [] quando usuário não tem membros", async () => {
      mockCreateClient.mockResolvedValue({
        auth: { getUser: () => Promise.resolve({ data: { user: { id: "u1" } } }) },
        from: () => ({
          select: () => ({
            eq: () => ({
              not: () => Promise.resolve({ data: [], error: null }),
            }),
          }),
        }),
      } as never);

      const result = await getWorkspacesForUser();
      expect(result).toEqual([]);
    });

    it("retorna workspaces quando usuário é membro", async () => {
      const workspaces = [
        { id: "ws-1", name: "Pessoal", slug: "pessoal", plan: "pro" },
      ];
      mockCreateClient.mockResolvedValue({
        auth: { getUser: () => Promise.resolve({ data: { user: { id: "u1" } } }) },
        from: (table: string) => {
          if (table === "workspace_members") {
            return {
              select: () => ({
                eq: () => ({
                  not: () => Promise.resolve({
                    data: [{ workspace_id: "ws-1" }],
                    error: null,
                  }),
                }),
              }),
            };
          }
          return {
            select: () => ({
              in: () => ({
                order: () => Promise.resolve({ data: workspaces, error: null }),
              }),
            }),
          };
        },
      } as never);

      const result = await getWorkspacesForUser();
      expect(result).toEqual(workspaces);
    });
  });

  describe("getWorkspaceById", () => {
    it("retorna null quando workspaceId é null", async () => {
      const result = await getWorkspaceById(null);
      expect(result).toBeNull();
    });

    it("retorna null quando usuário não logado", async () => {
      mockCreateClient.mockResolvedValue({
        auth: { getUser: () => Promise.resolve({ data: { user: null } }) },
        from: () => ({}),
      } as never);

      const result = await getWorkspaceById("ws-1");
      expect(result).toBeNull();
    });

    it("retorna workspace quando encontrado", async () => {
      const workspace = { id: "ws-1", name: "Meu", slug: "meu", plan: "pro" };
      mockCreateClient.mockResolvedValue({
        auth: { getUser: () => Promise.resolve({ data: { user: { id: "u1" } } }) },
        from: () => ({
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: workspace, error: null }),
            }),
          }),
        }),
      } as never);

      const result = await getWorkspaceById("ws-1");
      expect(result).toEqual(workspace);
    });
  });
});

