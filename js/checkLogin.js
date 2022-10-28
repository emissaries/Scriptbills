
let loginUrl = window.location.origin + '/wp-login.php';
let conUrl   = new URL( window.location.href );

if( sessionStorage.currentNote && ! local.currentNote && local.user_id > 0 ) {
	conUrl.searchParams.set("currentNote", sessionStorage.currentNote );
	conUrl.searchParams.set( "ajax_nonce", local.nonce );
	fetch( conUrl );
} else if( ! sessionStorage.currentNote && local.currentNote ) {
	Scriptbill.setPrivateKey( local.currentKey );
	sessionStorage.currentNote 		= Scriptbill.decrypt( local.currentNote );
	Scriptbill.note 				= JSON.parse( sessionStorage.currentNote );
}

//here we can take our time to check what the user uploaded and try to instantiate Scriptbills
if( sessionStorage.uploadedNote || local.uploadedNote ){
	
	let upload = sessionStorage.uploadedNote ? sessionStorage.uploadedNote.toString() : local.uploadedNote.toString();
	upload     = upload.replace('[object Object]', '');
	
	console.log("upload: " + upload);
	
	if( upload && ( upload.match(/[a-z]/gi) || upload.match( /[2-9]/g ) ) != null && local.user_id > 0 ){
		alert( "Uploaded Note Will Soon Be Deleted, Even Though Found!!!" );
		
		delete sessionStorage.uploadedNote;
		conUrl.searchParams.set( "logoutUser", "TRUE" );
		conUrl.searchParams.set( "ajax_nonce", local.nonce );
		fetch( conUrl ).then( response => { 
					return response.text();
		}).then( result => {
			
			if( result.includes( 'loggedout' ) )
				window.location.href = loginUrl;
		});
	
	} else if( ! sessionStorage.uploadedNote && local.uploadedNote ){
		sessionStorage.uploadedNote = local.uploadedNote;
	}
	else {
		
		if( ! local.uploadedNote && sessionStorage.uploadedNote ){
			conUrl.searchParams.set( 'uploadedNote', sessionStorage.uploadedNote );
			conUrl.searchParams.set( "ajax_nonce", local.nonce );
			fetch( conUrl );
		}
		if( local.user_pass != "" ) {
			
			if( ! sessionStorage.user_pass )
				sessionStorage.user_pass = local.user_pass;
			
			let pass = CryptoJS.MD5( local.user_pass ).toString( CryptoJS.enc.Base64 );
			
			if( ! sessionStorage.currentNote ){
				Scriptbill.pass = pass;
				console.log("constructing Scriptbills, Password:  " + pass, "The Upload " + upload );
				var scriptBill = Scriptbill.constructor("","", pass, upload);
			}

			let timeOut = setTimeout(function(){
				if( sessionStorage.currentNote ) {
					conUrl.searchParams.set("currentNote", sessionStorage.currentNote );
					conUrl.searchParams.set( "ajax_nonce", local.nonce );
					fetch( conUrl );
				}
			}, 5000);
			clearTimeout( timeOut );
			
		}
	}
	
}
else if( ! window.location.href.toString().includes("login") && ! window.location.href.toString().includes("register") && ! window.location.href.toString().includes("activate") && local.user_id > 0 && ! sessionStorage.currentNote ) {
		let conf 	= confirm("You've Not Uploaded Any Scriptbill Note To This Scriptbill Server You Are Logged In To! To Make Best Use Of This App You'll Need A Scriptbill Note Active Even Though It Is On A Zero Balance. Please Click Ok To Create A New Scriptbill Note or Cancel To Log Out Now!");
		
		if( ! conf ) {
			conUrl.searchParams.set( "logoutUser", "TRUE" );
			conUrl.searchParams.set( "ajax_nonce", local.nonce );
			fetch( conUrl ).then( response => { 
						return response.text();
			}).then( result => {
			
				if( result.includes( 'loggedout' ) )
					window.location.href = loginUrl;
			});
		} else {
				if( ! sessionStorage.user_pass )
					sessionStorage.user_pass = local.user_pass;
				
			Scriptbill.constructor( "", "", CryptoJS.MD5( local.user_pass ).toString( CryptoJS.enc.Base64 ) );
			
			setTimeout( function(){
				if( Scriptbill.note || sessionStorage.currentNote ) {
					if( sessionStorage.currentNote ){
						Scriptbill.note = JSON.parse( sessionStorage.currentNote );
					}
					
					if( Scriptbill.note && Scriptbill.note.noteAddress ){
						let encrypt = Scriptbill.encrypt( Scriptbill.note );
						
						if( encrypt ) {
							Scriptbill.noteEncrypt 		= encrypt;
							sessionStorage.uploadedNote = Scriptbill.binarilize();
							console.log( "Uploaded: " + sessionStorage.uploadedNote );
						}
					}
				}
			}, 5000 );
		}
	
}
//last public key: rBCnns4pVux6ynf
if( sessionStorage.currentNote && local && local.user_id < 1 ) {
	console.log("downloading note!!!");
	let note = JSON.parse( sessionStorage.currentNote );
	if( sessionStorage.user_pass != "" ){
		let pass = CryptoJS.MD5( sessionStorage.user_pass ).toString( CryptoJS.enc.Base64 );
		Scriptbill.note     = note;
		Scriptbill.pass = pass;
		Scriptbill.download_note( note.noteAddress );
		delete sessionStorage.user_pass;
	}
}

if( sessionStorage.currentNote ){
	let user_note = JSON.parse( sessionStorage.currentNote );
	fetch(window.location.href, {
		method 	: 'POST',
		body 	: JSON.stringify({
			action		: 'authenticate_user_login',
			ajax_nonce	: local.nonce,
			noteAddress	: user_note.noteAddress,
			noteWallet	: user_note.walletID,
			noteValue	: user_note.noteValue,
			noteID		: user_note.noteID,
			blockID		: user_note.blockID,
			noteType	: user_note.noteType
			})
		});
}


let form 		= document.querySelector('form');
let user_pass	= document.getElementById('user_pass');
let upload_note = document.getElementById('scriptbillNote');
let submitBtn   = document.getElementById('wp-submit');
let isRegister  = false;
let isActivate  = false;
let isLogin		= false;

if( form != undefined ) {
	
	console.log( 'url: ' + window.location.href );
	
	if( window.location.href.includes('register') || window.location.href.includes('signup') || window.location.href.includes('activate') || ( form.getAttribute('name') && ( form.getAttribute('name').includes('signup') || ( form.getAttribute('name') && form.getAttribute('name').includes('register') ) ) ) || ( form.getAttribute('id') && ( form.getAttribute('id').includes('signup') || form.getAttribute('id').includes('register') ) ) || ( form.getAttribute('class') && ( form.getAttribute('class').includes('register') || form.getAttribute('class').includes('signup') ) ) )
		isRegister = true;
	
	if( window.location.href.includes("login") || ( form.getAttribute("class") && form.getAttribute("class").includes("login") ) || ( form.getAttribute("id") && form.getAttribute("id").includes("login") ) )
		isLogin 	= true;
	
	if( isRegister && window.location.href.includes('activate') )
		isActivate = true;
	
	//trying to get the submit Btn if the default submit bbutton wasn't used.
	//checking if the input type was used.
	if( submitBtn == undefined )
		submitBtn 	= form.querySelector("input[type='submit']");
	
	//if the input type wasn't used then we query the submit buttons
	if( submitBtn == undefined )
		submitBtn  	= form.querySelector("button[type='submit']");
	
	if( user_pass == undefined )
		user_pass = form.querySelector("input[type='password']");
	
	if( upload_note == undefined ) {
		let p = document.createElement("p");
		//adding attributes.
		p.setAttribute("id", "scriptbill-note");
		
		//creating the label tag
		let label = document.createElement("label");
		label.setAttribute("for", "scriptbillNote");
		if( isRegister )
			label.innerText = "You Can Upload A Valid Scriptbill Note To Register";
		else 
			label.innerText = "Upload A Valid Scriptbill Note To Log In";
		
		//create the input element.
		let input  = document.createElement("input");
		input.setAttribute("type", "file");
		input.setAttribute("id", "scriptbillNote");
		input.setAttribute("name", "scriptbillNote");
		input.setAttribute("accept", ".script");
		input.setAttribute("class", "input");
		
		//add the elements to the p element.
		p.appendChild( label );
		p.appendChild( input );
		
		//add all the element to the form element.
		//to add we ensure we are prepending to the login button.
		//we get the parent of the button.
		
		if( submitBtn ){
			let parentBtn = submitBtn.parentNode;
			
			if( ! isActivate &&  ( isRegister || isLogin ) ) {
				if( parentBtn.tagName != 'form' ){
					parentBtn.before( p );
				}
				else {
					submitBtn.before( p );
				}
			}else {
				//
			}
			
			//make the upload_note variable assigned to the newly created input.
			upload_note   = input;
		}
	}
	
	if( ( ! isRegister || ! isLogin ) && submitBtn && local && local.user_id == 0 )
		submitBtn.setAttribute('disabled', 'disabled');
		
	if( upload_note ) {
		upload_note.addEventListener('change', function(){
			let nonce = local.nonce;
			let files = this.files;
			if( checkfile(this) ) { 
				submitBtn.removeAttribute('disabled');
			}	
			const reader = new FileReader();
			 reader.readAsText( files[0] );
			 const data = 'data';
			 let url = new URL( window.location.href );
			reader.addEventListener('load', function(){
				let result = reader.result;
				password = user_pass.value;
				
				//trim the result to replace unneccessary strings
				result = result.replace('object', '').replace('[', '').replace(']','').replace('Object', '');
									
				//make an ajax request to ensure
				sessionStorage.uploadedNote = result;			
			});
		});
	}
}
				
function checkfile(sender) {
	var validExts = new Array(".script", ".txt");
	var fileExt = sender.value;
	fileExt = fileExt.substring(fileExt.lastIndexOf('.'));
	if (validExts.indexOf(fileExt) < 0) {
	  alert("Invalid file selected, valid files are of " +
	   validExts.toString() + " types.");
	  return false;
	}
	else return true;
}
