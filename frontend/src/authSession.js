function clearSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

export function getValidAuthToken() {
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    const payload = token.split(".")[1];
    const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(payload.length / 4) * 4, "=");
    const claims = JSON.parse(atob(normalizedPayload));
    if (!claims.exp || claims.exp * 1000 <= Date.now()) {
      clearSession();
      return null;
    }
    return token;
  } catch {
    clearSession();
    return null;
  }
}

export function handleUnauthorized(error, navigate) {
  if (error.response?.status === 401) {
    clearSession();
    navigate("/login", { replace: true });
    return true;
  }
  return false;
}
