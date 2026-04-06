var express = require("express");
var router = express.Router();
var bodyParser = require("body-parser");
var db = require.main.require("./models/db_controller");
var createConnection = require.main.require('./models/db_config');
var alreadyexists=false;
router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

var con = createConnection();

router.get("/", function (req, res) {
    res.render("patientsignup.ejs",{alreadyexists:alreadyexists});
  });

router.post("/",function (req,res) {
    var email = req.body.email;
    var username = req.body.username;
    var password = req.body.password;
    var patient_name = req.body.patient_name;
    var address = req.body.address;
    var phone_number = req.body.phone_number;
    var pdob = req.body.pdob;
        alreadyexists=false;
    con.query('select * from patients where username = ?' , [username], function(error , results , fields){
      if(results.length>0){
        alreadyexists=true;
        res.redirect('back');
      }else{
        con.query('insert into patients(patient_name,dob,phone_number,address,username,email,password) values(?,?,?,?,?,?,?)',[patient_name,pdob,phone_number,address,username,email,password],function (err,result) {
            if (err) throw err;
            console.log(`1 patient added`);

            res.redirect('/patientlogin');
        });
      }
    }); 
})

module.exports=router;