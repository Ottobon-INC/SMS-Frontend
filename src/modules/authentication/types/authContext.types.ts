export type PortalKey = "institution" | "branch" | "office" | "parent" | "platform";

export type AuthenticatedUser = {
  id: string;
  display_name: string;
  email: string | null;
  status: string;
  account_category: string;
};

export type TenantSummary = {
  id: string;
  name: string;
  status: string;
};

export type BranchSummary = {
  id: string;
  name: string;
  status: string;
};

export type RoleSummary = {
  code: string;
  label: string;
};

export type AccessContextSummary = {
  assignment_id: string;
  tenant: TenantSummary | null;
  branch: BranchSummary | null;
  role: RoleSummary;
  scope_type: string;
  enabled_modules: string[];
  permissions: string[];
};

export type ActiveContext = {
  assignment_id: string;
  tenant_id: string | null;
  branch_id: string | null;
  role_codes: string[];
  permissions: string[];
  enabled_modules: string[];
  scope_type: string;
};

export type CurrentUserResponse = {
  user: AuthenticatedUser;
  available_contexts: AccessContextSummary[];
  active_context: ActiveContext | null;
};

export type LoginResponse = CurrentUserResponse & {
  access_token: string;
  token_type: "bearer";
  expires_in_seconds: number;
};

export type LoginCredentials = {
  email: string;
  password: string;
};

export type AuthContextValue = {
  isAuthenticated: boolean;
  loading: boolean;
  appUser: AuthenticatedUser | null;
  availableContexts: AccessContextSummary[];
  activeContext: ActiveContext | null;
  login: (credentials: LoginCredentials, portal: PortalKey) => Promise<ActiveContext | null>;
  logout: () => Promise<void>;
  refreshApplicationContext: () => Promise<void>;
  selectContext: (assignmentId: string) => Promise<void>;
  hasPermission: (permissionKey: string) => boolean;
  hasAnyPermission: (permissionKeys: string[]) => boolean;
  hasModule: (moduleCode: string) => boolean;
};
