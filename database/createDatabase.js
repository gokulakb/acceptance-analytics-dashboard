const crypto = require('crypto');
const db = require('./database');

function buildIntegrityHash(offer) {
  const payload = `${offer.candidate_name}|${offer.role}|${offer.department}|${offer.application_date}|${offer.stage}|${offer.decision_status}|${offer.offer_value}|${offer.source}`;
  return crypto.createHash('sha256').update(payload).digest('hex');
}

function repairIntegrityHashes() {
  return new Promise((resolve, reject) => {
    db.all('SELECT id, candidate_name, role, department, application_date, stage, decision_status, offer_value, source FROM offers', (error, rows) => {
      if (error) return reject(error);

      db.serialize(() => {
        const stmt = db.prepare('UPDATE offers SET integrity_hash = ? WHERE id = ?');
        rows.forEach((row) => {
          const payload = `${row.candidate_name}|${row.role}|${row.department}|${row.application_date}|${row.stage}|${row.decision_status}|${row.offer_value}|${row.source}`;
          const hash = crypto.createHash('sha256').update(payload).digest('hex');
          stmt.run(hash, row.id);
        });

        stmt.finalize((finalError) => {
          if (finalError) return reject(finalError);
          resolve();
        });
      });
    });
  });
}

function initializeDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(`
        CREATE TABLE IF NOT EXISTS offers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          candidate_name TEXT NOT NULL,
          role TEXT NOT NULL,
          department TEXT NOT NULL,
          application_date TEXT NOT NULL,
          stage TEXT NOT NULL,
          decision_status TEXT NOT NULL,
          offer_value REAL NOT NULL,
          source TEXT,
          integrity_hash TEXT NOT NULL,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `, (error) => {
        if (error) {
          reject(error);
          return;
        }

        db.run(`
          CREATE TABLE IF NOT EXISTS verification_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            offer_id INTEGER,
            event_type TEXT NOT NULL,
            integrity_hash TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
          )
        `, (eventError) => {
          if (eventError) {
            reject(eventError);
            return;
          }

          db.get('SELECT COUNT(*) AS count FROM offers', (countError, row) => {
            if (countError) {
              reject(countError);
              return;
            }

            if (row.count === 0) {
              const seedOffers = [
                ['Ava Chen', 'Senior Software Engineer', 'Engineering', '2026-06-10', 'offer_generated', 'active', 145000, 'Referral'],
                ['Liam Patel', 'Product Manager', 'Product', '2026-06-11', 'offer_viewed', 'active', 132000, 'LinkedIn'],
                ['Noah Rivera', 'Data Analyst', 'Analytics', '2026-06-09', 'offer_signed', 'active', 98000, 'Direct'],
                ['Sophia Lee', 'Operations Lead', 'Operations', '2026-05-28', 'offer_accepted', 'accepted', 118000, 'Referral'],
                ['Mason Cruz', 'QA Lead', 'Engineering', '2026-05-20', 'offer_rejected', 'rejected', 102000, 'Direct'],
                ['Isabella Kim', 'HR Manager', 'People', '2026-04-18', 'offer_expired', 'expired', 95000, 'Referral']
              ];

              const stmt = db.prepare(`
                INSERT INTO offers (candidate_name, role, department, application_date, stage, decision_status, offer_value, source, integrity_hash)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
              `);

              seedOffers.forEach((offer) => {
                const seedOffer = {
                  candidate_name: offer[0],
                  role: offer[1],
                  department: offer[2],
                  application_date: offer[3],
                  stage: offer[4],
                  decision_status: offer[5],
                  offer_value: offer[6],
                  source: offer[7]
                };
                stmt.run([...offer.slice(0, 8), buildIntegrityHash(seedOffer)]);
              });
              stmt.finalize();
            }

            repairIntegrityHashes()
              .then(() => resolve())
              .catch(reject);
          });
        });
      });
    });
  });
}

module.exports = { initializeDatabase };
