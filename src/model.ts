import * as fs from "fs";
import mingo from "mingo";
import * as readline from "readline";
import { createReadStream, createWriteStream, promises as fsPromises } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { parser } from "stream-json";
import { streamArray } from "stream-json/streamers/StreamArray";
import { chain } from "stream-chain";
// write all model class functions names
// insert, find, findOne, update, delete, count, aggregate, filter, all, paginate, getAll, findOneAndUpdate, findOneAndDelete, distinct, project, findOneAndReplace
export class Model<T> {
    filePath: string;
    schema: Record<string, { type: string }>;

    constructor(filePath: string, schema: Record<string, { type: string }>) {
        // Always include _id as a default field in the schema
        this.schema = { _id: { type: "number" }, ...schema };
        this.filePath = filePath;
    }

    /** Normalize an object to match the schema (remove extra fields, set missing to undefined) */
    private normalizeToSchema(obj: any): T {
        const normalized: any = {};
        for (const key of Object.keys(this.schema)) {
            normalized[key] = obj[key];
        }
        return normalized as T;
    }

    /** Insert a new record or multiple records (append mode, auto _id) */
    async insert(data: T | T[]): Promise<Model<T>> {
        let records: T[] = [];
        try {
            const fileContent = await fsPromises.readFile(this.filePath, "utf-8");
            records = fileContent.trim() ? JSON.parse(fileContent) : [];
        } catch {
            records = [];
        }
        const newRecords = Array.isArray(data) ? data : [data];
        const normalizedRecords = newRecords.map((rec, idx) => {
            // Assign _id as the next index value
            const _id = records.length + idx;
            return { ...this.normalizeToSchema(rec), _id };
        });
        records.push(...normalizedRecords);
        await fsPromises.writeFile(this.filePath, JSON.stringify(records, null, 2));
        return this;
    }

    /** Find records using query (streaming, memory efficient) */
    async find(query: Partial<T>): Promise<T[]> {
        const results: T[] = [];
        const mingoQuery = new mingo.Query(query);

        let fileContent: string;
        try {
            fileContent = await fsPromises.readFile(this.filePath, "utf-8");
        } catch {
            return results;
        }
        if (!fileContent.trim()) return results;

        let records: any[] = [];
        try {
            // Only parse if fileContent is a valid JSON array
            const trimmed = fileContent.trim();
            if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
                records = JSON.parse(trimmed);
            } else {
                // Not a valid JSON array, return empty results
                return results;
            }
        } catch {
            // If parsing fails, return empty results
            return results;
        }

        for (const record of records) {
            if (mingoQuery.test(record)) results.push(this.normalizeToSchema(record));
        }
        return results;
    }

    /** Find one record matching query */
    async findOne(query: Partial<T>): Promise<T | null> {
        const mingoQuery = new mingo.Query(query);
        let fileContent: string;
        try {
            fileContent = await fsPromises.readFile(this.filePath, "utf-8");
        } catch {
            return null;
        }
        if (!fileContent.trim()) return null;

        let records: any[] = [];
        try {
            // Only parse if fileContent is a valid JSON array
            const trimmed = fileContent.trim();
            if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
                records = JSON.parse(trimmed);
            } else {
                // Not a valid JSON array, return null
                return null;
            }
        } catch {
            // If parsing fails, return null
            return null;
        }

        for (const record of records) {
            if (mingoQuery.test(record)) return this.normalizeToSchema(record);
        }
        return null;
    }

    /** Update records matching query (array-based, memory efficient for small/medium files) */
    async update(query: Partial<T>, update: Partial<T>): Promise<Model<T>> {
        const mingoQuery = new mingo.Query(query);
        let fileContent: string;
        try {
            fileContent = await fsPromises.readFile(this.filePath, "utf-8");
        } catch {
            fileContent = "[]";
        }
        let records: any[] = [];
        try {
            const trimmed = fileContent.trim();
            if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
                records = JSON.parse(trimmed);
            }
        } catch {
            // If parsing fails, leave records as empty array
        }
        for (let i = 0; i < records.length; i++) {
            if (mingoQuery.test(records[i])) {
                records[i] = this.normalizeToSchema({ ...records[i], ...update });
            }
        }
        await fsPromises.writeFile(this.filePath, JSON.stringify(records, null, 2));
        return this;
    }

    /** Delete records matching query */
    async delete(query: Partial<T>): Promise<number> {
        const mingoQuery = new mingo.Query(query);
        let fileContent: string;
        try {
            fileContent = await fsPromises.readFile(this.filePath, "utf-8");
        } catch {
            return 0;
        }
        if (!fileContent.trim()) return 0;

        let records: any[] = [];
        try {
            const trimmed = fileContent.trim();
            if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
                records = JSON.parse(trimmed);
            } else {
                // Not a valid JSON array, nothing to delete
                return 0;
            }
        } catch {
            // If parsing fails, nothing to delete
            return 0;
        }

        const originalLength = records.length;
        records = records.filter((record) => !mingoQuery.test(record));
        const deletedCount = originalLength - records.length;

        await fsPromises.writeFile(this.filePath, JSON.stringify(records, null, 2));
        return deletedCount;
    }

    /** Count records matching query */
    async count(query: Partial<T> = {}): Promise<number> {
        const mingoQuery = new mingo.Query(query);
        let count = 0;
        let fileContent: string;
        try {
            fileContent = await fsPromises.readFile(this.filePath, "utf-8");
        } catch {
            return 0;
        }
        if (!fileContent.trim()) return 0;

        let records: any[] = [];
        try {
            const trimmed = fileContent.trim();
            if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
                records = JSON.parse(trimmed);
            } else {
                return 0;
            }
        } catch {
            return 0;
        }

        for (const record of records) {
            if (mingoQuery.test(record)) count++;
        }
        return count;
    }

    /** Aggregate records using Mingo (streaming, memory efficient) */
    async aggregate(pipeline: any[]): Promise<any[]> {
        let records: T[] = [];
        try {
            const fileContent = await fsPromises.readFile(this.filePath, "utf-8");
            const trimmed = fileContent.trim();
            if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
                records = JSON.parse(trimmed).map((rec: any) => this.normalizeToSchema(rec));
            }
        } catch {
            records = [];
        }
        return mingo.aggregate(records, pipeline);
    }

    /** Filter records using query (streaming, memory efficient) */
    async filter(query: Partial<T>): Promise<T[]> {
        // Defensive: ensure file is not empty before parsing
        let fileContent: string;
        try {
            fileContent = await fsPromises.readFile(this.filePath, "utf-8");
        } catch {
            return [];
        }
        if (!fileContent.trim()) return [];
        return this.find(query);
    }

    /** Get all records (use with caution for large files) */
    async all(): Promise<T[]> {
        let fileContent: string;
        try {
            fileContent = await fsPromises.readFile(this.filePath, "utf-8");
        } catch {
            return [];
        }
        if (!fileContent.trim()) return [];
        let records: any[] = [];
        try {
            const trimmed = fileContent.trim();
            if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
                records = JSON.parse(trimmed);
            } else {
                // Not a valid JSON array, return empty
                return [];
            }
        } catch {
            return [];
        }
        return records.map((rec) => this.normalizeToSchema(rec));
    }

    /** Paginate records */
    async paginate(query: Partial<T>, page: number, pageSize: number): Promise<{ data: T[]; total: number; page: number; pageSize: number }> {
        const mingoQuery = new mingo.Query(query);
        let fileContent: string;
        try {
            fileContent = await fsPromises.readFile(this.filePath, "utf-8");
        } catch {
            return { data: [], total: 0, page, pageSize };
        }
        if (!fileContent.trim()) return { data: [], total: 0, page, pageSize };

        let records: any[] = [];
        try {
            const trimmed = fileContent.trim();
            if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
                records = JSON.parse(trimmed);
            } else {
                return { data: [], total: 0, page, pageSize };
            }
        } catch {
            return { data: [], total: 0, page, pageSize };
        }

        const filtered = records.filter((record) => mingoQuery.test(record));
        const total = filtered.length;
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        const data = filtered.slice(start, end).map((rec) => this.normalizeToSchema(rec));
        return { data, total, page, pageSize };
    }

    async getAll(): Promise<T[]> {
        return new Promise<T[]>((resolve, reject) => {
            const results: T[] = [];
            const pipeline = chain([
                fs.createReadStream(this.filePath),
                parser(),
                streamArray()
            ]);
            pipeline.on("data", ({ value }) => results.push(this.normalizeToSchema(value)));
            pipeline.on("end", () => resolve(results));
            pipeline.on("error", reject);
        });
    }

    /** Find and update one record matching query */
    async findOneAndUpdate(query: Partial<T>, update: Partial<T>): Promise<T | null> {
        const mingoQuery = new mingo.Query(query);
        let fileContent: string;
        try {
            fileContent = await fsPromises.readFile(this.filePath, "utf-8");
        } catch {
            return null;
        }
        if (!fileContent.trim()) return null;

        let records: any[] = [];
        try {
            const trimmed = fileContent.trim();
            if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
                records = JSON.parse(trimmed);
            } else {
                return null;
            }
        } catch {
            return null;
        }

        let updatedRecord: T | null = null;
        let updated = false;
        for (let i = 0; i < records.length; i++) {
            if (!updated && mingoQuery.test(records[i])) {
                records[i] = { ...records[i], ...update };
                updatedRecord = this.normalizeToSchema(records[i]);
                updated = true;
            }
        }
        await fsPromises.writeFile(this.filePath, JSON.stringify(records, null, 2));
        return updatedRecord;
    }

    /** Find and delete one record matching query */
    async findOneAndDelete(query: Partial<T>): Promise<T | null> {
        const mingoQuery = new mingo.Query(query);
        let fileContent: string;
        try {
            fileContent = await fsPromises.readFile(this.filePath, "utf-8");
        } catch {
            return null;
        }
        if (!fileContent.trim()) return null;

        let records: any[] = [];
        try {
            const trimmed = fileContent.trim();
            if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
                records = JSON.parse(trimmed);
            } else {
                return null;
            }
        } catch {
            return null;
        }

        let deletedRecord: T | null = null;
        let deleted = false;
        const newRecords: any[] = [];
        for (const record of records) {
            if (!deleted && mingoQuery.test(record)) {
                deletedRecord = this.normalizeToSchema(record);
                deleted = true;
                continue;
            }
            newRecords.push(record);
        }
        await fsPromises.writeFile(this.filePath, JSON.stringify(newRecords, null, 2));
        return deletedRecord;
    }

    /** Distinct values for a field */
    async distinct<K extends keyof T>(field: K, query: Partial<T> = {}): Promise<T[K][]> {
        const mingoQuery = new mingo.Query(query);
        const values = new Set<T[K]>();
        let fileContent: string;
        try {
            fileContent = await fsPromises.readFile(this.filePath, "utf-8");
        } catch {
            return [];
        }
        if (!fileContent.trim()) return [];
        let records: any[] = [];
        try {
            const trimmed = fileContent.trim();
            if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
                records = JSON.parse(trimmed);
            } else {
                return [];
            }
        } catch {
            return [];
        }
        for (const record of records) {
            if (mingoQuery.test(record)) {
                values.add(this.normalizeToSchema(record)[field]);
            }
        }
        return Array.from(values);
    }

    /** Project fields (like MongoDB's projection) */
    async project(query: Partial<T>, projection: Partial<Record<keyof T, 0 | 1>>): Promise<Partial<T>[]> {
        const mingoQuery = new mingo.Query(query);
        const results: Partial<T>[] = [];

        const includeFields = Object.entries(projection)
            .filter(([_, v]) => v === 1)
            .map(([k]) => k);

        const excludeFields = Object.entries(projection)
            .filter(([_, v]) => v === 0)
            .map(([k]) => k);

        let fileContent: string;
        try {
            fileContent = await fsPromises.readFile(this.filePath, "utf-8");
        } catch {
            return results;
        }
        if (!fileContent.trim()) return results;

        let records: any[] = [];
        try {
            const trimmed = fileContent.trim();
            if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
                records = JSON.parse(trimmed);
            } else {
                return results;
            }
        } catch {
            return results;
        }

        for (const rec of records) {
            const record = this.normalizeToSchema(rec);
            if (mingoQuery.test(record)) {
                let projected: Partial<T> = {};
                if (includeFields.length > 0) {
                    for (const field of includeFields) {
                        projected[field as keyof T] = record[field as keyof T];
                    }
                } else if (excludeFields.length > 0) {
                    projected = { ...record };
                    for (const field of excludeFields) {
                        delete projected[field as keyof T];
                    }
                } else {
                    projected = record;
                }
                results.push(projected);
            }
        }
        return results;
    }

    //findOneAndReplace

    async findOneAndReplace(query: Partial<T>, replacement: T): Promise<T | null> {
        const mingoQuery = new mingo.Query(query);
        let fileContent: string;
        try {
            fileContent = await fsPromises.readFile(this.filePath, "utf-8");
        } catch {
            return null;
        }
        if (!fileContent.trim()) return null;

        let records: any[] = [];
        try {
            const trimmed = fileContent.trim();
            if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
                records = JSON.parse(trimmed);
            } else {
                return null;
            }
        } catch {
            return null;
        }

        let replacedRecord: T | null = null;
        let replaced = false;
        for (let i = 0; i < records.length; i++) {
            if (!replaced && mingoQuery.test(records[i])) {
                replacedRecord = this.normalizeToSchema(replacement);
                records[i] = { ...replacedRecord, _id: records[i]._id }; // keep original _id
                replaced = true;
            }
        }
        await fsPromises.writeFile(this.filePath, JSON.stringify(records, null, 2));
        return replacedRecord;
    }
    
}