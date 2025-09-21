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
    message: string,
    sentDate?: Date
}
