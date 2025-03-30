import { AppTokenAuthProvider } from "@twurple/auth";
import { ApiClient } from '@twurple/api';


export interface TwitchUser {
    id: number;
    userName: string;
    profileImageUrl: string;
}

export interface Token {
    accessToken: string;
    expiresIn: number;
    tokenType: string;
    timeStamp: Date;
}

export class TwitchAPI {
    private authProvider: AppTokenAuthProvider;
    public apiConnection: ApiClient;

    constructor(clientID: string, clientSecret: string) {
        this.authProvider = new AppTokenAuthProvider(clientID, clientSecret);
        this.apiConnection = this.setApiConnection(this.authProvider);
    }

    private setApiConnection(authProvider: AppTokenAuthProvider): ApiClient {
        return new ApiClient({ authProvider });
    }
}
