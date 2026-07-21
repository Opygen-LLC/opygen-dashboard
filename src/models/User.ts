import mongoose, { Schema, Document, Model } from "mongoose";
import { UserRole, UserRoleType, UserStatus, UserStatusType } from "@/types";

export interface IUserAccount {
    _id?: string;
    type: "bank" | "mobile_banking";
    providerName: string;
    accountName: string;
    accountNumber: string;
    routingNumber?: string;
    branch?: string;
}

export interface IUser extends Document {
    name: string;
    email: string;
    passwordHash: string;
    avatarUrl?: string;
    role: UserRoleType;
    status: UserStatusType;
    needPasswordChange: boolean;
    mobileNumber?: string;
    resetPasswordToken?: string;
    resetPasswordExpires?: Date;
    balance: number;
    fathersName?: string;
    mothersName?: string;
    gender?: string;
    dateOfBirth?: string;
    bloodGroup?: string;
    accounts?: IUserAccount[];
    createdAt: Date;
}

const UserSchema = new Schema<IUser>({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    avatarUrl: { type: String },
    role: {
        type: String,
        enum: Object.values(UserRole),
        default: UserRole.MEMBER,
    },
    status: {
        type: String,
        enum: Object.values(UserStatus),
        default: UserStatus.ACTIVE,
    },
    needPasswordChange: { type: Boolean, default: false },
    mobileNumber: { type: String },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    balance: { type: Number, default: 0 },
    fathersName: { type: String },
    mothersName: { type: String },
    gender: { type: String, enum: ["Male", "Female", "Other"] },
    dateOfBirth: { type: String },
    bloodGroup: { type: String, enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] },
    accounts: [
        {
            type: { type: String, enum: ["bank", "mobile_banking"], required: true },
            providerName: { type: String, required: true },
            accountName: { type: String, required: true },
            accountNumber: { type: String, required: true },
            routingNumber: { type: String },
            branch: { type: String },
        }
    ],
    createdAt: { type: Date, default: Date.now },
});

if (mongoose.models.User) {
    delete mongoose.models.User;
}

const User: Model<IUser> = mongoose.model<IUser>("User", UserSchema);

export default User;
