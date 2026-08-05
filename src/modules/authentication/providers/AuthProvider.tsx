import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { queryClient } from "../../../app/query/queryClient";
import { getStoredAccessToken, storeAccessAssignmentId, storeAccessToken } from "../../../api/client/apiClient";
import { fetchCurrentUser, loginWithPassword, selectAccessContext } from "../api/authClient";
import { portalDefinitions } from "../constants/portals";
import type {
  AccessContextSummary,
  ActiveContext,
  AuthContextValue,
  AuthenticatedUser,
  LoginCredentials,
  PortalKey
} from "../types/authContext.types";

const AuthContext = createContext<AuthContextValue | null>(null);

function contextMatchesPortal(context: AccessContextSummary, portal: PortalKey): boolean {
  return portalDefinitions[portal].expectedRoles.includes(context.role.code);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => getStoredAccessToken() != null);
  const [loading, setLoading] = useState(true);
  const [appUser, setAppUser] = useState<AuthenticatedUser | null>(null);
  const [availableContexts, setAvailableContexts] = useState<AccessContextSummary[]>([]);
  const [activeContext, setActiveContext] = useState<ActiveContext | null>(null);

  const applyCurrentUser = useCallback((response: Awaited<ReturnType<typeof fetchCurrentUser>>) => {
    setAppUser(response.user);
    setAvailableContexts(response.available_contexts);
    setActiveContext(response.active_context);
    storeAccessAssignmentId(response.active_context?.assignment_id ?? null);
  }, []);

  const refreshApplicationContext = useCallback(async () => {
    const response = await fetchCurrentUser();
    applyCurrentUser(response);
  }, [applyCurrentUser]);

  useEffect(() => {
    let mounted = true;
    async function restoreSession() {
      if (!mounted) return;
      if (getStoredAccessToken() != null) {
        try {
          await refreshApplicationContext();
          setIsAuthenticated(true);
        } catch {
          storeAccessToken(null);
          setAppUser(null);
          setAvailableContexts([]);
          setActiveContext(null);
          storeAccessAssignmentId(null);
          setIsAuthenticated(false);
        }
      }
      setLoading(false);
    }
    void restoreSession();
    return () => {
      mounted = false;
    };
  }, [refreshApplicationContext]);

  const login = useCallback(
    async (credentials: LoginCredentials, portal: PortalKey) => {
      const response = await loginWithPassword(credentials.email, credentials.password, portal);
      storeAccessToken(response.access_token);
      setIsAuthenticated(true);
      const matchingContexts = response.available_contexts.filter((context) =>
        contextMatchesPortal(context, portal)
      );
      if (matchingContexts.length === 1) {
        const selected = await selectAccessContext(matchingContexts[0].assignment_id);
        applyCurrentUser(selected);
        return selected.active_context;
      }
      applyCurrentUser(response);
      if (matchingContexts.length === 0) {
        throw new Error(`This account does not have access to the ${portalDefinitions[portal].label} portal.`);
      }
      return response.active_context;
    },
    [applyCurrentUser]
  );

  const logout = useCallback(async () => {
    storeAccessToken(null);
    setIsAuthenticated(false);
    setAppUser(null);
    setAvailableContexts([]);
    setActiveContext(null);
    storeAccessAssignmentId(null);
    queryClient.clear();
  }, []);

  const selectContext = useCallback(
    async (assignmentId: string) => {
      storeAccessAssignmentId(assignmentId);
      const response = await selectAccessContext(assignmentId);
      applyCurrentUser(response);
      queryClient.clear();
    },
    [applyCurrentUser]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated,
      loading,
      appUser,
      availableContexts,
      activeContext,
      login,
      logout,
      refreshApplicationContext,
      selectContext,
      hasPermission: (permissionKey: string) => activeContext?.permissions.includes(permissionKey) ?? false,
      hasAnyPermission: (permissionKeys: string[]) =>
        permissionKeys.some((permissionKey) => activeContext?.permissions.includes(permissionKey)),
      hasModule: (moduleCode: string) => activeContext?.enabled_modules.includes(moduleCode) ?? false
    }),
    [
      isAuthenticated,
      loading,
      appUser,
      availableContexts,
      activeContext,
      login,
      logout,
      refreshApplicationContext,
      selectContext
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context == null) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }
  return context;
}
