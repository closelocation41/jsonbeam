const { json } = require('stream/consumers');
const jsonbeam = require('./dist/index.js');

// This code connects to a database using jsonbeam, creates a profile model, and performs various operations like insert, update, delete, and find on the profile model.
// check all models functions in jsonbeam documentation for more details on how to use them.
/**
 * @typedef {import('./dist/index.js').Database} Database
 * @typedef {import('./dist/index.js').Model} Model
 */

// insert, find, findOne, update, delete, count, aggregate, filter, all, paginate, getAll, findOneAndUpdate, findOneAndDelete, distinct, project, findOneAndReplace

async function db() {
    let database = null;
    // create a database 

    // connect to the database

    await jsonbeam.createDatabase({
        database: 'post_db',

        username: 'admin1',

        password: 'admin1'
    });

    try {
        database = await jsonbeam.connect({
            database: 'post_db',
            username: 'admin1',
            password: 'admin1'
        });

        const profileModel = await database.createModel('profile', {
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            email: { type: 'string' },
            age: { type: 'string' },
            createdAt: { type: 'string' }
        });

        const profile = await profileModel.insert([
            {
                firstName: 'John',
                lastName: 'Doe',
                email: 'Sa@gmail.com',
                age: '30',
                createdAt: new Date().toISOString()
            },
            {
                firstName: 'sandeep',
                lastName: 'Kumar',

                email: 'sa@gmail.com',
                age: '30',
                createdAt: new Date().toISOString()
            }
        ]);

        console.log('Profile created:', profile);

        const getAllProfiles11 = await profileModel.getAll();
        const getAllProfiles111 = await profileModel.find({ firstName: 'sandeep' });

        const getAllProfiles = await profileModel.findOne({ firstName: 'John' });
        console.log('All profiles:', getAllProfiles);

        // ==================update=========================
        const updatedProfile = await profileModel.update(
            { firstName: 'John' },
            { lastName: 'Smith Deo' }
        );
         console.log('Profile updated:', updatedProfile);

        // ===================delete===========================
        const deletedProfile = await profileModel.delete({ firstName: 'John' });
        console.log('Profile deleted:', deletedProfile);

        // ===================count===========================
        const count = await profileModel.count();
        console.log('Total profiles:', count);

        // ===================findOne===========================
        const foundProfile = await profileModel.findOne({ firstName: 'sandeep' });
        console.log('Found profile:', foundProfile);

        // ===================find===========================
        const foundProfiles = await profileModel.find({ firstName: 'sandeep' });
        console.log('Found profiles:', foundProfiles);

        // ===================findOneAndUpdate===========================
        const updatedProfile1 = await profileModel.findOneAndUpdate(
            { firstName: 'sandeep' },
            { lastName: 'Kumar Singh' }
        );
        console.log('Profile updated:', updatedProfile1);

        // ===================findOneAndDelete===========================
        const deletedProfile1 = await profileModel.findOneAndDelete({ firstName: 'sandeep' });
        console.log('Profile deleted:', deletedProfile1);

        // ===================findOneAndReplace===========================
        const replacedProfile = await profileModel.findOneAndReplace(
            { firstName: 'sandeep' },
            {
                firstName: 'Sandeep',    
                lastName: 'Kumar Singh',
                email: 'sandeep@gmail.com',
                age: '30',
                createdAt: new Date().toISOString()
            }    
        );
        console.log('Profile replaced:', replacedProfile);

        // ===================distinct===========================
        // const distinctAges = await profileModel.distinct('age');
        // console.log('Distinct ages:', distinctAges);

        // ===================project===========================
        const projectedProfiles = await profileModel.project( 
            { firstName: 1 },
            { firstName: 'sandeep' }
        );
        console.log('Projected profiles:', projectedProfiles);


        // ===================aggregate===========================
        // Use supported aggregate operators or filter data before aggregation
        // const filteredProfiles = await profileModel.find({ firstName: 'sandeep' });
        // const aggregatedProfiles = await profileModel.aggregate([
        //     { $group: { _id: '$age', count: { $sum: 1 } } }
        // ], filteredProfiles);
        // console.log('Aggregated profiles:', aggregatedProfiles);

        // ===================paginate===========================
        const paginatedProfiles = await profileModel.paginate(
            { firstName: 'sandeep' },
            { page: 1, limit: 1 }
        );
        console.log('Paginated profiles:', paginatedProfiles);

        // If you get empty data, check if there are any profiles with firstName 'sandeep'
        // You can try inserting a profile first:
        await profileModel.insert({
            firstName: 'sandeep',
            lastName: 'Kumar',
            email: 'sandeep@example.com',
            age: '30',
            createdAt: new Date().toISOString()
        });
        // Then run the paginate code again.


        // ===================filter===========================
        const filteredProfiles1 = await profileModel.filter(
            { firstName: 'sandeep' },
            { age: 1, email: 1 }
        );
        console.log('Filtered profiles:', filteredProfiles1);


        // ===================all===========================
        const allProfiles = await profileModel.all();
        console.log('All profiles:', allProfiles);


        // ===================getAll===========================
        const allProfiles1 = await profileModel.getAll();
        console.log('All profiles:', allProfiles1);


        if (database) {
            console.log('Database created successfully');
            return database;
        }
    } catch (error) {
        console.error('Error connecting to database:', error);
        return null;
    }
}

db()
    .then((database) => {
        if (database) {
            console.log('Database connection established');
        } else {
            console.error('Failed to connect to the database');
        }
    })
    .catch((error) => {
        console.error('Error during database initialization:', error);
    });


