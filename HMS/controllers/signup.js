var express = require("express");
var router = express.Router();
var bodyParser = require("body-parser");
var db = require.main.require("./models/db_controller");
var createConnection = require.main.require('./models/db_config');
var nodemailer = require("nodemailer");
var randomToken = require("random-token");
const { check, validationResult } = require("express-validator");
var con = createConnection();

router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

router.get("/", function (req, res) {
  res.render("signup.ejs",{msg:""});
});

router.post("/",function (req, res) {
    var email = req.body.email;
    var username = req.body.username;
    var password= req.body.password;
    con.query("select * from admin where username=? ",[username],function (err,results) {
      if(results.length>0){
        res.render("signup.ejs",{msg:"User already exists. Please try again"});
      }else{
        con.query("insert into admin (username,password,email) values(?,?,?)",[username,password,email],function (err,results1) {
          if (err) console.log(err);
          console.log(username,email,password);
          res.redirect("/login");
        })
      }
    })
  }
);

module.exports = router;
