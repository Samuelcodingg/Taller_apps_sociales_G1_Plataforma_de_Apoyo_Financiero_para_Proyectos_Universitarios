import { IOAuthProvider } from '../domain/IOAuthProvider';
import { OAuthProfile } from '../domain/User';

interface LinkedInUserInfo {
	sub?: string;
	email?: string;
}

export class LinkedInOAuth implements IOAuthProvider {
	async verifyAccessToken(accessToken: string): Promise<OAuthProfile> {
		const response = await fetch('https://api.linkedin.com/v2/userinfo', {
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
		});

		if (!response.ok) {
			throw new Error('No se pudo validar el token de LinkedIn.');
		}

		const payload = (await response.json()) as LinkedInUserInfo;
		if (!payload.email || !payload.sub) {
			throw new Error('LinkedIn no devolvio email o identificador del usuario.');
		}

		return {
			email: payload.email.toLowerCase(),
			providerId: payload.sub,
		};
	}
}
