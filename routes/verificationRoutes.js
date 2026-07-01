const express = require('express');
const verificationController = require('../controllers/verificationController');

const router = express.Router();

router.get('/', verificationController.verify);
router.get('/:id', verificationController.verifyOffer);

module.exports = router;
