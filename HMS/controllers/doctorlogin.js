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
    res.render("doctorlogin.ejs",{incorrect:incorrect});    
})

router.post('/',function(req,res) {
    var username=req.body.username;
    var password=req.body.password;
    con.query("select * from staff where username=? and password=?",[username,password],function(err,results,fields) {
        if (results.length>0) {
            req.session.loggedin=true;
            req.session.username=results[0].staff_id;
            res.cookie('username' , results[0].staff_id);
            con.query("create or replace view staff_apts as select * from appointments where staff_id=?",[results[0].staff_id],function (err,results1) {
                res.redirect('/doctorhome');
            })
        }else{
            //res.redirect('/doctorlogin')
            //res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
            res.redirect('back');
        }
    })
})

module.exports=router;