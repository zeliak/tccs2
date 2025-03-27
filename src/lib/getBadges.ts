import tApi from "./apiConnection";

export const twitchGlobalBadges = tApi.apiConnection.chat.getGlobalBadges().then(res => {return res});