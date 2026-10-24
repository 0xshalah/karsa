import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { LangProvider } from "./lib/i18n";
import { ContractProvider } from "./lib/contract";
import Landing from "./pages/Landing";

const VaultApp = lazy(() => import("./pages/VaultApp"));

export default function App() {
  return (
    <LangProvider>
      <ContractProvider>
        <BrowserRouter>
          <Suspense fallback={<div className="page" />}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/app" element={<VaultApp />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </ContractProvider>
    </LangProvider>
  );
}
