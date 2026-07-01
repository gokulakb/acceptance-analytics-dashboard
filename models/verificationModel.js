const db = require('../database/database');
const crypto = require('crypto');

function buildHash(row) {
  const payload = `${row.candidate_name}|${row.role}|${row.department}|${row.application_date}|${row.stage}|${row.decision_status}|${row.offer_value}|${row.source}`;
  return crypto.createHash('sha256').update(payload).digest('hex');
}

function verifyIntegrity() {
  return new Promise((resolve, reject) => {
    db.all('SELECT id, candidate_name, role, department, application_date, stage, decision_status, offer_value, source, integrity_hash FROM offers', (error, rows) => {
      if (error) return reject(error);
      const tampered = rows.filter((row) => buildHash(row) !== row.integrity_hash);
      resolve({ verified: tampered.length === 0, tamperedCount: tampered.length });
    });
  });
}

function verifyOfferById(id) {
  return new Promise((resolve, reject) => {
    db.get('SELECT id, candidate_name, role, department, application_date, stage, decision_status, offer_value, source, integrity_hash FROM offers WHERE id = ?', [id], (error, row) => {
      if (error) return reject(error);
      if (!row) return reject(new Error('Offer not found'));

      const currentHash = buildHash(row);
      const verified = currentHash === row.integrity_hash;
      const verificationTime = new Date().toISOString();
      const message = verified
        ? 'Offer integrity is intact. This offer has not been modified since it was signed.'
        : 'Stored hash and current hash do not match. This offer may have been modified after signing.';

      db.run(
        'INSERT INTO verification_events (offer_id, event_type, integrity_hash, created_at) VALUES (?, ?, ?, ?)',
        [row.id, verified ? 'verified' : 'tampered', currentHash, verificationTime],
        (insertError) => {
          if (insertError) return reject(insertError);
          resolve({
            candidate: row.candidate_name,
            candidateName: row.candidate_name,
            offerId: row.id,
            storedHash: row.integrity_hash,
            currentHash,
            verifiedAt: verificationTime,
            verificationTime,
            verified,
            status: verified ? 'Verified' : 'Tampered',
            message,
            icon: verified ? '🟢 VERIFIED' : '🔴 TAMPER DETECTED'
          });
        }
      );
    });
  });
}

function getVerificationHistory() {
  return new Promise((resolve, reject) => {
    db.all(`
      SELECT ve.offer_id, o.candidate_name AS candidate, ve.created_at AS verification_time, ve.event_type AS result, ve.integrity_hash AS current_hash, o.integrity_hash AS stored_hash
      FROM verification_events ve
      LEFT JOIN offers o ON o.id = ve.offer_id
      ORDER BY ve.created_at DESC
    `, (error, rows) => {
      if (error) return reject(error);
      resolve(rows.map((row) => ({
        candidate: row.candidate || 'Unknown',
        offerId: row.offer_id,
        verificationTime: row.verification_time,
        result: row.result === 'verified' ? 'Verified' : 'Tampered',
        storedHash: row.stored_hash,
        currentHash: row.current_hash
      })));
    });
  });
}

function getVerificationSummary() {
  return new Promise((resolve, reject) => {
    db.all('SELECT id, candidate_name, role, department, application_date, stage, decision_status, offer_value, source, integrity_hash FROM offers', (error, rows) => {
      if (error) return reject(error);
      const verifiedOffers = rows.filter((row) => buildHash(row) === row.integrity_hash).length;
      const tamperedOffers = rows.length - verifiedOffers;
      const verificationSuccessRate = rows.length ? Math.round((verifiedOffers / rows.length) * 100) : 0;
      resolve({
        verifiedOffers,
        tamperedOffers,
        verificationSuccessRate,
        verified: tamperedOffers === 0,
        tamperedCount: tamperedOffers
      });
    });
  });
}

module.exports = { verifyIntegrity, verifyOfferById, getVerificationHistory, getVerificationSummary };
