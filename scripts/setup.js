const fs = require("fs");
const path = require("path");
const readline = require("readline");
const crypto = require("crypto");

async function setupAdminDB() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.question("Enter the directory path where you want to create the database folder: ", (dirPath) => {
        rl.question("Enter admin username: ", (username) => {
            rl.question("Enter admin password: ", (password) => {
                rl.question("Enter default database name: ", (database) => {
                    const BASE_DIR = path.resolve(dirPath, "JSONDB");
                    const ADMIN_DB = path.join(BASE_DIR, "admin_db");
                    const USERS_FILE = path.join(ADMIN_DB, "users.json");
                    const ROLES_FILE = path.join(ADMIN_DB, "roles.json");
                    const DB_FILE = path.join(ADMIN_DB, "db.jsonl");

                    // Create necessary directories
                    if (!fs.existsSync(BASE_DIR)) fs.mkdirSync(BASE_DIR, { recursive: true });
                    if (!fs.existsSync(ADMIN_DB)) fs.mkdirSync(ADMIN_DB);

                    // Store admin credentials securely, including dirPath
                    const adminData = [{
                        username: username,
                        password: crypto.createHash("sha256").update(password).digest("hex"),
                        roles: ["admin"],
                        permissions: ["ALL"],
                        defaultDB: database,
                        dirPath: dirPath
                    }];
                    fs.writeFileSync(USERS_FILE, JSON.stringify(adminData, null, 2));

                    // Define default roles and permissions
                    const rolesData = {
                        admin: ["ALL"],
                        user: ["READ", "WRITE"]
                    };
                    fs.writeFileSync(ROLES_FILE, JSON.stringify(rolesData, null, 2));

                    // Create empty db.jsonl file
                    fs.writeFileSync(DB_FILE, "");

                    console.log("✅ Admin database initialized successfully!");
                    console.log("✅ Roles configuration created successfully!");
                    rl.close();
                });
            });
        });
    });
}

setupAdminDB();