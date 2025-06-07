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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Model = void 0;
const fs = __importStar(require("fs"));
const mingo_1 = __importDefault(require("mingo"));
const fs_1 = require("fs");
const stream_json_1 = require("stream-json");
const StreamArray_1 = require("stream-json/streamers/StreamArray");
const stream_chain_1 = require("stream-chain");
const core_1 = require("mingo/core");
const pipelineOperators = __importStar(require("mingo/operators/pipeline"));
const accumulatorOperators = __importStar(require("mingo/operators/accumulator"));
const expressionOperators = __importStar(require("mingo/operators/expression"));
const queryOperators = __importStar(require("mingo/operators/query"));
(0, core_1.useOperators)(core_1.OpType.PIPELINE, pipelineOperators);
(0, core_1.useOperators)(core_1.OpType.ACCUMULATOR, accumulatorOperators);
(0, core_1.useOperators)(core_1.OpType.EXPRESSION, expressionOperators);
(0, core_1.useOperators)(core_1.OpType.QUERY, queryOperators);
// write all model class functions names
// insert, find, findOne, update, delete, count, aggregate, filter, all, paginate, getAll, findOneAndUpdate, findOneAndDelete, distinct, project, findOneAndReplace
class Model {
    constructor(filePath, schema) {
        // Always include _id as a default field in the schema
        this.schema = Object.assign({ _id: { type: "string" } }, schema);
        this.filePath = filePath;
    }
    /** Normalize an object to match the schema (remove extra fields, set missing to undefined) */
    normalizeToSchema(obj) {
        const normalized = {};
        for (const key of Object.keys(this.schema)) {
            normalized[key] = obj[key];
        }
        return normalized;
    }
    /** Insert a new record or multiple records (append mode, auto _id) */
    insert(data) {
        return __awaiter(this, void 0, void 0, function* () {
            let records = [];
            try {
                const fileContent = yield fs_1.promises.readFile(this.filePath, "utf-8");
                records = fileContent.trim() ? JSON.parse(fileContent) : [];
            }
            catch (_a) {
                records = [];
            }
            const newRecords = Array.isArray(data) ? data : [data];
            const normalizedRecords = newRecords.map((rec) => {
                // Generate a random unique string for _id
                const _id = cryptoRandomId();
                return Object.assign(Object.assign({}, this.normalizeToSchema(rec)), { _id });
            });
            records.push(...normalizedRecords);
            yield fs_1.promises.writeFile(this.filePath, JSON.stringify(records, null, 2));
            return this;
        });
    }
    /** Find records using query (streaming, memory efficient) */
    find(query) {
        return __awaiter(this, void 0, void 0, function* () {
            const results = [];
            const mingoQuery = new mingo_1.default.Query(query);
            let fileContent;
            try {
                fileContent = yield fs_1.promises.readFile(this.filePath, "utf-8");
            }
            catch (_a) {
                return results;
            }
            if (!fileContent.trim())
                return results;
            let records = [];
            try {
                // Only parse if fileContent is a valid JSON array
                const trimmed = fileContent.trim();
                if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
                    records = JSON.parse(trimmed);
                }
                else {
                    // Not a valid JSON array, return empty results
                    return results;
                }
            }
            catch (_b) {
                // If parsing fails, return empty results
                return results;
            }
            for (const record of records) {
                if (mingoQuery.test(record))
                    results.push(this.normalizeToSchema(record));
            }
            return results;
        });
    }
    /** Find one record matching query */
    findOne(query) {
        return __awaiter(this, void 0, void 0, function* () {
            const mingoQuery = new mingo_1.default.Query(query);
            let fileContent;
            try {
                fileContent = yield fs_1.promises.readFile(this.filePath, "utf-8");
            }
            catch (_a) {
                return null;
            }
            if (!fileContent.trim())
                return null;
            let records = [];
            try {
                // Only parse if fileContent is a valid JSON array
                const trimmed = fileContent.trim();
                if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
                    records = JSON.parse(trimmed);
                }
                else {
                    // Not a valid JSON array, return null
                    return null;
                }
            }
            catch (_b) {
                // If parsing fails, return null
                return null;
            }
            for (const record of records) {
                if (mingoQuery.test(record))
                    return this.normalizeToSchema(record);
            }
            return null;
        });
    }
    /** Update records matching query (array-based, memory efficient for small/medium files) */
    update(query, update) {
        return __awaiter(this, void 0, void 0, function* () {
            const mingoQuery = new mingo_1.default.Query(query);
            let fileContent;
            try {
                fileContent = yield fs_1.promises.readFile(this.filePath, "utf-8");
            }
            catch (_a) {
                fileContent = "[]";
            }
            let records = [];
            try {
                const trimmed = fileContent.trim();
                if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
                    records = JSON.parse(trimmed);
                }
            }
            catch (_b) {
                // If parsing fails, leave records as empty array
            }
            for (let i = 0; i < records.length; i++) {
                if (mingoQuery.test(records[i])) {
                    records[i] = this.normalizeToSchema(Object.assign(Object.assign({}, records[i]), update));
                }
            }
            yield fs_1.promises.writeFile(this.filePath, JSON.stringify(records, null, 2));
            return this;
        });
    }
    /** Delete records matching query */
    delete(query) {
        return __awaiter(this, void 0, void 0, function* () {
            const mingoQuery = new mingo_1.default.Query(query);
            let fileContent;
            try {
                fileContent = yield fs_1.promises.readFile(this.filePath, "utf-8");
            }
            catch (_a) {
                return 0;
            }
            if (!fileContent.trim())
                return 0;
            let records = [];
            try {
                const trimmed = fileContent.trim();
                if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
                    records = JSON.parse(trimmed);
                }
                else {
                    // Not a valid JSON array, nothing to delete
                    return 0;
                }
            }
            catch (_b) {
                // If parsing fails, nothing to delete
                return 0;
            }
            const originalLength = records.length;
            records = records.filter((record) => !mingoQuery.test(record));
            const deletedCount = originalLength - records.length;
            yield fs_1.promises.writeFile(this.filePath, JSON.stringify(records, null, 2));
            return deletedCount;
        });
    }
    /** Count records matching query */
    count() {
        return __awaiter(this, arguments, void 0, function* (query = {}) {
            const mingoQuery = new mingo_1.default.Query(query);
            let count = 0;
            let fileContent;
            try {
                fileContent = yield fs_1.promises.readFile(this.filePath, "utf-8");
            }
            catch (_a) {
                return 0;
            }
            if (!fileContent.trim())
                return 0;
            let records = [];
            try {
                const trimmed = fileContent.trim();
                if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
                    records = JSON.parse(trimmed);
                }
                else {
                    return 0;
                }
            }
            catch (_b) {
                return 0;
            }
            for (const record of records) {
                if (mingoQuery.test(record))
                    count++;
            }
            return count;
        });
    }
    /** Aggregate records using Mingo (streaming, memory efficient) */
    aggregate(pipeline) {
        return __awaiter(this, void 0, void 0, function* () {
            let records = [];
            try {
                const fileContent = yield fs_1.promises.readFile(this.filePath, "utf-8");
                const trimmed = fileContent.trim();
                if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
                    records = JSON.parse(trimmed).map((rec) => this.normalizeToSchema(rec));
                }
            }
            catch (_a) {
                records = [];
            }
            return mingo_1.default.aggregate(records, pipeline);
        });
    }
    /** Filter records using query (streaming, memory efficient) */
    filter(query) {
        return __awaiter(this, void 0, void 0, function* () {
            // Defensive: ensure file is not empty before parsing
            let fileContent;
            try {
                fileContent = yield fs_1.promises.readFile(this.filePath, "utf-8");
            }
            catch (_a) {
                return [];
            }
            if (!fileContent.trim())
                return [];
            return this.find(query);
        });
    }
    /** Get all records (use with caution for large files) */
    all() {
        return __awaiter(this, void 0, void 0, function* () {
            let fileContent;
            try {
                fileContent = yield fs_1.promises.readFile(this.filePath, "utf-8");
            }
            catch (_a) {
                return [];
            }
            if (!fileContent.trim())
                return [];
            let records = [];
            try {
                const trimmed = fileContent.trim();
                if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
                    records = JSON.parse(trimmed);
                }
                else {
                    // Not a valid JSON array, return empty
                    return [];
                }
            }
            catch (_b) {
                return [];
            }
            return records.map((rec) => this.normalizeToSchema(rec));
        });
    }
    /** Paginate records */
    /** Paginate records */
    paginate(query_1) {
        return __awaiter(this, arguments, void 0, function* (query, page = 1, pageSize = 10) {
            // Defensive: ensure page and pageSize are numbers and valid
            page = typeof page === "number" && page > 0 ? page : 1;
            pageSize = typeof pageSize === "number" && pageSize > 0 ? pageSize : 10;
            const mingoQuery = new mingo_1.default.Query(query);
            let fileContent;
            try {
                fileContent = yield fs_1.promises.readFile(this.filePath, "utf-8");
            }
            catch (_a) {
                return { data: [], total: 0, page, pageSize };
            }
            if (!fileContent.trim())
                return { data: [], total: 0, page, pageSize };
            let records = [];
            try {
                const trimmed = fileContent.trim();
                if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
                    records = JSON.parse(trimmed);
                }
                else {
                    return { data: [], total: 0, page, pageSize };
                }
            }
            catch (_b) {
                return { data: [], total: 0, page, pageSize };
            }
            const filtered = records.filter((record) => mingoQuery.test(record));
            const total = filtered.length;
            const start = (page - 1) * pageSize;
            const end = start + pageSize;
            const data = filtered.slice(start, end).map((rec) => this.normalizeToSchema(rec));
            return { data, total, page, pageSize };
        });
    }
    getAll() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                const results = [];
                const pipeline = (0, stream_chain_1.chain)([
                    fs.createReadStream(this.filePath),
                    (0, stream_json_1.parser)(),
                    (0, StreamArray_1.streamArray)()
                ]);
                pipeline.on("data", ({ value }) => results.push(this.normalizeToSchema(value)));
                pipeline.on("end", () => resolve(results));
                pipeline.on("error", reject);
            });
        });
    }
    /** Find and update one record matching query */
    findOneAndUpdate(query, update) {
        return __awaiter(this, void 0, void 0, function* () {
            const mingoQuery = new mingo_1.default.Query(query);
            let fileContent;
            try {
                fileContent = yield fs_1.promises.readFile(this.filePath, "utf-8");
            }
            catch (_a) {
                return null;
            }
            if (!fileContent.trim())
                return null;
            let records = [];
            try {
                const trimmed = fileContent.trim();
                if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
                    records = JSON.parse(trimmed);
                }
                else {
                    return null;
                }
            }
            catch (_b) {
                return null;
            }
            let updatedRecord = null;
            let updated = false;
            for (let i = 0; i < records.length; i++) {
                if (!updated && mingoQuery.test(records[i])) {
                    records[i] = Object.assign(Object.assign({}, records[i]), update);
                    updatedRecord = this.normalizeToSchema(records[i]);
                    updated = true;
                }
            }
            yield fs_1.promises.writeFile(this.filePath, JSON.stringify(records, null, 2));
            return updatedRecord;
        });
    }
    /** Find and delete one record matching query */
    findOneAndDelete(query) {
        return __awaiter(this, void 0, void 0, function* () {
            const mingoQuery = new mingo_1.default.Query(query);
            let fileContent;
            try {
                fileContent = yield fs_1.promises.readFile(this.filePath, "utf-8");
            }
            catch (_a) {
                return null;
            }
            if (!fileContent.trim())
                return null;
            let records = [];
            try {
                const trimmed = fileContent.trim();
                if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
                    records = JSON.parse(trimmed);
                }
                else {
                    return null;
                }
            }
            catch (_b) {
                return null;
            }
            let deletedRecord = null;
            let deleted = false;
            const newRecords = [];
            for (const record of records) {
                if (!deleted && mingoQuery.test(record)) {
                    deletedRecord = this.normalizeToSchema(record);
                    deleted = true;
                    continue;
                }
                newRecords.push(record);
            }
            yield fs_1.promises.writeFile(this.filePath, JSON.stringify(newRecords, null, 2));
            return deletedRecord;
        });
    }
    /** Distinct values for a field */
    distinct(field_1) {
        return __awaiter(this, arguments, void 0, function* (field, query = {}) {
            const mingoQuery = new mingo_1.default.Query(query);
            const values = new Set();
            let fileContent;
            try {
                fileContent = yield fs_1.promises.readFile(this.filePath, "utf-8");
            }
            catch (_a) {
                return [];
            }
            if (!fileContent.trim())
                return [];
            let records = [];
            try {
                const trimmed = fileContent.trim();
                if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
                    records = JSON.parse(trimmed);
                }
                else {
                    return [];
                }
            }
            catch (_b) {
                return [];
            }
            for (const record of records) {
                if (mingoQuery.test(record)) {
                    values.add(this.normalizeToSchema(record)[field]);
                }
            }
            return Array.from(values);
        });
    }
    /** Project fields (like MongoDB's projection) */
    project(query, projection) {
        return __awaiter(this, void 0, void 0, function* () {
            const mingoQuery = new mingo_1.default.Query(query);
            const results = [];
            const includeFields = Object.entries(projection)
                .filter(([_, v]) => v === 1)
                .map(([k]) => k);
            const excludeFields = Object.entries(projection)
                .filter(([_, v]) => v === 0)
                .map(([k]) => k);
            let fileContent;
            try {
                fileContent = yield fs_1.promises.readFile(this.filePath, "utf-8");
            }
            catch (_a) {
                return results;
            }
            if (!fileContent.trim())
                return results;
            let records = [];
            try {
                const trimmed = fileContent.trim();
                if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
                    records = JSON.parse(trimmed);
                }
                else {
                    return results;
                }
            }
            catch (_b) {
                return results;
            }
            for (const rec of records) {
                const record = this.normalizeToSchema(rec);
                if (mingoQuery.test(record)) {
                    let projected = {};
                    if (includeFields.length > 0) {
                        for (const field of includeFields) {
                            projected[field] = record[field];
                        }
                    }
                    else if (excludeFields.length > 0) {
                        projected = Object.assign({}, record);
                        for (const field of excludeFields) {
                            delete projected[field];
                        }
                    }
                    else {
                        projected = record;
                    }
                    results.push(projected);
                }
            }
            return results;
        });
    }
    //findOneAndReplace
    findOneAndReplace(query, replacement) {
        return __awaiter(this, void 0, void 0, function* () {
            const mingoQuery = new mingo_1.default.Query(query);
            let fileContent;
            try {
                fileContent = yield fs_1.promises.readFile(this.filePath, "utf-8");
            }
            catch (_a) {
                return null;
            }
            if (!fileContent.trim())
                return null;
            let records = [];
            try {
                const trimmed = fileContent.trim();
                if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
                    records = JSON.parse(trimmed);
                }
                else {
                    return null;
                }
            }
            catch (_b) {
                return null;
            }
            let replacedRecord = null;
            let replaced = false;
            for (let i = 0; i < records.length; i++) {
                if (!replaced && mingoQuery.test(records[i])) {
                    replacedRecord = this.normalizeToSchema(replacement);
                    records[i] = Object.assign(Object.assign({}, replacedRecord), { _id: records[i]._id }); // keep original _id
                    replaced = true;
                }
            }
            yield fs_1.promises.writeFile(this.filePath, JSON.stringify(records, null, 2));
            return replacedRecord;
        });
    }
}
exports.Model = Model;
function cryptoRandomId() {
    // Generate a random 16-byte hex string (32 chars)
    return Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");
}
