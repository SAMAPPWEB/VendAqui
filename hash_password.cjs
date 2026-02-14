const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabase = createClient('https://hryjngpvbcdbxraabqja.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhyeWpuZ3B2YmNkYnhyYWFicWphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4Mzc1MzgsImV4cCI6MjA4NjQxMzUzOH0.Fd2zVMskYuynGUXLG6Bgy_NyNUi9-FwFTx3KHqknh8o');

async function setPassword(email, plainPassword) {
    console.log(`Hashing password for ${email}...`);
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(plainPassword, salt);

    console.log(`Updating database...`);
    const { data, error } = await supabase
        .from('users')
        .update({ senha: hash })
        .eq('email', email);

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Success! Password hashed and updated.');
    }
}

setPassword('a_sergio@icloud.com', 'antonio2026');
