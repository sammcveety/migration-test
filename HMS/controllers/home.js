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
const { request } = require('express');


router.get('*', function(req, res, next){
	if(req.cookies['username'] == null){
		res.redirect('/login');
	}else{
		next();
	}
});

var con = createConnection();


router.get('/',function(req,res){
    con.query("select * from staff",function (err,result) {
        //select * from appointments inner join staff on appointments.staff_id=staff.staff_id inner join patients on appointments.patient_id=patients.patient_id
        con.query("select * from appointments",function (err,result1) {
            var total_doc = result.length ;
            var appointment = result1.length;
            console.log(result1);
            res.render('home.ejs',{doc : total_doc , doclist : result, appointment : appointment, applist : result1});  
        })       
    })
    /*db.getAllDoc(function(err,result){
        db.getallappointment(function(err,result1){
        var total_doc = result.length ;
        var appointment = result1.length;
         
        res.render('home.ejs',{doc : total_doc , doclist : result, appointment : appointment, applist : result1});
        });
        //console.log(result.length);
        
    });*/
   
});


router.get('/departments',function(req,res){

    con.query("select * from department",function (err,result) {
        res.render('departments.ejs',{list:result});
    })
    /*db.getalldept(function(err,result){
        res.render('departments.ejs',{list:result});
    });*/
    
});

router.get('/add_departments',function(req,res){
    res.render('add_departments.ejs');
});

router.post('/add_departments',function(req,res){
    var dname = req.body.dname;
    var contact = req.body.contact;
    var location = req.body.location;
    con.query("insert into department (dname,contact_info,locationName) values(?,?,?)",[dname,contact,location],function (err,result) {
        res.redirect('/home/departments');
    })
    /*db.add_dept(name,desc,function(err,result){
        res.redirect('/home/departments');
    });*/
});

module.exports =router;