const verificationModel = require('../models/verificationModel');

async function verify(req, res) {
  try {
    const [integritySummary, history, summary] = await Promise.all([
      verificationModel.verifyIntegrity(),
      verificationModel.getVerificationHistory(),
      verificationModel.getVerificationSummary()
    ]);
    res.json({
      ...integritySummary,
      ...summary,
      history
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function verifyOffer(req, res) {
  try {
    const result = await verificationModel.verifyOfferById(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = { verify, verifyOffer };
