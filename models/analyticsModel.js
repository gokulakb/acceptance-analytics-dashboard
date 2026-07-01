const db = require('../database/database');
const offerModel = require('./offerModel');

function getOverview() {
  return new Promise((resolve, reject) => {
    db.get(`
      SELECT
        COUNT(*) AS totalOffers,
        SUM(CASE WHEN decision_status = 'accepted' THEN 1 ELSE 0 END) AS accepted,
        SUM(CASE WHEN decision_status = 'rejected' THEN 1 ELSE 0 END) AS rejected,
        SUM(CASE WHEN decision_status = 'expired' THEN 1 ELSE 0 END) AS expired,
        AVG(CASE WHEN decision_status = 'accepted' THEN JULIANDAY(created_at) - JULIANDAY(application_date) END) AS averageAcceptanceTime
      FROM offers
    `, (error, row) => {
      if (error) return reject(error);
      const accepted = Number(row.accepted || 0);
      const rejected = Number(row.rejected || 0);
      const expired = Number(row.expired || 0);
      const total = Number(row.totalOffers || 0);
      const acceptanceRate = total ? Math.round((accepted / total) * 100) : 0;
      const averageAcceptanceTime = row.averageAcceptanceTime ? Number(row.averageAcceptanceTime).toFixed(1) : '0.0';
      db.all('SELECT * FROM offers', (offerError, offers) => {
        if (offerError) return reject(offerError);
        const verificationSummary = offers.reduce((memo, offer) => {
          const currentHash = offerModel.buildIntegrityHash(offer);
          const verified = currentHash === offer.integrity_hash;
          memo.verifiedOffers += verified ? 1 : 0;
          memo.tamperedOffers += verified ? 0 : 1;
          return memo;
        }, { verifiedOffers: 0, tamperedOffers: 0 });
        verificationSummary.verificationSuccessRate = total ? Math.round((verificationSummary.verifiedOffers / total) * 100) : 0;
        console.log("Overview Verification Summary:", verificationSummary);
        resolve({
          totalOffers: total,
          accepted,
          rejected,
          expired,
          acceptanceRate,
          activePipeline: total - accepted - rejected - expired,
          averageAcceptanceTime,
          verificationSummary,
          lastUpdated: new Date().toISOString()
        });
      });
    });
  });
}

function getStageBreakdown() {
  return new Promise((resolve, reject) => {
    db.all(`
      SELECT stage, COUNT(*) AS count
      FROM offers
      GROUP BY stage
      ORDER BY COUNT(*) DESC
    `, (error, rows) => {
      if (error) return reject(error);
      resolve(rows);
    });
  });
}

function getStatusBreakdown() {
  return new Promise((resolve, reject) => {
    db.all(`
      SELECT decision_status, COUNT(*) AS count
      FROM offers
      GROUP BY decision_status
      ORDER BY COUNT(*) DESC
    `, (error, rows) => {
      if (error) return reject(error);
      resolve(rows);
    });
  });
}

function getTimeline() {
  return new Promise((resolve, reject) => {
    db.all(`
      SELECT strftime('%Y-%W', application_date) AS week_label, COUNT(*) AS count
      FROM offers
      GROUP BY strftime('%Y-%W', application_date)
      ORDER BY week_label
    `, (error, rows) => {
      if (error) return reject(error);
      resolve(rows);
    });
  });
}

function getRecentActivity() {
  return new Promise((resolve, reject) => {
    db.all(`
      SELECT id, candidate_name, created_at, stage, decision_status
      FROM offers
      ORDER BY created_at DESC
    `, (error, rows) => {
      if (error) return reject(error);
      const activity = [];
      const seen = new Set();
      const stageLabelMap = {
        application: 'Application Created',
        offer_generated: 'Offer Generated',
        offer_viewed: 'Offer Viewed',
        offer_signed: 'Offer Signed',
        offer_accepted: 'Offer Accepted',
        offer_rejected: 'Offer Rejected',
        offer_expired: 'Offer Expired'
      };

      rows.forEach((row) => {
        const eventTitle = row.decision_status === 'accepted' || row.stage === 'offer_accepted'
          ? 'Offer Accepted'
          : row.decision_status === 'rejected' || row.stage === 'offer_rejected'
            ? 'Offer Rejected'
            : row.decision_status === 'expired' || row.stage === 'offer_expired'
              ? 'Offer Expired'
              : stageLabelMap[row.stage] || 'Application Created';
        const eventKey = `${row.id}:${eventTitle}`;
        if (!seen.has(eventKey)) {
          seen.add(eventKey);
          activity.push({
            title: eventTitle,
            candidate_name: row.candidate_name,
            timestamp: row.created_at
          });
        }
      });

      activity.sort((left, right) => new Date(right.timestamp) - new Date(left.timestamp));
      resolve(activity.slice(0, 12));
    });
  });
}

function getDataQuality() {
  return new Promise((resolve, reject) => {
    db.get(`
      SELECT
        (SELECT COUNT(*) FROM (
          SELECT candidate_name, role, department, application_date
          FROM offers
          GROUP BY candidate_name, role, department, application_date
          HAVING COUNT(*) > 1
        )) AS duplicateRecords,
        (SELECT COUNT(*) FROM offers WHERE candidate_name IS NULL OR role IS NULL OR department IS NULL OR application_date IS NULL OR stage IS NULL OR decision_status IS NULL OR offer_value IS NULL OR source IS NULL) AS nullRecords,
        (SELECT MAX(latest) FROM (
          SELECT MAX(created_at) AS latest FROM offers
          UNION ALL
          SELECT MAX(created_at) AS latest FROM verification_events
        )) AS latestEventTimestamp
    `, (error, row) => {
      if (error) return reject(error);
      const duplicateRecords = Number(row.duplicateRecords || 0);
      const nullRecords = Number(row.nullRecords || 0);
      resolve({
        databaseStatus: duplicateRecords === 0 && nullRecords === 0 ? 'Healthy' : 'Needs Review',
        duplicateRecords,
        nullRecords,
        latestEventTimestamp: row.latestEventTimestamp || null
      });
    });
  });
}

module.exports = { getOverview, getStageBreakdown, getStatusBreakdown, getTimeline, getRecentActivity, getDataQuality };
