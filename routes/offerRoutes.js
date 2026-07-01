const express = require('express');
const offerController = require('../controllers/offerController');

const router = express.Router();

router.get('/', offerController.listOffers);
router.post('/', offerController.createOffer);
router.put('/:id', offerController.advanceOffer);
router.get('/export/csv', offerController.exportCsv);

module.exports = router;
