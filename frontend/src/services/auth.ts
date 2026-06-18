export const getToken = (): string | null => {
  return localStorage.getItem('admin_token');
};

export const setToken = (token: string): void => {
  localStorage.setItem('admin_token', token);
};

export const removeToken = (): void => {
  localStorage.removeItem('admin_token');
};

export const isTokenValid = (token: string | null): boolean => {
  if (!token) return false;
  
  try {
    // Basic JWT validation - check if it has 3 parts
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    // Decode payload to check expiry
    const payloadPart = parts[1];
    if (!payloadPart) return false;
    
    const payload = JSON.parse(atob(payloadPart));
    const now = Date.now() / 1000;
    
    return payload.exp > now;
  } catch (error) {
    return false;
  }
};