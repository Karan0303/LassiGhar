const bcrypt = require("bcryptjs");
const User = require("../models/User");

async function ensureAdminUserExists() {
  const count = await User.countDocuments();
  if (count > 0) {
    return;
  }

  const hashed = await bcrypt.hash("admin", 10);

  await User.create({
    name: "Administrator",
    email: "admin@lassighar.com",
    password: hashed,
    role: "admin",
  });

  console.log("No users found. Default admin user created:");
  console.log("Email: admin@lassighar.com");
  console.log("Password: admin");
}

module.exports = { ensureAdminUserExists };

