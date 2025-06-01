import { Database } from "./database";
import * as fs from "fs/promises";
import * as path from "path";

interface UserCredentials {
    username: string;
    password: string;
    roles?: string[];
    permissions?: string[];
    database?: string; // Add database name
    dbDir?: string;    // Add database directory path
}

interface Role {
    name: string;
    permissions: string[];
}

const DEFAULT_DB_NAME = "admin_db";
const DEFAULT_ADMIN_USER: UserCredentials = {
    username: "admin",
    password: "admin",
    roles: ["admin"],
    permissions: ["read", "write", "full"],
    database: DEFAULT_DB_NAME,
    dbDir: path.resolve("jsonbeam", DEFAULT_DB_NAME)
};
const DEFAULT_ROLES: Role[] = [
    { name: "admin", permissions: ["read", "write", "full"] },
    { name: "user", permissions: ["read", "write"] }
];

async function ensureDefaultDatabase(): Promise<boolean> {
    const dbDir = path.resolve("jsonbeam", DEFAULT_DB_NAME);
    const userFile = path.join(dbDir, "users.json");
    const rolesFile = path.join(dbDir, "roles.json");
    if (!(await databaseDirExists(dbDir))) {
        await fs.mkdir(dbDir, { recursive: true });
        await fs.writeFile(userFile, JSON.stringify([DEFAULT_ADMIN_USER], null, 2), "utf-8");
        await fs.writeFile(rolesFile, JSON.stringify(DEFAULT_ROLES, null, 2), "utf-8");
        return true;
    }
    return false;
}

async function databaseDirExists(database: string): Promise<boolean> {
    try {
        await fs.access(database);
        return true;
    } catch {
        return false;
    }
}

async function readUsers(userFile: string): Promise<UserCredentials[]> {
    try {
        const userData = await fs.readFile(userFile, "utf-8");
        const parsed = JSON.parse(userData);
        return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
        throw new Error("users.json file not found or invalid.");
    }
}

function validateUser(users: UserCredentials[], username: string, password: string): UserCredentials | null {
    return users.find(u => u.username === username && u.password === password) || null;
}

function hasPermission(user: UserCredentials, permission: string): boolean {
    if (!user.roles || user.roles.includes("user")) return true; // default full access
    return user.permissions?.includes(permission) ?? false;
}

async function createDatabase({
    database,
    username,
    password,
    roles = ["user"],
    permissions = ["read", "write"]
}: {
    database: string;
    username: string;
    password: string;
    roles?: string[];
    permissions?: string[];
}): Promise<Database> {
    await ensureDefaultDatabase();
    const dbDir = path.resolve("jsonbeam", database);

    // Check if database folder already exists
    if (await databaseDirExists(dbDir)) {
        throw new Error("Database already exists.");
    }

    // Only update admin_db/users.json for new database access
    const adminDbDir = path.resolve("jsonbeam", DEFAULT_DB_NAME);
    const adminUserFile = path.join(adminDbDir, "users.json");

    let users: UserCredentials[] = [];
    try {
        users = await readUsers(adminUserFile);
        if (validateUser(users, username, password)) {
            throw new Error("Username and password already exist.");
        }
    } catch (err: any) {
        if (!/not found/.test(err.message)) throw err;
    }
    users.push({
        username,
        password,
        roles,
        permissions,
        database,
        dbDir
    });
    await fs.writeFile(adminUserFile, JSON.stringify(users, null, 2), "utf-8");

    await fs.mkdir(dbDir, { recursive: true });

    const dbFile = path.join(dbDir);
    return new Database(dbFile);
}

async function updateDatabaseUser({
    database,
    oldUsername,
    oldPassword,
    newUsername,
    newPassword,
    roles,
    permissions
}: {
    database: string;
    oldUsername: string;
    oldPassword: string;
    newUsername?: string;
    newPassword?: string;
    roles?: string[];
    permissions?: string[];
}): Promise<void> {
    await ensureDefaultDatabase();
    const dbDir = path.resolve("jsonbeam", database);
    if (!await databaseDirExists(dbDir)) {
        throw new Error("Database does not exist.");
    }
    const adminDbDir = path.resolve("jsonbeam", DEFAULT_DB_NAME);
    const adminUserFile = path.join(adminDbDir, "users.json");

    const users = await readUsers(adminUserFile);
    const idx = users.findIndex(u => u.username === oldUsername && u.password === oldPassword);
    if (idx === -1) {
        throw new Error("User not found.");
    }
    // Check for duplicate username/password if changed
    if ((newUsername && newUsername !== oldUsername) || (newPassword && newPassword !== oldPassword)) {
        if (users.some((u, i) =>
            i !== idx &&
            (u.username === (newUsername ?? oldUsername)) &&
            (u.password === (newPassword ?? oldPassword))
        )) {
            throw new Error("Username and password already exist.");
        }
    }
    if (newUsername) users[idx].username = newUsername;
    if (newPassword) users[idx].password = newPassword;
    if (roles) users[idx].roles = roles;
    if (permissions) users[idx].permissions = permissions;
    users[idx].database = database;
    users[idx].dbDir = dbDir;
    await fs.writeFile(adminUserFile, JSON.stringify(users, null, 2), "utf-8");
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error("Connection timeout")), ms);
        promise
            .then(val => {
                clearTimeout(timer);
                resolve(val);
            })
            .catch(err => {
                clearTimeout(timer);
                reject(err);
            });
    });
}

async function connect({
    database,
    username,
    password,
    timeout = 5000
}: { database: string; username: string; password: string; timeout?: number }): Promise<Database | false> {
    await ensureDefaultDatabase();
    try {
        return await withTimeout((async () => {
            const dbDir = path.resolve("jsonbeam", database);
            if (!await databaseDirExists(dbDir)) {
                console.error("Database directory does not exist:", dbDir);
                throw new Error("Database does not exist.");
            }

            // Check users.json and roles.json in default database folder if not present in target db
    
            const defaultDbDir = path.resolve("jsonbeam", DEFAULT_DB_NAME);
            const defaultUserFile = path.join(defaultDbDir, "users.json");
            const defaultRolesFile = path.join(defaultDbDir, "roles.json");

            // If users.json or roles.json do not exist in dbDir, fallback to default
            
                await fs.access(defaultUserFile);
                await fs.access(defaultRolesFile);

            const users = await readUsers(defaultUserFile);
            const user = validateUser(users, username, password);
            if (!user) {
                console.error("Invalid username or password for:", username);
                throw new Error("Invalid username or password.");
            }
            if (!hasPermission(user, "read")) {
                console.error("User does not have read permission:", username);
                throw new Error("User does not have read permission.");
            }
            user.database = database;
            user.dbDir = dbDir;
            return new Database(dbDir);
        })(), timeout);
    } catch (err) {
        console.error("Connect error:", err);
        return false;
    }
}




export {
    createDatabase,
    updateDatabaseUser,
    connect,
    UserCredentials,
    Role
};
