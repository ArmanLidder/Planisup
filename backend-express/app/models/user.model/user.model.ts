import { Schema, model, Document } from 'mongoose';
import { UserRole } from '@common/user';

export interface IUser extends Document {
    _id: string;
    usercode: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    currentPlan: string;
    plans: [string];
    department?: string;
    programId?: string
    directorId?: string
    codirectorsIds?: string[];
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
    currentPlan:  { type: String},
    plans: { type: [String] },
    department: { type: String },
    programId: { type: String },
    directorId: { type: String },
    codirectorsIds: { type: [String] },
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
        department: user.department || '',
        programId: user.programId || '',
        directorId: user.directorId || '',
        codirectorsIds: user.codirectorsIds || [],
    }
}

