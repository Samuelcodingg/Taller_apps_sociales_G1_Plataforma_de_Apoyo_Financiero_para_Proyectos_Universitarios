import { Request, Response } from 'express';
import {
	createAuthMiddleware,
	IAccessTokenVerifier,
} from '../../src/shared/http/authMiddleware';

const buildRes = () => {
	const res = {} as Response & { statusCode?: number; body?: unknown };
	res.status = jest.fn().mockImplementation((code: number) => {
		res.statusCode = code;
		return res;
	}) as unknown as Response['status'];
	res.json = jest.fn().mockImplementation((payload: unknown) => {
		res.body = payload;
		return res;
	}) as unknown as Response['json'];
	return res;
};

const verifier: IAccessTokenVerifier = {
	verifyAccessToken: (token: string) => {
		if (token !== 'good') {
			throw new Error('invalid');
		}
		return { userId: 'account-1', email: 'a@b.com', role: 'DONOR' };
	},
};

describe('createAuthMiddleware', () => {
	it('rechaza peticiones sin header Authorization', () => {
		const res = buildRes();
		const next = jest.fn();

		createAuthMiddleware(verifier)({ headers: {} } as Request, res, next);

		expect(res.statusCode).toBe(401);
		expect(next).not.toHaveBeenCalled();
	});

	it('rechaza tokens invalidos', () => {
		const res = buildRes();
		const next = jest.fn();

		createAuthMiddleware(verifier)(
			{ headers: { authorization: 'Bearer bad' } } as Request,
			res,
			next,
		);

		expect(res.statusCode).toBe(401);
		expect(next).not.toHaveBeenCalled();
	});

	it('adjunta req.auth y llama next con un token valido', () => {
		const res = buildRes();
		const next = jest.fn();
		const req = { headers: { authorization: 'Bearer good' } } as Request;

		createAuthMiddleware(verifier)(req, res, next);

		expect(next).toHaveBeenCalledTimes(1);
		expect(req.auth).toEqual({ userId: 'account-1', email: 'a@b.com', role: 'DONOR' });
	});
});
