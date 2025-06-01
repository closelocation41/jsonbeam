import fs from "fs";
import path from "path";
import { Model } from "./model";

export class Database {
    name: string;
    dbPath: string;
    models: Record<string, Model<any>>;

    constructor(name: string) {
        this.name = name;
        // Always resolve from project root, not __dirname
        this.dbPath = path.resolve("jsonbeam", name);
        if (!fs.existsSync(this.dbPath)) fs.mkdirSync(this.dbPath, { recursive: true });
        this.models = {};
    }

    createModel<T>(modelName: string, schema: Record<string, { type: string }>): Model<T> {
        const filePath = path.join(this.dbPath, `${modelName}.json`);
        if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, JSON.stringify([]));
        this.models[modelName] = new Model<T>(filePath, schema);
        return this.models[modelName];
    }

    // List all models in the database
    listModels(): string[] {
        return Object.keys(this.models);
    }

    // Remove a model and its data file
    deleteModel(modelName: string): boolean {
        const model = this.models[modelName];
        if (!model) return false;
        fs.unlinkSync(model.filePath);
        delete this.models[modelName];
        return true;
    }

    // Compact all model files (remove whitespace, optimize storage)
    compact(): void {
        for (const modelName in this.models) {
            const model = this.models[modelName];
            const data = model.getAll();
            fs.writeFileSync(model.filePath, JSON.stringify(data));
        }
    }

    // Backup the entire database to a specified directory
    backup(backupDir: string): void {
        if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
        for (const modelName in this.models) {
            const model = this.models[modelName];
            const dest = path.join(backupDir, `${modelName}.json`);
            fs.copyFileSync(model.filePath, dest);
        }
    }

    // List all database names (folders) under jsonbeam directory
     listDatabases(): string[] {
        const jsonbeamDir = path.join(__dirname, "jsonbeam");
        if (!fs.existsSync(jsonbeamDir)) return [];
        return fs.readdirSync(jsonbeamDir).filter((file) => {
            return fs.statSync(path.join(jsonbeamDir, file)).isDirectory();
        });
    }

    
}