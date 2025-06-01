"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDatabase = createDatabase;
exports.updateDatabaseUser = updateDatabaseUser;
exports.connect = connect;
const database_1 = require("./database");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const DEFAULT_DB_NAME = "admin_db";
const DEFAULT_ADMIN_USER = {
    username: "admin",
    password: "admin",
    roles: ["admin"],
    permissions: ["read", "write", "full"],
    database: DEFAULT_DB_NAME,
    dbDir: path.resolve("jsonbeam", DEFAULT_DB_NAME)
};
const DEFAULT_ROLES = [
    { name: "admin", permissions: ["read", "write", "full"] },
    { name: "user", permissions: ["read", "write"] }
];
function ensureDefaultDatabase() {
    return __awaiter(this, void 0, void 0, function* () {
        const dbDir = path.resolve("jsonbeam", DEFAULT_DB_NAME);
        const userFile = path.join(dbDir, "users.json");
        const rolesFile = path.join(dbDir, "roles.json");
        if (!(yield databaseDirExists(dbDir))) {
            yield fs.mkdir(dbDir, { recursive: true });
            yield fs.writeFile(userFile, JSON.stringify([DEFAULT_ADMIN_USER], null, 2), "utf-8");
            yield fs.writeFile(rolesFile, JSON.stringify(DEFAULT_ROLES, null, 2), "utf-8");
            return true;
        }
        return false;
    });
}
function databaseDirExists(database) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield fs.access(database);
            return true;
        }
        catch (_a) {
            return false;
        }
    });
}
function readUsers(userFile) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const userData = yield fs.readFile(userFile, "utf-8");
            const parsed = JSON.parse(userData);
            return Array.isArray(parsed) ? parsed : [parsed];
        }
        catch (_a) {
            throw new Error("users.json file not found or invalid.");
        }
    });
}
function validateUser(users, username, password) {
    return users.find(u => u.username === username && u.password === password) || null;
}
function hasPermission(user, permission) {
    var _a, _b;
    if (!user.roles || user.roles.includes("user"))
        return true; // default full access
    return (_b = (_a = user.permissions) === null || _a === void 0 ? void 0 : _a.includes(permission)) !== null && _b !== void 0 ? _b : false;
}
function createDatabase(_a) {
    return __awaiter(this, arguments, void 0, function* ({ database, username, password, roles = ["user"], permissions = ["read", "write"] }) {
        yield ensureDefaultDatabase();
        const dbDir = path.resolve("jsonbeam", database);
        // Check if database folder already exists
        if (yield databaseDirExists(dbDir)) {
            throw new Error("Database already exists.");
        }
        // Only update admin_db/users.json for new database access
        const adminDbDir = path.resolve("jsonbeam", DEFAULT_DB_NAME);
        const adminUserFile = path.join(adminDbDir, "users.json");
        let users = [];
        try {
            users = yield readUsers(adminUserFile);
            if (validateUser(users, username, password)) {
                throw new Error("Username and password already exist.");
            }
        }
        catch (err) {
            if (!/not found/.test(err.message))
                throw err;
        }
        users.push({
            username,
            password,
            roles,
            permissions,
            database,
            dbDir
        });
        yield fs.writeFile(adminUserFile, JSON.stringify(users, null, 2), "utf-8");
        yield fs.mkdir(dbDir, { recursive: true });
        const dbFile = path.join(dbDir);
        return new database_1.Database(dbFile);
    });
}
function updateDatabaseUser(_a) {
    return __awaiter(this, arguments, void 0, function* ({ database, oldUsername, oldPassword, newUsername, newPassword, roles, permissions }) {
        yield ensureDefaultDatabase();
        const dbDir = path.resolve("jsonbeam", database);
        if (!(yield databaseDirExists(dbDir))) {
            throw new Error("Database does not exist.");
        }
        const adminDbDir = path.resolve("jsonbeam", DEFAULT_DB_NAME);
        const adminUserFile = path.join(adminDbDir, "users.json");
        const users = yield readUsers(adminUserFile);
        const idx = users.findIndex(u => u.username === oldUsername && u.password === oldPassword);
        if (idx === -1) {
            throw new Error("User not found.");
        }
        // Check for duplicate username/password if changed
        if ((newUsername && newUsername !== oldUsername) || (newPassword && newPassword !== oldPassword)) {
            if (users.some((u, i) => i !== idx &&
                (u.username === (newUsername !== null && newUsername !== void 0 ? newUsername : oldUsername)) &&
                (u.password === (newPassword !== null && newPassword !== void 0 ? newPassword : oldPassword)))) {
                throw new Error("Username and password already exist.");
            }
        }
        if (newUsername)
            users[idx].username = newUsername;
        if (newPassword)
            users[idx].password = newPassword;
        if (roles)
            users[idx].roles = roles;
        if (permissions)
            users[idx].permissions = permissions;
        users[idx].database = database;
        users[idx].dbDir = dbDir;
        yield fs.writeFile(adminUserFile, JSON.stringify(users, null, 2), "utf-8");
    });
}
function withTimeout(promise, ms) {
    return new Promise((resolve, reject) => {
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
function connect(_a) {
    return __awaiter(this, arguments, void 0, function* ({ database, username, password, timeout = 5000 }) {
        yield ensureDefaultDatabase();
        try {
            return yield withTimeout((() => __awaiter(this, void 0, void 0, function* () {
                const dbDir = path.resolve("jsonbeam", database);
                if (!(yield databaseDirExists(dbDir))) {
                    console.error("Database directory does not exist:", dbDir);
                    throw new Error("Database does not exist.");
                }
                // Check users.json and roles.json in default database folder if not present in target db
                const defaultDbDir = path.resolve("jsonbeam", DEFAULT_DB_NAME);
                const defaultUserFile = path.join(defaultDbDir, "users.json");
                const defaultRolesFile = path.join(defaultDbDir, "roles.json");
                // If users.json or roles.json do not exist in dbDir, fallback to default
                yield fs.access(defaultUserFile);
                yield fs.access(defaultRolesFile);
                const users = yield readUsers(defaultUserFile);
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
                return new database_1.Database(dbDir);
            }))(), timeout);
        }
        catch (err) {
            console.error("Connect error:", err);
            return false;
        }
    });
}
