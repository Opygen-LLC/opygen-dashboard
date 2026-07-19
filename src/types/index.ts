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

export enum TransactionType {
    INCOME = "income",
    EXPENSE = "expense",
}

export enum TransactionCategory {
    SALARY = "salary",
    LOAN_GIVEN = "loan_given",
    LOAN_TAKEN = "loan_taken",
    LOAN_REPAYMENT = "loan_repayment",
    EQUIPMENT = "equipment",
    SOFTWARE = "software",
    OFFICE = "office",
    PROJECT_REVENUE = "project_revenue",
    OTHER = "other",
}

export type TransactionTypeUnion = "income" | "expense";
export type TransactionCategoryUnion =
    | "salary"
    | "loan_given"
    | "loan_taken"
    | "loan_repayment"
    | "equipment"
    | "software"
    | "office"
    | "project_revenue"
    | "other";
