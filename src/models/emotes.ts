import { ObjectId } from "mongodb"

export interface IEmote {
    name: string
    imgUrl?: string
    version: string
}

export class Emote {
    constructor(public name: string, public imgUrl: string, public twitchId: string, public _id?: ObjectId) {}
}
