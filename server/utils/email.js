const { Resend } = require('resend');
require('dotenv').config();

const resend = new Resend(process.env.RESEND_API_KEY || 're_123');

const sendEmail = async ({ to, subject, html }) => {
    try {
        const { data, error } = await resend.emails.send({
            from: 'Lumina Security <onboarding@resend.dev>',
            to,
            subject,
            html,
        });

        if (error) {
            console.error('Email send failed:', error);
            throw error;
        }

        return data;
    } catch (err) {
        console.error('Email service error:', err);
        throw err;
    }
};

module.exports = { sendEmail };
