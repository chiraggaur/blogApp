const express = require("express");
const User = require("../models/User");
const auth = require("../middlewares/auth");
var router = express.Router();

/* GET users listing. */

router.get("/", auth.verifyToken, function (req, res, next) {
  res.send({ access: "Access Granted" });
});

/* GET users listing. */

/* Register user */

router.post("/", async (req, res, next) => {
  try {
    let user = await User.create(req.body.user);
    let token = await user.signToken();
    return res.status(201).json({ user: user.userJSON(token) });
  } catch (error) {
    next(error);
  }
});

/* Register user */

/* Login user */

router.post("/login", async (req, res, next) => {
  let { email, password } = req.body.user;
  if (!email || !password) {
    return res.status(400).json({ error: "Email/Password required" });
  }
  try {
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }
    let result = await user.verifyPassword(password);
    if (!result) {
      return res.status(400).json({ error: "Incorrect Password!!" });
    }
    let token = await user.signToken();
    return res.status(201).json({ user: user.userJSON(token) });
  } catch (error) {
    next(error);
  }
});

/* Login user */

module.exports = router;