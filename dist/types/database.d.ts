import { Model } from "./model";
export declare class Database {
    name: string;
    dbPath: string;
    models: Record<string, Model<any>>;
    constructor(name: string);
    createModel<T>(modelName: string, schema: Record<string, {
        type: string;
    }>): Model<T>;
    listModels(): string[];
    deleteModel(modelName: string): boolean;
    compact(): void;
    backup(backupDir: string): void;
    listDatabases(): string[];
}
