const offerModel = require('../models/offerModel');

async function listOffers(req, res) {
  try {
    const offers = await offerModel.getAllOffers();
    res.json(offers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function createOffer(req, res) {
  try {
    const offer = await offerModel.createOffer(req.body);
    res.status(201).json(offer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function advanceOffer(req, res) {
  try {
    const action = req.body?.action || (req.body?.advance ? 'advance' : 'advance');
    const offer = await offerModel.advanceOffer(req.params.id, action);
    res.json(offer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function exportCsv(req, res) {
  try {
    const csv = await offerModel.exportOffersCsv();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="offers.csv"');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = { listOffers, createOffer, advanceOffer, exportCsv };
