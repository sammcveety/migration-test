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

router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

router.use(session({

    secret: 'secret',
    resave : true ,
    saveUninitialized : true 

}));

var con = createConnection();

var incorrect=false;
router.get("/",function(req,res) {
    incorrect=false;
    res.render("patientlogin.ejs",{incorrect:incorrect});    
})

router.post('/',function(req,res) {
    var username=req.body.username;
    var password=req.body.password;
    con.query("select * from patients where username=? and password=?",[username,password],function(err,result1,fields) {
        if (result1.length>0) {
            req.session.loggedin=true;
            req.session.username=result1[0].patient_id;
            res.cookie('username' , result1[0].patient_id);
            res.cookie('noapts' , true);
            //"create or replace view patient_apts as select * from appointments where patient_id=?"
            //"create or replace view patient_apts (select * from appointments where patient_id=?)"
            con.query("create or replace view patient_apts as select * from appointments where patient_id=?",[result1[0].patient_id],function (err,result2) {
                console.log('about to go patienthome');
                res.redirect('/patienthome');
            })
        }else{
            //res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
            res.redirect('back');
            //res.redirect('/patientlogin');
        }
    })
})

module.exports=router;