import { IOAuthProvider } from '../domain/IOAuthProvider';
import { OAuthProfile } from '../domain/User';

interface GoogleUserInfo {
	sub?: string;
	email?: string;
}

export class GoogleOAuth implements IOAuthProvider {
	async verifyAccessToken(accessToken: string): Promise<OAuthProfile> {
		const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
		});

		if (!response.ok) {
			throw new Error('No se pudo validar el token de Google.');
		}

		const payload = (await response.json()) as GoogleUserInfo;
		if (!payload.email || !payload.sub) {
			throw new Error('Google no devolvio email o identificador del usuario.');
		}

		return {
			email: payload.email.toLowerCase(),
			providerId: payload.sub,
		};
	}
}
