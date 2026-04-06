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
var incorrect=false;
var con = createConnection();

router.use(session({

    secret: 'secret',
    resave : true ,
    saveUninitialized : true 

}));


router.use(bodyParser.urlencoded({extended : true}));
router.use(bodyParser.json());

router.get('/', function(req ,res){
    res.render('login.ejs',{msg:""});
});

router.post('/', function(request , response){
    var username = request.body.username;
    var password = request.body.password;

    //if (username && password){
        con.query('select * from admin where username = ? and password = ?' , [username, password], function(error , results , fields){
            if (results.length > 0){
                
                request.session.loggedin = true ; 
                request.session.username = username;
                response.cookie('username' , username);
                response.redirect('/home');
            }else{
               incorrect=true;
               response.render('login.ejs',{msg:"Incorrect Username/Password"});
            }
            response.end();
        });

    //}

});

module.exports = router;