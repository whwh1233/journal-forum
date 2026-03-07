const { Manuscript, User, Submission } = require('./backend/models');
const { connectDB } = require('./backend/config/database');

async function checkData() {
    await connectDB();
    const manuscripts = await Manuscript.findAll({
        include: [{ model: User, as: 'user', attributes: ['id', 'email'] }, { model: Submission, as: 'submissions' }]
    });
    console.log(`Found ${manuscripts.length} manuscripts in DB:`);
    manuscripts.forEach(m => {
        console.log(`- ID: ${m.id}, User: ${m.user.email} (${m.userId})`);
    });
    process.exit(0);
}

checkData().catch(e => { console.error('Error:', e); process.exit(1); });
