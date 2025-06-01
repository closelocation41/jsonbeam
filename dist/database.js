"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Database = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const model_1 = require("./model");
class Database {
    constructor(name) {
        this.name = name;
        // Always resolve from project root, not __dirname
        this.dbPath = path_1.default.resolve("jsonbeam", name);
        if (!fs_1.default.existsSync(this.dbPath))
            fs_1.default.mkdirSync(this.dbPath, { recursive: true });
        this.models = {};
    }
    createModel(modelName, schema) {
        const filePath = path_1.default.join(this.dbPath, `${modelName}.json`);
        if (!fs_1.default.existsSync(filePath))
            fs_1.default.writeFileSync(filePath, JSON.stringify([]));
        this.models[modelName] = new model_1.Model(filePath, schema);
        return this.models[modelName];
    }
    // List all models in the database
    listModels() {
        return Object.keys(this.models);
    }
    // Remove a model and its data file
    deleteModel(modelName) {
        const model = this.models[modelName];
        if (!model)
            return false;
        fs_1.default.unlinkSync(model.filePath);
        delete this.models[modelName];
        return true;
    }
    // Compact all model files (remove whitespace, optimize storage)
    compact() {
        for (const modelName in this.models) {
            const model = this.models[modelName];
            const data = model.getAll();
            fs_1.default.writeFileSync(model.filePath, JSON.stringify(data));
        }
    }
    // Backup the entire database to a specified directory
    backup(backupDir) {
        if (!fs_1.default.existsSync(backupDir))
            fs_1.default.mkdirSync(backupDir, { recursive: true });
        for (const modelName in this.models) {
            const model = this.models[modelName];
            const dest = path_1.default.join(backupDir, `${modelName}.json`);
            fs_1.default.copyFileSync(model.filePath, dest);
        }
    }
    // List all database names (folders) under jsonbeam directory
    listDatabases() {
        const jsonbeamDir = path_1.default.join(__dirname, "jsonbeam");
        if (!fs_1.default.existsSync(jsonbeamDir))
            return [];
        return fs_1.default.readdirSync(jsonbeamDir).filter((file) => {
            return fs_1.default.statSync(path_1.default.join(jsonbeamDir, file)).isDirectory();
        });
    }
}
exports.Database = Database;
