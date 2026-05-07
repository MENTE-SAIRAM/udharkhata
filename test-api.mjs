import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-at-least-32-chars-long!!';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-at-least-32-chars-long!';
process.env.NODE_ENV = 'development';
process.env.TEST_OTP = '123456';

let app;

const log = (label, passed, detail = '') => {
  const icon = passed ? '  PASS' : '  FAIL';
  console.log(`${icon} ${label}${detail ? ' - ' + detail : ''}`);
};

const expectStatus = (res, status) => {
  if (res.status !== status) {
    throw new Error(`Expected ${status}, got ${res.status}: ${JSON.stringify(res.body)}`);
  }
};

const expectSuccess = (res) => {
  if (!res.body.success) {
    throw new Error(`Expected success, got: ${JSON.stringify(res.body)}`);
  }
};

let accessToken = '';
let refreshToken = '';
let contactId = '';
let contact2Id = '';
let transactionId = '';
let transaction2Id = '';
let groupId = '';
let memberId = '';

let passed = 0;
let failed = 0;

const run = async () => {
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  process.env.MONGODB_URI = uri;

  await mongoose.connect(uri, { dbName: 'udhar-khata-test' });

  const { default: expressApp } = await import('./src/app.js');

  const server = expressApp.listen(0, () => {
    const port = server.address().port;
    const base = `http://localhost:${port}`;
    console.log(`Test server on port ${port}\n`);

    const req = (method, path, opts = {}) => {
      const url = new URL(path, base);
      const headers = { 'Content-Type': 'application/json', ...opts.headers };
      if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

      const body = opts.body ? JSON.stringify(opts.body) : undefined;

      return fetch(url.toString(), {
        method,
        headers,
        body,
      }).then(async (r) => ({
        status: r.status,
        body: await r.json(),
        headers: r.headers,
      }));
    };

    const tests = async () => {
      try {
        // ============= AUTH =============
        console.log('\n=== AUTH ===');

        // Health check
        {
          const r = await req('GET', '/api/v1/health');
          expectStatus(r, 200);
          log('Health check', true);
          passed++;
        }

        // Send OTP
        {
          const r = await req('POST', '/api/v1/auth/send-otp', {
            body: { phone: '+919876543210' },
          });
          expectStatus(r, 200);
          log('Send OTP', true);
          passed++;
        }

        // Verify OTP
        {
          const r = await req('POST', '/api/v1/auth/verify-otp', {
            body: { phone: '+919876543210', otp: '123456' },
          });
          expectStatus(r, 200);
          expectSuccess(r);
          accessToken = r.body.data.accessToken;
          refreshToken = r.body.data.refreshToken;
          log('Verify OTP + JWT received', true, `token: ${accessToken.substring(0, 20)}...`);
          passed++;
        }

        // Refresh token
        {
          const r = await req('POST', '/api/v1/auth/refresh', {
            body: { refreshToken },
          });
          expectStatus(r, 200);
          accessToken = r.body.data.accessToken;
          refreshToken = r.body.data.refreshToken;
          log('Refresh token', true);
          passed++;
        }

        // Update profile
        {
          const r = await req('PUT', '/api/v1/auth/profile', {
            body: { name: 'Test User' },
          });
          expectStatus(r, 200);
          log('Update profile', true);
          passed++;
        }

        // Update FCM token
        {
          const r = await req('PUT', '/api/v1/auth/fcm-token', {
            body: { fcmToken: 'test-fcm-token-123' },
          });
          expectStatus(r, 200);
          log('Update FCM token', true);
          passed++;
        }

        // ============= CONTACTS =============
        console.log('\n=== CONTACTS ===');

        // Create contact 1
        {
          const r = await req('POST', '/api/v1/contacts', {
            body: { name: 'Amit Verma', phone: '+919876543211', notes: 'College friend' },
          });
          expectStatus(r, 201);
          contactId = r.body.data.contact._id;
          log('Create contact', true, `id: ${contactId}`);
          passed++;
        }

        // Create contact 2
        {
          const r = await req('POST', '/api/v1/contacts', {
            body: { name: 'Priya Singh', phone: '+919876543212', colorHex: '#ff6b6b' },
          });
          expectStatus(r, 201);
          contact2Id = r.body.data.contact._id;
          log('Create contact 2', true);
          passed++;
        }

        // Get all contacts
        {
          const r = await req('GET', '/api/v1/contacts');
          expectStatus(r, 200);
          if (r.body.data.contacts.length < 2) throw new Error('Expected 2 contacts');
          log('List contacts', true, `count: ${r.body.data.contacts.length}`);
          passed++;
        }

        // Get contact by ID
        {
          const r = await req('GET', `/api/v1/contacts/${contactId}`);
          expectStatus(r, 200);
          log('Get contact by ID', true);
          passed++;
        }

        // Update contact
        {
          const r = await req('PUT', `/api/v1/contacts/${contactId}`, {
            body: { name: 'Amit Verma Updated', notes: 'Updated notes' },
          });
          expectStatus(r, 200);
          log('Update contact', true);
          passed++;
        }

        // ============= TRANSACTIONS =============
        console.log('\n=== TRANSACTIONS ===');

        // Create transaction (gave)
        {
          const r = await req('POST', '/api/v1/transactions', {
            body: {
              contactId,
              type: 'gave',
              amount: 50000,
              note: 'Lunch at Barbeque Nation',
              categoryTag: 'food',
              dueDate: '2026-06-01T00:00:00.000Z',
            },
          });
          expectStatus(r, 201);
          transactionId = r.body.data.transaction._id;
          log('Create transaction (gave)', true, `id: ${transactionId}`);
          passed++;
        }

        // Create transaction (received)
        {
          const r = await req('POST', '/api/v1/transactions', {
            body: {
              contactId,
              type: 'received',
              amount: 25000,
              note: 'Movie ticket refund',
              categoryTag: 'travel',
            },
          });
          expectStatus(r, 201);
          transaction2Id = r.body.data.transaction._id;
          log('Create transaction (received)', true);
          passed++;
        }

        // Update transaction
        {
          const r = await req('PUT', `/api/v1/transactions/${transactionId}`, {
            body: { note: 'Updated note', categoryTag: 'household' },
          });
          expectStatus(r, 200);
          log('Update transaction', true);
          passed++;
        }

        // Get contact transactions
        {
          const r = await req('GET', `/api/v1/contacts/${contactId}/transactions?limit=20`);
          expectStatus(r, 200);
          if (!r.body.data.transactions.length) throw new Error('Expected transactions');
          log('Contact transactions (paginated)', true, `count: ${r.body.data.transactions.length}`);
          passed++;
        }

        // Verify netBalance updated
        {
          const r = await req('GET', `/api/v1/contacts/${contactId}`);
          expectStatus(r, 200);
          const net = r.body.data.contact.netBalance;
          if (net !== 25000) throw new Error(`Expected netBalance 25000, got ${net}`);
          log('netBalance auto-calculated', true, `${net} paise`);
          passed++;
        }

        // Settle transaction
        {
          const r = await req('POST', `/api/v1/transactions/${transactionId}/settle`);
          expectStatus(r, 200);
          if (!r.body.data.transaction.isSettled) throw new Error('Expected isSettled true');
          log('Settle transaction', true);
          passed++;
        }

        // ============= GROUPS =============
        console.log('\n=== GROUPS ===');

        // Create group (need to pass contact2Id since members need different contacts)
        {
          const r = await req('POST', '/api/v1/groups', {
            body: {
              name: 'Goa Trip 2026',
              type: 'trip',
              members: [
                { contactId, shareAmount: 500000 },
                { contactId: contact2Id, shareAmount: 300000 },
              ],
            },
          });
          expectStatus(r, 201);
          groupId = r.body.data.group._id;
          memberId = r.body.data.members[0]._id;
          log('Create group', true, `id: ${groupId}`);
          passed++;
        }

        // Get group
        {
          const r = await req('GET', `/api/v1/groups/${groupId}`);
          expectStatus(r, 200);
          if (!r.body.data.members || r.body.data.members.length < 2) throw new Error('Expected members');
          log('Get group details', true, `${r.body.data.members.length} members`);
          passed++;
        }

        // Mark member as paid
        {
          const r = await req('PUT', `/api/v1/groups/${groupId}/members/${memberId}/pay`);
          expectStatus(r, 200);
          log('Mark member paid', true);
          passed++;
        }

        // ============= NUDGE =============
        console.log('\n=== NUDGE ===');

        {
          const r = await req('POST', '/api/v1/nudge/generate', {
            body: { contactId, style: 'polite' },
          });
          expectStatus(r, 200);
          if (!r.body.data.whatsappUrl) throw new Error('Expected whatsappUrl');
          if (!r.body.data.message) throw new Error('Expected message');
          log('Generate nudge', true, `style: polite`);
          passed++;
        }

        {
          const r = await req('POST', '/api/v1/nudge/generate', {
            body: { contactId, style: 'funny' },
          });
          expectStatus(r, 200);
          log('Generate nudge (funny)', true);
          passed++;
        }

        // ============= NOTIFICATIONS =============
        console.log('\n=== NOTIFICATIONS ===');

        {
          const r = await req('GET', '/api/v1/notifications?page=1&limit=20');
          expectStatus(r, 200);
          log('List notifications', true, `count: ${r.body.data.notifications.length}, unread: ${r.body.data.unreadCount}`);
          passed++;
        }

        {
          const r = await req('PUT', '/api/v1/notifications/read-all');
          expectStatus(r, 200);
          log('Mark all notifications read', true);
          passed++;
        }

        // ============= DUPLICATE CONTACT ERROR =============
        console.log('\n=== ERROR HANDLING ===');

        {
          const r = await req('POST', '/api/v1/contacts', {
            body: { name: 'Duplicate', phone: '+919876543211' },
          });
          expectStatus(r, 409);
          log('Duplicate contact → 409', true);
          passed++;
        }

        // Auth required
        {
          const r = await fetch(`${base}/api/v1/contacts`, { headers: { 'Content-Type': 'application/json' } });
          const body = await r.json();
          if (r.status !== 401) throw new Error('Expected 401');
          log('No auth → 401', true);
          passed++;
        }

        // Not found
        {
          const r = await req('GET', '/api/v1/contacts/000000000000000000000000');
          expectStatus(r, 404);
          log('Not found → 404', true);
          passed++;
        }

        // Validation error
        {
          const r = await req('POST', '/api/v1/contacts', {
            body: { name: '' },
          });
          expectStatus(r, 400);
          log('Validation error → 400', true);
          passed++;
        }

        // ============= PREMIUM GATING =============
        console.log('\n=== PREMIUM GATING ===');

        {
          const r = await req('GET', '/api/v1/analytics/summary');
          expectStatus(r, 403);
          if (r.body.message !== 'Premium subscription required') throw new Error('Expected premium message');
          log('Premium gating → 403', true);
          passed++;
        }

        {
          const r = await req('GET', '/api/v1/export/pdf?contactId=' + contactId);
          expectStatus(r, 403);
          log('Export PDF premium gating → 403', true);
          passed++;
        }

        // ============= CLEANUP =============
        console.log('\n=== CLEANUP ===');

        // Delete transaction
        {
          const r = await req('DELETE', `/api/v1/transactions/${transaction2Id}`);
          expectStatus(r, 200);
          log('Delete transaction', true);
          passed++;
        }

        // Delete group
        {
          const r = await req('DELETE', `/api/v1/groups/${groupId}`);
          expectStatus(r, 200);
          log('Delete group', true);
          passed++;
        }

        // Delete contact
        {
          const r = await req('DELETE', `/api/v1/contacts/${contactId}`);
          expectStatus(r, 200);
          log('Soft delete contact', true);
          passed++;
        }

        // Logout
        {
          const r = await req('POST', '/api/v1/auth/logout');
          expectStatus(r, 200);
          log('Logout', true);
          passed++;
        }

        // ============= SUMMARY =============
        console.log(`\n========================================`);
        console.log(`  Total: ${passed} passed, ${failed} failed, ${passed + failed} total`);
        console.log(`========================================`);

      } catch (err) {
        console.error('\nUNEXPECTED ERROR:', err.message, err.stack);
        failed++;
      } finally {
        server.close();
        await mongoose.disconnect();
        await mongod.stop();
        process.exit(failed > 0 ? 1 : 0);
      }
    };

    tests();
  });
};

run();
