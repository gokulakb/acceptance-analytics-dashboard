const db = require('../database/database');
const crypto = require('crypto');

function buildIntegrityHash(offer) {
  const payload = `${offer.candidate_name}|${offer.role}|${offer.department}|${offer.application_date}|${offer.stage}|${offer.decision_status}|${offer.offer_value}|${offer.source}`;
  return crypto.createHash('sha256').update(payload).digest('hex');
}

function getAllOffers() {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM offers ORDER BY created_at DESC', (error, rows) => {
      if (error) return reject(error);
      const offers = rows.map((row) => {
        const currentHash = buildIntegrityHash(row);
        const verified = currentHash === row.integrity_hash;
        return {
          ...row,
          verificationStatus: verified ? 'Verified' : 'Tampered',
          verificationLabel: verified ? '🟢 Verified' : '🔴 Tampered'
        };
      });
      resolve(offers);
    });
  });
}

function createOffer(data) {
  return new Promise((resolve, reject) => {
    const offer = {
      ...data,
      integrity_hash: buildIntegrityHash(data)
    };

    db.run(
      `INSERT INTO offers (candidate_name, role, department, application_date, stage, decision_status, offer_value, source, integrity_hash) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [offer.candidate_name, offer.role, offer.department, offer.application_date, offer.stage, offer.decision_status, offer.offer_value, offer.source, offer.integrity_hash],
      function (error) {
        if (error) return reject(error);
        resolve({ id: this.lastID, ...offer });
      }
    );
  });
}

function advanceOffer(id, action = 'advance') {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM offers WHERE id = ?', [id], (error, row) => {
      if (error) return reject(error);
      if (!row) return reject(new Error('Offer not found'));

      let nextStage = row.stage;
      let nextStatus = row.decision_status;

      if (action === 'accept') {
        nextStage = 'offer_accepted';
        nextStatus = 'accepted';
      } else if (action === 'reject') {
        nextStage = 'offer_rejected';
        nextStatus = 'rejected';
      } else if (action === 'expire') {
        nextStage = 'offer_expired';
        nextStatus = 'expired';
      } else {
        const stages = ['application', 'offer_generated', 'offer_viewed', 'offer_signed', 'offer_accepted', 'offer_rejected', 'offer_expired'];
        const currentIndex = stages.indexOf(row.stage);
        nextStage = stages[Math.min(currentIndex + 1, stages.length - 1)];
        nextStatus = nextStage === 'offer_accepted' ? 'accepted' : nextStage === 'offer_rejected' ? 'rejected' : nextStage === 'offer_expired' ? 'expired' : 'active';
      }

      const updatedRow = {
        ...row,
        stage: nextStage,
        decision_status: nextStatus,
        integrity_hash: buildIntegrityHash({ ...row, stage: nextStage, decision_status: nextStatus })
      };

      db.run(
        'UPDATE offers SET stage = ?, decision_status = ?, integrity_hash = ? WHERE id = ?',
        [updatedRow.stage, updatedRow.decision_status, updatedRow.integrity_hash, id],
        (updateError) => {
          if (updateError) return reject(updateError);
          resolve(updatedRow);
        }
      );
    });
  });
}

function exportOffersCsv() {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM offers ORDER BY created_at DESC', (error, rows) => {
      if (error) return reject(error);
      const header = ['id', 'candidate_name', 'role', 'department', 'application_date', 'stage', 'decision_status', 'offer_value', 'source', 'integrity_hash', 'created_at'];
      const csvRows = rows.map((row) => header.map((key) => `"${String(row[key]).replace(/"/g, '""')}"`).join(','));
      resolve([header.join(','), ...csvRows].join('\n'));
    });
  });
}

module.exports = { getAllOffers, createOffer, advanceOffer, exportOffersCsv, buildIntegrityHash };
