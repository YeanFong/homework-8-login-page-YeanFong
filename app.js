require("dotenv").config();

const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const { engine } = require("express-handlebars");

const app = express();
const PORT = process.env.PORT || 3000;

const users = {
    "admin": {
        username: "admin",
        password: "password123",
        fullName: "System Administrator",
        email: "admin@university.edu",
        bio: "Managing the campus network infrastructure."
    },
    "student_dev": {
        username: "student_dev",
        password: "dev_password",
        fullName: "Jane Developer",
        email: "jane.d@student.edu",
        bio: "Full-stack enthusiast and coffee drinker."
    }
};

app.engine("handlebars", engine());
app.set("view engine", "handlebars");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.use(cookieParser(process.env.COOKIE_SECRET || "cookie_secret_123"));
app.use(
  session({
    secret: process.env.SESSION_SECRET || "session_secret_123",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true
    }
  })
);

app.use((req, res, next) => {
  res.locals.theme = req.signedCookies.theme || "light";
  res.locals.user = req.session.user || null;
  next();
});

function requireAuth(req, res, next) {
  if (req.session.user) {
    return next();
  }
  return res.redirect("/login");
}

app.get("/", (req, res) => {
  if (req.session.user) {
    return res.redirect("/profile");
  }
  return res.redirect("/login");
});

app.get("/login", (req, res) => {
  res.render("login", {
    title: "Login",
    error: req.query.error || null
  });
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;

  const matchedUser = Object.values(users).find(
    (user) => user.username === username && user.password === password
  );

  if (!matchedUser) {
    return res.redirect("/login?error=Invalid credentials");
  }

  req.session.user = {
    username: matchedUser.username,
    fullName: matchedUser.fullName,
    email: matchedUser.email,
    bio: matchedUser.bio
  };

  return res.redirect("/profile");
});

app.get("/profile", requireAuth, (req, res) => {
  res.render("profile", {
    title: "Profile",
    user: req.session.user
  });
});

app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.redirect("/profile");
    }

    res.clearCookie("connect.sid");
    return res.redirect("/login");
  });
});

app.get("/toggle-theme", (req, res) => {
  const currentTheme = req.signedCookies.theme || "light";
  const nextTheme = currentTheme === "light" ? "dark" : "light";

  res.cookie("theme", nextTheme, {
    signed: true,
    httpOnly: true
  });

  const backURL = req.get("Referrer") || "/login";
  return res.redirect(backURL);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});