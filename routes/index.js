var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Passport Facebook Extension Demo' });
});

router.get('/logged', function(req, res,next){
  res.json({
    user: req.user
  });
});

module.exports = router;
