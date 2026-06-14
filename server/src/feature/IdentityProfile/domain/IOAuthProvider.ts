import { OAuthProfile } from './User';

export interface IOAuthProvider {
	verifyAccessToken(accessToken: string): Promise<OAuthProfile>;
}
