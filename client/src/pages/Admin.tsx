import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Search,
  ShieldAlert,
  Eye,
  Pencil,
  Trash2,
  Plus,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  useAdminUsersQuery,
  useAdminUserDetailQuery,
  useAdminCreateUserMutation,
  useAdminUpdateUserMutation,
  useAdminDeleteUserMutation,
  AdminUserListItem,
} from "@/slices/apiSlice";
import { getErrorMessage } from "@/lib/getErrorMessage";

const ROLE_LABEL: Record<string, string> = {
  CREATOR: "Creador",
  DONOR: "Donador",
  ADMIN: "Administrador",
};

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("es-PE", { dateStyle: "medium", timeStyle: "short" }) : "—";

const Admin = () => {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("ALL");
  const [sort, setSort] = useState("newest");

  const { data: users = [], isLoading } = useAdminUsersQuery({
    search: search.trim() || undefined,
    type: type === "ALL" ? undefined : type,
    sort,
  });

  // Modales
  const [viewId, setViewId] = useState<string | null>(null);
  const [editUser, setEditUser] = useState<AdminUserListItem | null>(null);
  const [deleteUser, setDeleteUser] = useState<AdminUserListItem | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const [removeUser, { isLoading: isDeleting }] = useAdminDeleteUserMutation();

  const confirmDelete = async () => {
    if (!deleteUser) return;
    try {
      await removeUser(deleteUser.id).unwrap();
      toast.success("Usuario eliminado");
      setDeleteUser(null);
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-destructive/10 text-destructive grid place-items-center">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Panel de administración</h1>
              <p className="text-muted-foreground">Gestión de usuarios de la plataforma.</p>
            </div>
          </div>
          <Button className="bg-gradient-warm shadow-warm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Crear usuario
          </Button>
        </div>

        <Card className="p-5 space-y-4">
          {/* Barra de búsqueda y filtros */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Buscar por correo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos los tipos</SelectItem>
                <SelectItem value="CREATOR">Creador</SelectItem>
                <SelectItem value="DONOR">Donador</SelectItem>
                <SelectItem value="ADMIN">Administrador</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Orden" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Más nuevos</SelectItem>
                <SelectItem value="oldest">Más antiguos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tabla de usuarios */}
          {isLoading ? (
            <div className="flex justify-center py-12 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID de cuenta</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Apellidos</TableHead>
                  <TableHead>Correo electrónico</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No se encontraron usuarios.
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-mono text-xs">{u.id}</TableCell>
                      <TableCell>{u.names || "—"}</TableCell>
                      <TableCell>{u.surnames || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{u.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{ROLE_LABEL[u.role] ?? u.role}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" title="Ver" onClick={() => setViewId(u.id)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" title="Editar" onClick={() => setEditUser(u)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            title="Eliminar"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleteUser(u)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>

      {/* Modal VER detalle */}
      <ViewUserDialog id={viewId} onClose={() => setViewId(null)} />

      {/* Modal CREAR */}
      <CreateUserDialog open={createOpen} onClose={() => setCreateOpen(false)} />

      {/* Modal EDITAR */}
      <EditUserDialog user={editUser} onClose={() => setEditUser(null)} />

      {/* Confirmación de ELIMINAR */}
      <AlertDialog open={!!deleteUser} onOpenChange={(o) => !o && setDeleteUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar usuario</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar este usuario? Esta acción es irreversible y
              afectará sus registros vinculados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? "Eliminando..." : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
};

// ---------- Modal: ver detalle de usuario ----------
const ViewUserDialog = ({ id, onClose }: { id: string | null; onClose: () => void }) => {
  const { data, isFetching } = useAdminUserDetailQuery(id as string, { skip: !id });
  return (
    <Dialog open={!!id} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalle del usuario</DialogTitle>
          <DialogDescription>Información de la cuenta y sus registros vinculados.</DialogDescription>
        </DialogHeader>
        {isFetching || !data ? (
          <div className="flex justify-center py-10 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-5 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <Field label="ID de cuenta" value={data.id} mono />
              <Field label="Tipo" value={ROLE_LABEL[data.role] ?? data.role} />
              <Field label="Nombre" value={data.names || "—"} />
              <Field label="Apellidos" value={data.surnames || "—"} />
              <Field label="Correo electrónico" value={data.email} />
              <Field label="Fecha de registro" value={fmtDate(data.createdAt)} />
              <Field label="Último inicio de sesión" value={fmtDate(data.lastLoginAt)} />
            </div>

            <div>
              <h4 className="font-semibold mb-2">Campañas ({data.campaigns.length})</h4>
              {data.campaigns.length === 0 ? (
                <p className="text-muted-foreground">Sin campañas.</p>
              ) : (
                <ul className="space-y-1">
                  {data.campaigns.map((c) => (
                    <li key={c.id} className="flex justify-between border rounded-md px-3 py-2">
                      <span>{c.title}</span>
                      <span className="text-muted-foreground">
                        {c.status} · S/ {c.currentAmount} / {c.goalAmount}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <h4 className="font-semibold mb-2">Donaciones ({data.donations.length})</h4>
              {data.donations.length === 0 ? (
                <p className="text-muted-foreground">Sin donaciones.</p>
              ) : (
                <ul className="space-y-1">
                  {data.donations.map((d) => (
                    <li key={d.id} className="flex justify-between border rounded-md px-3 py-2">
                      <span>{d.campaignTitle ?? "Campaña eliminada"}</span>
                      <span className="text-muted-foreground">
                        S/ {d.amount} · {d.status} · {fmtDate(d.createdAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

const Field = ({ label, value, mono }: { label: string; value: string; mono?: boolean }) => (
  <div>
    <div className="text-xs text-muted-foreground">{label}</div>
    <div className={mono ? "font-mono text-xs break-all" : ""}>{value}</div>
  </div>
);

// ---------- Modal: crear usuario ----------
const CreateUserDialog = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [names, setNames] = useState("");
  const [surnames, setSurnames] = useState("");
  const [role, setRole] = useState("DONOR");
  const [createUser, { isLoading }] = useAdminCreateUserMutation();

  const submit = async () => {
    try {
      await createUser({ email: email.trim(), password, role, names, surnames }).unwrap();
      toast.success("Usuario creado");
      setEmail(""); setPassword(""); setNames(""); setSurnames(""); setRole("DONOR");
      onClose();
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear usuario</DialogTitle>
          <DialogDescription>Crea una cuenta de donador, creador o administrador.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Nombres</Label>
              <Input value={names} onChange={(e) => setNames(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Apellidos</Label>
              <Input value={surnames} onChange={(e) => setSurnames(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Correo electrónico</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Contraseña</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Tipo de cuenta</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DONOR">Donador</SelectItem>
                <SelectItem value="CREATOR">Creador</SelectItem>
                <SelectItem value="ADMIN">Administrador</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={isLoading}>
            {isLoading ? "Creando..." : "Crear"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ---------- Modal: editar usuario ----------
const EditUserDialog = ({
  user,
  onClose,
}: {
  user: AdminUserListItem | null;
  onClose: () => void;
}) => {
  const [updateUser, { isLoading }] = useAdminUpdateUserMutation();

  return (
    <Dialog open={!!user} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar usuario</DialogTitle>
          <DialogDescription>Actualiza los datos de la cuenta.</DialogDescription>
        </DialogHeader>
        {user && (
          <EditUserForm
            key={user.id}
            user={user}
            isLoading={isLoading}
            onCancel={onClose}
            onSubmit={async (patch) => {
              try {
                await updateUser({ id: user.id, data: patch }).unwrap();
                toast.success("Usuario actualizado");
                onClose();
              } catch (e) {
                toast.error(getErrorMessage(e));
              }
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

const EditUserForm = ({
  user,
  isLoading,
  onCancel,
  onSubmit,
}: {
  user: AdminUserListItem;
  isLoading: boolean;
  onCancel: () => void;
  onSubmit: (patch: { email: string; role: string; names: string; surnames: string }) => void;
}) => {
  const [names, setNames] = useState(user.names);
  const [surnames, setSurnames] = useState(user.surnames);
  const [email, setEmail] = useState(user.email);
  const [role, setRole] = useState(user.role);

  return (
    <>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label>Nombres</Label>
            <Input value={names} onChange={(e) => setNames(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Apellidos</Label>
            <Input value={surnames} onChange={(e) => setSurnames(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1">
          <Label>Correo electrónico</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Tipo de cuenta</Label>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DONOR">Donador</SelectItem>
              <SelectItem value="CREATOR">Creador</SelectItem>
              <SelectItem value="ADMIN">Administrador</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter className="mt-4">
        <Button variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button onClick={() => onSubmit({ email, role, names, surnames })} disabled={isLoading}>
          {isLoading ? "Guardando..." : "Guardar"}
        </Button>
      </DialogFooter>
    </>
  );
};

export default Admin;
