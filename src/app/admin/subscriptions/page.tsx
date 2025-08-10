'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, Trash2, Calendar, CreditCard, User, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getAllSubscriptionsAdmin, cancelUserSubscription, cleanupExpiredSubscriptions } from './actions';
import { UserSubscription, SubscriptionPlan } from '@/lib/subscription-manager';

interface SubscriptionWithPlan extends UserSubscription {
  plan?: SubscriptionPlan;
}

export default function AdminSubscriptionsPage() {
  const { toast } = useToast();
  const [subscriptions, setSubscriptions] = useState<SubscriptionWithPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCleaningUp, setIsCleaningUp] = useState(false);

  const fetchSubscriptions = async () => {
    setIsLoading(true);
    try {
      const result = await getAllSubscriptionsAdmin();
      if (result.success) {
        setSubscriptions(result.subscriptions || []);
      } else {
        toast({
          variant: 'destructive',
          title: 'Erro ao carregar assinaturas',
          description: result.error
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar assinaturas',
        description: 'Erro interno do servidor'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelSubscription = async (subscriptionId: string) => {
    if (!confirm('Tem certeza que deseja cancelar esta assinatura?')) return;

    try {
      const result = await cancelUserSubscription(subscriptionId);
      if (result.success) {
        toast({
          title: 'Assinatura cancelada',
          description: 'A assinatura foi cancelada com sucesso'
        });
        await fetchSubscriptions();
      } else {
        toast({
          variant: 'destructive',
          title: 'Erro ao cancelar',
          description: result.error
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao cancelar',
        description: 'Erro interno do servidor'
      });
    }
  };

  const handleCleanupExpired = async () => {
    setIsCleaningUp(true);
    try {
      const result = await cleanupExpiredSubscriptions();
      if (result.success) {
        toast({
          title: 'Cleanup realizado',
          description: `${result.cleanupCount} assinaturas expiradas foram atualizadas`
        });
        await fetchSubscriptions();
      } else {
        toast({
          variant: 'destructive',
          title: 'Erro no cleanup',
          description: result.error
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro no cleanup',
        description: 'Erro interno do servidor'
      });
    } finally {
      setIsCleaningUp(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const getStatusBadge = (status: UserSubscription['status']) => {
    const variants = {
      active: 'default',
      expired: 'secondary',
      canceled: 'destructive',
      pending: 'outline'
    } as const;

    const labels = {
      active: 'Ativa',
      expired: 'Expirada',
      canceled: 'Cancelada',
      pending: 'Pendente'
    };

    return (
      <Badge variant={variants[status]}>
        {labels[status]}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };

  const formatPrice = (price?: number) => {
    return price ? new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price) : 'N/A';
  };

  const stats = {
    total: subscriptions.length,
    active: subscriptions.filter(s => s.status === 'active').length,
    expired: subscriptions.filter(s => s.status === 'expired').length,
    revenue: subscriptions
      .filter(s => s.status === 'active')
      .reduce((sum, s) => sum + (s.plan?.price || 0), 0)
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Gerenciar Assinaturas</h1>
        <div className="flex gap-2">
          <Button 
            onClick={handleCleanupExpired} 
            variant="outline"
            disabled={isCleaningUp}
          >
            {isCleaningUp ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Limpar Expiradas
          </Button>
          <Button onClick={fetchSubscriptions} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Assinaturas</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assinaturas Ativas</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiradas</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.expired}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Ativa</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatPrice(stats.revenue)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Assinaturas */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Assinaturas</CardTitle>
          <CardDescription>
            Gerencie todas as assinaturas do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : subscriptions.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              Nenhuma assinatura encontrada
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Início</TableHead>
                    <TableHead>Término</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptions.map((subscription) => (
                    <TableRow key={subscription.id}>
                      <TableCell className="font-medium">
                        {subscription.email}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {subscription.plan?.name || subscription.planId}
                          </div>
                          {subscription.plan?.popular && (
                            <Badge variant="outline" className="text-xs">Popular</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(subscription.status)}
                      </TableCell>
                      <TableCell className="capitalize">
                        {subscription.paymentMethod}
                      </TableCell>
                      <TableCell>
                        {formatPrice(subscription.plan?.price)}
                      </TableCell>
                      <TableCell>
                        {formatDate(subscription.startDate)}
                      </TableCell>
                      <TableCell>
                        {formatDate(subscription.endDate)}
                      </TableCell>
                      <TableCell>
                        {subscription.status === 'active' && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleCancelSubscription(subscription.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Cancelar
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
