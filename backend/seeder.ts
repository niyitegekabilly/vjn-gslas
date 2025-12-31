
import { supabase } from './supabaseClient';
import { SEED_DATA } from './db';

const CHUNK_SIZE = 50;

const insertChunked = async (table: string, data: any[]) => {
    if (!data || data.length === 0) return;
    
    for (let i = 0; i < data.length; i += CHUNK_SIZE) {
        const chunk = data.slice(i, i + CHUNK_SIZE);
        const { error } = await supabase.from(table).upsert(chunk);
        if (error) {
            console.error(`Error inserting into ${table}:`, error);
            // Don't throw, just log so other chunks might proceed. 
            // In dev, you might want to throw.
            console.warn(`Partial failure in ${table} seeding.`);
        }
    }
    console.log(`Seeded ${table}: ${data.length} records processed.`);
};

export const seedDatabase = async () => {
    try {
        console.log("Starting full database seed...");

        // 1. Users
        await insertChunked('users', SEED_DATA.users);

        // 2. Groups
        await insertChunked('groups', SEED_DATA.groups);

        // 3. Members
        await insertChunked('members', SEED_DATA.members);

        // 4. Cycles
        await insertChunked('cycles', SEED_DATA.cycles);

        // 5. Loans
        await insertChunked('loans', SEED_DATA.loans);

        // 6. Categories
        await insertChunked('fine_categories', SEED_DATA.fineCategories);
        await insertChunked('expense_categories', SEED_DATA.expenseCategories);

        // 7. Transactions, Fines, Notifications
        await insertChunked('transactions', SEED_DATA.transactions);
        await insertChunked('fines', SEED_DATA.fines);
        await insertChunked('notifications', SEED_DATA.notifications);

        return { success: true, message: 'Database populated successfully with demo data.' };
    } catch (error: any) {
        console.error("Seeding error:", error);
        return { success: false, message: error.message };
    }
};
