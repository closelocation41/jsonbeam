import { Command } from "commander";
import { createDatabase, connect } from "./index";

const program = new Command();

program
    .name("jsonbeam")
    .description("JSON-based local database CLI")
    .version("1.0.0");

// Create a new database
program
    .command("create-db <database> <username> <password>")
    .description("Create a new database if it does not exist")
    .action(async (database, username, password) => {
        try {
            await createDatabase({ database, username, password });
            console.log(`✅ Database "${database}" created and user "${username}" added.`);
        } catch (error: any) {
            console.error("❌ Error creating database:", error.message || error);
            process.exit(1);
        }
    });

// Connect to an existing database
program
    .command("connect <database> <username> <password>")
    .description("Connect to an existing database")
    .action(async (database, username, password) => {
        try {
            const DB = await connect({ database, username, password });
            if (!DB) {
                console.error("❌ Connection failed. Check credentials or database existence.");
                process.exit(1);
            }
            console.log(`✅ Connected to database "${database}" as "${username}".`);
        } catch (error: any) {
            console.error("❌ Error connecting to database:", error.message || error);
            process.exit(1);
        }
    });

program.parse(process.argv);