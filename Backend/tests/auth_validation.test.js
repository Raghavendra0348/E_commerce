const { registerSchema, loginSchema, updateProfileSchema } = require("../src/validators/auth.validator");

const validUser = { name: "Test User", email: "test@example.com", password: "Password123" };

describe("authentication input validation", () => {
    it.each(["12345", "User123", "Test @User"])("rejects invalid name %s on registration and profile updates", name => {
        expect(registerSchema.safeParse({ body: { ...validUser, name } }).success).toBe(false);
        expect(updateProfileSchema.safeParse({ body: { name } }).success).toBe(false);
    });

    it.each(["Test User", "Anne-Marie", "O’Connor", "రాఘవేంద్ర", "José"])("accepts name %s", name => {
        expect(registerSchema.safeParse({ body: { ...validUser, name } }).success).toBe(true);
        expect(updateProfileSchema.safeParse({ body: { name } }).success).toBe(true);
    });
    it.each(["6123456789", "7123456789", "8123456789", "9123456789"])("accepts Indian mobile %s", phone => {
        expect(registerSchema.safeParse({ body: { ...validUser, phone } }).success).toBe(true);
        expect(updateProfileSchema.safeParse({ body: { phone } }).success).toBe(true);
    });

    it.each(["5123456789", "0123456789", "987654321", "98765432101", "+919876543210", "98765abc10", "98765 4321"])("rejects invalid mobile %s on registration and profile updates", phone => {
        expect(registerSchema.safeParse({ body: { ...validUser, phone } }).success).toBe(false);
        expect(updateProfileSchema.safeParse({ body: { phone } }).success).toBe(false);
    });

    it.each([undefined, ""])("allows an optional phone: %s", phone => {
        expect(registerSchema.safeParse({ body: { ...validUser, phone } }).success).toBe(true);
    });

    it.each(["  ", " A "])("rejects short trimmed name %s", name => {
        expect(registerSchema.safeParse({ body: { ...validUser, name } }).success).toBe(false);
    });

    it("normalizes registration name and emails without changing passwords", () => {
        const body = registerSchema.parse({ body: { ...validUser, name: "  Test User  ", email: " TEST@EXAMPLE.COM " } }).body;
        expect(body.name).toBe("Test User");
        expect(body.email).toBe("test@example.com");
        expect(body.password).toBe(validUser.password);
        expect(loginSchema.parse({ body: { email: " TEST@EXAMPLE.COM ", password: " password " } }).body).toEqual({ email: "test@example.com", password: " password " });
    });
});
