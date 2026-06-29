// Puerto de salida hacia la pasarela de pago. Aislar esto permite cambiar de
// proveedor (Stripe, Niubiz, MercadoPago) sin tocar la logica de negocio.
export interface CreateChargeInput {
	amount: number;
	currency: string;
	metadata: Record<string, string>;
}

export interface CreateChargeResult {
	transactionId: string;
	gateway: string;
	status: 'PENDING';
}

export interface IPaymentGateway {
	createCharge(input: CreateChargeInput): Promise<CreateChargeResult>;
}
