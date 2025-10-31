'use client';

import * as React from 'react';
import { useUser } from '@/hooks/use-user';
import { updateCredit as updateCreditAction } from '@/app/credits/actions';
import type { CreditDetail, UserRole } from '@/lib/types';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AccessDenied } from '@/components/AccessDenied';
import { getClient } from '@/services/client-service-server';
import { calculateCreditStatusDetails } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, parseISO } from 'date-fns';
import { todayInNicaragua, formatDateForUser, nowInNicaragua } from '@/lib/date-utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RejectionDialog } from '@/components/RejectionDialog';
import { DisbursementForm, DisbursementFormValues } from './components/DisbursementForm';
import { DisbursementDetailSheet } from './components/DisbursementDetailSheet';
import { Button } from '@/components/ui/button';
import { getCreditsAdmin } from '@/services/credit-service-server';

const ALLOWED_ROLES: UserRole[] = ['ADMINISTRADOR', 'GERENTE', 'SUPERVISOR', 'OPERATIVO'];

const formatCurrency = (amount: number = 0) => `C$${amount.toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

interface CreditLists {
  pending: CreditDetail[];
  disbursedToday: CreditDetail[];
  deniedToday: CreditDetail[];
}

export default function DisbursementsPage() {
  const { user } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [creditLists, setCreditLists] = React.useState<CreditLists>({ pending: [], disbursedToday: [], deniedToday: [] });
  const [isLoading, setIsLoading] = React.useState(true);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [selectedCredit, setSelectedCredit] = React.useState<CreditDetail | null>(null);
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [isDisbursementFormOpen, setIsDisbursementFormOpen] = React.useState(false);
  const [isRejectionModalOpen, setIsRejectionModalOpen] = React.useState(false);

  const fetchDisbursements = React.useCallback(async () => {
    if (!user || !ALLOWED_ROLES.includes(user.role as UserRole)) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { credits: allCredits } = await getCreditsAdmin({ user });

      const todayStr = todayInNicaragua();

      const approvedCredits = allCredits.filter(c => c.status === 'Approved');
      const activeCredits = allCredits.filter(c => c.status === 'Active');
      const rejectedCredits = allCredits.filter(c => c.status === 'Rejected');

      const disbursedToday = activeCredits.filter(c => c.deliveryDate && format(parseISO(c.deliveryDate), 'yyyy-MM-dd') === todayStr);
      const deniedToday = rejectedCredits.filter(c => c.approvalDate && format(parseISO(c.approvalDate), 'yyyy-MM-dd') === todayStr);

      const clientIdsWithPending = [...new Set(approvedCredits.map(c => c.clientId))];
      const relevantActiveCredits = activeCredits.filter(ac => clientIdsWithPending.includes(ac.clientId));

      const enhancedPending = approvedCredits.map(credit => {
        let outstandingBalance = 0;
        const activeCreditForClient = relevantActiveCredits.find(ac => ac.clientId === credit.clientId);
        if (activeCreditForClient) {
          outstandingBalance = calculateCreditStatusDetails(activeCreditForClient).remainingBalance;
        }
        const netDisbursementAmount = credit.amount - outstandingBalance;
        return { ...credit, outstandingBalance, netDisbursementAmount: netDisbursementAmount > 0 ? netDisbursementAmount : 0 };
      }).sort((a, b) => {
        if (!a.approvalDate || !b.approvalDate) return 0;
        return parseISO(b.approvalDate).getTime() - parseISO(a.approvalDate).getTime();
      });

      setCreditLists({
        pending: enhancedPending,
        disbursedToday: disbursedToday.sort((a, b) => {
          if (!a.deliveryDate || !b.deliveryDate) return 0;
          return parseISO(b.deliveryDate).getTime() - parseISO(a.deliveryDate).getTime();
        }),
        deniedToday: deniedToday
      });

    } catch (error) {
      console.error("Error en la carga de datos (desembolsos): ", error);
      toast({ title: 'Error de Permisos', description: 'No se pudo cargar la lista de desembolsos. Contacte al administrador.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);


  React.useEffect(() => {
    fetchDisbursements();
  }, [fetchDisbursements]);

  const handleOpenSheet = async (credit: CreditDetail) => {
    const fullClient = await getClient(credit.clientId);
    const creditWithDetails = { ...credit, clientDetails: fullClient || undefined };
    setSelectedCredit(creditWithDetails);
    setIsSheetOpen(true);
  };

  const handleOpenDisbursementForm = async () => {
    if (!selectedCredit) return;
    setIsDisbursementFormOpen(true);
    setIsSheetOpen(false);
  }

  const openRejectionDialog = async () => {
    setIsSheetOpen(false);
    setIsRejectionModalOpen(true);
  }

  const handleDisbursement = async (data: DisbursementFormValues) => {
    if (!selectedCredit || !user) return;
    setIsProcessing(true);
    try {
      if (selectedCredit.outstandingBalance && selectedCredit.outstandingBalance > 0) {
      }
      await updateCreditAction(selectedCredit.id, {
        status: 'Active',
        disbursedAmount: data.amount,
        firstPaymentDate: data.firstPaymentDate,
        deliveryDate: data.deliveryDate,
        disbursedBy: user.fullName,
      }, user);

      toast({ title: `Crédito Desembolsado`, description: `El crédito para ${selectedCredit.clientName} ha sido activado.` });
      setIsDisbursementFormOpen(false);
      setSelectedCredit(null);
      await fetchDisbursements();
    } catch (error) {
      console.error("Error during disbursement transaction:", error);
      toast({ title: 'Error en Transacción', description: 'No se pudo procesar el desembolso.', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejection = async (reason: string) => {
    if (!selectedCredit || !user) return;
    setIsProcessing(true);
    try {
      await updateCreditAction(selectedCredit.id, {
        status: 'Rejected',
        rejectionReason: `Rechazado en etapa de desembolso: ${reason}`,
        rejectedBy: user.fullName,
        approvalDate: nowInNicaragua()
      }, user);
      toast({ title: `Crédito Rechazado`, description: `La solicitud para ${selectedCredit.clientName} ha sido rechazada.`, variant: 'destructive' });
      setIsRejectionModalOpen(false);
      setSelectedCredit(null);
      await fetchDisbursements();
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo procesar el rechazo.', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!user || !ALLOWED_ROLES.includes(user.role as UserRole)) {
    return <AccessDenied />;
  }

  const renderDesktopTable = (credits: CreditDetail[], type: 'pending' | 'disbursed' | 'denied') => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Cliente</TableHead>
          <TableHead>{type === 'pending' ? 'Monto a Entregar' : 'Monto Desembolsado'}</TableHead>
          <TableHead>Gestor</TableHead>
          <TableHead>{type === 'denied' ? 'Fecha de Rechazo' : 'Fecha Aprobación'}</TableHead>
          {type === 'pending' && <TableHead className="text-right">Acciones</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {credits.length > 0 ? (
          credits.map((credit) => (
            <TableRow key={credit.id}>
              <TableCell className="font-medium">{credit.clientName}</TableCell>
              <TableCell>{formatCurrency(type === 'pending' ? (credit.netDisbursementAmount ?? credit.amount) : credit.disbursedAmount)}</TableCell>
              <TableCell>{credit.collectionsManager}</TableCell>
              <TableCell>{credit.approvalDate ? formatDateForUser(credit.approvalDate) : 'N/A'}</TableCell>
              {type === 'pending' &&
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" onClick={() => handleOpenSheet(credit)}>
                    Ver Detalles
                  </Button>
                </TableCell>
              }
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={5} className="h-24 text-center">
              No hay créditos en esta categoría.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );

  return (
    <>
      <div className="space-y-6">
        <Tabs defaultValue="pending">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending">Por Desembolsar ({creditLists.pending.length})</TabsTrigger>
            <TabsTrigger value="disbursed">Desembolsados Hoy ({creditLists.disbursedToday.length})</TabsTrigger>
            <TabsTrigger value="denied">Denegados Hoy ({creditLists.deniedToday.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-4">
            {renderDesktopTable(creditLists.pending, 'pending')}
          </TabsContent>
          <TabsContent value="disbursed" className="mt-4">
            {renderDesktopTable(creditLists.disbursedToday, 'disbursed')}
          </TabsContent>
          <TabsContent value="denied" className="mt-4">
            {renderDesktopTable(creditLists.deniedToday, 'denied')}
          </TabsContent>
        </Tabs>
      </div>

      <DisbursementDetailSheet
        isOpen={isSheetOpen}
        onClose={async () => setIsSheetOpen(false)}
        credit={selectedCredit}
        onDisburse={handleOpenDisbursementForm}
        onReject={openRejectionDialog}
      />

      <DisbursementForm
        isOpen={isDisbursementFormOpen}
        onClose={async () => {
          setIsDisbursementFormOpen(false);
          setSelectedCredit(null);
        }}
        credit={selectedCredit}
        onSubmit={handleDisbursement}
      />
      <RejectionDialog
        isOpen={isRejectionModalOpen}
        onClose={async () => setIsRejectionModalOpen(false)}
        onSubmit={handleRejection}
        isProcessing={isProcessing}
      />
    </>
  );
}
