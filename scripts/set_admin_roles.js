import dotenv from "dotenv";
import { query } from "../lib/db.js";

dotenv.config();

async function main() {
  await query(
    "UPDATE users SET role = 'ADMIN' WHERE email IN ('himanshibawne75@gmail.com', 'sonubawne482005@gmail.com', 'admin@globebridge.dev')"
  );

  const adminUsers = await query("SELECT id, name, email, role, is_active FROM users WHERE role = 'ADMIN'");
  console.log("Updated Admin Users:", JSON.stringify(adminUsers, null, 2));
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
