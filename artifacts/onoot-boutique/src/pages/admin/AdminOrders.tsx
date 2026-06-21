import React from "react";
import { AdminLayout } from "./AdminDashboard";
import { useListOrders, useUpdateOrderStatus, getListOrdersQueryKey } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function AdminOrders() {
  const { data, isLoading } = useListOrders({ limit: 100 });
  const updateStatus = useUpdateOrderStatus();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleStatusChange = (id: number, status: string) => {
    updateStatus.mutate({ id, data: { orderStatus: status } }, {
      onSuccess: () => {
        toast({ title: "Statut mis à jour" });
        queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
      }
    });
  };

  const getStatusBadgeColor = (status: string) => {
    switch(status) {
      case 'En attente': return "bg-orange-100 text-orange-800";
      case 'Confirmée': return "bg-blue-100 text-blue-800";
      case 'Expédiée': return "bg-indigo-100 text-indigo-800";
      case 'Livrée': return "bg-green-100 text-green-800";
      case 'Annulée': return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <AdminLayout title="Gestion des Commandes">
      <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Statut Actuel</TableHead>
              <TableHead className="text-right">Modifier le statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8">Chargement...</TableCell></TableRow>
            ) : data?.orders.map(order => (
              <TableRow key={order.id}>
                <TableCell className="font-medium">#{order.id}</TableCell>
                <TableCell>{order.shippingAddress.fullName}</TableCell>
                <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                <TableCell className="font-bold text-accent">{order.totalAmount.toLocaleString()} FCFA</TableCell>
                <TableCell>
                  <Badge variant="secondary" className={getStatusBadgeColor(order.orderStatus)}>
                    {order.orderStatus}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Select defaultValue={order.orderStatus} onValueChange={(val) => handleStatusChange(order.id, val)}>
                    <SelectTrigger className="w-[140px] ml-auto">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="En attente">En attente</SelectItem>
                      <SelectItem value="Confirmée">Confirmée</SelectItem>
                      <SelectItem value="Expédiée">Expédiée</SelectItem>
                      <SelectItem value="Livrée">Livrée</SelectItem>
                      <SelectItem value="Annulée">Annulée</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </AdminLayout>
  );
}
