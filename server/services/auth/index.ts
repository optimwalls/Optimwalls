import { Express } from "express";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import createMemoryStore from "memorystore";
import { setupAuthRoutes } from "./routes";
import { authService } from "./service";

export function setupAuthService(app: Express) {
  // Session setup
  const MemoryStore = createMemoryStore(session);
  const sessionSettings: session.SessionOptions = {
    secret: process.env.REPL_ID || "optim-walls-crm",
    resave: false,
    saveUninitialized: false,
    cookie: {},
    store: new MemoryStore({
      checkPeriod: 86400000,
    }),
  };

  if (app.get("env") === "production") {
    app.set("trust proxy", 1);
    sessionSettings.cookie = { secure: true };
  }

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Setup passport strategy
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const result = await authService.validateUser(username, password);
        if (!result.success) {
          return done(null, false, { message: result.message });
        }
        return done(null, result.user);
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.serializeUser((user: Express.User, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await authService.getUserById(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Setup routes
  setupAuthRoutes(app);
}
