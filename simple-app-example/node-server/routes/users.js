var express = require('express');
var router = express.Router();

function supportCrossOriginScript(req, res, next) {
    res.status(200);
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Content-Type");

    // res.header("Access-Control-Allow-Headers", "Origin");
    // res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    // res.header("Access-Control-Allow-Methods","POST, OPTIONS");
    // res.header("Access-Control-Allow-Methods","POST, GET, OPTIONS, DELETE, PUT, HEAD");
    // res.header("Access-Control-Max-Age","1728000");
    next();
}/*
 * GET userlist.
 */
 router.options('/userlist', supportCrossOriginScript, function(req, res) {
     var db = req.db;
     var collection = db.get('userlist');
     collection.find({},{},function(e,docs){
         res.json(docs);
     });
 });

router.get('/userlist', function(req, res) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
console.log("router get userlist")
    var db = req.db;
    var collection = db.get('userlist');
    collection.find({},{},function(e,docs){
        res.json(docs);
    });
});

/*function supportCrossOriginScript(req, res, next) {
    res.status(200);
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Content-Type");

    // res.header("Access-Control-Allow-Headers", "Origin");
    // res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    // res.header("Access-Control-Allow-Methods","POST, OPTIONS");
    // res.header("Access-Control-Allow-Methods","POST, GET, OPTIONS, DELETE, PUT, HEAD");
    // res.header("Access-Control-Max-Age","1728000");
    next();
}
 * POST to adduser.
 */
router.options('/adduser',supportCrossOriginScript, function(req, res) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');

    var db = req.db;
    var collection = db.get('userlist');
    collection.find({},{},function(e,docs){
        //res.json(docs);
    });
    res.json({});
});

router.post('/adduser',supportCrossOriginScript, function(req, res) {
    var db = req.db;
    var collection = db.get('userlist');
    collection.insert(req.body, function(err, result){
      /*
        res.send(
            (err === null) ? { msg: '' } : { msg: err }
        );
        */
          res.header('Access-Control-Allow-Origin', '*');
          res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
          res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');

          var db = req.db;
          var collection = db.get('userlist');
          collection.find({},{},function(e,docs){
              res.json(docs);
          });
    });
});


/*
 * DELETE to deleteuser.
 */
 router.options('/deleteuser/:id',supportCrossOriginScript, function(req, res) {
     res.header('Access-Control-Allow-Origin', '*');
     res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, DELETE');
     res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
     console.log("router options deleteuser");

     var db = req.db;
     var collection = db.get('userlist');
     collection.find({},{},function(e,docs){
         //res.json(docs);
     });
     res.json({});
 });
router.delete('/deleteuser/:id', supportCrossOriginScript, function(req, res) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, DELETE');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    var id = req.params.id;
    console.log("router.delete", id);
    var db = req.db;
    var collection = db.get('userlist');
    collection.remove({ 'username' : id }, function(err, result) {
      console.log("router.delete err", err, result);
    });
      collection.find({},{},function(e,docs){
          res.json(docs);
      });

});

module.exports = router;
