var express = require('express');
const jwt = require('jsonwebtoken');
const auth = require('../middlewares/auth');
const User = require('../models/User');
const Article = require('../models/Article');
const bcrypt = require('bcrypt');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/* Get Current User  */

router.get('/user', auth.verifyToken, async (req, res, next) => {
  try{
    let currentUser = await User.findById(req.user.userId);
    res.status(201).json({ user: currentUser.userJSON() });
  }catch(error){
    next(error);
  }
});

/* Get Current User */


/* Edit User Info */

router.put('/user', auth.verifyToken, async (req, res, next) => {
  let id = req.user.userId;
  try{
    if(req.body.user.password){
      req.body.user.password = await bcrypt.hash(req.body.user.password, 10);
    }
    let user = await User.findByIdAndUpdate(id, req.body.user, {new: true});
    return res.status(201).json({ user });
  }catch(error){
    next(error);
  }
});

/* Edit User Info */


/* Get Tags List */

router.get('/tags', async (req, res, next) => {
  try{
    let tags = await Article.find({}).distinct('tagList');
    return res.status(201).json({ tags });
  }catch(error){
    next(error);
  }
});

/* Get Tags List */

module.exports = router;