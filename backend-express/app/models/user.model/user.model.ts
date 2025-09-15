import { Schema, model, Document } from 'mongoose';
import { UserRole } from '@common/user';
import { ObjectId } from 'mongodb';

export interface IUser extends Document {
    _id: string;
    usercode: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    currentPlan: Object;
    plans: [string];
}

const UserSchema = new Schema({
    usercode:  { type: String, required: true, unique: true },
    firstName: { type: String, required: true },
    lastName:  { type: String, required: true },
    role: { 
        type: String,
        enum: Object.values(UserRole),
        required: true,
    },
    currentPlan:  { type: Object},
    plans: { type: [ObjectId] }
}, {collection: 'User'});

export const UserModel = model<IUser>('User', UserSchema);

export const convertUserInterface = (user: IUser) => {
    return {
        _id: user._id,
        usercode: user.usercode,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        currentPlan: user.currentPlan,
        plans: user.plans,
    }
}

