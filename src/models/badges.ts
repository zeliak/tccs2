import { ObjectId } from "mongodb";

export interface IUserBadge {
    name: string
    imgUrl?: string
    version: string
}

export class Badge {
    constructor(public name: string, public version: string, public imgUrl?:string, public _id?: ObjectId) {}
}
