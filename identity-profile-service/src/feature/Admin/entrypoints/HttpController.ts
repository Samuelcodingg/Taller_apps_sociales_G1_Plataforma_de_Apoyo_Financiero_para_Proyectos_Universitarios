import { Request, Response } from 'express';
import {
	ConflictError,
	NotFoundError,
	ValidationError,
} from '../../../shared/errors';
import { IPasswordService } from '../../IdentityProfile/domain/Password';
import { AdminRepository } from '../infrastructure/AdminRepository';
import { ListUsersQuery } from '../application/dtos';

const ALLOWED_ROLES = ['DONOR', 'CREATOR', 'ADMIN'];
const ALLOWED_STATUS = ['DRAFT', 'ACTIVE', 'FINISHED'];

export class AdminHttpController {
	constructor(
		private readonly repo: AdminRepository,
		private readonly passwordService: IPasswordService,
	) {}

	async listUsers(req: Request, res: Response): Promise<Response> {
		try {
			const { search, type, sort } = req.query;
			const query: ListUsersQuery = {
				search: typeof search === 'string' && search.trim() ? search.trim() : undefined,
				type:
					typeof type === 'string' && ALLOWED_ROLES.includes(type.toUpperCase())
						? type.toUpperCase()
						: undefined,
				sort: sort === 'oldest' ? 'oldest' : 'newest',
			};
			const users = await this.repo.listUsers(query);
			return res.json(users);
		} catch (error) {
			return this.handleError(error, res);
		}
	}

	async getUser(req: Request, res: Response): Promise<Response> {
		try {
			const detail = await this.repo.getUserDetail(String(req.params.id));
			return res.json(detail);
		} catch (error) {
			return this.handleError(error, res);
		}
	}

	async createUser(req: Request, res: Response): Promise<Response> {
		try {
			const { email, password, role, names, surnames } = req.body as {
				email?: string;
				password?: string;
				role?: string;
				names?: string;
				surnames?: string;
			};

			if (typeof email !== 'string' || !email.includes('@')) {
				throw new ValidationError('Correo invalido.');
			}
			if (typeof password !== 'string' || password.length < 6) {
				throw new ValidationError('La contraseña debe tener al menos 6 caracteres.');
			}
			const roleUpper = typeof role === 'string' ? role.toUpperCase() : '';
			if (!ALLOWED_ROLES.includes(roleUpper)) {
				throw new ValidationError('El rol debe ser DONOR, CREATOR o ADMIN.');
			}

			const passwordHash = await this.passwordService.hash(password);
			const created = await this.repo.createUser({
				email: email.trim().toLowerCase(),
				passwordHash,
				role: roleUpper,
				names: typeof names === 'string' ? names.trim() : '',
				surnames: typeof surnames === 'string' ? surnames.trim() : '',
			});
			return res.status(201).json(created);
		} catch (error) {
			return this.handleError(error, res);
		}
	}

	async updateUser(req: Request, res: Response): Promise<Response> {
		try {
			const { email, role, names, surnames } = req.body as {
				email?: string;
				role?: string;
				names?: string;
				surnames?: string;
			};
			const patch: { email?: string; role?: string; names?: string; surnames?: string } = {};
			if (email !== undefined) {
				if (typeof email !== 'string' || !email.includes('@')) {
					throw new ValidationError('Correo invalido.');
				}
				patch.email = email.trim().toLowerCase();
			}
			if (role !== undefined) {
				const roleUpper = typeof role === 'string' ? role.toUpperCase() : '';
				if (!ALLOWED_ROLES.includes(roleUpper)) {
					throw new ValidationError('El rol debe ser DONOR, CREATOR o ADMIN.');
				}
				patch.role = roleUpper;
			}
			if (names !== undefined) patch.names = String(names).trim();
			if (surnames !== undefined) patch.surnames = String(surnames).trim();

			const updated = await this.repo.updateUser(String(req.params.id), patch);
			return res.json(updated);
		} catch (error) {
			return this.handleError(error, res);
		}
	}

	async deleteUser(req: Request, res: Response): Promise<Response> {
		try {
			await this.repo.deleteUser(String(req.params.id));
			return res.status(204).send();
		} catch (error) {
			return this.handleError(error, res);
		}
	}

	// ---------- Proyectos (campañas) ----------
	async listCampaigns(req: Request, res: Response): Promise<Response> {
		try {
			const { search, status, sort } = req.query;
			const campaigns = await this.repo.listCampaigns({
				search: typeof search === 'string' && search.trim() ? search.trim() : undefined,
				status:
					typeof status === 'string' && ALLOWED_STATUS.includes(status.toUpperCase())
						? status.toUpperCase()
						: undefined,
				sort: sort === 'oldest' ? 'oldest' : 'newest',
			});
			return res.json(campaigns);
		} catch (error) {
			return this.handleError(error, res);
		}
	}

	async getCampaign(req: Request, res: Response): Promise<Response> {
		try {
			return res.json(await this.repo.getCampaignDetail(String(req.params.id)));
		} catch (error) {
			return this.handleError(error, res);
		}
	}

	async updateCampaign(req: Request, res: Response): Promise<Response> {
		try {
			const { title, description, status, goalAmount } = req.body as {
				title?: string;
				description?: string;
				status?: string;
				goalAmount?: number;
			};
			const patch: {
				title?: string;
				description?: string;
				status?: string;
				goalAmount?: number;
			} = {};
			if (title !== undefined) patch.title = String(title).trim();
			if (description !== undefined) patch.description = String(description).trim();
			if (status !== undefined) {
				const s = String(status).toUpperCase();
				if (!ALLOWED_STATUS.includes(s)) {
					throw new ValidationError('Estado invalido (DRAFT, ACTIVE o FINISHED).');
				}
				patch.status = s;
			}
			if (goalAmount !== undefined) {
				const n = Number(goalAmount);
				if (Number.isNaN(n) || n <= 0) throw new ValidationError('La meta debe ser un numero positivo.');
				patch.goalAmount = n;
			}
			return res.json(await this.repo.updateCampaign(String(req.params.id), patch));
		} catch (error) {
			return this.handleError(error, res);
		}
	}

	async deleteCampaign(req: Request, res: Response): Promise<Response> {
		try {
			await this.repo.deleteCampaign(String(req.params.id));
			return res.status(204).send();
		} catch (error) {
			return this.handleError(error, res);
		}
	}

	// ---------- Donaciones pendientes ----------
	async listPendingDonations(_req: Request, res: Response): Promise<Response> {
		try {
			return res.json(await this.repo.listPendingDonations());
		} catch (error) {
			return this.handleError(error, res);
		}
	}

	async confirmDonation(req: Request, res: Response): Promise<Response> {
		try {
			await this.repo.confirmDonation(String(req.params.donationId));
			return res.json({ ok: true });
		} catch (error) {
			return this.handleError(error, res);
		}
	}

	private handleError(error: unknown, res: Response): Response {
		if (error instanceof ValidationError) {
			return res.status(400).json({ message: error.message });
		}
		if (error instanceof ConflictError) {
			return res.status(409).json({ message: error.message });
		}
		if (error instanceof NotFoundError) {
			return res.status(404).json({ message: error.message });
		}
		console.error('[admin] error:', error);
		return res.status(500).json({ message: 'Error interno del servidor.' });
	}
}
