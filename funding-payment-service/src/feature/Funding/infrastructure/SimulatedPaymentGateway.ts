import { randomUUID } from 'node:crypto';
import {
	CreateChargeInput,
	CreateChargeResult,
	IPaymentGateway,
} from '../domain/IPaymentGateway';

// Pasarela SIMULADA para desarrollo: no mueve dinero real. Genera un
// transactionId y deja el pago PENDING; la confirmacion llega por el webhook.
// En produccion se reemplaza por StripeGateway / NiubizGateway / etc. sin tocar
// la logica de negocio (mismo puerto IPaymentGateway).
export class SimulatedPaymentGateway implements IPaymentGateway {
	async createCharge(_input: CreateChargeInput): Promise<CreateChargeResult> {
		return {
			transactionId: `sim_${randomUUID()}`,
			gateway: 'SIMULATED',
			status: 'PENDING',
		};
	}
}
