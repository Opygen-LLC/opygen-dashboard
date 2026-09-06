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

export enum ClientPriority {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
}

export type ClientPriorityType = "low" | "medium" | "high";

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
    ALLOWANCE = "allowance",
    LOAN_GIVEN = "loan_given",
    LOAN_TAKEN = "loan_taken",
    LOAN_REPAYMENT = "loan_repayment",
    LOAN_COLLECTED = "loan_collected",
    EQUIPMENT = "equipment",
    SOFTWARE = "software",
    OFFICE = "office",
    PROJECT_REVENUE = "project_revenue",
    PRODUCT = "product",
    OTHER = "other",
}

export enum ProductName {
    OPYGEN_CLEANING_CRM = "Opygen Cleaning CRM",
    OPYGEN_REAL_ESTATE_CRM = "Opygen Real Estate CRM",
}

export type ProductNameUnion =
    | "Opygen Cleaning CRM"
    | "Opygen Real Estate CRM";

export type TransactionTypeUnion = "income" | "expense";
export type TransactionCategoryUnion =
    | "salary"
    | "allowance"
    | "loan_given"
    | "loan_taken"
    | "loan_repayment"
    | "loan_collected"
    | "equipment"
    | "software"
    | "office"
    | "project_revenue"
    | "product"
    | "other";

