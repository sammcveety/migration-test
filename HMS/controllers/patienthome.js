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
var pid,pname,aptid;

router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

/*router.get('*', function(req, res, next){
	if(req.cookies['username'] == null){
		res.redirect('/patientlogin');
	}else{
		next();
	}
});*/
/*router.use(session({

    secret: 'secret',
    resave : true ,
    saveUninitialized : true 

}));*/

var con = createConnection();

router.get("/",function (req,res) {
    console.log('inside patienhome');
    pid=req.cookies['username'];
    console.log(pid);
    req.cookies["noapts"]=false;
    //res.render("patienthome.ejs",{pname:req.session.username});
    con.query("select * from patients where patient_id=?",[pid],function (err,result1) {
        pname=result1[0].patient_name;
        con.query("select * from department",function (err,result2) {
            con.query("select * from patient_apts inner join staff on patient_apts.staff_id=staff.staff_id",function (err,result3) {
                if(result3.length == 0)
                res.cookie('noapts' , true);
                res.render("patienthome.ejs",{pname:pname,deplist:result2,aptlist:result3,noapts:req.cookies["noapts"]});    
            })
        })
    })
})

router.post('/',function (req,res) {
    //req.session.department=req.body.department;
    res.cookie("department",req.body.department);
    res.redirect('patienthome/add_apt');
})

router.get("/add_apt",function (req,res) {
    pid=req.cookies["username"];
    var deptname=req.cookies["department"];
    console.log(`patient_id=${pid}, department: ${deptname}`);
    con.query("select * from staff where staff_id in (select staff_id from works_for where dept_id=?)",[deptname],function (err,results) {
        if(results.length==0){
            res.redirect("/patienthome");
        }else{
            res.render("add_apt.ejs",{list:results});  
        }
    })
})

router.post("/add_apt",function (req,res) {
    var title=req.body.title;
    var date=req.body.date;
    var staff_id=req.body.staff_id;
    var patient_id=req.cookies["username"];
    con.query("insert into appointments (title,aptdate,staff_id,patient_id) values(?,?,?,?)",[title,date,staff_id,patient_id],function (err,result) {
        if (err) throw err; //add trigger to update doctors max allowed
        con.query("update staff set max_allowed=max_allowed-1 where staff_id=?",[staff_id],function (err,result1) {
        console.log('added 1 appointment');
        res.redirect('/patienthome');  
        })
    })
})

router.get('/delete_apt/:id',function(req,res){
    aptid = req.params.id;
    con.query("select * from patient_apts where aptid=?",[aptid],function (err,result) {
        con.query("delete from patient_apts where aptid=?",[aptid],function (err,result0) {
            con.query("update staff set max_allowed=max_allowed+1 where staff_id=?",[result[0].staff_id],function (err,result1) {
                res.redirect('/patienthome');
            })  
        })
    })
});

router.get('/edit_apt/:id',function(req,res){
    aptid = req.params.id;
    con.query("select * from patient_apts where aptid=?",[aptid],function (err,result) {
        res.render("appointmentpage.ejs",{list:result});  
    })
});

router.post('/edit_apt/:id',function (req,res) {
    aptid=req.params.id;
    let title=req.body.title;
    let apt_date=req.body.apt_date;
    let rating=req.body.rating;
    let remarks=req.body.remarks;
    let complete=req.body.complete;
    con.query("update appointments set title=?,aptdate=?,remarks=? where aptid=?",[title,apt_date,remarks,aptid],function (err,result1) {
        con.query("select * from patient_apts where aptid=?",[aptid],function (err,result2){    
            con.query("insert into ratings(staff_id,patient_id,ratingstar) values(?,?,?)",[result2[0].staff_id,req.cookies["username"],rating],function (err,result3) {  
                if(complete){
                    con.query("insert into bills (amount_due,patient_id,due_date,aptid) values(?,?,?,?)",[500000,req.cookies["username"],apt_date,aptid],function (err,result4) {
                        con.query("update patients set balance=balance+50000 where patient_id=?",[req.cookies["username"]],function (err,result5) {
                            res.redirect('/patienthome'); 
                        })
                    })
                }else{
                    res.redirect('/patienthome');
                }
            })
        })
    })
})

router.get('/bills',function (req,res) {
    con.query("select * from patient_apts inner join bills on patient_apts.aptid=bills.aptid",function (err,results1) {
        con.query("select * from patients where patient_id=?",[req.cookies["username"]],function (err,results2) {
            res.render("bills.ejs",{list:results1,balance:results2[0].balance});  
        })
    })
})

router.get('/generate/:id',function (req,res) {
    res.redirect('/patienthome/bills');
})

module.exports=router;