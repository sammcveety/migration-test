var express = require ('express');
var home = require('./home');
var createConnection = require.main.require('./models/db_config');
var session = require ('express-session');
var router = express.Router();
var bodyParser = require('body-parser');
var db = require.main.require ('./models/db_controller');
var  sweetalert = require('sweetalert2');
const { check, validationResult } = require('express-validator');
const { default: Swal } = require('sweetalert2');
const { route } = require('./home');
var pid,pname,aptid;

router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());



var con = createConnection();

router.get('*', function(req, res, next){
	if(req.cookies['username'] == null){
		res.redirect('/doctorlogin');
	}else{
		next();
	}
});

router.get('/',function (req,res) {
    console.log('inside doctorhome');
    let did=req.cookies['username'];
    con.query("select * from staff where staff_id=?",[did],function (err,results0) {
        con.query("select * from staff_apts inner join patients on staff_apts.patient_id=patients.patient_id",function (err,results1) {
            res.render('doctorhome.ejs',{list:results0,aptlist:results1});
        })
    })
})

router.post('/',function (req,res) {
    let onleave=req.body.onleave;
    let dob=req.body.dob;
    let email=req.body.email;
    let staff_name=req.body.staff_name;
    let occupation=req.body.occupation;
    con.query("update staff set onleave=?,dob=?,email=?,staff_name=?,occupation=? where staff_id=?",[onleave,dob,email,staff_name,occupation,req.session.username],function (err,result) {
        res.redirect("/doctorhome");
    })
})
module.exports=router;