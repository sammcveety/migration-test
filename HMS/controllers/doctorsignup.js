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
    alreadyexists=false;
    con.query("select * from department",function (err,result) {
        res.render("doctorsignup.ejs",{list:result,alreadyexists:alreadyexists});    
    })
  });

router.post("/",function (req,res) {
    var email = req.body.email;
    var username = req.body.username;
    var password = req.body.password;
    var staff_name = req.body.staff_name;
    var occupation = req.body.occupation;
    var dept=req.body.department;
    var sdob = req.body.sdob;
    var salary=req.body.salary;
        alreadyexists=false;
    con.query('select * from staff where username = ?' , [username], function(error , results , fields){
      if(results.length>0){
        alreadyexists=true;
        res.redirect('back');
      }else{
        con.query('insert into staff(staff_name,occupation,dob,username,email,password,dept_id) values(?,?,?,?,?,?,?)',[staff_name,occupation,sdob,username,email,password,dept],function (err,result) {
            if (err) throw err;
            console.log(`1 doctor added`);
            con.query("select * from staff where username=? and password=?",[username,password],function (err,result1) {
                let staff_id=result1[0].staff_id;
                con.query("insert into works_for (staff_id,dept_id,salary,startdate) values(?,?,?,DATE(NOW()))",[staff_id,dept,salary],function (err,result2) {
                    res.redirect('/doctorlogin');  
                })
            })
        });
      }
    });
})

module.exports=router;