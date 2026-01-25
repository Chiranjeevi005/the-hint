// Test script to send welcome email
async function main() {
    // Load env vars with correct Gmail account
    process.env.SMTP_HOST = 'smtp.gmail.com';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_USER = 'chiranjeevi8050@gmail.com';
    process.env.SMTP_PASS = 'codpbllmulptypqw'; // App password without spaces
    process.env.SMTP_FROM = 'The Editorial Desk <chiranjeevi8050@gmail.com>';
    process.env.NEXT_PUBLIC_BASE_URL = 'http://localhost:3000';

    const { sendWelcomeEmail } = await import('../src/lib/email');

    console.log('Sending test welcome email to smartinboxauto@gmail.com...');
    await sendWelcomeEmail('smartinboxauto@gmail.com');
    console.log('Done! Check the inbox of smartinboxauto@gmail.com');
}

main().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
});
