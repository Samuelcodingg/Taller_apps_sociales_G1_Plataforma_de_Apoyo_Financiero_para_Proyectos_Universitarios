import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AuthInitializer from "@/components/auth/AuthInitializer";
import { store } from "@/store/store";
import App from "./App";
import { loadRemoteRoutes } from "./remoteRoutes";
import "@/index.css";

// El store viene del remote mf-shared: el Provider del shell alimenta también
// a los componentes de los demás microfrontends (react-redux es singleton).
const remoteRoutes = await loadRemoteRoutes();

createRoot(document.getElementById("root")!).render(
  <Provider store={store}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthInitializer>
          <App remoteRoutes={remoteRoutes} />
        </AuthInitializer>
      </BrowserRouter>
    </TooltipProvider>
  </Provider>,
);
