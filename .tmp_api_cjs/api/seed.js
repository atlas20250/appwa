"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const postgres_1 = require("@vercel/postgres");
const types_1 = require("../types");
// This is a Vercel Serverless Function to seed the database.
// It should be run once by visiting /api/seed after deploying.
async function handler(request) {
    // This endpoint should be protected in a real production environment
    try {
        // Check if the users table exists to prevent re-seeding
        const checkTable = await (0, postgres_1.sql) `
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'users'
            );
        `;
        if (checkTable.rows[0].exists) {
            return new Response(JSON.stringify({ message: 'Database already seeded.' }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            });
        }
        console.log('Creating tables...');
        await (0, postgres_1.sql) `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`;
        // Create users table
        await (0, postgres_1.sql) `
            CREATE TABLE users (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                name VARCHAR(255) NOT NULL,
                address VARCHAR(255) NOT NULL,
                phone_number VARCHAR(255) UNIQUE NOT NULL,
                meter_id VARCHAR(255) UNIQUE NOT NULL,
                role VARCHAR(50) NOT NULL,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        `;
        // Create meter_readings table
        await (0, postgres_1.sql) `
            CREATE TABLE meter_readings (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                reading INT NOT NULL,
                date TIMESTAMPTZ NOT NULL,
                previous_reading INT NOT NULL,
                consumption INT NOT NULL,
                meter_image TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        `;
        // Create bills table
        await (0, postgres_1.sql) `
            CREATE TABLE bills (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                reading_id UUID REFERENCES meter_readings(id) ON DELETE CASCADE,
                amount NUMERIC(10, 2) NOT NULL,
                issue_date TIMESTAMPTZ NOT NULL,
                due_date TIMESTAMPTZ NOT NULL,
                status VARCHAR(50) NOT NULL,
                consumption INT NOT NULL,
                meter_image TEXT,
                payment_date TIMESTAMPTZ,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        `;
        // Create announcements table
        await (0, postgres_1.sql) `
            CREATE TABLE announcements (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                message TEXT NOT NULL,
                date TIMESTAMPTZ NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        `;
        // Create settings table for water price
        await (0, postgres_1.sql) `
            CREATE TABLE settings (
                key VARCHAR(255) PRIMARY KEY,
                value VARCHAR(255) NOT NULL
            );
        `;
        console.log('Tables created. Inserting initial data...');
        // Insert initial data
        await (0, postgres_1.sql) `
            INSERT INTO settings (key, value) VALUES ('water_price_per_unit', '1.5');
        `;
        await (0, postgres_1.sql) `
            INSERT INTO users (name, address, phone_number, meter_id, role, password) VALUES
            ('مدير النظام', '000 شارع النظام', '5550000', 'SYS001', ${types_1.UserRole.SUPER_ADMIN}, 'superadminpassword'),
            ('مسؤول', '100 الشارع الرئيسي', '5550100', 'ADM001', ${types_1.UserRole.ADMIN}, 'adminpassword'),
            ('أليس جونسون', '123 شارع البلوط', '5550101', 'WTR001', ${types_1.UserRole.USER}, 'password123'),
            ('بوب ويليامز', '456 ممر الصنوبر', '5550102', 'WTR002', ${types_1.UserRole.USER}, 'password123'),
            ('تشارلي براون', '789 طريق القيقب', '5550103', 'WTR003', ${types_1.UserRole.USER}, 'password123');
        `;
        console.log('Seeding complete!');
        return new Response(JSON.stringify({ message: 'Database seeded successfully!' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    }
    catch (error) {
        console.error('Seeding error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
