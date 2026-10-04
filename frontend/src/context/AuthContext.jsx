import { createContext, useContext, useState } from 'react';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);
const read = () => { try { return JSON.parse(localStorage.getItem('st_user') || sessionStorage.getItem('st_user')); } catch { return null; } };

export function AuthProvider({ children }) {
  const [user, setUser] = useState(read);
  const signIn = (d, remember = true) => {
    const store = remember ? localStorage : sessionStorage;
    localStorage.clear(); sessionStorage.clear();
    const u = { role: d.role, name: d.name, email: d.email };
    store.setItem('token', d.token); store.setItem('st_user', JSON.stringify(u)); setUser(u);
  };
  const signOut = () => { localStorage.clear(); sessionStorage.clear(); setUser(null); };
  return <Ctx.Provider value={{ user, signIn, signOut }}>{children}</Ctx.Provider>;
}
