
export const setToken = (token) => {
  localStorage.setItem("token", token);
};

export const getToken = () => {
  return localStorage.getItem("token");
};




const parseJwt = (token) => {
  try {
    if (!token) return null;

    const base64 = token.split(".")[1];
    const json = atob(base64);

    return JSON.parse(json);

  } catch {
    return null;
  }
};




export const isTokenExpired = () => {
  const token = getToken();
  if (!token) return true;

  const payload = parseJwt(token);
  if (!payload?.exp) return true;

  return payload.exp * 1000 < Date.now();
};




export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("username");
};




export const isLoggedIn = () => {
  const token = getToken();

  if (!token) return false;

  if (isTokenExpired()) {
    logout();
    return false;
  }

  return true;
};



export const getRole = () => {
  const token = getToken();
  if (!token) return null;

  const payload = parseJwt(token);
  return payload?.Role || null;
};




export const getUsername = () => {
  const token = getToken();
  if (!token) return null;

  const payload = parseJwt(token);
  return payload?.sub || null;
};
