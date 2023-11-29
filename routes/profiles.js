const express = require('express');
const User = require('../models/User');
const auth = require('../middlewares/auth');

const router = express.Router();


router.get('/:username', auth.optionalVerify, async (req, res, next) => {
  let username = req.params.username;
  try{
    let profile = await User.findOne({ username });
    if(!profile){
      return res.status(400).json({ error: "No user Found for this username!!" });
    }else if(!req.user){
      return res.status(201).json({ profile: profile.profileJSON() });
    }else{
      return res.status(201).json({ profile: profile.profileJSON(req.user.userId) });
    }
  }catch(error){
    next(error);
  }
});

router.post('/:username/follow', auth.verifyToken, async (req, res, next) => {
  let username = req.params.username;
  try{
    let userToFollow = await User.findOne({ username });
    if(!userToFollow){
      res.status(201).json({ error: 'No user found' });
    }else if(req.user.userId === userToFollow.id.toString()){
      return res.status(400).json({ error: "You can't follow/unfollow yourselves" });
    }else{
      let followedUser = await User.findOneAndUpdate({ username }, { $push: {followers: req.user.userId} }, {new: true});
      if(followedUser){
        res.status(201).json({ profile: followedUser.profileJSON(req.user.userId) });
      }else{
        res.status(400).json({error: "This username doesn't exist"});
      }
    }
  }catch(error){
    next(error);
  }
});

router.post('/:username/unfollow', auth.verifyToken, async (req, res, next) => {
  let username = req.params.username;
  try{
    let userToFollow = await User.findOne({ username });
    if(req.user.userId === userToFollow.id.toString()){
      return res.status(400).json({ error: "You can't follow/unfollow yourselves" });
    }else{
      let followedUser = await User.findOneAndUpdate({ username }, { $pull: {followers: req.user.userId} }, {new: true});
      if(followedUser){
        res.status(201).json({ profile: followedUser.profileJSON(req.user.userId) });
      }else{
        res.status(400).json({error: "This username doesn't exist"});
      }
    }
  }catch(error){
    next(error);
  }
});


module.exports = router;