import { AppLayout } from "@/components/AppLayout";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { GraduationCap } from "lucide-react";

import Login from "./Login";
import Register from "./Register";

const Auth = () => {
  return (
    <AppLayout>
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-8">
          <div className="h-14 w-14 rounded-2xl bg-gradient-warm grid place-items-center text-primary-foreground mx-auto shadow-warm">
            <GraduationCap className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-bold mt-4">Bienvenido a Sembradora</h1>
          <p className="text-muted-foreground">
            Inicia sesión o crea una cuenta
          </p>
        </div>

        <Card className="p-6">
          <Tabs defaultValue="login">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="login" className="cursor-pointer">
                Iniciar sesión
              </TabsTrigger>
              <TabsTrigger value="register" className="cursor-pointer">
                Registrarme
              </TabsTrigger>
            </TabsList>

            <Login value="login" />
            <Register value="register" />
          </Tabs>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Auth;
