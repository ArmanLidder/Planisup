import { UserRole } from "./user";

export interface Chat {
    _id?: string,
    studyPlanId: string,
    messages: Message[]
    createdDate?: Date;
    modifiedDate?: Date;
}

export interface Message {
    _id?: string,
    senderId: string,
    firstName: string;
    lastName: string;
    role: UserRole;
    message: string,
    createdAt?: Date
}
