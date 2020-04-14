var express = require('express');

var router = express.Router({mergeParams: true});

const estimationController = require('../../../controllers/api/estimator');



router.post('/on-covid-19', estimationController.estimate);
router.post('/on-covid-19/:format', estimationController.estimate);
router.get('/on-covid-19/logs', estimationController.logs);

module.exports = router;
