import { Router } from "express";
import { db } from "@db";
import { users, roles } from "@db/schema";
import { eq } from "drizzle-orm";
import passport from "passport";
import { checkPermission } from "../../middleware/rbac";

const router = Router();

// User management routes
router.get("/users", checkPermission("users", "read"), async (req, res) => {
  try {
    const allUsers = await db
      .select({
        id: users.id,
        username: users.username,
        roleId: users.roleId,
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
  // Only SuperAdmin can create new users
  if (!req.user || req.user.roleId !== 1) {
    return res.status(403).json({ message: "Only SuperAdmin can create new users" });
  }

  try {
    const { username, password, roleId } = req.body;
    
    // Check if user exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (existingUser.length > 0) {
      return res.status(400).json({ message: "Username already exists" });
    }

    // Create new user
    const [newUser] = await db
      .insert(users)
      .values({
        username,
        password,
        roleId,
      })
      .returning();

    res.status(201).json({
      message: "User created successfully",
      user: {
        id: newUser.id,
        username: newUser.username,
        roleId: newUser.roleId,
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Auth routes
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
