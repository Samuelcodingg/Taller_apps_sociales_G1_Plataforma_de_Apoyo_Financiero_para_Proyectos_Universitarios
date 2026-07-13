// Arranque autónomo: permite desarrollar/probar este microfrontend solo,
// sin el shell. En producción el shell monta `routes` vía Module Federation.
import { createRoot } from "react-dom/client";
import { BrowserRouter, useRoutes } from "react-router-dom";
import { Provider } from "react-redux";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import AuthInitializer from "@/components/auth/AuthInitializer";
import { store } from "@/store/store";
import routes from "./routes";
import "@/index.css";

const Routed = () => useRoutes(routes);

createRoot(document.getElementById("root")!).render(
  <Provider store={store}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthInitializer>
          <Routed />
        </AuthInitializer>
      </BrowserRouter>
    </TooltipProvider>
  </Provider>,
);
