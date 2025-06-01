# jsonbeam

jsonbeam is a lightweight, file-based database for JavaScript and TypeScript projects. It provides simple APIs for creating databases, managing users and roles, and performing CRUD operations using models.

---

## Features

- File-based, zero-dependency database
- Easy setup for Node.js and TypeScript
- User and role management with permissions
- Model-based data access (insert, update, delete, find, etc.)

---

## Installation

```bash
npm install jsonbeam
```

---

## Quick Start

### 1. Auto-generate Default Database and User

- Creates main directory `jsonbeam/`
- Creates default database: `jsonbeam/admin_db/`
- Creates default user: `jsonbeam/admin_db/users.json`
- Creates default roles: `jsonbeam/admin_db/roles.json` with permissions `['read', 'write', 'full']`
- Default role: `admin` with permissions `['read', 'write']`

---

### 2. Create a Database

- Prevents duplicate databases and users
- Example:

```ts
await jsonbeam.createDatabase({
    database: 'DB1',
    username: 'admin',
    password: 'jsonbeam@123'
});
```

- Creates database in `jsonbeam/DB1/`
- Adds user to `users.json` with default role and permissions
- Optionally, provide custom roles and permissions

---

### 4. Connect to a Database

- Validates database, username, and password
- Grants access based on user roles and permissions

```js
const jsonbeam = require('jsonbeam');

async function db() {
    try {
        const database = await jsonbeam.connect({
            database: 'post_db',
            username: 'admin',
            password: 'admin'
        });

        // Define a model
        const profileModel = await database.createModel('profile', {
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            email: { type: 'string' },
            age: { type: 'string' },
            createdAt: { type: 'string' }
        });

        // Insert documents
        await profileModel.insert([
            { firstName: 'John', lastName: 'Doe', email: 'john@example.com', age: '30', createdAt: new Date().toISOString() },
            { firstName: 'Sandeep', lastName: 'Kumar', email: 'sandeep@example.com', age: '30', createdAt: new Date().toISOString() }
        ]);

        // Query examples
        const allProfiles = await profileModel.getAll();
        const johnProfile = await profileModel.findOne({ firstName: 'John' });

        // Update
        await profileModel.update({ firstName: 'John' }, { lastName: 'Smith' });

        // Delete
        await profileModel.delete({ firstName: 'John' });

        // Count
        const count = await profileModel.count();

        // Find
        const sandeepProfiles = await profileModel.find({ firstName: 'Sandeep' });

        // Pagination
        const paginated = await profileModel.paginate({ firstName: 'Sandeep' }, { page: 1, limit: 1 });

        // Projection
        const projected = await profileModel.project({ firstName: 1 }, {});

        // Filtering
        const filtered = await profileModel.filter({ firstName: 'Sandeep' }, { age: 1, email: 1 });

        console.log('All profiles:', allProfiles);
        console.log('Profile count:', count);
        console.log('Paginated:', paginated);
        // ...other operations

        if (database) {
            console.log('Database connection established');
            return database;
        }
    } catch (error) {
        console.error('Error:', error);
        return null;
    }
}

db();
```

---

## Model Methods

- `insert`, `find`, `findOne`, `update`, `delete`, `count`
- `aggregate`, `filter`, `all`, `paginate`
- `getAll`, `findOneAndUpdate`, `findOneAndDelete`, `distinct`, `project`, `findOneAndReplace`

See the [documentation](#) for full API details.

---

## License

MIT

