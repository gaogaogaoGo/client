import { Handle } from '../common/base';
let handle = new Handle();

$('.submit').on('click', ()=> { 
	let name = $('.form-horizontal input[name="userName"]').val();
	let password = $('.form-horizontal input[name="password"]').val();
	console.log(name);
	console.log(password);
	let user = {	  tenancyName: '',
	  usernameOrEmailAddress: name,
	  password: password
	};

	dhp.ajax({
	  contentType: 'application/json',
	  url: 'http://localhost:7682/api/Account/Authenticate',
	  data: JSON.stringify(user)
	})
	.done(function (data) {
		var str = handle.encrypt(data);
		localStorage.setItem('str', str);
    window.location.href= 'home.html';	  
  });	
});

