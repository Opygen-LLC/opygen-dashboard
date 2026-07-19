import mongoose, { Schema, Document, Model } from "mongoose";
import { UserRole, UserRoleType, UserStatus, UserStatusType } from "@/types";

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
    createdAt: { type: Date, default: Date.now },
});

const User: Model<IUser> =
    mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
