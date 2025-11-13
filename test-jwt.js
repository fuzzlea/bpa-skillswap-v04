#!/usr/bin/env node

// Quick test to verify JWT includes admin role
async function testAdminJWT() {
    const API_BASE = 'http://localhost:5188/api';

    // Login as admin
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ UserName: 'admin', Password: 'Admin123!' })
    });

    if (!loginRes.ok) {
        console.error('❌ Login failed:', loginRes.status, await loginRes.text());
        process.exit(1);
    }

    const { token } = await loginRes.json();
    console.log('✓ Login successful');
    console.log('JWT Token (first 50 chars):', token.substring(0, 50) + '...');

    // Decode JWT
    const parts = token.split('.');
    const decoded = JSON.parse(Buffer.from(parts[1], 'base64').toString());

    console.log('\n📋 JWT Payload:');
    console.log(JSON.stringify(decoded, null, 2));

    // Check for role
    if (decoded.role) {
        console.log('\n✓ Role claim found:', decoded.role);
        const roles = Array.isArray(decoded.role) ? decoded.role : [decoded.role];
        if (roles.includes('Admin')) {
            console.log('✅ Admin role is present in JWT!');
        } else {
            console.log('❌ Admin role NOT found in JWT');
        }
    } else {
        console.log('\n❌ No role claim in JWT!');
    }
}

testAdminJWT().catch(console.error);
