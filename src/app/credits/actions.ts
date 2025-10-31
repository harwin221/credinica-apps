
'use server';

import type { CreditApplication, CreditDetail, User, UserRole, RegisteredPayment } from '@/lib/types';
import { 
    addCredit as addCreditService, 
    updateCredit as updateCreditService,
    revertDisbursement as revertDisbursementService,
    addPayment as addPaymentService,
    voidPayment as voidPaymentService,
    requestVoidPayment as requestVoidPaymentService,
    getClientCredits as getClientCreditsService
} from '@/services/credit-service-server';
import { calculateCreditStatusDetails } from '@/lib/utils';
import { getCredit } from '@/services/credit-service-server';


// Esta es una acción de servidor para añadir un crédito
export async function addCredit(creditData: Partial<CreditApplication> & { deliveryDate?: string }, creator: User): Promise<{ success: boolean; creditId?: string; error?: string }> {
    return addCreditService(creditData, creator);
}

// Esta es una acción de servidor para actualizar un crédito
export async function updateCredit(id: string, creditData: Partial<CreditDetail>, actor: User): Promise<{ success: boolean; error?: string }> {
    return updateCreditService(id, creditData, actor);
}

export async function revertDisbursement(revertedCreditId: string, actor: User): Promise<{ success: boolean; error?: string }> {
    return revertDisbursementService(revertedCreditId, actor);
}

export async function requestVoidPayment(creditId: string, paymentId: string, reason: string, actor: User): Promise<{ success: boolean; error?: string }> {
    return requestVoidPaymentService(creditId, paymentId, reason, actor);
}

export async function voidPayment(creditId: string, paymentId: string, actor: User): Promise<{ success: boolean; error?: string }> {
    return voidPaymentService(creditId, paymentId, actor);
}

export async function addPayment(creditId: string, paymentData: Omit<RegisteredPayment, 'id'>, actorId: string): Promise<{ success: boolean; error?: string, paymentId?: string }> {
    const actor = await getCredit(actorId); // This is incorrect, should be getUser
    // This is a placeholder for the actual user fetching logic
    const actorUser = { id: actorId, fullName: 'Offline User' } as User;
    return addPaymentService(creditId, paymentData, actorUser);
}
