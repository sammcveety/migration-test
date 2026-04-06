var express = require('express');
const { default: Swal } = require('sweetalert2');
var  sweetalert = require('sweetalert2');
var router = express.Router();

router.get('/', function(req, res){
	console.log('inside logout');
	//req.session.username = null;
	res.clearCookie('username');
	res.redirect('/');
});

module.exports = router;