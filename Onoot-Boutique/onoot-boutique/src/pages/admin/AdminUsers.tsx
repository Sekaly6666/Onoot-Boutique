import React from "react";
import { AdminLayout } from "./AdminDashboard";
import { useListAdminUsers } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { User as UserIcon } from "lucide-react";

export default function AdminUsers() {
  const { data, isLoading } = useListAdminUsers({ limit: 100 });

  return (
    <AdminLayout title="Gestion des Utilisateurs">
      <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Utilisateur</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Téléphone</TableHead>
              <TableHead>Commandes</TableHead>
              <TableHead>Rôle</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8">Chargement...</TableCell></TableRow>
            ) : data?.users.map(user => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                      {user.avatar ? <img src={user.avatar} alt="" className="w-full h-full rounded-full object-cover" /> : <UserIcon size={16} />}
                    </div>
                    {user.name}
                  </div>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.phone || "-"}</TableCell>
                <TableCell>{user.orderCount || 0}</TableCell>
                <TableCell>
                  {user.role === 'admin' ? 
                    <Badge className="bg-primary text-white">Admin</Badge> : 
                    <Badge variant="outline">Client</Badge>
                  }
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </AdminLayout>
  );
}
