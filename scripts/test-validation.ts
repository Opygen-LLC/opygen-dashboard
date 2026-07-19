import { addUserSchema } from "../src/lib/validations";
import { UserRole, UserStatus } from "../src/types";

function testValidation() {
  const testData1 = {
    name: "John Doe",
    email: "john@example.com",
    role: UserRole.MEMBER,
    password: "Password123",
    mobileNumber: "",
    status: UserStatus.PENDING,
  };

  const testData2 = {
    name: "John Doe",
    email: "john@example.com",
    role: UserRole.MEMBER,
    password: "Password123",
    mobileNumber: undefined,
    status: UserStatus.PENDING,
  };

  const testData3 = {
    name: "John Doe",
    email: "john@example.com",
    role: UserRole.MEMBER,
    password: "Password123",
    mobileNumber: "+8801712345678",
    status: UserStatus.PENDING,
  };

  console.log("Test 1 (empty string):", addUserSchema.safeParse(testData1).success);
  if (!addUserSchema.safeParse(testData1).success) {
    console.log(addUserSchema.safeParse(testData1).error);
  }

  console.log("Test 2 (undefined):", addUserSchema.safeParse(testData2).success);
  if (!addUserSchema.safeParse(testData2).success) {
    console.log(addUserSchema.safeParse(testData2).error);
  }

  console.log("Test 3 (valid number):", addUserSchema.safeParse(testData3).success);
  if (!addUserSchema.safeParse(testData3).success) {
    console.log(addUserSchema.safeParse(testData3).error);
  }
}

testValidation();
