import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, ShieldAlert, Ban, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

const users = [
  { id: 1, name: "María Fernández", email: "maria@uni.edu.pe", role: "Creador", status: "Verificado" },
  { id: 2, name: "Sofía Pérez", email: "sofia@gmail.com", role: "Donante", status: "Activo" },
  { id: 3, name: "Carlos Mendoza", email: "carlos@pucp.edu.pe", role: "Creador", status: "Verificado" },
  { id: 4, name: "Usuario Sospechoso", email: "x@x.com", role: "Donante", status: "Revisión", flag: true },
];
const tx = [
  { id: "TX-001", user: "Sofía P.", amount: 50, campaign: "Huerto urbano", date: "12 abr", status: "OK" },
  { id: "TX-002", user: "Anónimo", amount: 200, campaign: "Robots educativos", date: "12 abr", status: "OK" },
  { id: "TX-003", user: "X. (revisión)", amount: 5000, campaign: "Documental", date: "11 abr", status: "Sospechoso", flag: true },
  { id: "TX-004", user: "Diego R.", amount: 30, campaign: "Biblioteca móvil", date: "11 abr", status: "OK" },
];

const Admin = () => {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-destructive/10 text-destructive grid place-items-center">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Panel de administración</h1>
            <p className="text-muted-foreground">Acceso restringido por roles.</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="p-5"><div className="text-sm text-muted-foreground">Usuarios totales</div><div className="text-2xl font-bold mt-1">2,418</div></Card>
          <Card className="p-5"><div className="text-sm text-muted-foreground">Transacciones (mes)</div><div className="text-2xl font-bold mt-1">S/ 84,210</div></Card>
          <Card className="p-5 border-destructive/40"><div className="text-sm text-destructive flex items-center gap-1"><AlertTriangle className="h-4 w-4" />Alertas activas</div><div className="text-2xl font-bold mt-1">3</div></Card>
        </div>

        <Card className="p-5">
          <Tabs defaultValue="users">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
              <TabsList>
                <TabsTrigger value="users">Usuarios</TabsTrigger>
                <TabsTrigger value="tx">Transacciones</TabsTrigger>
              </TabsList>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input className="pl-9 w-64" placeholder="Buscar..." />
              </div>
            </div>

            <TabsContent value="users">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Usuario</TableHead><TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead><TableHead className="text-right">Acción</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id} className={u.flag ? "bg-destructive/5" : ""}>
                      <TableCell>
                        <div className="font-medium">{u.name}</div>
                        <div className="text-xs text-muted-foreground">{u.email}</div>
                      </TableCell>
                      <TableCell><Badge variant="outline">{u.role}</Badge></TableCell>
                      <TableCell><Badge className={u.flag ? "bg-destructive text-destructive-foreground" : "bg-secondary text-secondary-foreground"}>{u.status}</Badge></TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" onClick={() => toast.success(`${u.name} suspendido`)}>
                          <Ban className="h-3 w-3 mr-1" />Suspender
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="tx">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>ID</TableHead><TableHead>Donante</TableHead>
                  <TableHead>Campaña</TableHead><TableHead>Monto</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {tx.map((t) => (
                    <TableRow key={t.id} className={t.flag ? "bg-destructive/5" : ""}>
                      <TableCell className="font-mono text-xs">{t.id}</TableCell>
                      <TableCell>{t.user}</TableCell>
                      <TableCell className="text-muted-foreground">{t.campaign}</TableCell>
                      <TableCell className="font-semibold">S/ {t.amount}</TableCell>
                      <TableCell><Badge className={t.flag ? "bg-destructive text-destructive-foreground" : "bg-secondary text-secondary-foreground"}>{t.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Admin;
