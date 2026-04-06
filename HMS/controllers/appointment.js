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


var con = createConnection();


router.get('*', function(req, res, next){
	if(req.cookies['username'] == null){
		res.redirect('/login');
	}else{
		next();
	}
});

router.get('/',function(req,res){
    /*db.getallappointment(function(err,result){
        console.log(result);
        res.render('appointment.ejs',{list :result});
    })*/
    con.query("select * from appointments inner join patients on appointments.patient_id=patients.patient_id inner join staff on appointments.staff_id=staff.staff_id=",function (err,result) {
        console.log(result);
        res.render('appointment.ejs',{list :result});
    })
});

router.get('/delete_appointment/:id',function(req,res){
    var id = req.params.id;
    con.query("select * from appointments where apt_id=?",[id],function (err,result) {
        console.log(result);
        res.render('delete_appointment.ejs',{list:result});
    })
    /*db.getappointmentbyid(id,function(err,result){
        console.log(result);
        res.render('delete_appointment.ejs',{list:result});
    })*/
    
});

router.post('/delete_appointment/:id',function(req,res){
    var id =req.params.id;
    con.query("delete from appointments where apt_id=?",[id],function (err,result) {
        res.redirect('/appointment');
    });
    /*db.deleteappointment(id,function(err,result){
        res.redirect('/appointment');
    });*/
})

module.exports =router;