export enum UserRole {
    ADMIN = "admin",
    MEMBER = "member",
}

export enum UserStatus {
    PENDING = "pending",
    ACTIVE = "active",
    BLOCKED = "blocked",
}

export enum ProjectStatus {
    POTENTIAL = "potential",
    FUTURE = "future",
    TODO = "todo",
    IN_PROGRESS = "in_progress",
    IN_REVIEW = "in_review",
    COMPLETED = "completed",
    ON_HOLD = "on_hold",
}

export enum ProjectPriority {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    URGENT = "urgent",
}

export type UserRoleType = "admin" | "member";
export type UserStatusType = "pending" | "active" | "blocked";
export type ProjectStatusType =
    | "potential"
    | "future"
    | "todo"
    | "in_progress"
    | "in_review"
    | "completed"
    | "on_hold";
export type ProjectPriorityType = "low" | "medium" | "high" | "urgent";
