export declare class Model<T> {
    filePath: string;
    schema: Record<string, {
        type: string;
    }>;
    constructor(filePath: string, schema: Record<string, {
        type: string;
    }>);
    /** Normalize an object to match the schema (remove extra fields, set missing to undefined) */
    private normalizeToSchema;
    /** Insert a new record or multiple records (append mode, auto _id) */
    insert(data: T | T[]): Promise<Model<T>>;
    /** Find records using query (streaming, memory efficient) */
    find(query: Partial<T>): Promise<T[]>;
    /** Find one record matching query */
    findOne(query: Partial<T>): Promise<T | null>;
    /** Update records matching query (array-based, memory efficient for small/medium files) */
    update(query: Partial<T>, update: Partial<T>): Promise<Model<T>>;
    /** Delete records matching query */
    delete(query: Partial<T>): Promise<number>;
    /** Count records matching query */
    count(query?: Partial<T>): Promise<number>;
    /** Aggregate records using Mingo (streaming, memory efficient) */
    aggregate(pipeline: any[]): Promise<any[]>;
    /** Filter records using query (streaming, memory efficient) */
    filter(query: Partial<T>): Promise<T[]>;
    /** Get all records (use with caution for large files) */
    all(): Promise<T[]>;
    /** Paginate records */
    /** Paginate records */
    paginate(query: Partial<T>, page?: number, pageSize?: number): Promise<{
        data: T[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    getAll(): Promise<T[]>;
    /** Find and update one record matching query */
    findOneAndUpdate(query: Partial<T>, update: Partial<T>): Promise<T | null>;
    /** Find and delete one record matching query */
    findOneAndDelete(query: Partial<T>): Promise<T | null>;
    /** Distinct values for a field */
    distinct<K extends keyof T>(field: K, query?: Partial<T>): Promise<T[K][]>;
    /** Project fields (like MongoDB's projection) */
    project(query: Partial<T>, projection: Partial<Record<keyof T, 0 | 1>>): Promise<Partial<T>[]>;
    findOneAndReplace(query: Partial<T>, replacement: T): Promise<T | null>;
}
