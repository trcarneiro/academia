
const mysql = require('mysql2/promise');

async function inspectContent() {
    const config = {
        host: '67.205.159.161',
        user: '-WBA-Carneiro',
        password: 'Ojqemjeowt*a1',
        database: 'academia',
        port: 3306,
        connectTimeout: 5000
    };

    try {
        const connection = await mysql.createConnection(config);

        // Check Courses
        const [courses] = await connection.execute('SELECT id, name, organizationId FROM courses'); // Check exact table name (plural?)
        // Prisma maps 'Course' to 'courses' usually? Or 'Course'? 'SHOW TABLES' showed plural (e.g. activities)
        // Let's assume 'Course' maps to 'Course' or 'courses'. The list showed 'activities', 'achievements'.

        // Check for 'Course' or 'courses' specifically
        const [tables] = await connection.execute("SHOW TABLES");
        const allTables = tables.map(t => Object.values(t)[0]);
        const courseTableName = allTables.find(t => t.toLowerCase() === 'course' || t.toLowerCase() === 'courses');

        if (courseTableName) {
            console.log(`\n📚 Checking Table: ${courseTableName}`);
            const [rows] = await connection.execute(`SELECT id, name, organizationId FROM ${courseTableName} LIMIT 50`);
            rows.forEach(r => console.log(`- ${r.name} (${r.id}) [Org: ${r.organizationId}]`));

            // Check Lesson Plans count for first course
            if (rows.length > 0) {
                const [lpTables] = await connection.execute("SHOW TABLES LIKE '%esson%'");
                if (lpTables.length > 0) {
                    const lpTableName = Object.values(lpTables[0])[0];
                    const [lps] = await connection.execute(`SELECT COUNT(*) as count FROM ${lpTableName} WHERE courseId = ?`, [rows[0].id]);
                    console.log(`  -> Has ${lps[0].count} Lesson Plans`);
                }
            }

        } else {
            console.log("❌ No table found matching '%ourse%'");
        }


        await connection.end();
    } catch (err) {
        console.error('❌ Error:', err.message);
    }
}

inspectContent();
