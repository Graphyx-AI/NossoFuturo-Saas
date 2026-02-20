export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
          onboarding_completed_at: string | null;
          onboarding_intent: "personal" | "family" | "business" | "other" | null;
        };
        Insert: {
          id: string;
          full_name?: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
          onboarding_completed_at?: string | null;
          onboarding_intent?: "personal" | "family" | "business" | "other" | null;
        };
        Update: {
          id?: string;
          full_name?: string;
          avatar_url?: string | null;
          updated_at?: string;
          onboarding_completed_at?: string | null;
          onboarding_intent?: "personal" | "family" | "business" | "other" | null;
        };
      };
      workspaces: {
        Row: {
          id: string;
          name: string;
          slug: string;
          plan: "pro";
          owner_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          plan?: "pro";
          owner_id: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["workspaces"]["Insert"]>;
      };
      workspace_members: {
        Row: {
          id: string;
          workspace_id: string;
          user_id: string;
          role: "owner" | "admin" | "editor" | "viewer";
          invited_by: string | null;
          accepted_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          user_id: string;
          role?: "owner" | "admin" | "editor" | "viewer";
          invited_by?: string | null;
          accepted_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["workspace_members"]["Insert"]>;
      };
      workspace_invites: {
        Row: {
          id: string;
          workspace_id: string;
          email: string;
          role: "admin" | "editor" | "viewer";
          token: string;
          invited_by: string;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          email: string;
          role?: "admin" | "editor" | "viewer";
          token: string;
          invited_by: string;
          expires_at: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["workspace_invites"]["Insert"]>;
      };
      categories: {
        Row: {
          id: string;
          workspace_id: string;
          name: string;
          icon: string;
          type: "income" | "expense";
          color: string;
          is_system: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          name: string;
          icon?: string;
          type: "income" | "expense";
          color?: string;
          is_system?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["categories"]["Insert"]>;
      };
      transactions: {
        Row: {
          id: string;
          workspace_id: string;
          account_id: string | null;
          category_id: string | null;
          type: "income" | "expense" | "transfer";
          amount: number;
          description: string;
          date: string;
          tags: string[];
          notes: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          account_id?: string | null;
          category_id?: string | null;
          type: "income" | "expense" | "transfer";
          amount: number;
          description: string;
          date: string;
          tags?: string[];
          notes?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["transactions"]["Insert"]>;
      };
      investments: {
        Row: {
          id: string;
          workspace_id: string;
          account_id: string | null;
          name: string;
          type: string | null;
          amount: number;
          current_value: number | null;
          date: string;
          notes: string | null;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          account_id?: string | null;
          name: string;
          type?: string | null;
          amount: number;
          current_value?: number | null;
          date: string;
          notes?: string | null;
          created_by: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["investments"]["Insert"]>;
      };
      goals: {
        Row: {
          id: string;
          workspace_id: string;
          title: string;
          target_amount: number;
          deadline: string | null;
          icon: string;
          color: string;
          status: "active" | "completed" | "archived";
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          title: string;
          target_amount: number;
          deadline?: string | null;
          icon?: string;
          color?: string;
          status?: "active" | "completed" | "archived";
          created_by: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["goals"]["Insert"]>;
      };
      goal_contributions: {
        Row: {
          id: string;
          goal_id: string;
          workspace_id: string;
          amount: number;
          date: string;
          notes: string | null;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          goal_id: string;
          workspace_id: string;
          amount: number;
          date: string;
          notes?: string | null;
          created_by: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["goal_contributions"]["Insert"]>;
      };
      receivables: {
        Row: {
          id: string;
          workspace_id: string;
          debtor_name: string;
          amount: number;
          due_date: string | null;
          status: "pending" | "paid" | "overdue";
          phone: string | null;
          notes: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          debtor_name: string;
          amount: number;
          due_date?: string | null;
          status?: "pending" | "paid" | "overdue";
          phone?: string | null;
          notes?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["receivables"]["Insert"]>;
      };
    };
  };
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Workspace = Database["public"]["Tables"]["workspaces"]["Row"];
export type WorkspaceInvite = Database["public"]["Tables"]["workspace_invites"]["Row"];
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type Transaction = Database["public"]["Tables"]["transactions"]["Row"];
export type Investment = Database["public"]["Tables"]["investments"]["Row"];
export type Goal = Database["public"]["Tables"]["goals"]["Row"];
export type GoalContribution = Database["public"]["Tables"]["goal_contributions"]["Row"];
export type Receivable = Database["public"]["Tables"]["receivables"]["Row"];

