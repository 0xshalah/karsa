import { createContext, useCallback, useContext, useState } from "react";
import { isValidContractId, resolveContractId, saveContractId } from "./config";

const Ctx = createContext(null);

export const ContractProvider = ({ children }) => {
  const [cfg, setCfg] = useState(resolveContractId);
  /** Save to localStorage (overrides env and deployments/testnet.json). Pass null to clear the override. */
  const setContractId = useCallback((id) => {
    if (id !== null && !isValidContractId(id)) return false;
    const stored = saveContractId(id);
    setCfg(id && !stored ? { id, source: "memory" } : resolveContractId());
    return true;
  }, []);
  return <Ctx.Provider value={{ ...cfg, setContractId }}>{children}</Ctx.Provider>;
};

export const useContract = () => useContext(Ctx);
