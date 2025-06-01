import { Database } from "./database";
interface UserCredentials {
    username: string;
    password: string;
    roles?: string[];
    permissions?: string[];
    database?: string;
    dbDir?: string;
}
interface Role {
    name: string;
    permissions: string[];
}
declare function createDatabase({ database, username, password, roles, permissions }: {
    database: string;
    username: string;
    password: string;
    roles?: string[];
    permissions?: string[];
}): Promise<Database>;
declare function updateDatabaseUser({ database, oldUsername, oldPassword, newUsername, newPassword, roles, permissions }: {
    database: string;
    oldUsername: string;
    oldPassword: string;
    newUsername?: string;
    newPassword?: string;
    roles?: string[];
    permissions?: string[];
}): Promise<void>;
declare function connect({ database, username, password, timeout }: {
    database: string;
    username: string;
    password: string;
    timeout?: number;
}): Promise<Database | false>;
export { createDatabase, updateDatabaseUser, connect, UserCredentials, Role };
