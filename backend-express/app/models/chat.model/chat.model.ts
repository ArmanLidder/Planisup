import mongoose, { Schema, Document } from "mongoose";
import { UserRole } from "@common/user";

export interface IMessage {
  senderId: string; // correspond _id from User  
  firstName: string;
  lastName: string;
  role: UserRole;
  message: string;
  sentDate?: Date;
}

export interface IChat extends Document {
  studyPlanId: string;
  messages: IMessage[];
  createdDate?: Date;
  modifiedDate?: Date;
}

const MessageSchema: Schema = new mongoose.Schema(
  {
    senderId: { type: String, required: true, ref: "User" },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    role: { type: String, enum: Object.values(UserRole), required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false } // pas besoin d’un id unique par sous-doc
);

const ChatSchema: Schema = new mongoose.Schema(
  {
    studyPlanId: { type: String, required: true, ref: "StudyPlan" },
    messages: [MessageSchema],
    createdDate: { type: Date, default: Date.now },
    modifiedDate: { type: Date, default: Date.now },
  },
  { collection: "Chat" }
);

ChatSchema.pre("save", function (next) {
  this.modifiedDate = new Date();
  next();
});

ChatSchema.pre("findOneAndUpdate", function (next) {
  this.set({ modifiedDate: new Date() });
  next();
});

export const ChatModel = mongoose.model<IChat>("Chat", ChatSchema);

export const convertToChat = (chat: IChat) => {
    return {
        _id: chat._id,
        studyPlanId: chat.studyPlanId,
        messages: chat.messages,
        createdDate: chat.createdDate,
        modifiedDate: chat.modifiedDate,
    };
}
