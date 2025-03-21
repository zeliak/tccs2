export interface TwitchUser {
    id: number;
    userName: string;
    profileImageUrl: string;
}

export interface Token {
    accessToken: string;
    expiresIn: number;
    tokenType: string;
}