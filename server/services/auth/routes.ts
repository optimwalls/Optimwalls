import { Router } from "express";
import { db } from "@db";
import { users, roles, insertUserSchema } from "@db/schema";
import { eq } from "drizzle-orm";
import passport from "passport";
import { checkPermission } from "../../middleware/rbac";
import { emailService } from "../email/service";
import { crypto } from "../../auth";

const router = Router();

// User management routes
router.get("/users", checkPermission("users", "read"), async (req, res) => {
  try {
    const allUsers = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        roleId: users.roleId,
        isEmailVerified: users.isEmailVerified,
        createdAt: users.createdAt,
      })
      .from(users)
      .leftJoin(roles, eq(users.roleId, roles.id));
    res.json(allUsers);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/register", async (req, res) => {
  try {
    const result = insertUserSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        message: "Invalid input",
        errors: result.error.issues.map(i => i.message)
      });
    }

    const { username, password, email } = result.data;

    // Check if user exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (existingUser.length > 0) {
      return res.status(400).json({ message: "Username already exists" });
    }

    // Get viewer role (default role for new users)
    const [viewerRole] = await db
      .select()
      .from(roles)
      .where(eq(roles.name, "Viewer"))
      .limit(1);

    if (!viewerRole) {
      return res.status(500).json({ message: "Default role not found" });
    }

    // Create user with hashed password
    const hashedPassword = await crypto.hash(password);
    const [newUser] = await db
      .insert(users)
      .values({
        username,
        password: hashedPassword,
        email,
        roleId: viewerRole.id,
        isEmailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Send verification email
    await emailService.sendVerificationEmail(newUser.id, email);

    // Create safe user object
    const safeUser = {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      roleId: newUser.roleId,
      isEmailVerified: newUser.isEmailVerified,
      createdAt: newUser.createdAt,
      updatedAt: newUser.updatedAt,
    };

    res.status(201).json({
      message: "Registration successful. Please check your email to verify your account.",
      user: safeUser,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Email verification endpoint
router.get("/verify-email/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const verified = await emailService.verifyEmail(token);

    if (!verified) {
      return res.status(400).json({ message: "Invalid or expired verification token" });
    }

    res.json({ message: "Email verified successfully" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Password reset request endpoint
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    await emailService.sendPasswordResetEmail(email);
    res.json({ message: "If an account exists with this email, you will receive password reset instructions." });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Reset password endpoint
router.post("/reset-password/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: "New password is required" });
    }

    const userId = await emailService.verifyResetToken(token);
    if (!userId) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    // Update password
    const hashedPassword = await crypto.hash(password);
    await db
      .update(users)
      .set({
        password: hashedPassword,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    res.json({ message: "Password reset successful" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Auth routes (retained from original)
router.post("/login", passport.authenticate("local"), (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication failed" });
  }
  res.json({ message: "Login successful", user: req.user });
});

router.post("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ message: "Logout failed" });
    }
    res.json({ message: "Logged out successfully" });
  });
});

router.get("/me", (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  res.json(req.user);
});

export default router;