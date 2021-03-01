var express = require("express");
var router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

router.post("/users/register", function (req, res) {
  // 1. retrieve username and password from req.body
  const username = req.body.username;
  const password = req.body.password;
  if (!username || !password) {
    res.status(400).json({
      error: true,
      message: "Request body incomplete - username and password are required!",
    });
    return;
  }
  // 2. determine whether the user already exists in the table
  req.db
    .from("users")
    .select("*")
    .where({ username })
    .then((users) => {
      const queryUser = users[0];
      //    2.1 if the user does exist, return error message
      if (queryUser) {
        res
          .status(400)
          .json({ error: true, message: "The username is already used!" });
        return;
      }
      //    2.2 if the user does not exist, insert it into the table
      else {
        const saltRounds = 10;
        const hash = bcrypt.hashSync(password, saltRounds);
        req.db
          .from("users")
          .insert({ username, hash })
          .then(() => {
            res.status(201).json({ success: true, message: "User created!" });
          })
          .catch((err) => console.log(err));
      }
    });
});

router.post("/users/login", async function (req, res) {
  // 1. retrieve username and password from req.body
  // verify body
  const username = req.body.username;
  const password = req.body.password;
  if (!username || !password) {
    res.status(400).json({
      error: true,
      message: "Request body incomplete - username and password are required!",
    });
    return;
  }
  // 2. determine whether the user already exists in the table
  req.db
    .from("users")
    .select("*")
    .where({ username })
    .then((users) => {
      const queryUser = users[0];
      //    2.1 if the user does exist,
      if (queryUser) {
        // verify the password
        return bcrypt.compareSync(password, queryUser.hash);
      }
      //    2.2 if the user does not exist, return error message
      else {
        throw new Error("username does not exist!");
      }
    })
    .then((match) => {
      if (match) {
        // sign token to it
        // 1 day in s
        const secret_key = "a secret key";
        const expires_in = 60 * 60 * 24;
        const ms = 1000;
        const exp = Date.now() + expires_in * ms;
        const token = jwt.sign({ username, exp }, secret_key);
        res.status(200).json({
          toke_type: "Bearer",
          token,
          expires_in,
        });
      } else {
        res
          .status(500)
          .json({ error: true, message: "Incorrect password or username!" });
      }
    })
    .catch((error) => {
      // Todo: the status code should be refined!
      res.status(400).json({ error: true, message: error.message });
    });
});

// USERS table
// CREATE TABLE users (
// 	id INT NOT NULL AUTO_INCREMENT,
// 	username VARCHAR(45) NOT NULL UNIQUE,
//     hash VARCHAR(60) NOT NULL,
//     PRIMARY KEY (id)
// );
module.exports = router;
