"use strict";
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
const commander_1 = require("commander");
const index_1 = require("./index");
const program = new commander_1.Command();
program
    .name("jsonbeam")
    .description("JSON-based local database CLI")
    .version("1.0.0");
// Create a new database
program
    .command("create-db <database> <username> <password>")
    .description("Create a new database if it does not exist")
    .action((database, username, password) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield (0, index_1.createDatabase)({ database, username, password });
        console.log(`✅ Database "${database}" created and user "${username}" added.`);
    }
    catch (error) {
        console.error("❌ Error creating database:", error.message || error);
        process.exit(1);
    }
}));
// Connect to an existing database
program
    .command("connect <database> <username> <password>")
    .description("Connect to an existing database")
    .action((database, username, password) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const DB = yield (0, index_1.connect)({ database, username, password });
        if (!DB) {
            console.error("❌ Connection failed. Check credentials or database existence.");
            process.exit(1);
        }
        console.log(`✅ Connected to database "${database}" as "${username}".`);
    }
    catch (error) {
        console.error("❌ Error connecting to database:", error.message || error);
        process.exit(1);
    }
}));
program.parse(process.argv);
