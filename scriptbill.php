<?php
/**
 * Plugin Name: Scriptbill Cryptonote
 * Plugin URI: https://scriptbank.ml
 * Description: A Cryptocurrency Based On Cryptonote Technology.
 * Version: 2.4.8.1
 * Tags: point, credit, loyalty program, engagement, reward, woocommerce rewards
 * Author: Scriptbank
 * Author URI: https://scriptbank.ml
 * Author Email: support@scriptbank.ml
 * Requires at least: WP 4.8
 * Tested up to: WP 6.0
 * Text Domain: scriptbill
 * Domain Path: /lang
 * License: GPLv2 or later
 * License URI: http://www.gnu.org/licenses/gpl-2.0.html
 */

if( ! class_exists( 'Scriptbill' ) ){
	class Scriptbill {
		
		//plugin version
		public $version = '0.0.1';
		
		private $default_note = array();
		
		// Instnace
		protected static $_instance = NULL;
		
		//whether or not we are registering a Business Manager note
		public static $isBusinessManagerNote = false;
		
		//whether or not the current user is a business manager
		public static $isBusinessManager = false;
		
		public static function instance(){
			if( is_null( self::$_instance ) ){
				self::$_instance = new self();
			}
			return self::$_instance;
		}
		
		/**
		 * Not allowed
		 * @since 0.1
		 * @version 0.1
		 */
		public function __clone() { _doing_it_wrong( __FUNCTION__, 'Cheatin&#8217; huh?', '0.0.1' ); }

		/**
		 * Not allowed
		 * @since 0.1
		 * @version 0.1
		 */
		public function __wakeup() { _doing_it_wrong( __FUNCTION__, 'Cheatin&#8217; huh?', '0.0.1' ); }
		
		public function __construct(){
			
			if( ! function_exists('mycred') ) {
				add_action( 'admin_notices', array( $this, 'scriptbill_notices__mycred_error' ) );
				return false;
			}
			
			add_action( 'admin_notices', array( $this, 'scriptbill_notices__mycred_success' ) );
			
			$defaults = array(
					'walletID' 	=> '',//this is the unique wallet ID of the user, this data is used to cryptographically link all the account of a particular user to a wallet. So that it can be recognized everywhere it is found.
					'noteID'		=> '0000',//this a unique nonce of the note, it increase everytime there is a transaction using this note
					'noteAddress'	=> '', //this is the public key of the note, it is used to encrypt data that should be read by this note alone.
					'noteSecret'	=> '', //this is the private key of the note, used by the note owner to recieve funds sent to this note address. If you think your note Secret is compromized, you can recreate it and change your note address. To aviod it not affecting business, you can use the connectedNote parameter to link your new note to the compromized note and maintain the security on your note.
					'noteKey'		=> '', //this is the increment value of the nonce above, this means the noteKey divided by the current note ID should give us the total transaction done by this note.
					'noteValue' 	=> 0, //this is the value of the note. 
					'noteType'	=> 'SBCRD',//this is the unique code of the note you are using, anything that changes this note type would change the transactional value of the note to the new note type.
					'transValue'	=> 0, //this is the last transaction value of the note. 
					'transTime' 	=> 0, //this is the last time stamp of the transaction on the note.
					'transType'	 	=> 'CREATE',//this is the type of transaction conducted by the note.
					'transHash'		=> '',//this is half of the hash of the last transaction block this note created. To create a new transaction block, then this note must verify this hash.
					'transKey'		=> '', //this is the private key of the last bock produced by this note.
					'profitKeys'	=> [],//this is the private key of the product block held by the note for profit sharing.
					'noteServer'	=> $_SERVER['REQUEST_SCHEME']."://".$_SERVER['SERVER_ADDR'].'::'.$_SERVER['SERVER_PORT'], //the server where the note is hosted. The note will be found of sending request to this server to connect to the network.
					'noteHash'		=> '',//this is the last hash value of the note
					'noteSign'		=> '', //this is the signature built using the noteHash and the secret of the note.
					'noteSubs'		=> [], //this is an array of the total subsription on this note
					'noteBudgets'	=> [], //this is an array of the total budget on this note.
					'agreements' 	=> [], //this is an array of private keys of agreements held by this note.
					'blockKey'		=> '',//this is the private key to the note's current block. Used to verify that the note actually signed the block it created.
					'blockHash'		=> '',//this is the hash of the total hash of the transaction block concerned. This is required to verify if the note created the transaction block it is processing wiith.
					'BMKey'			=> '', //this is the note address of the business manager that controls this note network.
					);
					
			$this->default_note = $defaults;
			//first we create theScriptbill database tables we will use to query Scriptbill Transactional data.
			$this->createTables();
			$this->define();
			$this->actions();
			$this->filters();
			$this->add_pages();
			
		}
		
		public function define(){
			define('SCRIPTBANK_URL', 'https://dev-cmbf-bank.pantheonsite.io/');
			define('SCRIPTBANK_BIZ_URL', SCRIPTBANK_URL . '?businessManagerQuery=TRUE');
			define('SCRIPTBANK_BIZ_MANAGER', $this->get_site_business_manager_id());
		}
		
		public function actions(){
			//register_activation_hook( __FILE__, array( $this, 'add_pages' ) );
			add_action( 'init', array( $this, 'recieve_data' ) );
			add_action('init', array( $this, 'check_user_online_status' ) );
			//add_action( 'init', array( $this, 'recieve_user_block' ) );
			//add_action( 'mycred_update_user_balance', array( $this, 'check_balance_updates' ), 20, 4 );
			add_action( 'user_register', array( $this, 'create_new_note' ) );			
			add_action( 'init', array( $this, 'login_user_note' ) );
			add_action( 'wp_footer', array( $this, 'get_current_user_note' ) );
			add_action( 'init', array( $this, 'get_current_user_note_init' ) );
			add_action( 'init', array( $this, 'authenticate_user_login' ) );
			add_action( 'login_form', array( $this, 'upload_user_note' ) );
			add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_scriptbill_scripts' ) );
			add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_scriptbill_scripts' ) );
			add_action( 'login_enqueue_scripts', array( $this, 'enqueue_scriptbill_scripts' ) );
			add_action( 'init', array( $this, 'share_blocks' ) );
			//add_action( 'register_form', array( $this, 'add_scriptbill_wallet_address' ) );
			add_action( 'woocommerce_product_meta_start', array( $this, 'check_product_meta' ) );
			add_action( 'admin_menu', array( $this, 'add_admin_pages' ) );
			add_action( 'init', array( $this, 'add_scriptbill_ranks' ) );
			add_action( 'woocommerce_product_options_general_product_data', array($this, 'add_woocommerce_fields') );
			add_action('woocommerce_after_add_to_cart_button', array( $this, 'invest' ), 10);
			add_action( 'add_meta_boxes', array( $this, 'add_meta_box' ) );
			add_action( 'save_post',      array( $this, 'save'         ) );
			add_action('woocommerce_thankyou', array( $this, 'process_woocommerce_payment' ));
			add_action( 'woocommerce_process_product_meta', array( $this, 'save_budget_woocommerce' ) );
			add_action( 'wp_logout', array( $this, 'clear_scriptbill_keys' ) );
			
			
			//adding shortcodes
			add_shortcode( 'scriptbill_transaction_confirmation', array( $this, 'scriptbill_transaction_confirmation' ) );
			add_shortcode('note_management', array( $this, 'manage_scriptbill_note' ));
			
			
		}
		
		public function manage_scriptbill_note(){
			$login_url = wp_login_url();
			$html = <<<EOL
			<div class="script-container" id="note-management">
				<div class="script-container script-col s5 script-card">
					<p><strong>Your Note Address</strong></p>
					<p><pre id="note-address"></pre></p>
				</div>
				<div class="script-container script-col s4 script-card">
					<p><strong>Your Note Value</strong></p>
					<p><pre id="note-value"></pre></p>
				</div>
				<div class="script-container script-col s3 script-card">
					<p><strong>Your Last Trans Value</strong></p>
					<p><pre id="trans-value"></pre></p>
				</div>
				<div class="script-container script-col s12 script-card">
					<p><strong>Your wallet Address</strong></p>
					<p><pre id="wallet-address"></pre></p>
				</div>
				<div class="script-container script-col s5 script-card">
					<p><strong>Last Transaction Time</strong></p>
					<p><pre id="trans-time"></pre></p>
				</div>
				<a href="#buy-scriptbills"><div class="script-container script-col s4 script-card" id="buy-script">
					<p><strong>Buy Scriptbills</strong></p>
					<p><pre id="current-trade"></pre></p>					
				</div></a>
				<div class="script-modal" id="buy-script-div">
						<div class="script-modal-content script-padding">
							<header class="script-teal script-padding"><strong>Buy Scriptbills</strong><a href="#"><p class="script-right script-medium" id="close-buy-script">X</p></a></header>
							<p><label for="buy-amount"> Amount to Buy							
								<input type="number" class="script-input" id="buy-amount" />
							</label></p>
							<p><label for="sell-credit"> Credit to Sell
								<input type="text" class="script-input" id="sell-credit" />
							</label>
								<i class="script-text script-small">Please enter the Credit Type You'd want to Sell during the exchange. For instance, for United State Dollar, you enter USDCRD - all Scriptbill Credit Type Ends With CRD Suffix.</i>
							</p>
							<p>
								<button class="w3-button" id="buy-submit"> Buy Now</button>
							</p>
						</div>
					</div>
				<a href="#sell-scriptbills"><div class="script-container script-col s3 script-card" id="script-value">
					<p><strong>Sell Scriptbills</strong></p>
					<p><pre id="script-value-pre"></pre></p>					
				</div></a>
				<div class="script-modal" id="sell-script-div">
						<div class="script-modal-content script-padding">
							<header class="script-teal script-padding"><strong>Sell Scriptbills</strong><a href="#"><p class="script-right script-medium" id="close-sell-script">X</p></a></header>
							<p><label for="sell-amount"> Amount to Sell
								<input type="number" class="script-input" id="sell-amount" />
							</label></p>
							<p><label for="buy-credit"> Credit to Buy
								<input type="text" class="script-input" id="buy-credit" />
							</label>
								<i class="script-text script-small">Please enter the Credit Type You'd want to buy during the exchange. For instance, for United State Dollar, you enter USDCRD - all Scriptbill Credit Type Ends With CRD Suffix.</i>
							</p>
							<p>
								<button class="w3-button" id="sell-submit"> Sell Now</button>
							</p>
						</div>
					</div>
				<a href="#send-scriptbills"><div class="script-container script-col s5 script-card" id="send-script">
					<p><strong>Send Scriptbills</strong></p>
					<p><pre id="send-script-pre"></pre></p>					
				</div></a>
				<div class="script-modal" id="send-script-div">
						<div class="script-modal-content script-padding">
							<header class="script-teal script-padding"><strong>Send Scriptbills</strong><a href="#"><p class="script-right script-medium" id="close-send-script">X</p></a></header>
							<p><label for="send-note-address"> Note Address to Send Scriptbills To
								<input type="text" class="script-input" id="send-note-address" />
							</label></p>
							<p><label for="send-amount"> Amount to Send
								<input type="number" class="script-input" id="send-amount" />
							</label></p>
							<p>
								<button  class="script-center script-button" id="send-submit">Send Now</button>
							</p>
						</div>
					</div>
				<a href="#view-transactions"><div class="script-container script-col s4 script-card" id="view-trans">
					<p><strong>View Transactions</strong></p>
					<p><pre id="view-trans-pre"></pre></p>					
				</div></a>
				<div class="script-modal" id="view-trans-div">
						<div class="script-modal-content">
							<header class="script-teal script-padding"><strong>View transaction</strong><a href="#"><p class="script-right script-medium" id="close-view-trans">X</p></a></header>
							<div class="script-container" id="transaction-div"></div>
						</div>
				</div>
				<a href="#create-budget-div"><div class="script-container script-col s3 script-card" id="create-budget">
					<p><strong>Create Budget</strong></p>
					<p><pre id="create-budget-pre"></pre></p>					
				</div></a>
				<div class="script-modal" id="create-budget-div">
					<div class="script-modal-content script-padding">
						<header class="script-teal"><a href="#"><p class="script-right script-medium" id="close-create-budget">X</p></a>							
						<p><strong>Create Budget</strong></p></header>
						<p><label for="budget-name"> The Name of Your Budget
							<input type="text" id="budget-name" class="script-input" />
						</label></p>
						<p><label for="budget-amount"> The Amount of This Budget
							<input type="number" id="budget-amount" class="script-input" />
						</label></p>
						<p><label for="budget-product"> The Product You Would Purchase Running This Budget
							<input type="text" id="budget-Product" class="script-input" />
						</label>
							<i class="script-text script-small">Please enter Just The Scriptbill Product ID. You May Ask The Seller of the Product for this.</i>
						</p>
						<p><label for="budget-time"> The Date you would Execute This Budget
							<input type="date" id="budget-time" class="script-input" />
						</label></p>
						<p>
							<button class="script-button" id="budget-submit">Create Budget</button>
						</p>
					</div>
				</div>
			</div>
			<script type="text/javascript"> 
			let noteManage = document.getElementById("note-management");
			let HTML 			= noteManage.innerHTML;
			noteManage.innerHTML = '<p class="script-text">Please wait while note management is loading...</p>';			
			
			setTimeout(function(){
				noteManage.innerHTML = HTML;
				if( ! sessionStorage.user_pass )
					sessionStorage.user_pass = local.user_pass;
				
				console.log( "The Pass: " + sessionStorage.user_pass );
				
				if( sessionStorage.currentNote ){
					let note = JSON.parse( sessionStorage.currentNote );
					let addEl = document.getElementById("note-address");
					addEl.innerText = note.noteAddress;
					
					let balEl = document.getElementById("note-value");
					balEl.innerText = note.noteValue;
					
					let transEl = document.getElementById("trans-value");
					transEl.innerText = note.transValue;
					
					let walletEl = document.getElementById("wallet-address");
					walletEl.innerText = note.walletID;
					
					let timeEl = document.getElementById("trans-time");
					timeEl.innerText = note.transTime;
					
					let curTrade = document.getElementById("current-trade");
					let scriptVal = document.getElementById("script-value-pre");
					let exValue   = Scriptbill.getExchangeValue("USDCRD", "SBCRD");
					curTrade.innerText = " USD " + exValue[1];
					scriptVal.innerText = 10;

					let buySubmit 	= document.getElementById("buy-submit");
					let sellCredit 	= document.getElementById("sell-credit");
					let buyAmount 	= document.getElementById("buy-amount");
					let closeBuy 	= document.getElementById("close-buy-script");
					let buyDiv 		= document.getElementById("buy-script");
					let buyModal 	= document.getElementById("buy-script-div");
					
					closeBuy.addEventListener("click", function(){
						buyModal.style.display = "none";
					});
					buyDiv.addEventListener("click", function(){
						buyModal.style.display = "block";
					});
					
					buySubmit.addEventListener("click", function(){
						if( sellCredit.value == "" || buyAmount.value == "" ){
							alert("all Fields Are Required!!!");
						}
						else {
							Scriptbill.response = Scriptbill.defaultBlock;
							let a 				= Scriptbill.response;
							a.noteType 			= sellCredit.value.includes("CRD") ? sellCredit.value : sellCredit.value + "CRD";
							a.transValue 		= buyAmount.value;
							a.noteValue 		= a.transValue;
							a.transType			= "EXCHANGE";
							Scriptbill.response = a;
							Scriptbill.exchangeCredits();
							buyModal.style.display = "none";
						}
					});
					
					
					let createBud   = document.getElementById("create-budget");
					let budModal 	= document.getElementById("create-budget-div");				
					//creating the close button.
					let closeBtn = document.getElementById("close-create-budget");
					let budSubmit 	= document.getElementById("budget-submit");
					let budName 	= document.getElementById("budget-name");
					let budValue 	= document.getElementById("budget-value");
					let budProduct	= document.getElementById("budget-Product");
					let budMessage  = document.getElementById("create-budget-pre");
					
					budSubmit.addEventListener("click", function(){
						
						budMessage.innerText = "Processing Create Budget...";
						
						if( budName.value == "" || ! budValue.value || budProduct.value == "" ) {
							alert("all fields are required!!");
						}
						else {					
							budModal.style.display = "none";
							let a = Scriptbill.budgetConfig;
							a.name 	= budName.value;
							a.value 	= budValue.value;
							a.budgetType = "personal";
							a.budgetCredit = note.noteType;
							a.budgetItems.push( budProduct.value );
							Scriptbill.budgetConfig = a;
							Scriptbill.createScriptbillBudget();
							budMessage.innerText = "Budget Created Successfully...";
						}
					});
					
					budModal.style.display = "none";
					createBud.onclick = function(){
						budModal.style.display = "block";
					}
					
					closeBtn.onclick = function(){
						budModal.removeAttribute("style");
					}
					
					let viewTrans   = document.getElementById("view-trans");
					let budModal2 	= document.getElementById("view-trans-div");
					let closeTrans 	= document.getElementById("close-view-trans");
					let transactions = document.getElementById("transaction-div");
					viewTrans.addEventListener("click", function(){
						budModal2.style.display = "block";
						let blocks = [];
						let lastID, firstID;
						Scriptbill.getTransactions(function( block, key ){
							if( block.blockID == note.blockID){
								blocks.push( block );
								localStorage.blocks = JSON.stringify(blocks);
								note.blockID 		= block.nextBlockID;
								lastID 				= block.formerBlockID;
							}
							else if( block.blockID == lastID ){
								blocks.push( block );
								localStorage.blocks = JSON.stringify(blocks);
								firstID 			= note.blockID;
								note.blockID 		= block.formerBlockID;
								Scriptbill.seed 	= note.blockID;
								lastID 				= Scriptbill.calculateFormerBlockID();				
							}
							else if( block.blockID == firstID ){
								blocks.push( block );
								localStorage.blocks 	= JSON.stringify( blocks );
								Scriptbill.seed 		= block.nextBlockID;
								note.blockID			= block.nextBlockID;
								firstID 				= Scriptbill.calculateNextBlockID();
								lastID 					= block.formerBlockID;							
							}
						});
						blocks = JSON.parse( localStorage.blocks );
						let s, block, p = document.createElement('p'), t = document.createElement('table'), tr = document.createElement('tr'), td = document.createElement('td');
						
						//creating the headers.
						let tr1 = tr.cloneNode();
						let td1 = td.cloneNode();
						td1.innerText = "TransType";
						tr1.appendChild( td1 );
						td1 = td.cloneNode();
						td1.innerText = "TransValue";
						tr1.appendChild( td1 );
						td1 = td.cloneNode();
						td1.innerText = "NoteValue";
						tr1.appendChild( td1 );
						td1 = td.cloneNode();
						td1.innerText = "NoteType";
						tr1.appendChild( td1 );
						td1 = td.cloneNode();
						td1.innerText = "TransTime";
						tr1.appendChild( td1 );
						t.appendChild(tr1);
						
						for( s = 0; s < blocks.length; s++ ){
							block 			= blocks[s];
							
							if( block.transType == undefined || block.noteValue == undefined || block.transValue == undefined )continue;
							
							tr1 			= tr.cloneNode();
							td1 			= td.cloneNode();
							td1.innerText 	= block.transType;
							tr1.appendChild( td1 );
							td1 			= td.cloneNode();
							td1.innerText 	= block.transValue;
							tr1.appendChild( td1 );
							td1 			= td.cloneNode();
							td1.innerText 	= block.noteValue;
							tr1.appendChild( td1 );
							td1 			= td.cloneNode();
							td1.innerText 	= block.noteType;
							tr1.appendChild( td1 );
							td1 			= td.cloneNode();
							td1.innerText 	= block.transTime;
							tr1.appendChild( td1 );
							t.appendChild( tr1 );
						}
						t.setAttribute("class", "script-table-all");
						transactions.appendChild( t );
						
					});
					budModal2.addEventListener("click", function(){
						budModal2.style.display = "none";
					});
					closeTrans.addEventListener("click", function(){
						budModal2.style.display = "none";
					});
					
					let sendScript   	= document.getElementById("send-script");
					let budModal3 		= document.getElementById("send-script-div");
					let modalClose 		= document.getElementById("close-send-script");
					let sendNote 		= document.getElementById("send-note-address");
					let sendAmount 		= document.getElementById("send-amount");
					let sendSubmit 		= document.getElementById("send-submit");
					sendScript.addEventListener("click", function(){
						budModal3.style.display = "block";
					});
					
					modalClose.addEventListener("click", function(){
						budModal3.style.display = "none";
					});
					
					sendSubmit.addEventListener("click", function(){
						if( sendNote.value == "" || ! sendAmount.value ){
							alert("All Fields Are Required!");
						}
						
						else {
							budModal3.style.display = "none";
							Scriptbill.sendConfig.amount = sendAmount.value;
							Scriptbill.sendConfig.recipients.push( sendNote.value );
							Scriptbill.walletID 	= note.walletID;
							console.log("current note: " + Scriptbill.getCurrentNote() );
							Scriptbill.sendMoney();
						}
					});
					
					let scriptVald   = document.getElementById("script-value");
					let budModal4 	= document.getElementById("sell-script-div");
					let closeSell	= document.getElementById("close-sell-script");
					let sellAmount  = document.getElementById("sell-amount");
					let buyCredit   = document.getElementById("buy-credit");
					let sellSubmit  = document.getElementById("sell-submit");
					
					scriptVald.addEventListener("click", function(){
						budModal4.style.display = "block";		
					});
					
					
					closeSell.addEventListener("click", function(){
						budModal4.style.display = "none";
					});
					
					sellSubmit.addEventListener("click", function(){
						if( ! sellAmount.value || buyCredit.value == "" ) {
							alert("All Fields Are Required!!!");
						}
						else {
							budModal4.style.display = "none";
							
							//since the client would sell his or her Scriptbills. He must have a fiat Credit account to run this.
							let a = Scriptbill.defaultScriptbill;
							a.noteType 		= buyCredit.value.lastIndexOf("CRD") == ( buyCredit.value.length - 3 ) ? buyCredit.value + "CRD" : buyCredit.value;
							a.noteType      = a.noteType.toUpperCase();
							a.noteValue 	= 0;
							a.transValue 	= 0;
							a.transType 	= "EXCHANGE";
							Scriptbill.defaultScriptbill = a;
							Scriptbill.createNote 	= true;
							Scriptbill.createNewScriptbillWallet();
							scriptVal.innerText 			= "Exchange Proccessing..";
							setTimeout( function(){
								Scriptbill.blockID 				= note.blockID;
								Scriptbill.response 			= Scriptbill.getTransBlock();
								
								if( ! Scriptbill.response )
									Scriptbill.response 		= Scriptbill.defaultBlock;
								
								Scriptbill.response.transValue 	= sellAmount.value;
								Scriptbill.response.noteValue 	= note.noteValue;
								Scriptbill.response.transType 	= "EXCHANGE";
								Scriptbill.response.noteType  	= note.noteType;
								Scriptbill.exchangeCredits();
								scriptVal.innerText 			= "Exchange Initializing..";
							}, 5000 );							
						}
					});
					
				} else {
					noteManage.innerHTML = '<p>Sorry! Please <a href="$login_url">Login</a> a Note to This Server to manage Note.</p>';
				}
			}, 5000);			
			</script>			
EOL;

return $html;
		}
		
		public function clear_scriptbill_keys( $user_id ){
			$userNote = get_user_meta( $user_id, 'current_scriptbill_note', true );
			$userKey = get_user_meta( $user_id, 'current_scriptbill_key', true );
			
			if( $userNote )
				delete_user_meta( $user_id, 'current_scriptbill_note' );
			
			if( $userKey )
				delete_user_meta( $user_id, 'current_scriptbill_key' );
		}
		
		public function filters(){
			//add_filter('mycred_add', array( $this, 'check_add_data' ), 20, 3 );
			add_filter( 'auth_cookie_expiration', array( $this, 'check_user_session_expiration' ), 99, 3 );
			//add_filter('wp_authenticate_user', array( $this, 'authenticate_user_login' ), 20, 2 );
			add_filter( 'pre_user_login', array( $this, 'add_wallet_id_to_username' ), 20, 1 );
			add_filter('mycred_buy_args', array($this, 'check_Scriptbill_buy_user'), 20, 3 );
		}
		
		public function scriptbill_buy_render(){
			global $wpdb;
			$request = wp_remote_get( SCRIPTBANK_URL . 'getRemoteAddress.php?type=BTC' );
			$default_acc = explode(',',wp_remote_retrieve_body( $request ));
			$return = 'To acquire Scriptbills, Please Make Payment into this BTC Account';
			return $return;
			
		}
		
		public function check_Scriptbill_buy_user( $args, $atts, $mycred ){
			return $args;
		}
		
		public function save_budget_woocommerce( $post_id ){
			$budgetPrefs = get_site_option("scriptbill_site_budget");
			$product 	= wc_get_product( $post_id );
			
			if( ! $product ) return;
			
			if( ! $budgetPrefs )
				$budgetPrefs = array();
			
			if( ! $budgetPrefs['budgetItems'] )
				$budgetPrefs['budgetItems'] = array();
			
			$budItems = $budgetPrefs['budgetItems'];
			
			$itemID = hash('MD5', strval( time() ), false );
			$item 					= array();
			$item['itemName']		= $product->get_name();
			$item['itemValue']		= isset( $_POST['_item_product_value'] ) ? esc_attr( $_POST['_item_product_value'] ) : $product->get_price() * $product->get_stock_quantity();
			$item['scriptbillAddress'] = isset( $_POST['_merchants_note_address_'] ) ? esc_attr( $_POST['_merchants_note_address_'] ) : '';
			
			if( ! isset( $item['scriptbillAddress'] ) ){
				for( $x = 1; $x < 1000; $x++ ) {
					$item['scriptbillAddress'] = isset( $_POST['_merchants_note_address_' . $x] ) ? esc_attr( $_POST['_merchants_note_address_' . $x] ) : '';
					
					if( isset( $item['scriptbillAddress'] ) )
						break;
				}				
			}
			
			if( ! isset( $item['scriptbillAddress'] ) ){
				$this->create_new_note( get_current_user_id() );
			}
			
			$item['businessEmail']	= isset( $_POST['_merchants_email_address'] ) ? esc_attr( $_POST['_merchants_email_address'] ) : '';
			$item['businessPhone']	= isset( $_POST['_merchants_phone_number_'] ) ? esc_attr( $_POST['_merchants_phone_number_'] ) : '';
			
			$budItems[ $itemID ]    = $item;
			$budgetPrefs['budgetItems'] = $budItems;
			
			update_site_option( "scriptbill_site_budget", $budgetPrefs );
		}
		
		public function add_admin_pages(){
				add_menu_page(
				__( 'Scriptbill', 'mycred' ),
				'Scriptbill BM',
				'manage_options',
				'scriptbill-admin.php',
				array( $this, 'add_scriptbill_wallet_address' ),
				plugins_url( 'scriptbill/images/icon-20x20.png' ),
				6
			);
			add_submenu_page(
				'scriptbill-admin.php',
				'CMBF Registration',
				'CMBF Registration',
				'manage_options',
				'cmbf-registration.php',
				array( $this, 'cmbf_registeration' ),
				2
			);
			add_submenu_page(
				'scriptbill-admin.php',
				'CMBF Meetings',
				'CMBF Meetings',
				'edit_posts',
				'cmbf-meetings.php',
				array( $this, 'cmbf_meetings' ),
				3
			);
			add_submenu_page(
				'scriptbill-admin.php',
				'Create Credit',
				'Create Credit',
				'manage_options',
				'create_credit.php',
				array( $this, 'register_new_credit' ),
				4
			);
			add_submenu_page(
				'scriptbill-admin.php',
				'Create Budget',
				'Create Budget',
				'manage_options',
				'create-budget.php',
				array( $this, 'create_scriptbill_budget' ),
				5
			);
			add_submenu_page(
				'scriptbill-admin.php',
				'Budget Log',
				'Budget Log',
				'manage_options',
				'budget-log.php',
				array( $this, 'output_budget_log' ),
				5
			);
			
		}
		
		public function scriptbill_transaction_confirmation(){
			return '<div id="trans-con-page"></div>';
		}
		
		public function add_pages(){
			
			
			
			$buy_page_title = "Scriptbill Buy";
			$exchange_page = $this->post_exists( $buy_page_title );
			$args = array();
				
			if( ! $exchange_page ) {
				$args['comment_status'] = 'close';
				$args['ping_status']	= 'close';
				$args['post_author']	= 1;
				$args['post_title']		= $buy_page_title;
				$args['post_name']		=  strtolower(str_replace(' ', '-', trim($buy_page_title)));
				$args['post_content']      = '[mycred_buy_form button="Buy Scriptbills Now"]';
				$args['post_type'] 		= 'page';
				$args['post_status'] 	= 'publsh';
				$exchange_page = wp_insert_post( $args );
			}
				
			//next we get the Sell Scriptbills Page. [mycred_cashcred]
			$sell_page_title = "Sell Scriptbills";
			$sell_page = $this->post_exists( $sell_page_title );
			
			if( ! $sell_page ) {
				$args['comment_status'] = 'close';
				$args['ping_status']	= 'close';
				$args['post_author']	= 1;
				$args['post_title']		= $sell_page_title;
				$args['post_name']		=  strtolower(str_replace(' ', '-', trim($sell_page_title)));
				$args['post_content']      = '[mycred_cashcred]';
				$args['post_type'] 		= 'page';
				$args['post_status'] 	= 'publish';
				$sell_page = wp_insert_post( $args );
			}
			
			$transfer_page_title = "Transfer Scriptbills";
			$transfer_page = $this->post_exists( $transfer_page_title );
				
			if( ! $transfer_page ) {
				$args['comment_status'] = 'close';
				$args['ping_status']	= 'close';
				$args['post_author']	= 1;
				$args['post_title']		= $transfer_page_title;
				$args['post_name']		=  strtolower(str_replace(' ', '-', trim($transfer_page_title)));
				$args['post_content']      = '[mycred_transfer]';
				$args['post_type'] 		= 'page';
				$args['post_status'] 	= 'publish';
				$transfer_page = wp_insert_post( $args );
			}
				
			$balance_page_title = "My Scriptbill Balance";
			$balance_page = $this->post_exists( $balance_page_title );
				
			if( ! $balance_page ) {
				$args['comment_status'] = 'close';
				$args['ping_status']	= 'close';
				$args['post_author']	= 1;
				$args['post_title']		= $balance_page_title;
				$args['post_name']		=  strtolower(str_replace(' ', '-', trim($balance_page_title)));
				$args['post_content']      = '[mycred_my_balance]';
				$args['post_type'] 		= 'page';
				$args['post_status'] 	= 'publish';
				$balance_page = wp_insert_post( $args );
			}

			$transaction_con_title = "Scriptbill Transaction Confirmation";
			$trans_con_page        = $this->post_exists( $transaction_con_title );
			
			if( ! $trans_con_page ) {
				$args['comment_status'] = 'close';
				$args['ping_status']	= 'close';
				$args['post_author']	= 1;
				$args['post_title']		= $transaction_con_title;
				$args['post_name']		=  strtolower(str_replace(' ', '-', trim($transaction_con_title)));
				$args['post_content']      = '[scriptbill_transaction_confirmation]';
				$args['post_type'] 		= 'page';
				$args['post_status'] 	= 'publish';
				$trans_con_page = wp_insert_post( $args );
			}
			
			$note_management_title = "Scriptbill Note Management";
			$note_manage_page        = $this->post_exists( $note_management_title );
			
			if( ! $note_manage_page ) {
				$args['comment_status'] = 'close';
				$args['ping_status']	= 'close';
				$args['post_author']	= 1;
				$args['post_title']		= $note_management_title;
				$args['post_name']		=  strtolower(str_replace(' ', '-', trim($note_management_title)));
				$args['post_content']      = '[note_management]';
				$args['post_type'] 		= 'page';
				$args['post_status'] 	= 'publish';
				$note_manage_page = wp_insert_post( $args );
			}
			
		}
		
		public function post_exists( $post_title ){
			global $wpdb;
						
			$query = "SELECT * FROM {$wpdb->prefix}posts WHERE post_title = '%s'";
			$result = $wpdb->get_row( $wpdb->prepare( $query, $post_title ) );
			
			if( $result != null )
				return true;
			
			else 
				return false;
		}
		
		public function post_search( $post_name, $post_type = 'post', $limit = 10 ){
			global $wpdb;
						
			$query = "SELECT * FROM {$wpdb->prefix}posts WHERE post_title LIKE '%{$post_name}%' AND post_type = '{$post_type}' ORDER BY ID DESC LIMIT {$limit}";
			$result = $wpdb->get_results( $wpdb->prepare( $query ) );
			return $result;
		}
		
				
		public function add_scriptbill_wallet_address(){
			$BM_Wallet = get_site_option('businessManagerWallet');
			$site_profit = get_site_option('siteProfitSharingRate') ? get_site_option('siteInvestSharingRate') : 0.2;
			$invest_rate = get_site_option('siteInvestSharingRate') ? get_site_option('siteInvestSharingRate') : 0.2;
			$site_profit = $site_profit * 100;
			$invest_rate = $invest_rate * 100;
			?>
			<div class="script-container script-col s6">
			<form action="<?php echo $_SERVER['REQUEST_URI']; ?>" method="post" >
			<p>
				<label for="user_wallet"><?php _e( 'Please Set Your Business Manager Scriptbill Wallet Address' ); ?></label><br>
				<input type="text" name="user_wallet" id="user_wallet" class="input script-input" value="<?php echo $BM_Wallet; ?>" size="25" /><br>
				<i><?php _e( 'Note you need to be registered on the Scriptbank Website to be a Business manager for this site. This will help Scriptbank Invest in your business and credit your customers.' ); ?></i>
			</p>
			<p>
				<label for="profit_sharing"><?php _e( 'Please Set Your Profit Sharing Rate' ); ?></label><br>
				<input type="number" name="profit_sharing" id="profit_sharing" class="input script-input" value="<?php echo $site_profit; ?>" size="25" /><br>
				<i><?php _e( 'This is the rate of profit in percentage that will be deducted from the profit made from registered product sales' ); ?></i>
			</p>
			<p>
				<label for="invest_sharing"><?php _e( 'Please Set Your Investment Sharing Rate' ); ?></label><br>
				<input type="number" name="invest_sharing" id="invest_sharing" class="input script-input" value="<?php echo $invest_rate; ?>" size="25" /><br>
				<i><?php _e( 'This rate will determine how much will be deducted from transactions on this site as investment to the Company Matrix Business Fellowship. This exercise is what qualifies you for the Automatic Investment Prodceedure on your buiness From Scriptbank. ' ); ?></i>
			</p>
			<?php
			submit_button();
			?>
			</form>
			</div>
			<?php
			
			if( isset($_POST['user_wallet'] ) ){
				$BM_Wallet = esc_attr( $_POST['user_wallet'] );
				$url 		= add_query_arg( 'walletAddress', $BM_Wallet, SCRIPTBANK_URL . 'checkBM.php' );
				$response = wp_remote_get( $url );
				$isBusinessManager = wp_remote_retrieve_body( $response );
				
				if( $isBusinessManager == 'TRUE' ){
					update_site_option( 'businessManagerWallet', $BM_Wallet );
					echo '<p>Business Manager Wallet Successfully Registered. You Can Now Start Recieving Investment and Crediting Your Customers Securely with Scriptbank.</p>';
				}
				else {
					echo '<p>This Wallet is not registered on the Scriptbank Website. Please <a href="'. SCRIPTBANK_URL .'business-manager-registration">Click Here</a> to Register Now!!!</p>';
					
				}
				
			}
			
			if( isset( $_POST['profit_sharing'] ) ){
				$profit_rate = floatval( esc_attr( $_POST['profit_sharing'] ) );
				$profit_rate = $profit_rate / 100;
				if( $profit_rate >= 0.2 )
					update_site_option( 'siteProfitSharingRate', $profit_rate );
				
				else {
					update_site_option( 'siteProfitSharingRate', 0.2 );
					echo '<p>Sorry: Profit Sharing Rate Cannot Be Lesser Than 20%</p>';
				}
			}
			
			if( isset( $_POST['invest_sharing'] ) ){
				$invest_rate = floatval( esc_attr( $_POST['invest_sharing'] ) );
				$invest_rate = $invest_rate / 100;
				
				if( $invest_rate >= 0.2 )
					update_site_option( 'siteInvestSharingRate', $invest_rate );
				
				else {
					update_site_option( 'siteInvestSharingRate', 0.2 );
					echo '<p>Sorry: Investment Sharing Rate Cannot Be Lesser Than 20%</p>';
				}
			}
			
		}
		public function output_budget_log(){?>
			<p>
				<label for="user_wallet"><?php _e( 'Your Scriptbill Wallet Address' ); ?></label><br>
				<input type="text" name="user_wallet" id="user_wallet" class="input script-input" value="" size="25" /><br>
				<i><?php _e( 'Note you need to be registered on the Scriptbank Website to be a Business manager for this site' ); ?></i>
			</p>			
			<?php
			submit_button();
			
		}

		public function cmbf_registeration(){
			$user = wp_get_current_user();
			$username = explode(' ', $user->display_name);
			$firstname = $username[0];
			$lastname = $username[1];
			$middlename = "";
			if( count( $username ) > 2 ){
				$middlename = $lastname;
				$lastname   = $username[2];
			}
			$email = $user->user_email;
			
			$data 	= (array) get_site_transient( "businessRegisteration" );
			
			if( $data['firstname'] != $firstname )
				$data['firstname'] = $firstname;
			
			if( $data['lastname'] != $lastname )
				$data['lastname']	= $lastname;
			
			if( $data['middlename'] != $middlename )
				$data['middlename']	= $middlename;
			?>
			
			<div class="script-container script-col s6">
				<form action="<?php echo $_SERVER['REQUEST_URI']; ?>" method="post">  
				  
				<p>
				<label for="firstname"> <?php echo _e('Firstname'); ?> </label><br>         
				<input type="text" name="firstname" id="firstname" class="script-input" size="25" value="<?php echo $data['firstname'];?>"/> 
				</p> <br>
				<p>
				<label for="middlename"> <?php echo _e('Middlename:'); ?> </label> <br>    
				<input type="text" name="middlename" id="middlename" size="15" class="script-input" value="<?php echo $data['middlename']; ?>"/> 
				</p> <br>
				<p>
				<label for="lastname"> <?php echo _e('Lastname:'); ?>  </label> <br>        
				<input type="text" name="lastname" id="lastname" size="15" class="script-input" value="<?php echo $data['lastname'];?>"/> 
				</p> <br>  
				 
				 <p>
				<label for="activity">   
				<?php echo _e('Your Activity in the Scriptbill Network:'); ?>  
				</label> <br> 
				<select name="businessType" class="script-select" id="activity">  
				<option value="Trading" <?php echo $data['businessType'] == 'Trading' ? 'selected="selected"':''; ?> ><?php echo _e('Buying & Selling of Credits'); ?></option>  
				<option value="Stock" <?php echo $data['businessType'] == 'Stock' ? 'selected="selected"':''; ?> ><?php echo _e('Buying & Selling of Scriptbill Stocks'); ?></option>  
				<option value="Invest" <?php echo $data['businessType'] == 'Invest' ? 'selected="selected"':''; ?> ><?php echo _e('Investing in the Scriptbill Network'); ?></option>  
				<option value="Business" <?php echo $data['businessType'] == 'Business' ? 'selected="selected"':''; ?> ><?php echo _e('Developing & Trading Products in the Network '); ?></option>  
				<option value="BusinessManager" <?php echo $data['businessType'] == 'BusinessManager' ? 'selected="selected"':''; ?> ><?php echo _e('Building other peoples\'s Business as well as the network'); ?></option>  
				<option value="AssistantBusinessManager" <?php echo $data['businessType'] == 'AssistantBusinessManager' ? 'selected="selected"':''; ?> ><?php echo _e('Mentoring other People into the Network'); ?></option>  
				<option value="Purchase" <?php echo $data['businessType'] == 'Purchase' ? 'selected="selected"':''; ?> ><?php echo _e('Buying and/or Selling Products in the Scriptbill Network'); ?></option>  
				</select> 		  
				</p>  
				<br>
				<p>
				<label>   
				<?php echo _e('Gender:'); ?>  
				</label><br>  
				<input type="radio" name="sex" value="male" class="script-radio" selected="selected" /> <?php echo _e('Male'); ?> <br>  
				<input type="radio" name="sex" value="female" class="script-radio"/> <?php echo _e('Female'); ?> <br>  
				<input type="radio" name="sex" value="other" class="script-radio"/> <?php echo _e('Other'); ?> 
				</p>  
				<br>  
				 
				<p>
				<label>   
				<?php echo _e('Phone :'); ?>  
				</label> <br>
				<div class="script-col s2">
				<input type="text" name="country-code" class="script-input" value="+91" size="2"/>
				</div>
				<div class="script-col s9">
				<input type="text" name="phone" class="script-input" size="10"/> 
				</div>
				</p> <br><br>
				<p>
				<?php echo _e('Home Address'); ?>  
				<br>  
				<textarea cols="80" rows="5" value="address" class="script-input" name="HMAddress" id="HMAddress">  
				</textarea>  
				</p> <br>
				<p>
				<?php echo _e('Business Address'); ?>  
				<br>  
				<textarea cols="80" rows="5" class="script-input" name="BizAddress" id="BizAddress">  
				</textarea>  
				</p> <br>
				<p>
				<label for="email"><?php echo _e('Email'); ?> </label> <br> 
				<input type="email" id="email" name="email" class="script-input" value="<?php echo $email; ?>"/> <br>    
				</p> <br>
				 
				<?php
				submit_button();?> 
				</form>
			</div>
			<?php
			
			if( isset( $_POST['submit'] ) ){
				$data = array();
				
				?>
				<script type="text/javascript">
				function disappear(){
					let el = document.getElementById("modal");
					el.style.display = "none";
				}
				</script>
				<?php
				
				if( isset($_POST['email']) || $_POST['email'] == "" )
					$data['email']		= esc_attr( $_POST['email'] );
				
				else {
					echo '<div class="script-modal" id="modal" style="display:block" onclick="disappear();"><div class="script-modal-content script-padding-24"><p class="script-text script-small script-margin-left">Email Can\'t Be Empty!!!</p></div></div>';
					return;
				}
				
				if( isset($_POST['BizAddress']) || $_POST['BizAddress'] == "" )
					$data['businessAddress'] = esc_attr( esc_html( $_POST['BizAddress'] ) );
				
				else {
					echo '<div class="script-modal" id="modal" style="display:block" onclick="disappear();"><div class="script-modal-content script-padding-24"><p class="script-text script-small script-margin-left">Please enter a business address.</p></div></div>';
					return;
				}
				
				if( isset( $_POST['HMAddress'] ) || $_POST['HMAddress'] == "" )
					$data['homeAddress']	= esc_attr( esc_html( $_POST['HMAddress'] ) );
				
				else {
					echo '<div class="script-modal" id="modal" style="display:block" onclick="disappear();"><div class="script-modal-content script-padding-24"><p class="script-text script-small script-modal-left">Please enter a Home address.</p></div></div>';
					return;
				}
				
				if( isset( $_POST['phone'] ) || $_POST['phone'] == "" )
					$data['businessPhone']	= esc_attr( esc_html( $_POST['phone'] ) );
				
				else {
					echo '<div class="script-modal" id="modal" style="display:block" onclick="disappear();"><div class="script-modal-content script-padding-24"><p class="script-text script-small script-modal-left">The Company Matrix Needs Your Business Phones.</p></div></div>';
					return;
				}
				
				if( isset( $_POST['country-code'] ) || $_POST['country-code'] == ""  )
					$data['countryCode']	= esc_attr( $_POST['country-code'] );
				
				else {
					echo '<div class="script-modal" id="modal" style="display:block" onclick="disappear();"><div class="script-modal-content script-padding-24"><p class="script-text script-small script-margin-left">Provide Your Phone Business Code.</p></div></div>';
					return;
				}
				
				if( isset( $_POST['sex'] ) )
					$data['sex']	= esc_attr( $_POST['sex'] );
				
				else {
					echo '<div class="script-modal" id="modal" style="display:block" onclick="disappear();"><div class="script-modal-content script-padding-24"><p class="script-text script-small script-margin-left">Select a sex.</p>';
					return;
				}

				if( isset( $_POST['businessType'] ) )
					$data['businessType']	= esc_attr( $_POST['businessType'] );
				
				else {
					echo '<div class="script-modal" id="modal" style="display:block" onclick="disappear();"><div class="script-modal-content script-padding-24"><p class="script-text script-small script-margin-left">Please Select a Business Type.</p>';
					return;
				}
				
				if( isset( $_POST['lastname'] ) || $_POST['lastname'] == "" )
					$data['lastname']	= esc_attr( $_POST['lastname'] );
				
				else {
					echo '<div class="script-modal" id="modal" style="display:block" onclick="disappear();"><div class="script-modal-content script-padding-24"><p class="script-text script-small script-margin-left">Please Enter a Last Name.</p>';
					return;
				}
				
				if( isset( $_POST['middlename'] ) || $_POST['middlename'] == "" )
					$data['middlename']	= esc_attr( $_POST['middlename'] );
				
				else {
					echo '<div class="script-modal" id="modal" style="display:block" onclick="disappear();"><div class="script-modal-content script-padding-24"><p class="script-text script-small script-margin-left">Please Enter a Middle Name.</p>';
					return;
				}
				
				if( isset( $_POST['firstname'] ) || $_POST['firstname'] == "" )
					$data['firstname']	= esc_attr( $_POST['firstname'] );
				
				else {
					echo '<div class="script-modal" id="modal" style="display:block" onclick="disappear();"><div class="script-modal-content script-padding-24"><p class="script-text script-small script-margin-left">Please Enter a First Name.</p>';
					return;
				}
				
				set_site_transient( "businessRegisteration", $data );
				$url 		= add_query_arg( SCRIPTBANK_URL, 'scriptReg', json_encode( $data ) );
				wp_remote_get( $url );
				echo '<div class="script-modal" id="modal" style="display:block" onclick="disappear();"><div class="script-modal-content script-padding-24"><p class="script-text script-small script-margin-left">You Have Successfully Registered With Scriptbank. You Can Will Start Recieving Investments From Scriptbank Investors!!!</p>';
			}
			
			
		}

		public function cmbf_meetings(){
			$url 		= SCRIPTBANK_URL . 'getMeetingChannels.php';
			$response 	= wp_remote_get( $url );
			$data 		= json_decode( wp_remote_retrieve_body( $response ), true );
			if( ! empty( $data ) && is_array( $data ) ) :
				foreach( $data as $meeting ):
					?>
					<div>
					<p>
					<iframe width="420" height="345" src="<?php echo $meeting['url']; ?>">
					</iframe>				
					<p>
					<i><?php echo $meeting['description']; ?> </i>
					<?php
					if( $meeting['isLive'] == 'TRUE' )
						echo '<p class="live-event">Currently Happening</p>';
					echo '</div>';
				endforeach;
			else: ?>
				<p><strong>No Meeting Was Found Available....Keep In Touch For A Meeting With Your Business Manager From The Company Matrix Business Fellowship</strong></p>
		<?php
		endif;		
		}

		public function register_new_credit(){
			global $mycred_types; 
			$credit = get_site_option( 'site_credit_type' );
			$abbr 	= get_site_option( 'site_credit_abbr' );
			$prefix  = get_site_option( 'site_credit_prefix' );
			//var_dump( $_SERVER );
			?>
			<form action="<?php echo $_SERVER['REQUEST_URI']; ?>" method="post">
			<label for="new_credit"><?php _e( 'Please select the Mycred Credit You Will Love To Use As Scriptbill Credit' ); ?></label><br>
			<select name="new_credit" id="newCredit">
			<?php
			foreach( $mycred_types as $point_key => $type ) :
				if( $point_key == MYCRED_DEFAULT_TYPE_KEY )
					continue;
				?>
				<option <?php if( $credit == $type ) echo 'selected="selected"'; ?> >
					<?php echo $type; ?>
				</option>				
				<?php
				
			endforeach;?>
			</select><br>
			<i><?php _e( 'This will definitely decentralize the Credit' ); ?></i><br>
			<p>
				<label for="credit_abbr"><?php _e( 'Your Scriptbill Credit Abbreviation' ); ?></label><br>
				<input type="text" name="credit_abbr" id="credit_abbr" class="input script-input" value="<?php echo $abbr; ?>" size="25" /><br>
				<i><?php _e( 'Create a Unique Abbreviation for your new Scriptbill Credit' ); ?></i>
			</p>
			<p>
				<label for="credit_abbr"><?php _e( 'Your Scriptbill Credit Prefix' ); ?></label><br>
				<input type="text" name="credit_pref" id="credit_pref" class="input script-input" value="<?php echo $prefix; ?>" size="25" /><br>
				<i><?php _e( 'Create a Prefix That will be used to display your credit on Scriptbill Exchange Platforms' ); ?></i>
			</p>
			<?php
			submit_button();
			?>
			</form>
			<?php
			
			if( isset( $_POST['new_credit'] ) && isset( $_POST['credit_abbr'] ) && isset( $_POST['credit_pref'] ) ){
				$credit 	= esc_attr(  $_POST['new_credit'] );
				$abbr    	= esc_attr( $_POST['credit_abbr'] );
				$prefix 	= esc_attr( $_POST['credit_pref'] );
				
				$isExists = $this->credit_exists( $abbr );
				
				if( ! $isExists ){
					update_site_option( 'site_credit_type', $credit   );
					update_site_option( 'site_credit_abbr', $abbr     );
					update_site_option( 'site_credit_prefix', $prefix );
					echo 'Scriptbill Credit Successfully Set!';
				}
				else {
					echo 'Scriptbill Credit Already Exist, Use a Differenct Abbrevaition for Your Credit or Change the Credit Type';
				}
			}
		}
		
		public function credit_exists( $credit_id ){
			
			global $wpdb;
			
			$query = "SELECT * FROM {$wpdb->prefix}ScriptbillBlocks WHERE noteType = '%s'";
			$row = $wpdb->get_row( $wpdb->prepare( $query, $credit_id ) );
			
			if( $row )
				return true;
			
			else 
				return false;
		}
		
		public function create_scriptbill_budget(){
			$budgetPrefs = get_site_option("scriptbill_site_budget");
			?>
			<div class="" id="budget-home">
			<h4>Create a Scriptbill Budget to recieve investment from the Company Matrix Business Fellowship Automatically. You don't need any paperwork, visit any bank or need the service of any lawyer to get investment; Scriptbill Cryptonote is designed to handle all your investment needs for your business without stress</h4>
				<form action="<?php echo $_SERVER['REQUEST_URI']; ?>" method="post">
				<div class="script-panel">
					<label for="user_pass"><strong><?php _e( 'Your Budget Name' ); ?></strong></label>
					<div class="wp-pwd"><br>
						<input type="text" name="budgetName" id="budgetName" class="input script-input" value="<?php echo $budgetPrefs['name']; ?>" size="20" />			
					</div>
				</div>				
				<div class="script-panel">
					<label for="budgetValue"><strong><?php _e( 'Your Budget Value' ); ?></strong></label>
					<div class="wp-pwd">
						<input type="text" name="budgetValue" id="budgetValue" class="input script-input" value="<?php echo $budgetPrefs['budgetValue']; ?>" size="20" /><br>
						<i class="info"><strong><?php _e( 'This should constitute the value of what will boost the production of your product ' ); ?></strong></i>
					</div>
				</div>
				<div class="script-panel">
					<h4><strong><?php _e( 'Investment Preferences For Sleeping Partner' ); ?></strong></h4>
					<div class="wp-pwd">
						<p><input type="radio" class="button" value="percent-less" name="sleeping-partner" id="sp-percent-less" <?php if( $budgetPrefs['sleepingPartner'] == 'percent-less' ) echo 'checked="checked"'; ?>/> <label for="sp-percent-less"><?php _e( '  Gets Lesser Stock in Percentage Compare to Investment' ); ?></label></p>
						<p><input type="radio" class="button" value="percent-equal" name="sleeping-partner" id="sp-percent-equal" <?php if( $budgetPrefs['sleepingPartner'] == 'percent-equal' ) echo 'checked="checked"'; ?>/> <label for="sp-percent-equal"><?php _e( ' Gets an Equal Stock in Percentage Compare to Investment' ); ?></label></p>
						<p><input type="radio" class="button" value="percent-high" name="sleeping-partner" id="sp-percent-high" <?php if( $budgetPrefs['sleepingPartner'] == 'percent-high' ) echo 'checked="checked"'; ?>/> <label for="sp-percent-high"><?php _e( 'Gets Higher Stock in Percentage Compare to Investment' ); ?></label></p>
						<p><input type="radio" class="button" value="sp-dividend-less" name="sleeping-partner" id="sp-dividend-less" <?php if( $budgetPrefs['sleepingPartner'] == 'sp-dividend-less' ) echo 'checked="checked"'; ?>/> <label for="sp-dividend-less"><?php _e( ' Gets Lesser Dividend in Percentage Compare to Stock Value' ); ?></label></p>
						<p><input type="radio" class="button" name="sleeping-partner" id="sp-dividend-high" value="sp-dividend-high" <?php if( $budgetPrefs['sleepingPartner'] == 'sp-dividend-high' ) echo 'checked="checked"'; ?> /> <label for="sp-dividend-high"><?php _e( 'Gets Higher Dividend in Percentage Compare to Stock Value' ); ?></label></p>
						<p><input type="radio" class="button" value="sp-dividend-equal" name="sleeping-partner" id="sp-dividend-equal" <?php if( $budgetPrefs['sleepingPartner'] == 'sp-dividend-equal' ) echo 'checked="checked"'; ?>/> <label for="sp-dividend-equal"><?php _e( 'Gets Equal Dividend Based on Stock Value' ); ?></label></p>
						<i class="info"><strong><?php _e( 'A Sleeping Partner is an Investor who Just Invested Money Into the Budget Without Doing Anything.' ); ?></strong></i>
					</div>
				</div>
				<div class="script-panel" id="sleeping-percent" style="display:none;">
					<label for="percentage-sleep"><strong><?php _e( 'Please Specify the Percentage' ); ?></strong></label>
					<div class="wp-pwd">
						<input type="number" name="percentage-sleep" id="percentage-sleep" class="input script-input" value="<?php echo $budgetPrefs['sleepingPartnerShare']; ?>" size="20" />
						<i class="info"><strong><?php _e( 'This will be the percentage value the investor gets as an investor.' ); ?></strong></i>
					</div>
				</div>
				<div class="script-panel">
					<h4><strong><?php _e( 'Investment Preferences For Working Partner' ); ?></strong></h4>
					<div class="wp-pwd">
						<p><input type="radio" class="button" id="wp-percentage-less" name="working-partner" value="percent-less" <?php if( $budgetPrefs['workingPartner'] == 'percent-less' ) echo 'checked="checked"'; ?>/> <label for="wp-percentage-less" ><?php _e('Gets Lesser Stock in Percentage Compare to Investment'); ?></label></p>
						<p><input type="radio" class="button" id="wp-percentage-equal" name="working-partner" value="percent-equal" <?php if( $budgetPrefs['workingPartner'] == 'percent-equal' ) echo 'checked="checked"'; ?>/><label for="wp-percentage-equal"> <?php _e('Gets an Equal Stock in Percentage Compare to Investment'); ?></label></p>
						<p><input type="radio" class="button" id="wp-percentage-high" name="working-partner" value="percent-high" <?php if( $budgetPrefs['workingPartner'] == 'percent-high' ) echo 'checked="checked"'; ?>/>  <label for="wp-percentage-high"><?php _e('Gets Higher Stock in Percentage Compare to Investment'); ?></label></p>
						<p><input type="radio" class="button" id="wp-dividend-less" name="working-partner" value="dividend-less" <?php if( $budgetPrefs['workingPartner'] == 'dividend-less' ) echo 'checked="checked"'; ?>/> <label for="wp-dividend-less"> <?php _e('Gets Lesser Dividend in Percentage Compare to Stock Value'); ?></label></p>
						<p><input type="radio" class="button" id="wp-dividend-high" name="working-partner" value="dividend-high" <?php if( $budgetPrefs['workingPartner'] == 'dividend-high' ) echo 'checked="checked"'; ?>/>  <label for="wp-dividend-high"><?php _e('Gets Higher Dividend in Percentage Compare to Stock Value'); ?></label></p>
						<p><input type="radio" class="button" id="wp-dividend-equal" name="working-partner" value="dividend-equal" <?php if( $budgetPrefs['workingPartner'] == 'dividend-equal' ) echo 'checked="checked"'; ?>/>  <label for="wp-dividend-equal"><?php _e('Gets Equal Dividend Based on Stock Value'); ?></label></p>
						<i class="info"><strong><?php _e( 'A Working Partner is an Investor who Invested Money and at the same time rendering Service to the growth of the Business.' ); ?></strong></i>
					</div>
				</div>
				<div class="script-panel" id="working-percent" style="display:none;">
					<label for="percentage-work"><strong><?php _e( 'Please Specify the Percentage' ); ?></strong></label>
					<div class="wp-pwd">
						<input type="number" name="percentage-work" id="percentage-work" class="input script-input" value="<?php echo $budgetPrefs['workingPartnerShare']; ?>" size="20" /><br>
						<i class="info"><strong><?php _e( 'This will be the percentage value the investor gets as an investor.' ); ?></strong></i>
					</div>
				</div>
				<div class="script-panel">
					<label for="budgetNote"><strong><?php _e( 'Your Budget Note Address' ); ?></strong></label>
					<div class="wp-pwd">
						<input type="text" name="budgetNote" id="budgetNote" class="input upload-btn" value="<?php echo $budgetPrefs['budgetNote']; ?>" size="20" /><br>
						<i class="info"><strong><?php _e( 'This would be the note which would buy and sell stocks that would be associated with this budget. This note should be controled by the propreitor of the business' ); ?></strong></i>
					</div>
				</div>
				<?php if( ! isset( $budgetPrefs['budgetNote'] ) ) : ?>
				<div class="script-panel">
					<label for="budgetNote"><strong><?php _e( 'Please Upload Note' ); ?></strong></label>
					<div class="wp-pwd">
						<input type="file" name="budgetNoteBinary" id="budgetNoteBinary" class="input script-input" value="" size="20" accept=".script" /><br>
						<i class="info"><strong><?php _e( 'If this note has note been uploaded on this browser before, you will need to upload it to create the budget. You can leave uploading if the note is the current note or has been uploaded on this browser before.' ); ?></strong></i><br>
						<input type="hidden" name="saveNoteBinary" id="saveNoteBinary" class="input script-input" value="" size="20"/>
					</div>
				</div>
				<?php endif; ?>
				<div class="script-panel">
					<label for="add-budget-item"><strong><?php _e( 'Add Budget Item' ); ?></strong></label>
					<div class="wp-pwd">
						<div class="" id="item-list"></div><br>
						<input type="button" name="add-budget-item" id="add-budget-item" class="button" value="Add Budget Item" size="20" /><br>
						<input type="button" name="generate-budget-item" id="generate-budget-item" class="button" value="Autogenerate Budget Item" size="20" /><br>						
						<i class="info"><strong><?php _e( 'Your Budget is not a Budget without an item. You can also click to generate budget items from your woocommerce product. Autogenerated Budget Items are will create a Product Restock Budget. This means you Shouldn\'t Autogenerate Budget Items if you are a Manufacturer or a Service Provider.' ); ?></strong></i>
					</div>
				</div>
				<div class="script-panel" id="autogenerate-div" style="display:none;">
					<h4><strong><?php _e( 'Please Select Your Preferences for Purchase Prices' ); ?></strong></h4>
					<div class="wp-pwd">
						<p><input type="radio" class="button" value="percent-less" name="purchase-price" id="pp-percent-less"/> <label for="pp-percent-less"><?php _e( 'I set my Purchase Price Percent Less Than Sales Price' ); ?></label></p>
						<p><input type="radio" class="button" value="product-equal" name="purchase-price" id="pp-product-equal"/> <label for="pp-product-equal"><?php _e( ' The Current Prices of Products on My Store Are the Purchase Price of the Products' ); ?></label></p>
						<p><input type="radio" class="button" value="set-product" name="purchase-price" id="pp-set-product"/> <label for="pp-set-product"><?php _e( 'I\'ll Set the Purchase Prices Per Product When I Edit or Add New Product to My Store' ); ?></label></p>
						<br>
						<i class="info"><strong><?php _e( 'This is required to calculate the estimated profit when product is sold, to help in dividend sharing calculation.' ); ?></strong></i>
					</div>
				</div>
				<div class="script-panel" id="purchase-percent" style="display:none;">
					<label for="percentage-purchase"><strong><?php _e( 'Please Specify the Percentage' ); ?></strong></label>
					<div class="wp-pwd">
						<input type="number" name="percentage-purchase" id="percentage-purchase" class="input script-input" value="20" size="20" /><br>
						<i class="info"><strong><?php _e( 'This will be the Percentage Less in Product Sales Price. To Make Budget Execute, You May Need To Set Merchant Details On Each Product Edit Screens.' ); ?></strong></i>
					</div>
				</div>
				<?php
				submit_button();
				?>
				</form>
			</div>
			<div class="" id="budget-item-form" style="display:none;">
				<div class="script-panel">
					<label for="item-name"><strong><?php _e( 'Item Name' ); ?></strong></label>
					<div class="wp-pwd">
						<input type="text" name="item-name" id="item-name" class="input script-input" value="" size="20" /><br>
						<i class="info"><strong><?php _e( 'The name of the Item you want to purchase in your Budget. Can be any of the product in your store if you want to do a restock!' ); ?></strong></i>
					</div>
				</div>
				<div class="script-panel">
					<label for="item-value"><strong><?php _e( 'Item Value' ); ?></strong></label>
					<div class="wp-pwd">
						<input type="text" name="item-value" id="item-value" class="input script-input" value="" size="20" /><br>
						<i class="info"><strong><?php _e( 'The Value of the Item you want to purchase' ); ?></strong></i>
					</div>
				</div>
				<div class="script-panel">
					<label for="item-products"><strong><?php _e( 'Item Product' ); ?></strong></label>
					<div class="wp-pwd">
						<input type="text" name="item-products" id="item-products" class="input script-input wc-product-search" value="" size="20" oninput="checkProducts();" /><br>
						<select id="product-option" style="display:none;"></select><br>
						<div id="result-div"></div>
						<i class="info"><strong><?php _e( 'Please provide the product ID that will be affected when this item is purchased. If the product is not yet displayed on the store, it will be advisable to use a mockup product instead!' ); ?></strong></i>
					</div>
				</div>
				<div class="script-panel">
					<label for="item-account-type"><strong><?php _e( 'Item Account Type' ); ?></strong></label>
					<div class="wp-pwd">
						<select name="item-account-type" id="item-account-type" class="select"  size="20"  >
							<option value="scriptbill" selected>Scriptbills</option>
							<option value="fiat">Fiat</option>
							<option value="crypto">Cryptocurrency</option>
						</select><br>
						
						<i class="info"><strong><?php _e( 'The Account Type of the Merchant That Would Recieve Payment When This Budget Executes! Please Note That Non Scriptbill Account Type May Not Be Handled Automatically and Would Require That Recipient Has a Valid Email or Phone Number.' ); ?></strong></i>
					</div>					
				</div>
				<div class="script-panel" id="scriptbill-select" style="display:none;">
					<label for="scriptbill-address"><strong><?php _e( 'Please enter a Valid Note Address or Product ID of This Merchant.' ); ?></strong></label>
					<div class="wp-pwd">
						<input type="text" name="scriptbill-address" id="scriptbill-address" class="input script-input" value="" size="20" /><br>						
						<i class="info"><strong><?php _e( 'The transaction runned by Scriptbills will always be protected by agreements. However, wrong Scriptbill note Address or Product ID of the Merchant may slow down the execution of this budget.' ); ?></strong></i>
					</div>					
				</div>
				<div class="script-panel" id="bank-select" style="display:none;">
					<label for="account-number"><strong><?php _e( 'Please enter a Valid Bank Account Number or account ID of a Payment Processing Company Like Paypal.' ); ?></strong></label>
					<div class="wp-pwd">
						<input type="text" name="account-number" id="account-number" class="input script-input" value="" size="20" /><br>						
						<i class="info"><strong><?php _e( 'Please ensure it\'s valid before the budget executes' ); ?></strong></i>
					</div>					
				</div>				
				<div class="script-panel" id="bank-select-two" style="display:none;">
					<label for="bank-name"><strong><?php _e( 'Please Enter a Valid Bank Name or Website.' ); ?></strong></label>
					<div class="wp-pwd">
						<input type="text" name="bank-name" id="bank-name" class="input script-input" value="" size="20" /><br>						
						<i class="info"><strong><?php _e( 'This should be the name of the bank or url to the payment processing company\'s Website.' ); ?></strong></i>
					</div>					
				</div>
				<div class="script-panel" id="bank-select-three" style="display:none;">
					<label for="bank-country"><strong><?php _e( 'Please tell Us which Country the Bank is Located.' ); ?></strong></label>
					<div class="wp-pwd">
						<select class="select wc-product-search" name="bank-country" id="bank-country">
							<option value="NGN" selected>Nigeria</option>
							<option value="--">Not Specified</option>
							<option value="AF">Afghanistan</option>
							<option value="AL">Albania</option>
							<option value="DZ">Algeria</option>
							<option value="AS">American Samoa</option>
							<option value="AD">Andorra</option>
							<option value="AO">Angola</option>
							<option value="AI">Anguilla</option>
							<option value="AQ">Antarctica</option>
							<option value="AG">Antigua and Barbuda</option>
							<option value="AR">Argentina</option>
							<option value="AM">Armenia</option>
							<option value="AW">Aruba</option>
							<option value="AU">Australia</option>
							<option value="AT">Austria</option>
							<option value="AZ">Azerbaijan</option>
							<option value="BS">Bahamas</option>
							<option value="BH">Bahrain</option>
							<option value="BD">Bangladesh</option>
							<option value="BB">Barbados</option>
							<option value="BY">Belarus</option>
							<option value="BE">Belgium</option>
							<option value="BZ">Belize</option>
							<option value="BJ">Benin</option>
							<option value="BM">Bermuda</option>
							<option value="BT">Bhutan</option>
							<option value="BO">Bolivia</option>
							<option value="BA">Bosnia and Herzegowina</option>
							<option value="BW">Botswana</option>
							<option value="BV">Bouvet Island</option>
							<option value="BR">Brazil</option>
							<option value="IO">British Indian Ocean Territory</option>
							<option value="BN">Brunei Darussalam</option>
							<option value="BG">Bulgaria</option>
							<option value="BF">Burkina Faso</option>
							<option value="BI">Burundi</option>
							<option value="KH">Cambodia</option>
							<option value="CM">Cameroon</option>
							<option value="CA">Canada</option>
							<option value="CV">Cape Verde</option>
							<option value="KY">Cayman Islands</option>
							<option value="CF">Central African Republic</option>
							<option value="TD">Chad</option>
							<option value="CL">Chile</option>
							<option value="CN">China</option>
							<option value="CX">Christmas Island</option>
							<option value="CC">Cocos (Keeling) Islands</option>
							<option value="CO">Colombia</option>
							<option value="KM">Comoros</option>
							<option value="CG">Congo</option>
							<option value="CD">Congo, the Democratic Republic of the</option>
							<option value="CK">Cook Islands</option>
							<option value="CR">Costa Rica</option>
							<option value="CI">Cote d'Ivoire</option>
							<option value="HR">Croatia (Hrvatska)</option>
							<option value="CU">Cuba</option>
							<option value="CY">Cyprus</option>
							<option value="CZ">Czech Republic</option>
							<option value="DK">Denmark</option>
							<option value="DJ">Djibouti</option>
							<option value="DM">Dominica</option>
							<option value="DO">Dominican Republic</option>
							<option value="TP">East Timor</option>
							<option value="EC">Ecuador</option>
							<option value="EG">Egypt</option>
							<option value="SV">El Salvador</option>
							<option value="GQ">Equatorial Guinea</option>
							<option value="ER">Eritrea</option>
							<option value="EE">Estonia</option>
							<option value="ET">Ethiopia</option>
							<option value="FK">Falkland Islands (Malvinas)</option>
							<option value="FO">Faroe Islands</option>
							<option value="FJ">Fiji</option>
							<option value="FI">Finland</option>
							<option value="FR">France</option>
							<option value="FX">France, Metropolitan</option>
							<option value="GF">French Guiana</option>
							<option value="PF">French Polynesia</option>
							<option value="TF">French Southern Territories</option>
							<option value="GA">Gabon</option>
							<option value="GM">Gambia</option>
							<option value="GE">Georgia</option>
							<option value="DE">Germany</option>
							<option value="GH">Ghana</option>
							<option value="GI">Gibraltar</option>
							<option value="GR">Greece</option>
							<option value="GL">Greenland</option>
							<option value="GD">Grenada</option>
							<option value="GP">Guadeloupe</option>
							<option value="GU">Guam</option>
							<option value="GT">Guatemala</option>
							<option value="GN">Guinea</option>
							<option value="GW">Guinea-Bissau</option>
							<option value="GY">Guyana</option>
							<option value="HT">Haiti</option>
							<option value="HM">Heard and Mc Donald Islands</option>
							<option value="VA">Holy See (Vatican City State)</option>
							<option value="HN">Honduras</option>
							<option value="HK">Hong Kong</option>
							<option value="HU">Hungary</option>
							<option value="IS">Iceland</option>
							<option value="IN">India</option>
							<option value="ID">Indonesia</option>
							<option value="IR">Iran (Islamic Republic of)</option>
							<option value="IQ">Iraq</option>
							<option value="IE">Ireland</option>
							<option value="IL">Israel</option>
							<option value="IT">Italy</option>
							<option value="JM">Jamaica</option>
							<option value="JP">Japan</option>
							<option value="JO">Jordan</option>
							<option value="KZ">Kazakhstan</option>
							<option value="KE">Kenya</option>
							<option value="KI">Kiribati</option>
							<option value="KP">Korea, Democratic People's Republic of</option>
							<option value="KR">Korea, Republic of</option>
							<option value="KW">Kuwait</option>
							<option value="KG">Kyrgyzstan</option>
							<option value="LA">Lao People's Democratic Republic</option>
							<option value="LV">Latvia</option>
							<option value="LB">Lebanon</option>
							<option value="LS">Lesotho</option>
							<option value="LR">Liberia</option>
							<option value="LY">Libyan Arab Jamahiriya</option>
							<option value="LI">Liechtenstein</option>
							<option value="LT">Lithuania</option>
							<option value="LU">Luxembourg</option>
							<option value="MO">Macau</option>
							<option value="MK">Macedonia, The Former Yugoslav Republic of</option>
							<option value="MG">Madagascar</option>
							<option value="MW">Malawi</option>
							<option value="MY">Malaysia</option>
							<option value="MV">Maldives</option>
							<option value="ML">Mali</option>
							<option value="MT">Malta</option>
							<option value="MH">Marshall Islands</option>
							<option value="MQ">Martinique</option>
							<option value="MR">Mauritania</option>
							<option value="MU">Mauritius</option>
							<option value="YT">Mayotte</option>
							<option value="MX">Mexico</option>
							<option value="FM">Micronesia, Federated States of</option>
							<option value="MD">Moldova, Republic of</option>
							<option value="MC">Monaco</option>
							<option value="MN">Mongolia</option>
							<option value="MS">Montserrat</option>
							<option value="MA">Morocco</option>
							<option value="MZ">Mozambique</option>
							<option value="MM">Myanmar</option>
							<option value="NA">Namibia</option>
							<option value="NR">Nauru</option>
							<option value="NP">Nepal</option>
							<option value="NL">Netherlands</option>
							<option value="AN">Netherlands Antilles</option>
							<option value="NC">New Caledonia</option>
							<option value="NZ">New Zealand</option>
							<option value="NI">Nicaragua</option>
							<option value="NE">Niger</option>
							<option value="NG">Nigeria</option>
							<option value="NU">Niue</option>
							<option value="NF">Norfolk Island</option>
							<option value="MP">Northern Mariana Islands</option>
							<option value="NO">Norway</option>
							<option value="OM">Oman</option>
							<option value="PK">Pakistan</option>
							<option value="PW">Palau</option>
							<option value="PA">Panama</option>
							<option value="PG">Papua New Guinea</option>
							<option value="PY">Paraguay</option>
							<option value="PE">Peru</option>
							<option value="PH">Philippines</option>
							<option value="PN">Pitcairn</option>
							<option value="PL">Poland</option>
							<option value="PT">Portugal</option>
							<option value="PR">Puerto Rico</option>
							<option value="QA">Qatar</option>
							<option value="RE">Reunion</option>
							<option value="RO">Romania</option>
							<option value="RU">Russian Federation</option>
							<option value="RW">Rwanda</option>
							<option value="KN">Saint Kitts and Nevis</option> 
							<option value="LC">Saint LUCIA</option>
							<option value="VC">Saint Vincent and the Grenadines</option>
							<option value="WS">Samoa</option>
							<option value="SM">San Marino</option>
							<option value="ST">Sao Tome and Principe</option> 
							<option value="SA">Saudi Arabia</option>
							<option value="SN">Senegal</option>
							<option value="SC">Seychelles</option>
							<option value="SL">Sierra Leone</option>
							<option value="SG">Singapore</option>
							<option value="SK">Slovakia (Slovak Republic)</option>
							<option value="SI">Slovenia</option>
							<option value="SB">Solomon Islands</option>
							<option value="SO">Somalia</option>
							<option value="ZA">South Africa</option>
							<option value="GS">South Georgia and the South Sandwich Islands</option>
							<option value="ES">Spain</option>
							<option value="LK">Sri Lanka</option>
							<option value="SH">St. Helena</option>
							<option value="PM">St. Pierre and Miquelon</option>
							<option value="SD">Sudan</option>
							<option value="SR">Suriname</option>
							<option value="SJ">Svalbard and Jan Mayen Islands</option>
							<option value="SZ">Swaziland</option>
							<option value="SE">Sweden</option>
							<option value="CH">Switzerland</option>
							<option value="SY">Syrian Arab Republic</option>
							<option value="TW">Taiwan, Province of China</option>
							<option value="TJ">Tajikistan</option>
							<option value="TZ">Tanzania, United Republic of</option>
							<option value="TH">Thailand</option>
							<option value="TG">Togo</option>
							<option value="TK">Tokelau</option>
							<option value="TO">Tonga</option>
							<option value="TT">Trinidad and Tobago</option>
							<option value="TN">Tunisia</option>
							<option value="TR">Turkey</option>
							<option value="TM">Turkmenistan</option>
							<option value="TC">Turks and Caicos Islands</option>
							<option value="TV">Tuvalu</option>
							<option value="UG">Uganda</option>
							<option value="UA">Ukraine</option>
							<option value="AE">United Arab Emirates</option>
							<option value="GB">United Kingdom</option>
							<option value="US">United States</option>
							<option value="UM">United States Minor Outlying Islands</option>
							<option value="UY">Uruguay</option>
							<option value="UZ">Uzbekistan</option>
							<option value="VU">Vanuatu</option>
							<option value="VE">Venezuela</option>
							<option value="VN">Viet Nam</option>
							<option value="VG">Virgin Islands (British)</option>
							<option value="VI">Virgin Islands (U.S.)</option>
							<option value="WF">Wallis and Futuna Islands</option>
							<option value="EH">Western Sahara</option>
							<option value="YE">Yemen</option>
							<option value="YU">Yugoslavia</option>
							<option value="ZM">Zambia</option>
							<option value="ZW">Zimbabwe</option>
						</select><br>
						
						<i class="info"><strong><?php _e( '' ); ?></strong></i>
					</div>					
				</div>
				<div class="script-panel" id="crypto-select" style="display:none;">
					<label for="crypto-address"><strong><?php _e( 'Please enter a Valid Address of the Cryptocurrency.' ); ?></strong></label>
					<div class="wp-pwd">
						<input type="text" name="crypto-address" id="crypto-address" class="input script-input" value="" size="20" /><br>						
						<i class="info"><strong><?php _e( 'The Address of the Cryptocurrency Your Merchant Accepts.' ); ?></strong></i>
					</div>					
				</div>
				<div class="script-panel" id="crypto-select-two" style="display:none;">
					<label for="crypto-name"><strong><?php _e( 'Please select the name of the Cryptocurrency the Merchant Uses.' ); ?></strong></label>
					<div class="wp-pwd">
						<input type="text" name="crypto-name" id="crypto-name" class="input script-input" value="" size="20" /><br>						
						<i class="info"><strong><?php _e( 'If the Cryptocurrency name is not among this drop down list, then you\'ll need to contact your Merchant to give you a Crypto Address on this List.' ); ?></strong></i>
					</div>					
				</div>
				<div class="script-panel">
					<label for="business-name"><strong><?php _e( 'The Name of the Merchant.' ); ?></strong></label>
					<div class="wp-pwd">
						<input type="text" name="business-name" id="business-name" class="input script-input" value="" size="20" /><br>						
						<i class="info"><strong><?php _e( 'Appropraitely, Scriptbank will Prefer the Merchant\'s Business Name' ); ?></strong></i>
					</div>					
				</div>
				<div class="script-panel">
					<label for="business-email"><strong><?php _e( 'The Email of the Merchant.' ); ?></strong></label>
					<div class="wp-pwd">
						<input type="text" name="business-email" id="business-email" class="input script-input" value="" size="20" /><br>						
						<i class="info"><strong><?php _e( 'Appropraitely, Scriptbank will Prefer the Merchant\'s Business Email. This may be required to send sensitive information to the Merchant during fund transfer.' ); ?></strong></i>
					</div>					
				</div>
				<div class="script-panel">
					<label for="business-phone"><strong><?php _e( 'The Phone Number of the Merchant.' ); ?></strong></label>
					<div class="wp-pwd">
						<input type="text" name="business-phone" id="business-phone" class="input script-input" value="" size="20" /><br>						
						<i class="info"><strong><?php _e( 'Appropraitely, Scriptbank will Prefer the Merchant\'s Business Phone Number. This will act as a substitute to the email, where the merchant is not reachable using email alone.' ); ?></strong></i>
					</div>					
				</div>
				<div class="script-panel">
					<label for="business-street"><strong><?php _e( 'Merchant\'s Street Address' ); ?></strong></label>
					<div class="wp-pwd">
						<input type="text" name="business-street" id="business-street" class="input script-input" value="" size="20" /><br>						
						<i class="info"><strong><?php _e( 'Appropraitely, Scriptbank will Prefer the Merchant\'s Business Address' ); ?></strong></i>
					</div>					
				</div>
				<div class="script-panel">
					<label for="business-region"><strong><?php _e( 'Please Enter Merchant\'s Region' ); ?></strong></label>
					<div class="wp-pwd">
						<input type="text" name="business-region" id="business-region" class="input script-input" value="" size="20" /><br>						
						<i class="info"><strong><?php _e( 'Appropraitely, Scriptbank will Prefer the Merchant\'s Business Region' ); ?></strong></i>
					</div>					
				</div>
				<div class="script-panel">
					<label for="business-country"><strong><?php _e( 'Please Select Merchant\'s Country' ); ?></strong></label>
					<div class="wp-pwd">
						<select class="select wc-product-search" name="business-country" id="business-country">
							<option value="NG" selected>Nigeria</option>
							<option value="--">Not Specified</option>
							<option value="AF">Afghanistan</option>
							<option value="AL">Albania</option>
							<option value="DZ">Algeria</option>
							<option value="AS">American Samoa</option>
							<option value="AD">Andorra</option>
							<option value="AO">Angola</option>
							<option value="AI">Anguilla</option>
							<option value="AQ">Antarctica</option>
							<option value="AG">Antigua and Barbuda</option>
							<option value="AR">Argentina</option>
							<option value="AM">Armenia</option>
							<option value="AW">Aruba</option>
							<option value="AU">Australia</option>
							<option value="AT">Austria</option>
							<option value="AZ">Azerbaijan</option>
							<option value="BS">Bahamas</option>
							<option value="BH">Bahrain</option>
							<option value="BD">Bangladesh</option>
							<option value="BB">Barbados</option>
							<option value="BY">Belarus</option>
							<option value="BE">Belgium</option>
							<option value="BZ">Belize</option>
							<option value="BJ">Benin</option>
							<option value="BM">Bermuda</option>
							<option value="BT">Bhutan</option>
							<option value="BO">Bolivia</option>
							<option value="BA">Bosnia and Herzegowina</option>
							<option value="BW">Botswana</option>
							<option value="BV">Bouvet Island</option>
							<option value="BR">Brazil</option>
							<option value="IO">British Indian Ocean Territory</option>
							<option value="BN">Brunei Darussalam</option>
							<option value="BG">Bulgaria</option>
							<option value="BF">Burkina Faso</option>
							<option value="BI">Burundi</option>
							<option value="KH">Cambodia</option>
							<option value="CM">Cameroon</option>
							<option value="CA">Canada</option>
							<option value="CV">Cape Verde</option>
							<option value="KY">Cayman Islands</option>
							<option value="CF">Central African Republic</option>
							<option value="TD">Chad</option>
							<option value="CL">Chile</option>
							<option value="CN">China</option>
							<option value="CX">Christmas Island</option>
							<option value="CC">Cocos (Keeling) Islands</option>
							<option value="CO">Colombia</option>
							<option value="KM">Comoros</option>
							<option value="CG">Congo</option>
							<option value="CD">Congo, the Democratic Republic of the</option>
							<option value="CK">Cook Islands</option>
							<option value="CR">Costa Rica</option>
							<option value="CI">Cote d'Ivoire</option>
							<option value="HR">Croatia (Hrvatska)</option>
							<option value="CU">Cuba</option>
							<option value="CY">Cyprus</option>
							<option value="CZ">Czech Republic</option>
							<option value="DK">Denmark</option>
							<option value="DJ">Djibouti</option>
							<option value="DM">Dominica</option>
							<option value="DO">Dominican Republic</option>
							<option value="TP">East Timor</option>
							<option value="EC">Ecuador</option>
							<option value="EG">Egypt</option>
							<option value="SV">El Salvador</option>
							<option value="GQ">Equatorial Guinea</option>
							<option value="ER">Eritrea</option>
							<option value="EE">Estonia</option>
							<option value="ET">Ethiopia</option>
							<option value="FK">Falkland Islands (Malvinas)</option>
							<option value="FO">Faroe Islands</option>
							<option value="FJ">Fiji</option>
							<option value="FI">Finland</option>
							<option value="FR">France</option>
							<option value="FX">France, Metropolitan</option>
							<option value="GF">French Guiana</option>
							<option value="PF">French Polynesia</option>
							<option value="TF">French Southern Territories</option>
							<option value="GA">Gabon</option>
							<option value="GM">Gambia</option>
							<option value="GE">Georgia</option>
							<option value="DE">Germany</option>
							<option value="GH">Ghana</option>
							<option value="GI">Gibraltar</option>
							<option value="GR">Greece</option>
							<option value="GL">Greenland</option>
							<option value="GD">Grenada</option>
							<option value="GP">Guadeloupe</option>
							<option value="GU">Guam</option>
							<option value="GT">Guatemala</option>
							<option value="GN">Guinea</option>
							<option value="GW">Guinea-Bissau</option>
							<option value="GY">Guyana</option>
							<option value="HT">Haiti</option>
							<option value="HM">Heard and Mc Donald Islands</option>
							<option value="VA">Holy See (Vatican City State)</option>
							<option value="HN">Honduras</option>
							<option value="HK">Hong Kong</option>
							<option value="HU">Hungary</option>
							<option value="IS">Iceland</option>
							<option value="IN">India</option>
							<option value="ID">Indonesia</option>
							<option value="IR">Iran (Islamic Republic of)</option>
							<option value="IQ">Iraq</option>
							<option value="IE">Ireland</option>
							<option value="IL">Israel</option>
							<option value="IT">Italy</option>
							<option value="JM">Jamaica</option>
							<option value="JP">Japan</option>
							<option value="JO">Jordan</option>
							<option value="KZ">Kazakhstan</option>
							<option value="KE">Kenya</option>
							<option value="KI">Kiribati</option>
							<option value="KP">Korea, Democratic People's Republic of</option>
							<option value="KR">Korea, Republic of</option>
							<option value="KW">Kuwait</option>
							<option value="KG">Kyrgyzstan</option>
							<option value="LA">Lao People's Democratic Republic</option>
							<option value="LV">Latvia</option>
							<option value="LB">Lebanon</option>
							<option value="LS">Lesotho</option>
							<option value="LR">Liberia</option>
							<option value="LY">Libyan Arab Jamahiriya</option>
							<option value="LI">Liechtenstein</option>
							<option value="LT">Lithuania</option>
							<option value="LU">Luxembourg</option>
							<option value="MO">Macau</option>
							<option value="MK">Macedonia, The Former Yugoslav Republic of</option>
							<option value="MG">Madagascar</option>
							<option value="MW">Malawi</option>
							<option value="MY">Malaysia</option>
							<option value="MV">Maldives</option>
							<option value="ML">Mali</option>
							<option value="MT">Malta</option>
							<option value="MH">Marshall Islands</option>
							<option value="MQ">Martinique</option>
							<option value="MR">Mauritania</option>
							<option value="MU">Mauritius</option>
							<option value="YT">Mayotte</option>
							<option value="MX">Mexico</option>
							<option value="FM">Micronesia, Federated States of</option>
							<option value="MD">Moldova, Republic of</option>
							<option value="MC">Monaco</option>
							<option value="MN">Mongolia</option>
							<option value="MS">Montserrat</option>
							<option value="MA">Morocco</option>
							<option value="MZ">Mozambique</option>
							<option value="MM">Myanmar</option>
							<option value="NA">Namibia</option>
							<option value="NR">Nauru</option>
							<option value="NP">Nepal</option>
							<option value="NL">Netherlands</option>
							<option value="AN">Netherlands Antilles</option>
							<option value="NC">New Caledonia</option>
							<option value="NZ">New Zealand</option>
							<option value="NI">Nicaragua</option>
							<option value="NE">Niger</option>
							<option value="NG">Nigeria</option>
							<option value="NU">Niue</option>
							<option value="NF">Norfolk Island</option>
							<option value="MP">Northern Mariana Islands</option>
							<option value="NO">Norway</option>
							<option value="OM">Oman</option>
							<option value="PK">Pakistan</option>
							<option value="PW">Palau</option>
							<option value="PA">Panama</option>
							<option value="PG">Papua New Guinea</option>
							<option value="PY">Paraguay</option>
							<option value="PE">Peru</option>
							<option value="PH">Philippines</option>
							<option value="PN">Pitcairn</option>
							<option value="PL">Poland</option>
							<option value="PT">Portugal</option>
							<option value="PR">Puerto Rico</option>
							<option value="QA">Qatar</option>
							<option value="RE">Reunion</option>
							<option value="RO">Romania</option>
							<option value="RU">Russian Federation</option>
							<option value="RW">Rwanda</option>
							<option value="KN">Saint Kitts and Nevis</option> 
							<option value="LC">Saint LUCIA</option>
							<option value="VC">Saint Vincent and the Grenadines</option>
							<option value="WS">Samoa</option>
							<option value="SM">San Marino</option>
							<option value="ST">Sao Tome and Principe</option> 
							<option value="SA">Saudi Arabia</option>
							<option value="SN">Senegal</option>
							<option value="SC">Seychelles</option>
							<option value="SL">Sierra Leone</option>
							<option value="SG">Singapore</option>
							<option value="SK">Slovakia (Slovak Republic)</option>
							<option value="SI">Slovenia</option>
							<option value="SB">Solomon Islands</option>
							<option value="SO">Somalia</option>
							<option value="ZA">South Africa</option>
							<option value="GS">South Georgia and the South Sandwich Islands</option>
							<option value="ES">Spain</option>
							<option value="LK">Sri Lanka</option>
							<option value="SH">St. Helena</option>
							<option value="PM">St. Pierre and Miquelon</option>
							<option value="SD">Sudan</option>
							<option value="SR">Suriname</option>
							<option value="SJ">Svalbard and Jan Mayen Islands</option>
							<option value="SZ">Swaziland</option>
							<option value="SE">Sweden</option>
							<option value="CH">Switzerland</option>
							<option value="SY">Syrian Arab Republic</option>
							<option value="TW">Taiwan, Province of China</option>
							<option value="TJ">Tajikistan</option>
							<option value="TZ">Tanzania, United Republic of</option>
							<option value="TH">Thailand</option>
							<option value="TG">Togo</option>
							<option value="TK">Tokelau</option>
							<option value="TO">Tonga</option>
							<option value="TT">Trinidad and Tobago</option>
							<option value="TN">Tunisia</option>
							<option value="TR">Turkey</option>
							<option value="TM">Turkmenistan</option>
							<option value="TC">Turks and Caicos Islands</option>
							<option value="TV">Tuvalu</option>
							<option value="UG">Uganda</option>
							<option value="UA">Ukraine</option>
							<option value="AE">United Arab Emirates</option>
							<option value="GB">United Kingdom</option>
							<option value="US">United States</option>
							<option value="UM">United States Minor Outlying Islands</option>
							<option value="UY">Uruguay</option>
							<option value="UZ">Uzbekistan</option>
							<option value="VU">Vanuatu</option>
							<option value="VE">Venezuela</option>
							<option value="VN">Viet Nam</option>
							<option value="VG">Virgin Islands (British)</option>
							<option value="VI">Virgin Islands (U.S.)</option>
							<option value="WF">Wallis and Futuna Islands</option>
							<option value="EH">Western Sahara</option>
							<option value="YE">Yemen</option>
							<option value="YU">Yugoslavia</option>
							<option value="ZM">Zambia</option>
							<option value="ZW">Zimbabwe</option>
						</select><br>						
						<i class="info"><strong><?php _e( 'Appropraitely, Scriptbank will Prefer the Merchant\'s Business Country' ); ?></strong></i>
					</div>					
				</div>
				<div class="script-panel">
					<div class="wp-submit">
						<button name="submit-item" id="submit-item" class="button button-primary" size="20" >Submit</button><button name="cancel-item" id="cancel-item" class="button button-secondary" size="20" >Cancel</button>				
					</div>					
				</div>
			</div>
			<script type="text/javascript">
			//getting the id's of elements in the form.
			
			function checkProducts(){				
				let items = document.getElementById( "item-products" );
				//alert(items.value);
				let prodOpt = document.getElementById( "product-option" );
				let result  = document.getElementById( "result-div" );
				let prodSearch = items.value;
				
				result.style.display = "block";
				
				if( prodSearch.length < 3 ) {
					result.innerHTML = '<p>Please enter up to three characters to initiate the search</p>';
					return;
				}
				
				let durl  = new URL( window.location.href );
				durl.searchParams.set('prodSearch', prodSearch);
				durl.searchParams.set('ajax_nonce', '<?php echo wp_create_nonce('scriptbill-nonce');?>');
				fetch( durl ).then( response =>{
					let text = response.text();
					
					if( text.includes("PRODUCT NOT FOUND") )
						return "NOT FOUND";
					
					return response.json();
				}).then( data =>{
					if( data == 'NOT FOUND' ) {
						result.innerHTML = "Product Not Found";
						return;
					}
					
					result.style.display = "none";
					let options = JSON.parse( data );
					let prodName;
					let option   = document.createElement('option');
					let opt;
					for( prodID in options ) {
						prodName = options[prodID];
						opt   = option.cloneNode();
						opt.innerText = prodName + ' ' + prodID;
						opt.value     = prodID;
						prodOpt.appendChild(opt);
					}
					
					prodOpt.style.display = "block";
				});
			}
			
			let budgetItemForm 	= document.getElementById("budget-item-form");
			let budgetHome 		= document.getElementById("budget-home");
			let addBudget 		= document.getElementById("add-budget-item");
			addBudget.addEventListener("click", function(){
				budgetHome.style.display = "none";
				budgetItemForm.style.display = "block";
			});
			
			let cancelItem 		= document.getElementById("cancel-item");
			let submitItem		= document.getElementById("submit-item");
			let itemList 		= document.getElementById("item-list");
			
			//getting all element in the item form
			let itemName 		= document.getElementById("item-name");
			let itemValue 		= document.getElementById("item-value");
			let itemProducts	= document.getElementById("item-products");
			let itemAccType		= document.getElementById("item-account-type");
			let scriptAddress	= document.getElementById("scriptbill-address");
			let bankName		= document.getElementById("bank-name");
			let bankAccount 	= document.getElementById("account-number");
			let bankCountry		= document.getElementById("bank-country");
			let cryptoName 		= document.getElementById("crypto-name");
			let cryptoAddress	= document.getElementById("crypto-address");
			let clientName		= document.getElementById("business-name");
			let clientEmail		= document.getElementById("business-email");
			let clientPhone		= document.getElementById("business-phone");
			let clientAddress	= document.getElementById("business-street");
			let clientRegion	= document.getElementById("business-region");
			let clientCountry	= document.getElementById("business-country");
			let autoGenerate 	= document.getElementById("generate-budget-item");
			let autoGenerateDiv	= document.getElementById("autogenerate-div");
			//list for displaying the items on this budget to the user.
			let ul 				= document.createElement('ul');
			//neccessary to be appended prehand before actual append.
			itemList.appendChild(ul);
			//this is useful for cloning input elements for hidden input.
			//to transport data from items to the server side
			let input 			= document.createElement('input');
			//register the click handler for the cancel item button
			function clearItem(){
				budgetItemForm.style.display = "none";
				budgetHome.style.display = "block";
				
				//emptying all the value of the elements in the item
				itemName.value = "";
				itemValue.value = "";
				itemProducts.value = "";
				itemAccType.value = "";
				scriptAddress.value = "";
				bankName.value = "";
				bankAccount.value = "";
				bankCountry.value = "";
				cryptoName.value = "";
				cryptoAddress.value = "";
				clientAddress.value = "";
				clientCountry.value = "";
				clientEmail.value = "";
				clientName.value = "";
				clientPhone.value = "";
				clientRegion.value = "";
			}
			cancelItem.addEventListener( "click", clearItem );
			submitItem.addEventListener( "click", function(){
				autoGenerateDiv.style.display = "none";
				delete sessionStorage.autoGenerate;
				let itemObj = {};
				itemObj.itemName 	= itemName.value;
				itemObj.itemID		= Date.now().toString();
				itemObj.itemValue 	= parseFloat( itemValue.value );
				itemObj.itemProduct = itemProducts.value;
				itemObj.accountType = itemAccType.value;
				itemObj.scriptbillAddress = scriptAddress.value;
				itemObj.bankName		= bankName.value;
				itemObj.bankAccount 	= bankAccount.value;
				itemObj.bankCountry		= bankCountry.value;
				itemObj.cryptoName		= cryptoName.value;
				itemObj.cryptoAddress	= cryptoAddress.value;
				itemObj.businessName	= clientName.value;
				itemObj.businessEmail	= clientEmail.value;
				itemObj.businessPhone	= clientPhone.value;
				itemObj.businessAddress	= clientAddress.value;
				itemObj.businessRegion	= clientRegion.value;
				itemObj.businessCountry	= clientCountry.value;
				
				let storedItems 		= localStorage.budgetItems;
				
				if( storedItems ){
					storedItems = JSON.parse( storedItems );
				}
				else {
					storedItems = {};
				}
				
				storedItems[itemObj.itemID] 	= itemObj;
				localStorage.budgetItems 		= JSON.stringify( storedItems );
				
				//clear the items from the form.
				clearItem();				
				
				let li = document.createElement('li');
				li.innerText = itemObj.itemName + ' $B ' + itemObj.itemValue;
				ul.setAttribute("class", "item-listing");
				li.setAttribute( "id", itemObj.itemID );
				li.setAttribute("onclick", "showItemObjects()");
				let span 	= document.createElement("span");
				span.innerText = "delete";
				span.setAttribute("onclick", "deleteItems()");
				span.setAttribute("itemid", itemObj.itemID );
				span.setAttribute("class", "spanny");
				ul.appendChild(span);
				ul.setAttribute( "id", "scriptbill-item-list" );
				let hiddenInput = input.cloneNode().setAttribute("type", "hidden").setAttribute("value", JSON.stringify( itemObj )).setAttribute("itemid", itemObj.itemID);
				
				//to create readable name for the input element we use a generic name.
				let inputName = parseInt( localStorage.getInputName );
				
				if( ! inputName ) {
					hiddenInput.setAttribute("name", "scriptbill_hidden_item_1");
					hiddenInput.setAttribute("id", "scriptbill_hidden_item_1");
					localStorage.getInputName = "1";
				} else {					
					hiddenInput.setAttribute("name", "scriptbill_hidden_item_" + inputName);
					hiddenInput.setAttribute("id", "scriptbill_hidden_item_" + inputName );
					inputName++;
					localStorage.getInputName = inputName;
				}
				ul.appendChild( li );
				//append list to item list				
				itemList.appendChild(hiddenInput);			
			});
			
			function deleteItems(){
				let itemID = this.getAttribute("itemid");
				let li		= this.parentElement;
				
				if( itemID && localStorage.budgetItems ){
					let items = JSON.parse( localStorage.budgetItems );
					
					if( typeof items[ itemID ] != "undefined" ){
						delete items[ itemID ];
					}
					
					localStorage.budgetItems = JSON.stringify( items );
				}
				let hiddenTag = document.querySelector("input[itemid='"+itemID+"']");
				
				if( hiddenTag ){
					hiddenTag.remove();
				}
				
				li.remove();
			}
			
			function showItemObjects(){
				let ID = this.getAttribute("id");
				let itemStorage = JSON.parse( localStorage.budgetItems );
				let item		= itemStorage[ID];
				
				if( ! item || typeof item != "object" ) return;
				
				//from now on, we start ppopulating the value of the form with the item 
				//element value.
				//populating the item name handler.
				itemName.value = item.itemName;
				itemValue.value = item.itemValue;
				itemProduct.value = item.itemProduct;
				
				//to add the acc type as value, we have to query the options with the value we 
				//have to set it as selected.
				let accTypeOpt = itemAccType.querySelector("option[value='"+item.accountType+"']");
				
				if( accTypeOpt && accTypeOpt != null ){
					accTypeOpt.setAttribute("selected", "selected");
				}
				
				//set the Scriptbill Address if set.
				scriptAddress.value = item.scriptbillAddress;
				
				//set the bank account details.
				bankName.value 		= item.bankName;
				bankAccount.value 	= item.bankAccount;
				
				//querying the bankcountry drop down.
				let bankCountryOpt = bankCountry.querySelector("option[value='"+item.bankCountry+"']");
				
				if( bankCountryOpt && bankCountryOpt != null ){
					bankCountryOpt.setAttribute("selected", "selected");
				}
				
				//setting the Cryptocurrency values.
				cryptoAddress.value = item.cryptoAddress;
				cryptoName.value	= item.cryptoName;
				
				//setting the client details.
				clientAddress.value = item.businessAddress;
				clientName.value	= item.businessName;
				clientPhone.value 	= item.businessPhone;
				clientEmail.value 	= item.businessEmail;
				clientRegion.value	= item.businessRegion;
				
				//querying the client country dropdown.
				let clientCountryOpt = clientCountry.querySelector("option[value='"+item.businessCountry+"']");
				
				if( clientCountryOpt && clientCountryOpt != null ){
					clientCountryOpt.setAttribute("selected", "selected");
				}
				
				//next is to hide the home tab to show the items tab.
				budgetHome.style.display = "none";
				budgetItemForm.style.display = "block";
			}
			
			autoGenerate.addEventListener("click", function(){
				autoGenerateDiv.style.display = "block";
				sessionStorage.autoGenerate = "TRUE";
				let ppPercent = document.getElementById("pp-percent-less");
				let ppProduct = document.getElementById("pp-product-equal");
				let ppSetProduct = document.getElementById("pp-set-product");
				let purchasePercent = document.getElementById("purchase-percent");
				
				ppPercent.addEventListener("click", function(){
					purchasePercent.style.display = "block";
				});
				ppSetProduct.addEventListener("click", function(){
					purchasePercent.style.display = "none";
				});
				ppProduct.addEventListener("click", function(){
					purchasePercent.style.display = "block";
					let label = purchasePercent.querySelector("label");
					input     = purchasePercent.querySelector("input");
					let strong = purchasePercent.querySelector("i").querySelector("strong");
					strong.innerText = '<?php _e( 'This will be the Percentage Increase in Product Sales Price. To Make Budget Execute, You May Need To Set Merchant Details On Each Product Edit Screens.' ); ?>';
					label.setAttribute("for", "percentage-purchase-high");
					input.setAttribute("name", "percentage-purchase-high").setAttribute("id", "percentage-purchase-high");
				});	
			});
			
			let percentLess = document.getElementById("sp-percent-less");
			let percentHigh = document.getElementById("sp-percent-high");
			let dividendLess = document.getElementById("sp-dividend-less");
			let dividendHigh = document.getElementById("sp-dividend-high");
			let percentEqual = document.getElementById("sp-percent-equal");
			let dividendEqual = document.getElementById("sp-dividend-equal");
			let sleepDiv	 = document.getElementById("sleeping-percent");
			
			percentLess.addEventListener("click", function(){
				sleepDiv.style.display = "block";
			});
			percentHigh.addEventListener("click", function(){
				sleepDiv.style.display = "block";
			});
			dividendLess.addEventListener("click", function(){
				sleepDiv.style.display = "block";
			});
			dividendHigh.addEventListener("click", function(){
				sleepDiv.style.display = "block";
			});
			percentEqual.addEventListener("click", function(){
				sleepDiv.style.display = "none";
			});
			dividendEqual.addEventListener("click", function(){
				sleepDiv.style.display = "none";
			});
			let wpPercentLess = document.getElementById("wp-percentage-less");
			let wpPercentHigh = document.getElementById("wp-percentage-high");
			let wpDividendLess = document.getElementById("wp-dividend-less");
			let wpDividendHigh = document.getElementById("wp-dividend-high");
			let wpPercentEqual = document.getElementById("wp-percentage-equal");
			let wpDividendEqual = document.getElementById("wp-dividend-equal");
			let partnerDiv	 = document.getElementById("working-percent");
			
			wpPercentLess.addEventListener("click", function(){
				partnerDiv.style.display = "block";
			});
			wpPercentHigh.addEventListener("click", function(){
				partnerDiv.style.display = "block";
			});
			wpDividendLess.addEventListener("click", function(){
				partnerDiv.style.display = "block";
			});
			wpDividendHigh.addEventListener("click", function(){
				partnerDiv.style.display = "block";
			});
			wpPercentEqual.addEventListener("click", function(){
				partnerDiv.style.display = "none";
			});
			wpDividendEqual.addEventListener("click", function(){
				partnerDiv.style.display = "none";
			});
			
			let noteBinary = document.getElementById("budgetNoteBinary");
			let saveBinary = document.getElementById("saveNoteBinary");
			
			noteBinary.addEventListener("change", function(){
				const reader = new FileReader();
				files 		= this.files;
				reader.readAsText( files[0] );
				reader.addEventListener('load', function(){
					let result = reader.result;
					saveBinary.setAttribute( "value", result );
				});
	
			});
			
			</script>
			<style>
			.w3-card,.w3-card-2{
				box-shadow:0 2px 5px 0 rgba(0,0,0,0.16),0 2px 10px 0 rgba(0,0,0,0.12);
				padding: 5px;
				margin: 2px 5px 2px 5px;
				}
			.w3-container,.script-panel{padding:0.01em 16px}.script-panel{margin-top:16px;margin-bottom:16px}
			</style>
			<?php
			if( isset( $_POST['submit'] ) ) {
				$budgetPrefs = get_site_option("scriptbill_site_budget");
				
				if( ! $budgetPrefs )
					$budgetPrefs = array();
				
				echo "the contract value " . esc_attr( $_POST['budgetValue'] );
				
				$budgetPrefs['name'] = esc_attr( $_POST['budgetName'] );
				$budgetPrefs['value'] = esc_attr( $_POST['budgetValue'] );
				$budgetPrefs['sleepingPartner'] = esc_attr( $_POST['sleeping-partner'] );
				$budgetPrefs['sleepingPartnerShare'] = esc_attr( $_POST['percentage-sleep'] );
				$budgetPrefs['workingPartner'] = esc_attr( $_POST['working-partner'] );
				$budgetPrefs['workingPartnerShare'] = esc_attr( $_POST['percentage-work'] );
				
				if( ! $budgetPrefs['budgetItems'] )
					$budgetPrefs['budgetItems'] = array();
				
				for( $x = 1; $x < round( PHP_FLOAT_MAX ); $x++ ){
					if( ! isset( $_POST['scriptbill_hidden_item_' . $x] ) )
						break;
					
					$budgetItem = json_decode( esc_attr( $_POST['scriptbill_hidden_item_' . $x] ) );
					
					if( $budgetItem ) {
						$budgetPrefs['budgetItems'][ $budgetItem->itemID ] = $budgetItem;
					}
				}
				
				$budgetPrefs['budgetNote'] 		= esc_attr( $_POST['budgetNote'] );
				$budgetPrefs['budgetNoteBinary'] = esc_attr( $_POST['saveNoteBinary']);
				$budgetPrefs['defineProfit']	 = esc_attr( $_POST['purchase-price'] );
				$budgetPrefs['salesPercent']	 = esc_attr( $_POST['percentage-purchase'] );
				$budgetPrefs['budgetCreator']	=	wp_get_current_user();
				
				update_site_option( "scriptbill_site_budget", $budgetPrefs );
				
				?>
				<script type="text/javascript">
					let budgets =  JSON.parse( '<?php echo json_encode( $budgetPrefs );?>' );
					
					alert( "name: " + budgets.name + " value: " + budgets.value );
					budgets.budgetCredit = "SBCRD";
					
					if( budgets ){
						Scriptbill.budgetConfig.name = budgets.name;
						Scriptbill.budgetConfig.value = budgets.value;
						alert( Scriptbill.budgetConfig.name && Scriptbill.budgetConfig.value );
						
						if( Scriptbill.budgetConfig.name && Scriptbill.budgetConfig.value ){
							Scriptbill.createScriptbillBudget();
							alert("budget Created!!!");
						}
					}
				</script>
				
				<?php
			}
			
		}
		
		public function add_woocommerce_fields(){
			global $woocommerce, $post;
			$budgetPrefs = get_site_option('scriptbill_site_budget');
			$dir 		= plugin_dir_path(__FILE__);
			$scripts 	= file_get_contents( $dir . 'js/prod-budget.js' );
			echo '<div class=" product_custom_field ">';	
				
			$budgetItems = $budgetPrefs['budgetItems'];
				
				
				
			//custom radio
			woocommerce_wp_radio(
				array(
					'id'	=> '_manufacturer_or_restocker',
					'label'	=> '',
					'value'	=> 'Restocker',
					'options'	=> array(
						'manufacturer'	=> 'Manufacturer',
						'restocker'		=> 'Restocker'
					),
					'description'	=> 'Are you the Manufacturer of this Product or a Restocker. If Manufacturer, Your Purchase Value will be the Total Value of Items on this Product. Restocker! Then Simply Enter Your Purchase Value and Set Your Merchant\'s Address . This will help us structure your budget and help investors calculate their expected profits.',
					'desc_tip'		=> true
				)
			);				
								
			woocommerce_wp_text_input(
				array(
					'id'          => '_item_product_value',
					'label'       => __( 'Purchase Value', 'woocommerce' ),
					'type'		 => 'number',
					'placeholder' => 'Purchase Value Of This Product',
					'desc_tip'    => true,
					'description' => 'required by investors to calculate profit made per transaction on this product.',
					
				)
			);
				
			woocommerce_wp_text_input(
				array(
					'id'          => '_merchants_note_address',
					'label'       => __( 'The Note Address of Merchant', 'woocommerce' ),
					'placeholder' => 'Merchant\'s Note',
					'desc_tip'    => true,
					'description' => 'This should be a Scriptbill Note Address or Product ID of the Merchant Who Sells This Product. If the Merchant Do Not Have A Note Address, Leave Empty to Automatically Generate One For The Merchant Right Away. From this Note, The Merchant Would be Receive Funds in Any Currency Through The Decentralized Exchange System in Scriptbills.',
					'style'		  => 'display:none;'
						
				)
			);
			woocommerce_wp_text_input(
				array(
					'id'          => '_merchants_email_address',
					'label'       => __( 'The Email Address of Merchant', 'woocommerce' ),
					'type'			=> 'email',
					'placeholder' => 'Merchant\'s Email',
					'desc_tip'    => true,
					'description' => 'Scriptbank may need this to communicate alerts to this transaction with the Merchant.',
					'style'		  => 'display:none;'
						
				)
			);
					
			woocommerce_wp_text_input(
			  array(
				'id'          => 'save_item_button',
				'label'       => '',
				'class'			=> 'button',
				'type'			=> 'button',
				'desc_tip'    	=> false,
				'value' 		=> 'Save Item',
				'style'			=> 'display:none;'		
				)
			);
			echo '</div>';
			if( $scripts ){
				echo '<script type="text/javascript">' . $scripts . '</script>';
			}
		}
		
		public function add_wallet_id_to_username( $username ){
			
			if( isset( $_POST['user_wallet'] ) ){
				$wallet = esc_attr( $_POST['user_wallet'] );
				return $walletID;
			}
			
			return $username;
			
		}
		/*
			This function is neccessary if the user wants to upload a note to the server that is not hosted on the user's machine
			and belongs to the users current server.
		*/
		
		public function upload_user_note(){?>
			<div class="script-panel">
				<label for="user_pass"><strong><?php _e( 'Upload a Valid Scriptbill Note to Login' ); ?></strong></label>
				<div class="wp-pwd">
					<input type="file" name="userScriptbillNote" id="scriptbillNote" class="input upload-btn" value="" size="20" accept=".script"  />			
				</div>
			</div>
			<?php
			
		}
		
		public function check_user_login_credentials(){
			
		}
		
		public function configure_scriptbill_credit(){
			$credit_core = get_site_option('mycred_pref_core');
			
			if( ! is_array( $credit_core ) )
				$credit_core = array();
			
			if( $credit_core['cred_id'] != 'sbcrd' ){
				$credit_core['cred_id'] = 'sbcrd';
				//format the credit on mycred to obey scriptbills format.
				if( ! is_array( $credit_core['format'] ) ) {
					$credit_core['format'] = array();
				}
				
				if( ! is_array( $credit_core['name'] ) ) {
					 $credit_core['name'] = array();
				}
				
				if( ! is_array( $credit_core['caching'] ) ) {
					$credit_core['caching'] = array();
				}
				
				$credit_core['format']['decimals'] = 12;
				$credit_core['name']['singular'] = 'Scriptbill';
				$credit_core['name']['plural'] = 'Scriptbills';
				$credit_core['caching']['history']			= 'on';
				$credit_core['caching']['leaderboards']		= 'on';
				$credit_core['before']						= "$b";
				$credit_core['after']						= "A";
				
				if( ! is_array( $credit_core['export'] ) ) {
					$credit_core['export'] = array();
				}
				
				//control the exporting of data from front end.
				$credit_core['export']['front']				= 1;
				$credit_core['export']['admin']				= 1;
				
				if( ! is_array( $credit_core['br_social_share'] ) ) {
					$credit_core['br_social_share'] = array();
				}

				//enabling social share if available.
				$credit_core['br_social_share']['enable_open_badge_ss']	= 1;
				$credit_core['br_social_share']['enable_fb']			= 1;
				$credit_core['br_social_share']['enable_twitter']		= 1;
				
				if( ! is_array( $credit_core['rank'] ) ) {
					$credit_core['rank'] = array();
					$credit_core['rank']['support'] = array();
				}
				
				//setting the ranks
				$credit_core['rank']['support']['comments'] = true;
				$credit_core['rank']['base'] 				= 'current';
				$credit_core['rank']['public']				= true;
				$credit_core['rank']['slug']				= "scriptbill_ranks";
				$credit_core['rank']['bb_location']			= "both";
				$credit_core['rank']['bb_template']			= "Your Scriptbill Rank is: %rank_logo% %rank_title%";
				$credit_core['rank']['bp_location']			= "both";
				$credit_core['rank']['bp_template']			= "Your Scriptbill Rank is: %rank_logo% %rank_title%";
				
				if( ! is_array( $credit_core['transfers'] ) ) {
					$credit_core['transfers'] = array();
					$credit_core['transfers']['types'] = array();
				}
				
				//scriptbill must be set on the transfer module.
				$transfer_types = $credit_core['transfers']['types'];
				
				if( ! in_array( 'scriptbill', $transfer_types ) ){
					array_push( $transfer_types, "scriptbill" );
				}
				$credit_core['transfers']['types'] 			=  $transfer_types;
				
				//check the autofill it must be set to the user_login which is supposed to be the walletID of the user.
				if( $credit_core['transfers']['autofill'] != 'user_login' )
					$credit_core['transfers']['autofill'] = 'user_login';
				
				
				
				//adding the point type thumbnails
				$image_name 		= "ScriptbillImage.jpg";
				$sanitized_name 	= strtolower(str_replace(" ","-",$image_name));
				$image_url 			= "https://pbs.twimg.com/profile_images/957958126065471489/w2zeiKR-_400x400.jpg";
				$upload_dir 		= wp_upload_dir();
				$upload_file  		= $upload_dir['path'] . '/' . $image_name;
				$image_content 		= file_get_contents( $image_url );
				$put_content 		= file_put_contents( $upload_file, $image_content );
				
				if( $put_content ) {
					$image_url = $upload_dir['url'] . '/' . $image_name;
					$post_data = array(
						'post_author'   	=> '1',
						'post_name'     	=> $sanitized_name,
						'post_title'    	=> $image_name,
						'post_content'  	=> '',
						'post_excerpt'  	=> '',
						'post_status'   	=> 'publish',
						'ping_status'   	=> 'closed',
						'post_type'     	=> 'attachment',
						'post_mime_type'    => 'image/jpeg',
						'guid'          	=>  $image_url ,
					);

					$image_Id = wp_insert_post( $post_data );
					$credit_core['attachment_id'] = $image_Id;
				}
				
				
				//configuring Scriptbill stats
				$stats = $credit_core['stats'];
				
				if( $stats['color_positive'] != '#0ad19c' )
					$stats['color_positive'] = '#0ad19c';
				
				if( $stats['color_negative'] != '#be2bce' )
					$stats['color_negative'] = '#be2bce';
				
				$credit_core['stats'] = $stats;
				
				update_site_option( 'mycred_pref_core', $credit_core );
			}
			//setting the bank option.
			$bank 	= get_site_option("mycred_pref_bank");
			$bank_id = $this->get_site_business_manager_id();
			
			if( ! is_array( $bank ) ) {
				$bank = array();
			}
			
			if( ! is_array( $bank['active'] ) ){
				$bank['active'] = array();
			}
			
			if(  ! in_array( "central", $bank['active'] ) || ! in_array( "schedule_deposit", $bank['active'] ) ) {
				array_push( $bank['active'], "central" );
				array_push( $bank['active'], "schedule_deposit" );
			}
			
			if( ! is_array( $bank['service_prefs'] ) ) {
				 $bank['service_prefs'] = array();
			}
			
			if( ! is_array( $bank['service_prefs']['central'] ) ) {
				$bank['service_prefs']['central'] = array();
			}
			
			if( ! isset( $bank['service_prefs']['central']['bank_id'] ) || $bank['service_prefs']['central']['bank_id'] != $bank_id ) {
				
				//set the service prefs to support the business manager's account
				$bank['service_prefs']['central']['bank_id'] = $bank_id;
				$bank['service_prefs']['central']['ignore_manual'] = 1;				
			}
			
			$businessMID = $this->get_site_business_manager_id();
			$businessMBal = mycred_get_users_balance( $businessMID );
			
			if( ! is_array( $bank['service_prefs']['schedule_deposit'] ) ) {
				$bank['service_prefs']['schedule_deposit'] = array();
			}
			
			//scheduling the deposit of Scriptbills to the user account.
			if( ! strtotime( $bank['service_prefs']['schedule_deposit']['start_from'] ) ) {
				$bank['service_prefs']['schedule_deposit']['start_from'] = date( 'y-m-d', strtotime("+ 2 days") );
				$bank['service_prefs']['schedule_deposit']['schedule']	  = '7';
				$bank['service_prefs']['schedule_deposit']['points']	   = '500';
				$bank['service_prefs']['schedule_deposit']['recurring']		= 'on';
				update_site_option( "mycred_pref_bank", $bank );
			}
			
			elseif( $businessMBal < 500 ) {			
				$toStart = strtotime( $bank['service_prefs']['schedule_deposit']['start_from'] );
				if( $toStart > time() ){
					$bank['service_prefs']['schedule_deposit']['start_from'] = date( 'y-m-d', time() );
					$bank['service_prefs']['schedule_deposit']['points']	   = '100';
					$bank['service_prefs']['schedule_deposit']['schedule']	  = '1';
					$bank['service_prefs']['schedule_deposit']['recurring']		= 'on';
					update_site_option( "mycred_pref_bank", $bank );
				}
			}
			
			elseif( $businessMBal > 5000 ) {
				$toStart = strtotime( $bank['service_prefs']['schedule_deposit']['start_from'] );
				
				//if the scheduled deposit is already running, we postpone it till the balance drops again to 500
				if( $toStart < time() ) {
					$bank['service_prefs']['schedule_deposit']['start_from'] = date( 'y-m-d', strtotime("+ 7 days") );
					$bank['service_prefs']['schedule_deposit']['schedule']	  = '7';
					$bank['service_prefs']['schedule_deposit']['points']	   = '500';
					$bank['service_prefs']['schedule_deposit']['recurring']		= 'on';
					update_site_option( "mycred_pref_bank", $bank );
				}
			}

			$cashcred = get_site_option("mycred_pref_cashcreds");
			
			if( ! is_array( $cashcred ) ){
				$cashcred = array();				
			}
			
			if( ! is_array( $cashcred['active'] ) )
				$cashcred['active'] = array();
			
			if( ! is_array( $cashcred['gateway_prefs'] ) )
				$cashcred['gateway_prefs'] = array();
			
			if( ! in_array( "paypal", $cashcred['active'] ) || ! in_array( "bank", $cashcred['active'] ) ) {
				array_push( $cashcred['active'], "paypal" );
				array_push( $cashcred['active'], "bank" );
				
				$bank_prefs = $cashcred['gateway_prefs']['bank'];
				$bank_prefs['minimum_amount']	= '10';
				$bank_prefs['currency']			= 'USD';
					
				if( ! is_array( $bank_prefs['exchange'] ) )
					$bank_prefs['exchange'] = array();
					
				$bank_prefs['exchange']['scriptbill']	= '1';
				$cashcred['gateway_prefs']['bank'] = $bank_prefs;
			}
				
			$paypal_prefs = $cashcred['gateway_prefs']['paypal'];
			$paypal_prefs['sandbox']	= 'sandbox';
			$paypal_prefs['currency']	= 'USD';//
			$paypal_prefs['cashcred_deve_log'] = 'on';
			$paypal_prefs['minimum_amount']	= '10';
			$paypal_prefs['maximum_amount'] = '';//paypal_client_id
			
			if( $paypal_prefs['paypal_client_id'] != 'ATFB87dgn92e66AHIsM-A_NsIg1m9xYEe4CJt3wfvdUdh14zxWAc82T88eHJfDT0Goz_ticEMZ_iQzPo' )
				$paypal_prefs['paypal_client_id'] = 'ATFB87dgn92e66AHIsM-A_NsIg1m9xYEe4CJt3wfvdUdh14zxWAc82T88eHJfDT0Goz_ticEMZ_iQzPo';
			
			if( $paypal_prefs['paypal_secret_key'] != 'EAx8C2KmyLT6qkOrGAVg2wmarUjIFf8TrGYvpR0UP-oUVtxOwqx0qlKw0mMgb7wdvBMbFAPKSfIl-hH2' )
				$paypal_prefs['paypal_secret_key'] = 'EAx8C2KmyLT6qkOrGAVg2wmarUjIFf8TrGYvpR0UP-oUVtxOwqx0qlKw0mMgb7wdvBMbFAPKSfIl-hH2';
			
			$paypal_prefs['allow_auto_withdrawal'] = 'yes';
				
			if( ! $paypal_prefs['exchange'] )
				$paypal_prefs['exchange'] = array();
				
			$paypal_prefs['exchange']['scriptbill']	= '1';
			$cashcred['gateway_prefs']['paypal'] = $paypal_prefs;
			$cashcred['installed']				= 'paypal';
			$hash 						= password_hash( serialize( $cashcred ), PASSWORD_DEFAULT );
			
			//we use hashes to check if we are storing the same data
			if( get_site_option( 'scriptbill_pref_cashcreds' ) != $hash ) {
				update_site_option( 'mycred_pref_cashcreds', $cashcred );
				update_site_option( 'scriptbill_pref_cashcreds', $hash );
			}
			
			//this will help the business manager sell Scriptbills mined from this site.
			$buycreds 			= get_site_option('mycred_pref_buycreds');
			
			if( ! is_array( $buycreds ) ){
				$buycreds = array();
			}
			
			if( ! is_array( $buycreds['active'] ) ) {
				$buycreds['active'] = array();
			}
			
			if( ! is_array( $buycreds['gateway_prefs'] ) )
				$buycreds['gateway_prefs'] = array();
			
			if( ! $buycreds['active'] || ! in_array( "paypal-standard", $buycreds['active'] ) || ! in_array( "bank", $buycreds['active'] ) ) {
				array_push( $buycreds['active'], "paypal-standard" );
				array_push( $buycreds['active'], "bank" );				
			}
			
			$paypal_prefs = $buycreds['gateway_prefs']['paypal-standard'];
			$paypal_prefs['sandbox']	= 0;
			$paypal_prefs['currency']	= 'USD';
			
			if( $paypal_prefs['account'] != 'emissariespresidentdon@gmail.com' )
				$paypal_prefs['account']   	= 'emissariespresidentdon@gmail.com';
			
			$paypal_prefs['item_name']	= 'Purchase of Scriptbills Credit';
			$paypal_prefs['logo_url']	= '';
				
			if( ! is_array( $paypal_prefs['exchange'] ) )
				$paypal_prefs['exchange'] = array();
				
			$paypal_prefs['exchange']['scriptbill'] = '1';
				
			$buycreds['gateway_prefs']['paypal-standard'] = $paypal_prefs;
			//affiliate link for CEX.io Bitcoin Exchange https://cex.io/r/0/up156154689/0/
			//affilieta link for coingate exchange https://buy.coingate.com/ref/scriptbill?destination=buy
			$bank_prefs = $buycreds['gateway_prefs']['bank'];
			$bank_prefs['title']		= 'Purchase Scriptbills Using Bank Account Or Crypto Transfer';
			
			if( ! strpos( $bank_prefs['account'], 'Scriptbill Exchange' ) )
				$bank_prefs['account']   	= '<div><p id="exchange-message">Scriptbill Exchange</p><p id="button-wrap"></p></div>';
			
			$bank_prefs['logo_url']		= '';
			$bank_prefs['currency']		= 'USD';
				
			if( ! $bank_prefs['exchange'] )
				$bank_prefs['exchange'] = array();
				
			$bank_prefs['exchange']['scriptbill'] = '1';
			$buycreds['gateway_prefs']['bank'] = $bank_prefs;			
			$serialize = password_hash( serialize( $buycreds ), PASSWORD_DEFAULT );
			
			if( get_site_option('scriptbill_pref_buycreds') != $serialize ){
				update_site_option( 'mycred_pref_buycreds', $buycreds );
				update_site_option( 'scriptbill_pref_buycreds', $serialize );
			}				
			
		}
		
		public function check_product_meta(){
			echo "MEEETA";
		}
		
		public function add_scriptbill_ranks(){
			
			//rank types include Business Ranks, Business Manager Ranks, Military Ranks, Political Ranks, Fellowship Ranks, Investor Ranks
			
			$scriptbill_ranks = array(
				"Level 1" 	=> array( "CMBF Beginner"/*Fellowship Rank*/, "CMBF Recruit"/*Military Rank*/, "CMBF Apprentice"/*Business Rank*/, "CMBF Trainee"/*Business Manager Rank*/, "CMBF Council Member"/*Political Rank*/, "CMBF Asset Seeker"/*Investment Rank*/),
				"Level 2" 	=> array("CMBF Member", "CMBF Recruit Two", "CMBF Apprentice Two", "CMBF Executive Trainee", "CMBF Council Member Two", "CMBF Asset Taker"),				
				"Level 3"	=> array( "CMBF Trainee Worker", "CMBF Private", "CMBF Establisher", "CMBF Officer", "CMBF Councilor", "CMBF Asset Bringer" ),
				"Level 4"	=> array( "CMBF Worker", "CMBF Private Two", "CMBF Proprietor", "CMBF Assistant Business Officer", "CMBF Senior Councilor", "CMBF Asset Owner"),
				"Level 5"	=> array( "CMBF Senior Worker", "CMBF Private Second Class", "CMBF Senior Proprietor", "CMBF Assistant Senior Business Officer", "CMBF Local Councilor", "CMBF Asset Raiser" ),
				"Level 5" => array( "CMBF Assistant Deacon", "CMBF Private First Class", "CMBF Executive Proprietor", "CMBF Business Officer", "CMBF Area Councilor", "CMBF Asset Multiplier" ),
				"Level 6"	=> array( "CMBF Deacon", "CMBF Lance Corporal", "CMBF Senior Proprietor", "CMBF Deputy Business Officer",  "CMBF Inspecting Councilor", "CMBF Asset Grader"),
				"Level 7"	=> array("CMBF Senior Deacon", "CMBF Corporal", "CMBF Senior Executive Proprietor", "CMBF Senior Deputy Business Officer", "CMBF Deputy Local Chairman", "CMBF Asset Manager Gold"),
				"Level 8"	=> array("CMBF High Deacon", "CMBF High Corporal", "CMBF Sleeping Business Partner", "CMBF Business Officer", "CMBF Local Chairman Adviser", "CMBF Asset Manager Platinum"),
				"Level 9"	=> array("CMBF Assistant Priest", "CMBF Sergent", "CMBF Assisting Business Partner", "CMBF Deputy Senior Business Officer", "CMBF Local Chairman Cabin Member", "CMBF Asset Manager Diamond"),
				"Level 10"	=> array("CMBF Priest", "CMBF Senior Sergent", "CMBF Acting Business Partner", "CMBF Senior Business Officer", "CMBF Local Chairman", "CMBF Asset Manager Star"),
				"Level 11"	=> array("CMBF High Priest", "CMBF Staff Sergent", "CMBF Business Partner", "CMBF Assistant Business Manager", "CMBF Local Inspector", "CMBF Asset Manager Galaxy"),
				"Level 12"	=> array("CMBF Senior High Priest", "CMBF Warrant Officer", "CMBF Senior Business Partner", "CMBF Acting Business Manager", "CMBF Honourable", "CMBF High Asset Manager Gold"),
				"Level 13"	=> array("CMBF Chief Priest", "CMBF Senior Warrant Officer", "CMBF Business Gold Partner", "CMBF Business Manager", "CMBF Golden Honourable", "CMBF High Asset Manager Platinum"),
				"Level 14"	=> array("CMBF High Chief Priest", "CMBF Deputy Chief Warrant Officer", "CMBF Business Platinum Partner", "CMBF Assistant Local Business Manager", "CMBF Platinum Honourable", "CMBF High Asset Manager Diamond"),
				"Level 15"	=> array("CMBF Assistant Bishop", "CMBF Chief Warrant Officer 1", "CMBF Business Star Partner", "CMBF Local Business Manager", "CMBF Star Honourable", "CMBF High Asset Manager Star"),				
				"Level 16"	=> array("CMBF Area Bishop", "CMBF Chief Warrant Officer 2", "CMBF Business Product Inventor", "CMBF Assistant Area Business Manager", "CMBF House Clerk", "CMBF Senior Asset Manager"),
				"Level 16"	=> array("CMBF Assistant State Bishop", "CMBF Chief Warrant Officer 3", "CMBF Business Golden Product Inventor", "CMBF Area Business Manager", "CMBF Deputy Chief Whip", "CMBF Senior Asset Manager Gold"),//Deputy Lieutenant
				"Level 17"	=> array("CMBF State Bishop", "CMBF Chief Warrant Officer 4", "CMBF Business Platinum Product Inventor", "CMBF Assistant State Business Manager", "CMBF Chief Whip", "CMBF Senior Asset Manager Platinum"),//
				"Level 18"	=> array("CMBF Assistant Regional Bishop", "CMBF Chief Warrant Officer 5", "CMBF Business Diamond Product Inventor", "CMBF State Business Manager", "CMBF Deputy Majority Leader", "CMBF Senior Asset Manager Star"),//
				"Level 19"	=> array("CMBF Regional Bishop", "CMBF Deputy Lieutenant", "CMBF Business Star Product Inventor", "CMBF Assistant Regional Business Manager", "CMBF Majority Leader", "CMBF Asset Director"),//Regional Lieutenant
				"Level 19"	=> array("CMBF Assistant National Bishop", "CMBF Second Lieutenant", "CMBF Business Product Manager", "CMBF Regional Business Manager", "CMBF Deputy Speaker", "CMBF Asset Director Gold"),//
				"Level 20"	=> array("CMBF National Bishop", "CMBF Lieutenant", "CMBF Business Gold Product Manager", "CMBF Assistant National Business Manager", "CMBF House Speaker", "CMBF Asset Director Platinum"),
				"Level 21"	=> array("CMBF ArchBishop", "CMBF State Lieutenant", "CMBF Business Platinum Product Manager", "CMBF National Business Manager", "CMBF Deputy State Governor", "CMBF Asset Director Diamond"),//Captain
				"Level 22"	=> array("CMBF Senior ArchBishop", "CMBF National Lieutenant", "CMBF Business Star Product Manager", "CMBF Assistant Continental Business Manager", "CMBF State Governor", "CMBF Asset Director Star"),//Senior Captain
				"Level 23"	=> array("CMBF Continental ArchBishop", "CMBF Captain", "CMBF Business Product Director", "CMBF Continental Business Manager", "CMBF State Inspector", "CMBF Asset Commander"),
				"Level 24"	=> array("CMBF Senior Continental ArchBishop", "CMBF Senior Captain", "CMBF Business Gold Product Director", "CMBF Assistant General Business Manager", "CMBF Deputy Minister of State", "CMBF Asset Commander"),
				"Level 25"	=> array("CMBF Chief ArchBishop", "CMBF Chief Captain", "CMBF Business Platinum Product Director", "CMBF Assistant General Business Manager", "CMBF Minister of State", "CMBF Asset Commander Gold"),
				"Level 26"	=> array("CMBF Senior ArchBishop", "CMBF Captain Major", "CMBF Business Diamond Product Director", "CMBF Deputy General Business Manager", "CMBF Assistant Regional Minister", "CMBF Asset Commander Platinum"),
				"Level 27"	=> array("CMBF Assistant National Cardinal", "CMBF Major", "CMBF Business Star Product Director", "CMBF General Business Manager", "CMBF Regional Minister", "CMBF Asset Commander Star"),
				"Level 28"	=> array("CMBF National Cardinal", "CMBF Chief Major", "CMBF Business Product Chairman", "CMBF Assistant State Business Director", "CMBF Assistant National Minister", "CMBF Asset Analyst"),
				"Level 28"	=> array("CMBF Assistant Continental Cardinal", "CMBF Lieutenant Colonel", "CMBF Business Gold Product Chairman", "CMBF State Business Director", "CMBF National Minister", "CMBF Gold Asset Analyst"),
				"Level 29"	=> array("CMBF Continental Cardinal", "CMBF Colonel", "CMBF Business Platinum Product Chairman", "CMBF Assistant Regional Business Director", "CMBF National House Member", "CMBF Platinum Asset Analyst"),
				"Level 30"	=> array("CMBF Pope Carbinet Member", "CMBF Colonel Major", "CMBF Business Diamond Product Chairman", "CMBF Regional Business Director", "CMBF National House Leader", "CMBF Diamond Asset Analyst"),
				"Level 31"	=> array("CMBF Pope Carbinet Leader", "CMBF Brigadier General", "CMBF Business Star Product Chairman", "CMBF Assistant National Business Director", "CMBF National House Minority Whip", "CMBF Star Asset Analyst"),
				"Level 32"	=> array("CMBF Pope Carbinet Minority Whip Leader", "CMBF Brigadier General Star 2", "CMBF Business Vice Executive State Product Chairman", "CMBF Deputy National Business Director", "CMBF National House Majority Whip", "CMBF Asset Trader"),
				"Level 33"	=> array("CMBF Pope Carbinet Majority Whip Leader", "CMBF Brigadier General Star 3", "CMBF Business Executive State Product Chairman", "CMBF National Business Director", "CMBF Assistant National House Overseer", "CMBF Gold Asset Trader"),
				"Level 34"	=> array("CMBF Pope Assistant Carbinet Overseer", "CMBF Brigadier General Star 4", "CMBF Business Vice Executive Regional Product Chairman", "CMBF Vice Continental Business Director", "CMBF National House Overseer", "CMBF Platinum Asset Trader"),
				"Level 35"	=> array("CMBF Pope Carbinet Overseer", "CMBF Brigadier General Star 5", "CMBF Business Executive Regional Product Chairman", "CMBF Continental Business Director", "CMBF National House Assistant Counsellor", "CMBF Diamond Asset Trader"),
				"Level 36"	=> array("CMBF Pope Carbinet Assistant Counsellor", "CMBF Major General", "CMBF Business Vice Executive National Product Chairman", "CMBF Vice Principal Business Director", "CMBF National House Counsellor", "CMBF Star Asset Trader"),
				"Level 37"	=> array("CMBF Pope Carbinet Counsellor", "CMBF Major General Star 2", "CMBF Business Executive National Product Chairman", "CMBF Principal Business Director", "CMBF National Minority House Leader", "CMBF Asset Market Leader"),
				"Level 38"	=> array("CMBF Pope Carbinet Minority Leader", "CMBF Major General Star 3", "CMBF Business Vice Executive Continental Product Chairman", "CMBF Principal Gold Business Director", "CMBF National Majority House Leader", "CMBF Gold Asset Market Leader"),
				"Level 39"	=> array("CMBF Pope Carbinet Majority Leader", "CMBF Major General Star 4", "CMBF Business Executive Continental Product Chairman", "CMBF Principal Platinum Business Director", "CMBF National Council House Chair", "CMBF Platinum Asset Market Leader"),
				"Level 40"	=> array("CMBF Pope Carbinet Council Chair", "CMBF Major General Star 5", "CMBF Business Principal", "CMBF Principal Diamond Business Director", "CMBF National House Secretary", "CMBF Star Asset Market Leader"),
				"Level 41"	=> array("CMBF Pope Carbinet Council Secretary", "CMBF Lieutenant General", "CMBF Business Don", "CMBF Principal Star Business Director", "CMBF National House Vice President", "CMBF Asset Holder"),
				"Level 42"	=> array("CMBF Pope Carbinet Vice Chairman", "CMBF Lieutenant General Star 1", "CMBF Business Don King", "CMBF Business Vice Chairman", "CMBF National House President", "CMBF Gold Asset Holder"),
				"Level 43"	=> array("CMBF Pope Carbinet Chairman", "CMBF Lieutenant General Star 2", "CMBF Business Don King 5", "CMBF Business Vice Chairman Advicer", "CMBF National Adviser", "CMBF Platinum Asset Holder"),
				"Level 44"	=> array("CMBF Pope Adviser", "CMBF Lieutenant General Star 3", "CMBF Business Don King 4", "CMBF Special Business Vice Chairman Advicer", "CMBF Special National Adviser", "CMBF Diamond Asset Holder"),
				"Level 45"	=> array("CMBF Pope Special Adviser", "CMBF Lieutenant General Star 4", "CMBF Business Don King 3", "CMBF Business Vice Chairman", "CMBF National Chief of Staff", "CMBF Star Asset Holder"),
				"Level 46"	=> array("CMBF Pope Special Adviser", "CMBF Lieutenant General Star 5", "CMBF Business Don King 2", "CMBF Business Chairman Adviser", "CMBF National Senate Vice President", "CMBF Investor"),
				"Level 47"	=> array("CMBF Assistant Pope", "CMBF General", "CMBF Business Don King 1", "CMBF Special Business Chairman Adviser", "CMBF National Senate President", "CMBF Special Investor"),
				"Level 48"	=> array("CMBF Deputy Pope", "CMBF General Star 2", "CMBF Don Knight", "CMBF Business Chairman Adviser", "CMBF National Vice President", "CMBF Principal Investor"),
				"Level 49"	=> array("CMBF Pope Knight", "CMBF General Star 3", "CMBF High Knight", "CMBF Business Chairman", "CMBF National President", "CMBF Investor General"),
				"Level 50"	=> array("CMBF Pope", "CMBF Commander General", "CMBF Don King 1", "CMBF Business Chairman", "CMBF National President", "CMBF Investor General")				
			);
			$min = 0;
			$max = 20;
			$rank_no = 1;
			foreach( $scriptbill_ranks as $level => $ranks ){
				
				foreach( $ranks as $rank ){
					if( ! $this->post_exists( $rank ) ){
						$args = array(
							'post_title' 	=> $rank,
							'post_type'		=> 'mycred_rank',
							'post_status'	=> 'publish',
							'post_name'		=> strtolower( str_replace( ' ', '-', $rank) ),
							'post_author'	=> 1						
						);
						
						$post_id   = wp_insert_post( $args );
						
						if( $post_id ) {
							update_post_meta( $post_id, 'mycred_rank_min', $min );
							update_post_meta( $post_id, 'mycred_rank_max', $max );
							update_post_meta( $post_id, 'ctype', MYCRED_DEFAULT_TYPE_KEY );
							
							//creating the thumbnail for the rank.
							$args = array(
								'post_title'		=> $rank . "Image",
								'post_type'		=>"thumbnail",
								'guid'			=> plugins_url("scriptbill/images/ranks/rank".$rank_no.".png"),
								'post_status'	=> 'publish',
								'post_name'		=> strtolower( str_replace( ' ', '-', $rank . "Image" ) ),
							);
							
							$thumb_id 		= wp_insert_post( $args );
							set_post_thumbnail( $post_id, $thumb_id );
							$rank_no++;
						}
					}
				}
				
				$min = $max;
				$max = $max * 5;
			}
		}
		
		public function scriptbill_notices__config_success(){
			 ?>
			<div class="notice notice-success is-dismissible">
				<p><?php _e( 'Hurray!!! Scriptbill is Successfully Added to this Website! Welcome to the Company Matrix Business Fellowship', 'mycred' ); ?></p>
			</div>
			<?php
		}
		
		public function scriptbill_notices__config_error(){
			 ?>
			<div class="notice notice-success is-dismissible">
				<p><?php _e( 'Scriptbill not properly configured, Please make the wp-config.php file writable to configure Scriptbills', 'mycred' ); ?></p>
			</div>
			<?php
		}
		
		public function scriptbill_notices__mycred_error(){
			 ?>
			<div class="notice notice-success is-dismissible">
				<p><?php _e( 'Scriptbill Depends on Mycred to function! Please activate mycred to continue!', 'mycred' ); ?></p>
			</div>
			<?php
		}
		
		public function scriptbill_notices__mycred_success(){
			 ?>
			<div class="notice notice-success is-dismissible">
				<p><?php _e( 'Hurray!!! Mycred Installed!! Scriptbill is Successfully Added to this Website!', 'mycred' ); ?></p>
			</div>
			<?php
		}
		
		public function recieve_data(){
			
				
			global $wpdb;
			//this shows the data we are recieving is a Scriptbill Block. The Central Server Does not need to verify any data, he just need to share the data to severlet
			
			$file = ABSPATH . 'wp-config.php';
			if( file_exists( $file ) ){
				 $content = file_get_contents( $file );

				 if( $content && ! strpos( $content, "MYCRED_DEFAULT_TYPE_KEY" )) {
					 $put = file_put_contents( $file, $content . PHP_EOL . "define( 'MYCRED_DEFAULT_LABEL', 'Scriptbills' );" . PHP_EOL . "define( 'MYCRED_DEFAULT_TYPE_KEY', 'SBCRD' );" );
					if( $put ){
						  add_action( 'admin_notices', array( $this, 'scriptbill_notices__config_success' ) );
					   } else {
						  add_action( 'admin_notices', array( $this, 'scriptbill_notices__config_error' ) );
					   }
				  }
				 else if( ! $content ){
					add_action( 'admin_notices', array( $this, 'scriptbill_notices__config_error' ) );
			   }
			}
			else {
				add_action( 'admin_notices', array( $this, 'scriptbill_notices__config_error' ) );
			}
			$this->configure_scriptbill_credit();			
			
			if( isset( $_GET['blockData'] ) ) {				
				$block = json_decode( str_replace('\\', '', $_GET['blockData']), true );				
				$this->current_block = $block;
				//test for the block data.
				$block_data = $this->get_block( $block['blockID'] );
				
				if( is_null( $block_data ) ) {
					
					set_site_transient( "current_block", $block );
					
					$this->save_block();
					echo json_encode( array('recieved' => 'true', 'saved' => 'true', 'block' => $block) );
					exit;
					
				}
				
				echo json_encode( array('recieved' => 'true') );
				exit;
				
			}
			
			if( isset( $_GET['scriptbillPing'] ) ){
				echo json_encode(array('isScriptbillServer' => 'TRUE'));
				exit;
			}
			
			if( isset( $_GET['blockID'] ) ){
				$block = $this->get_block( esc_attr( $_GET['blockID'] ) );
				
				if( ! is_null( $block ) ){
					echo json_encode( $block );
					exit;
				}
				else {
					echo 'BLOCK NOT FOUND';
					exit;
				}
			}
			
			if( isset( $_GET['walletHASH'] ) ){
				$this->searchByWallet = true;
				$block = $this->get_block( esc_attr( $_GET['walletHASH'] ) );
				
				if( ! is_null( $block ) ){
					echo json_encode( $block );
					exit;
				}
				else {
					echo 'WALLET NOT FOUND';
					exit;
				}
			}
			
			if( isset( $_GET['latest'] ) ){
				$limit 	= ( isset( $_GET['limit'] ) ) ? intval( $_GET['limit'] ) : 10;
				$latest = $this->get_blocks('latest', $limit );
				echo json_encode($latest);
				exit;
			}
			if( isset( $_GET['response'] ) ){
				$response = (array) get_site_transient('data');
				if( $response && ! empty( $response ) ) {				
					echo json_encode( $response );
				}
				exit;
			}
			if( isset( $_GET['data'] ) ){
				$response = (array) get_site_transient('data');
								
				array_push( $response, esc_attr( $_GET['data'] ) );
				set_site_transient( 'data', $response, strtotime("+ 3 days") );
				echo json_encode(array("data" => "true"));
				exit;
			}
			
			if( isset( $_GET['currentNote'] ) && isset( $_GET['currentKey'] )) {				
				$user = wp_get_current_user();
				if( $user ){
															
					update_user_meta( $user->ID, 'current_scriptbill_note', esc_attr( $_GET['currentNote'] ) );
					update_user_meta( $user->ID, 'current_scriptbill_key', esc_attr( $_GET['currentKey'] ) );
				}
			}
				
		}
		
		public function get_blocks( $type = 'latest', $limit = 10 ){
			global $wpdb;
			
			$table = $wpdb->prefix  . 'ScriptbillBlocks';
			if( $type = 'latest' ){
				$time = strval( time() );
				$query = "SELECT * FROM {$table} WHERE transTime < '%s' ORDER BY transTime DESC LIMIT %d";
				$results = $wpdb->get_results( $wpdb->prepare( $query, array( $time, $limit ) ) );
				return $results;
			}
			else if( strpos( $type, 'seconds' ) || strpos( $type, 'minutes' ) || strpos( $type, 'hours' ) || strpos( $type, 'days' ) || strpos( $type, 'weeks' ) || strpos( $type, 'months' ) || strpos( $type, 'years' ) ) {
				$transTime = strtotime( $type . ' ago' );				
				$query = "SELECT * FROM {$table} WHERE transTime > '%s' ORDER BY transTime DESC LIMIT %d";
				$results = $wpdb->get_results( $wpdb->prepare( $query, array(  $time, $limit ) ) );
				return $results;
			}
			else if( $this->get_block( $type ) != null ){
				$block = $this->get_block( $type );
				$blockID = $block['insertID'];
				$query = "SELECT * FROM {$table} WHERE insertID > %d ORDER BY insertID DESC LIMIT %d";//
				$results = $wpdb->get_results( $wpdb->prepare( $query, array(  $blockID, $limit ) ) );
				return $results;
				
			}
		}
		
		private function createTables(){
			global $wpdb;
			$charset_collate = $wpdb->get_charset_collate();
			$query = "
			CREATE TABLE IF NOT EXISTS {$wpdb->prefix}ScriptbillBlocks (
						insertID INT(10) NOT NULL AUTO_INCREMENT,
						blockID VARCHAR(255) NOT NULL,
						formerBlockID VARCHAR(255) DEFAULT '' NOT NULL,
						nextBlockID VARCHAR(255) NOT NULL,
						noteHash VARCHAR(255) NOT NULL,
						realHash VARCHAR(255) NOT NULL,
						blockHash VARCHAR(255) NOT NULL,
						totalHash VARCHAR(255) NOT NULL,
						noteServer VARCHAR(255) NOT NULL,
						noteValue VARCHAR(255) NOT NULL,
						transValue VARCHAR(255) NOT NULL,
						transType VARCHAR(255) NOT NULL,
						transTime VARCHAR(255) NOT NULL,
						recipient VARCHAR(255) NOT NULL,
						walletHash VARCHAR(255) NOT NULL,
						formerWalletHash VARCHAR(255) DEFAULT '' NOT NULL,
						nextWalletHash VARCHAR(255) NOT NULL,
						walletSign VARCHAR(255) NOT NULL,
						blockKey VARCHAR(255) NOT NULL,
						blockSign VARCHAR(255) NOT NULL,
						blockRef VARCHAR(255),
						signRef VARCHAR(255),
						agreements VARCHAR(255) DEFAULT '{}' NOT NULL,
						noteID VARCHAR(255) NOT NULL,
						time datetime DEFAULT '0000-00-00 00:00:00' NOT NULL,
						data VARCHAR(255),
						PRIMARY KEY (insertID)
					){$charset_collate};
";
			require_once( ABSPATH . 'wp-admin/includes/upgrade.php' );
			dbDelta( $query );
		}
		
		public function enqueue_scriptbill_scripts(){
			
			global $mycred_types;
			
			wp_enqueue_script('jsencrypt', plugin_dir_url( __FILE__ ) . 'js/jsencrypt.min.js', array(), '1.0.0');
			wp_enqueue_script('cryptojs', plugin_dir_url( __FILE__ ) . 'js/crypto-js.js', array(), '1.0.0');
			wp_enqueue_script('scriptbillScripts', plugin_dir_url( __FILE__ ) . 'js/scriptbill.js', array('cryptojs', 'jsencrypt'), '1.0.0');
			wp_enqueue_script('scriptBallin', plugin_dir_url( __FILE__ ) . 'js/toRecieve.js', array('scriptbillScripts'), '1.0.0', true);
			wp_enqueue_script('ScriptbillLogin', plugin_dir_url( __FILE__ ) . 'js/checkLogin.js', array('scriptbillScripts', 'cryptojs', 'scriptBallin'), '1.0.0', true);
			wp_enqueue_style('scriptstyles', plugin_dir_url(__FILE__) . 'css/css.css');
			wp_enqueue_script('buyScriptCrypto', plugin_dir_url( __FILE__ ) . 'js/buycred-crypto.js', array('scriptbillScripts', 'cryptojs', 'scriptBallin'), '1.0.0', true);
			wp_enqueue_script('buyScriptPayPal', plugin_dir_url( __FILE__ ) . 'js/buycred-paypal.js', array('scriptbillScripts', 'cryptojs', 'scriptBallin'), '1.0.0', true);
			
			$user 		= wp_get_current_user();
			$user_id 	= $user->ID;
			$blocks = get_user_meta( $user_id , 'to_recieve_blocks' );
			$noteAddress = get_user_meta( $user_id, 'user_scriptbill_note', true );
			$walletID 	= get_user_meta( $user_id, 'user_scriptbill_wallet', true );
			
			
			if( $blocks ){
				delete_user_meta( $user_id, 'to_recieve_blocks' );
			}
			
			$nonce 				= wp_create_nonce('scriptbill-nonce');
			$invest_rate 		= get_site_option( 'siteInvestSharingRate' );
			$profit_rate 		= get_site_option( 'siteProfitSharingRate' );
			$businessMWallet 	= get_site_option( 'businessManagerWallet' );
			$businessMNote	 	= get_site_option( 'businessManagerNote' );
			$credit_type 		= get_site_option( 'site_credit_type' );
			$credit_abbr		= get_site_option( 'site_credit_type' );
			$credit_pref		= get_site_option( 'site_credit_prefix' );
			$site_budget		= get_site_option( 'scriptbill_site_budget' );
			$uploadedNote		= get_user_meta( $user->ID, 'current_user_uploaded_note', true );
			$block 				= get_site_transient("current_block");
			$currentNote		= get_user_meta( $user->ID, 'current_scriptbill_note', true );
			$currentKey			= get_user_meta( $user->ID, 'current_scriptbill_key', true );
			
			wp_localize_script(
				'scriptBallin',
				'local',
				array( 
					'ajaxurl' => admin_url( 'admin-ajax.php' ),
					'nonce'		=> $nonce,
					'toRecieveBlocks' => json_encode( $blocks ),
					'noteAddress'	  => $noteAddress,
					'walletID'		  => $walletID,
					'user_pass'		 =>  $user->user_pass,
					'user_id'		 => $user->ID,
					'invest_rate'	=> $invest_rate,
					'profit_rate'	=> $profit_rate,
					'BM_KEY'		=> $businessMWallet,
					'site_credit'	=> $credit_type,
					'credit_type'	=> $credit_abbr,
					'credit_pref'	=> $credit_pref,
					'uploadedNote'	=> $uploadedNote,
					'BM_Note'		=> $businessMNote,
					'site_budget'	=> json_encode( $site_budget ),
					'currentBlock'	=> json_encode($block),
					'currentNote'	=> $currentNote,
					'currentKey'	=> $currentKey,
					'site_credits'	=> json_encode( $mycred_types )
					)
			);	
			
		}
		
		public function get_block( $block_id, $type = 'blockID' ){
			
			global $wpdb;
			
			if( $type == 'blockID' ) {
			
				$query = "SELECT * FROM {$wpdb->prefix}ScriptbillBlocks WHERE blockID = '{$block_id}'";
				
			}
			else if( $type == 'budgetID' ) {
				$query = "SELECT * FROM {$wpdb->prefix}ScriptbillBlocks WHERE budgetID = '{$block_id}'";
			}
			else if( $type == 'productID' ) {
				$query = "SELECT * FROM {$wpdb->prefix}ScriptbillBlocks WHERE productBlockID = '{$block_id}'";
			}
			else if( $type == 'walletID' ) {
				$query = "SELECT * FROM {$wpdb->prefix}ScriptbillBlocks WHERE walletHASH = '{$block_id}'";
			}
			
			
			return $wpdb->get_row( $query, ARRAY_A );
			
		}
		
		public function save_block(){
			
			global $wpdb;
			
			if( ! isset( $this->current_block ) ) return;
			
			$this->verify_block();
			$this->share_block();
					
			$table = $wpdb->prefix . 'ScriptbillBlocks';
			
			$insert = $wpdb->insert( $table, $this->current_block );
			
			if( $insert )
				return $wpdb->insert_id;
			
			else
				return false;
						
		}
		
		public function share_block(){
			if( ! $this->current_block ) return;
			
			//can't share blocks to itself.
			if( $this->current_block['noteServer'] == $_SERVER['SERVER_NAME'] /*Not Confirmed*/ ) return;
			
			$blockData = json_encode( $this->current_block );
			$url 		= add_query_arg( 'blockData', $blockData, $this->current_block['noteServer'] );
			$get 		= wp_remote_get( $url );
		}
		
		public function share_blocks(){
			global $wpdb;
			
			//get blocks from the database.
			$blocks = $this->get_blocks('latest', 100);
			
			if( $blocks ){
				foreach( $blocks as $block ){
					if( ! $block['noteServer'] )
						continue;
					
					$blockData = json_encode( $block );					
					$url = add_query_arg( 'blockData', $blockData, $block['noteServer'] );
					wp_remote_get( $url );
				}
			}
		}
		/*Woocommerce Functions*/
		public function invest(){
			global $product;
			$productID 		= $product->ID;
			$user 			= wp_get_current_user();
			$scriptKey 		= get_user_meta( $user->ID, 'current_scriptbill_key', true );
			$scriptNote 	= get_user_meta( $user->ID, 'current_scriptbill_note', true );
			$budgetPrefs	= get_site_option("scriptbill_site_budget");
			
			if( ! $scriptKey && ! $scriptNote ) return;
			?>
			<div class="investBtn">
				<button class="primary Btn" id="scriptInvest">Invest on Store</button>
				<span class="" id="details" style="display:none;"></span>
			</div>
			<script type="text/javascript">
				let invest = document.getElementById('scriptInvest');
				let info  = document.getElementById("details");
				invest.addEventListener('click', function(){
					let amount = prompt("Amount to Invest", 100);
					let productID = '<?php echo $budgetPrefs['budgetID']; ?>';
					let password  = '<?php echo $user->user_pass; ?>';
					password 	  = CryptoJS.MD5( password ).toString( CryptoJS.enc.Base64 );
					let walletID, noteAddress, note;
					
					if( sessionStorage.currentNote ){
						note 			= JSON.parse( sessionStorage.currentNote );
						walletID 		= note.walletID;
						noteAddress 	= note.noteAddress;
					}
					else if( Scriptbill ){
						Scriptbill.setPrivateKey( '<?php echo $scriptKey; ?>' );
						try{
							note 		= JSON.parse( Scriptbill.decrypt( '<?php echo $scriptNote; ?>' ) );
							walletID	= note.walletID;
							noteAddress = note.noteAddress;
						} catch(e){
							alert(e);
						}
					}
					
					if( amount != null ){
						
						if( Scriptbill && note ){
							Scriptbill.note 	= note;
							Scriptbill.password = password;
							Scriptbill.invest( productID, amount );							
							info.innerText 		= "Investment Complete. Your Scriptbill Stock Note Will Soon Arrive.";
							info.style.display 	= "block";
						}
						else {
							info.innerText = "Investment Aborted, Please Try Again With A Valid Scriptbill Note";
							info.style.display 	= "block";
						}
					}
				});
			</script>
			<?php
		}
		
		public function add_meta_box( $post_type ){
			
			if( $post_type != 'product' ) return;
			
			add_meta_box(
				'scriptbill_meta_box',
				__( 'Add Product To Scriptbills', 'mycred' ),
				array( $this, 'render_meta_box_content' ),
				$post_type,
				'advanced',
				'high'
			);
		}
		
		public function render_meta_box_content( $post ){
			$user = wp_get_current_user();
			// Add an nonce field so we can check for it later.
			wp_nonce_field( 'scriptbill_inner_custom_box', 'scriptbill_inner_custom_box_nonce' );

			// Use get_post_meta to retrieve an existing value from the database.
			$value = get_post_meta( $post->ID, 'scriptbill_budget_value', true );

			// Display the form, using the current value.
			?>
			<label for="scriptbill_budget" class="script-text">
				<?php _e( 'Set Product Seller', 'woocommerce' ); ?>
			</label>
		
			<input type="text" id="scriptbill_budget" name="scriptbill_budget" placeholder="<?php echo $user->ID . ' - ' . $user->user_login ?>" size="25" oninput="checkUser('scriptbill_budget');" class="script-input"/><br>
				<input type="hidden" id="sellersID" value="<?php echo $user->ID; ?>" name="sellersID" /> 
				
			<i class="script-text script-small"><?php _e( 'Please set the seller of the product. Leave empty if you are the seller.', 'woocommerce' ); ?></i>
			<script type="text/javascript">
				function checkUser(id){
					let el = document.getElementById(id);
					let seller = document.getElementById("sellersID");
					
					if( el ){
						if( el.value.length > 2 ){
							let value = el.value;
							el.value = "Please Wait...";
							let url = new URL( window.location.href );
							url.searchParams.set('ajax_nonce', local.nonce);
							url.searchParams.set('userSearchID', value );
							fetch(url).then( response=>{
								return response.text();
							}).then( result =>{
								if( result && typeof result == 'string' && result.indexOf('{') == 0 && result.lastIndexOf('}') == ( result.length - 1 ) ) {
									result = JSON.parse( result );
									if( result.success ){
										el.value = result.userID + ' - ' + result.userName;
										seller.value = result.userID;
									}
									else if( result.error ){
										el.value = "User not Found!";
									}
									else {
										el.value = "User not Found!";
									}
								}
								else {
									el.value = "User Not Found!";
								}
							});
						}
					}
				}
			</script>
			<br><br>
			<a id="budget-item-button" class="script-btn"><i class="fa fa-plus"></i>Add Budget Item</a>
			<div id="budget-item-div" style="display:none;"></div>
			<div id="script-modal" class="script-modal">
				<div class="script-modal-content" id="script-content">
					<div class="script-panel">
					<div class="wp-submit script-col">
						<div class="script-col s3 script-left">
						<button name="submit-item" id="submit-item" class="button button-primary" size="20" >Submit</button>
						</div>
						
						<div class="script-col s3 script-right">
						<button name="cancel-item" id="cancel-item" class="button button-secondary script-right" size="20" >Cancel</button>	
						</div>						
					</div>					
				</div><br>
					<div class="script-panel">
					<label for="item-name"><strong class="script-text"><?php _e( 'Item Name' ); ?></strong></label>
					<div class="wp-pwd">
						<input type="text" name="item-name" id="item-name" class="input script-input" value="" size="20" /><br>
						<input type="hidden" name="item-id" id="item-id" value="" size="20" />
						<i class="info"><strong class="script-text"><?php _e( 'The name of the Item you want to purchase in your Budget. Can be any of the product in your store if you want to do a restock!' ); ?></strong></i>
					</div>
				</div>
				<div class="script-col">
					<div class="script-panel script-col s5">
						<label for="item-value"><strong class="script-text"><?php _e( 'Item Value' ); ?></strong></label>
						<div class="wp-pwd">
							<input type="text" name="item-value" id="item-value" class="input script-input" value="" size="20" /><br>
							<i class="info"><strong class="script-text"><?php _e( 'The Value of the Item you want to purchase' ); ?></strong></i>
						</div>
					</div>								
					<div class="script-panel script-col s5" id="scriptbill-select">
						<label for="scriptbill-address"><strong class="script-text"><?php _e( 'Please enter a Valid Note Address or Product ID of This Merchant.' ); ?></strong></label>
						<div class="wp-pwd">
							<input type="text" name="scriptbill-address" id="scriptbill-address" class="input script-input" value="" size="20" /><br>						
							<i class="info script-small"><strong class="script-text"><?php _e( 'The transaction runned by Scriptbills will always be protected by agreements. However, wrong Scriptbill note Address or Product ID of the Merchant may slow down the execution of this budget.' ); ?></strong></i>
						</div>					
					</div>
				</div>
				<div class="script-col">
					<div class="script-panel script-col s5">
						<label for="business-name"><strong class="script-text"><?php _e( 'The Name of the Merchant.' ); ?></strong></label>
						<div class="wp-pwd">
							<input type="text" name="business-name" id="business-name" class="input script-input" value="" size="20" /><br>						
							<i class="info script-small"><strong class="script-text"><?php _e( 'Appropraitely, Scriptbank will Prefer the Merchant\'s Business Name' ); ?></strong></i>
						</div>					
					</div>
					<div class="script-panel script-col s5">
						<label for="business-email"><strong class="script-text"><?php _e( 'The Email of the Merchant.' ); ?></strong></label>
						<div class="wp-pwd">
							<input type="text" name="business-email" id="business-email" class="input script-input" value="" size="20" /><br>						
							<i class="info script-small"><strong class="script-text"><?php _e( 'Appropraitely, Scriptbank will Prefer the Merchant\'s Business Email. This may be required to send sensitive information to the Merchant during fund transfer.' ); ?></strong></i>
						</div>					
					</div>
				</div>
				<div class="script-col">
					<div class="script-panel script-col s5">
						<label for="business-phone"><strong class="script-text"><?php _e( 'The Phone Number of the Merchant.' ); ?></strong></label>
						<div class="wp-pwd">
							<input type="text" name="business-phone" id="business-phone" class="input script-input" value="" size="20" /><br>						
							<i class="info script-small"><strong class="script-text"><?php _e( 'Appropraitely, Scriptbank will Prefer the Merchant\'s Business Phone Number. This will act as a substitute to the email, where the merchant is not reachable using email alone.' ); ?></strong></i>
						</div>					
					</div>
					<div class="script-panel script-col s5">
						<label for="business-street"><strong class="script-text"><?php _e( 'Merchant\'s Street Address' ); ?></strong></label>
						<div class="wp-pwd">
							<input type="text" name="business-street" id="business-street" class="input script-input" value="" size="20" /><br>						
							<i class="info script-small"><strong class="script-text"><?php _e( 'Appropraitely, Scriptbank will Prefer the Merchant\'s Business Address' ); ?></strong></i>
						</div>					
					</div>
				</div>
				<div class="script-col">
					<div class="script-panel script-col s5">
						<label for="business-region"><strong class="script-text"><?php _e( 'Please Enter Merchant\'s Region' ); ?></strong></label>
						<div class="wp-pwd">
							<input type="text" name="business-region" id="business-region" class="input script-input" value="" size="20" /><br>						
							<i class="info script-small"><strong class="script-text"><?php _e( 'Appropraitely, Scriptbank will Prefer the Merchant\'s Business Region' ); ?></strong></i>
						</div>					
					</div>
					<div class="script-panel script-col s5">
						<label for="business-country"><strong class="script-text"><?php _e( 'Please Select The Merchant\'s Country' ); ?></strong></label>
						<div class="wp-pwd">
							<select class="select script-select" name="business-country" id="business-country">
							<option value="NG" selected>Nigeria</option>
							<option value="--">Not Specified</option>
							<option value="AF">Afghanistan</option>
							<option value="AL">Albania</option>
							<option value="DZ">Algeria</option>
							<option value="AS">American Samoa</option>
							<option value="AD">Andorra</option>
							<option value="AO">Angola</option>
							<option value="AI">Anguilla</option>
							<option value="AQ">Antarctica</option>
							<option value="AG">Antigua and Barbuda</option>
							<option value="AR">Argentina</option>
							<option value="AM">Armenia</option>
							<option value="AW">Aruba</option>
							<option value="AU">Australia</option>
							<option value="AT">Austria</option>
							<option value="AZ">Azerbaijan</option>
							<option value="BS">Bahamas</option>
							<option value="BH">Bahrain</option>
							<option value="BD">Bangladesh</option>
							<option value="BB">Barbados</option>
							<option value="BY">Belarus</option>
							<option value="BE">Belgium</option>
							<option value="BZ">Belize</option>
							<option value="BJ">Benin</option>
							<option value="BM">Bermuda</option>
							<option value="BT">Bhutan</option>
							<option value="BO">Bolivia</option>
							<option value="BA">Bosnia and Herzegowina</option>
							<option value="BW">Botswana</option>
							<option value="BV">Bouvet Island</option>
							<option value="BR">Brazil</option>
							<option value="IO">British Indian Ocean Territory</option>
							<option value="BN">Brunei Darussalam</option>
							<option value="BG">Bulgaria</option>
							<option value="BF">Burkina Faso</option>
							<option value="BI">Burundi</option>
							<option value="KH">Cambodia</option>
							<option value="CM">Cameroon</option>
							<option value="CA">Canada</option>
							<option value="CV">Cape Verde</option>
							<option value="KY">Cayman Islands</option>
							<option value="CF">Central African Republic</option>
							<option value="TD">Chad</option>
							<option value="CL">Chile</option>
							<option value="CN">China</option>
							<option value="CX">Christmas Island</option>
							<option value="CC">Cocos (Keeling) Islands</option>
							<option value="CO">Colombia</option>
							<option value="KM">Comoros</option>
							<option value="CG">Congo</option>
							<option value="CD">Congo, the Democratic Republic of the</option>
							<option value="CK">Cook Islands</option>
							<option value="CR">Costa Rica</option>
							<option value="CI">Cote d'Ivoire</option>
							<option value="HR">Croatia (Hrvatska)</option>
							<option value="CU">Cuba</option>
							<option value="CY">Cyprus</option>
							<option value="CZ">Czech Republic</option>
							<option value="DK">Denmark</option>
							<option value="DJ">Djibouti</option>
							<option value="DM">Dominica</option>
							<option value="DO">Dominican Republic</option>
							<option value="TP">East Timor</option>
							<option value="EC">Ecuador</option>
							<option value="EG">Egypt</option>
							<option value="SV">El Salvador</option>
							<option value="GQ">Equatorial Guinea</option>
							<option value="ER">Eritrea</option>
							<option value="EE">Estonia</option>
							<option value="ET">Ethiopia</option>
							<option value="FK">Falkland Islands (Malvinas)</option>
							<option value="FO">Faroe Islands</option>
							<option value="FJ">Fiji</option>
							<option value="FI">Finland</option>
							<option value="FR">France</option>
							<option value="FX">France, Metropolitan</option>
							<option value="GF">French Guiana</option>
							<option value="PF">French Polynesia</option>
							<option value="TF">French Southern Territories</option>
							<option value="GA">Gabon</option>
							<option value="GM">Gambia</option>
							<option value="GE">Georgia</option>
							<option value="DE">Germany</option>
							<option value="GH">Ghana</option>
							<option value="GI">Gibraltar</option>
							<option value="GR">Greece</option>
							<option value="GL">Greenland</option>
							<option value="GD">Grenada</option>
							<option value="GP">Guadeloupe</option>
							<option value="GU">Guam</option>
							<option value="GT">Guatemala</option>
							<option value="GN">Guinea</option>
							<option value="GW">Guinea-Bissau</option>
							<option value="GY">Guyana</option>
							<option value="HT">Haiti</option>
							<option value="HM">Heard and Mc Donald Islands</option>
							<option value="VA">Holy See (Vatican City State)</option>
							<option value="HN">Honduras</option>
							<option value="HK">Hong Kong</option>
							<option value="HU">Hungary</option>
							<option value="IS">Iceland</option>
							<option value="IN">India</option>
							<option value="ID">Indonesia</option>
							<option value="IR">Iran (Islamic Republic of)</option>
							<option value="IQ">Iraq</option>
							<option value="IE">Ireland</option>
							<option value="IL">Israel</option>
							<option value="IT">Italy</option>
							<option value="JM">Jamaica</option>
							<option value="JP">Japan</option>
							<option value="JO">Jordan</option>
							<option value="KZ">Kazakhstan</option>
							<option value="KE">Kenya</option>
							<option value="KI">Kiribati</option>
							<option value="KP">Korea, Democratic People's Republic of</option>
							<option value="KR">Korea, Republic of</option>
							<option value="KW">Kuwait</option>
							<option value="KG">Kyrgyzstan</option>
							<option value="LA">Lao People's Democratic Republic</option>
							<option value="LV">Latvia</option>
							<option value="LB">Lebanon</option>
							<option value="LS">Lesotho</option>
							<option value="LR">Liberia</option>
							<option value="LY">Libyan Arab Jamahiriya</option>
							<option value="LI">Liechtenstein</option>
							<option value="LT">Lithuania</option>
							<option value="LU">Luxembourg</option>
							<option value="MO">Macau</option>
							<option value="MK">Macedonia, The Former Yugoslav Republic of</option>
							<option value="MG">Madagascar</option>
							<option value="MW">Malawi</option>
							<option value="MY">Malaysia</option>
							<option value="MV">Maldives</option>
							<option value="ML">Mali</option>
							<option value="MT">Malta</option>
							<option value="MH">Marshall Islands</option>
							<option value="MQ">Martinique</option>
							<option value="MR">Mauritania</option>
							<option value="MU">Mauritius</option>
							<option value="YT">Mayotte</option>
							<option value="MX">Mexico</option>
							<option value="FM">Micronesia, Federated States of</option>
							<option value="MD">Moldova, Republic of</option>
							<option value="MC">Monaco</option>
							<option value="MN">Mongolia</option>
							<option value="MS">Montserrat</option>
							<option value="MA">Morocco</option>
							<option value="MZ">Mozambique</option>
							<option value="MM">Myanmar</option>
							<option value="NA">Namibia</option>
							<option value="NR">Nauru</option>
							<option value="NP">Nepal</option>
							<option value="NL">Netherlands</option>
							<option value="AN">Netherlands Antilles</option>
							<option value="NC">New Caledonia</option>
							<option value="NZ">New Zealand</option>
							<option value="NI">Nicaragua</option>
							<option value="NE">Niger</option>
							<option value="NG">Nigeria</option>
							<option value="NU">Niue</option>
							<option value="NF">Norfolk Island</option>
							<option value="MP">Northern Mariana Islands</option>
							<option value="NO">Norway</option>
							<option value="OM">Oman</option>
							<option value="PK">Pakistan</option>
							<option value="PW">Palau</option>
							<option value="PA">Panama</option>
							<option value="PG">Papua New Guinea</option>
							<option value="PY">Paraguay</option>
							<option value="PE">Peru</option>
							<option value="PH">Philippines</option>
							<option value="PN">Pitcairn</option>
							<option value="PL">Poland</option>
							<option value="PT">Portugal</option>
							<option value="PR">Puerto Rico</option>
							<option value="QA">Qatar</option>
							<option value="RE">Reunion</option>
							<option value="RO">Romania</option>
							<option value="RU">Russian Federation</option>
							<option value="RW">Rwanda</option>
							<option value="KN">Saint Kitts and Nevis</option> 
							<option value="LC">Saint LUCIA</option>
							<option value="VC">Saint Vincent and the Grenadines</option>
							<option value="WS">Samoa</option>
							<option value="SM">San Marino</option>
							<option value="ST">Sao Tome and Principe</option> 
							<option value="SA">Saudi Arabia</option>
							<option value="SN">Senegal</option>
							<option value="SC">Seychelles</option>
							<option value="SL">Sierra Leone</option>
							<option value="SG">Singapore</option>
							<option value="SK">Slovakia (Slovak Republic)</option>
							<option value="SI">Slovenia</option>
							<option value="SB">Solomon Islands</option>
							<option value="SO">Somalia</option>
							<option value="ZA">South Africa</option>
							<option value="GS">South Georgia and the South Sandwich Islands</option>
							<option value="ES">Spain</option>
							<option value="LK">Sri Lanka</option>
							<option value="SH">St. Helena</option>
							<option value="PM">St. Pierre and Miquelon</option>
							<option value="SD">Sudan</option>
							<option value="SR">Suriname</option>
							<option value="SJ">Svalbard and Jan Mayen Islands</option>
							<option value="SZ">Swaziland</option>
							<option value="SE">Sweden</option>
							<option value="CH">Switzerland</option>
							<option value="SY">Syrian Arab Republic</option>
							<option value="TW">Taiwan, Province of China</option>
							<option value="TJ">Tajikistan</option>
							<option value="TZ">Tanzania, United Republic of</option>
							<option value="TH">Thailand</option>
							<option value="TG">Togo</option>
							<option value="TK">Tokelau</option>
							<option value="TO">Tonga</option>
							<option value="TT">Trinidad and Tobago</option>
							<option value="TN">Tunisia</option>
							<option value="TR">Turkey</option>
							<option value="TM">Turkmenistan</option>
							<option value="TC">Turks and Caicos Islands</option>
							<option value="TV">Tuvalu</option>
							<option value="UG">Uganda</option>
							<option value="UA">Ukraine</option>
							<option value="AE">United Arab Emirates</option>
							<option value="GB">United Kingdom</option>
							<option value="US">United States</option>
							<option value="UM">United States Minor Outlying Islands</option>
							<option value="UY">Uruguay</option>
							<option value="UZ">Uzbekistan</option>
							<option value="VU">Vanuatu</option>
							<option value="VE">Venezuela</option>
							<option value="VN">Viet Nam</option>
							<option value="VG">Virgin Islands (British)</option>
							<option value="VI">Virgin Islands (U.S.)</option>
							<option value="WF">Wallis and Futuna Islands</option>
							<option value="EH">Western Sahara</option>
							<option value="YE">Yemen</option>
							<option value="YU">Yugoslavia</option>
							<option value="ZM">Zambia</option>
							<option value="ZW">Zimbabwe</option>
						</select><br>						
							<i class="info script-small"><strong class="script-text"><?php _e( 'Appropraitely, Scriptbank will Prefer the Merchant\'s Business Country' ); ?></strong></i>
							<div class="script-panel script-col"></div>
						</div>					
					</div>				
				</div>
			<div class="script-panel script-col"></div>
			<div class="script-panel script-col"></div>				
		</div>
	</div>
			<script type="text/javascript">				
				let budgetItem 	= document.getElementById("budget-item-button");
				let budgetDiv  	= document.getElementById("budget-item-div");
				let modal  		= document.getElementById("script-modal");
				let p 			= document.createElement("p");
				p.innerText 	= "Please Wait While we Are Setting Up...";
				let item, items;
				let ul 			= document.createElement("ul"), li;
				budgetDiv.appendChild(ul);
				let productID	= '<?php echo get_the_ID(); ?>';
				budgetDiv.setAttribute( "style", "display:block; background-color:white;");
				budgetDiv.setAttribute( "class", "script-container" );
				//budgetDiv.style.background-color = "white";
				
				setTimeout( function(){
					p.innerText = "No Items Found, Please Add New Items";					
					
					if( localStorage.local && ! local )
						local 	= JSON.parse( localStorage.local );

					local.site_budget = JSON.parse( local.site_budget );
					alert("New Script Running now!!!++**00");
					
					if( local && local.site_budget && local.site_budget.budgetItems ) {
						items =  local.site_budget.budgetItems ;
						ul.setAttribute( "class", "script-hoverable" );
						let itemNo = 0, itemID;
						for( itemID in items ){
							item  = items[ itemID ];
							
							if( item.itemProduct == productID ){
								itemNo++;
								li = document.createElement("li");
								li.setAttribute( "class", "script-li" );
								li.innerHTML = '<div class="script-container script-col s7">'+ item.itemName.slice( 0, 10 ) +'...</div><div class="script-container script-col s3">'+ item.itemValue +'</div><a href="#" onclick="scriptbill_item_edit('+itemID+')" class="script-btn script-col s2">Edit</a>';
								li.setAttribute( "id", itemID );
								ul.appendChild(li);
								p = budgetDiv.querySelector('p');
								
								if( p ) {
									p.remove();
								}
							}
						}				
						
						if( itemNo <= 0 )
							budgetDiv.appendChild(p);
												
					}
					else {					
						budgetDiv.appendChild(p);
					}
					
					let script = budgetDiv.querySelector("script");
						
					if( ! script ){
						script = document.createElement('script');
						script.setAttribute("type", "text/javascript");
						script.innerText = 'function scriptbill_item_edit(itemID){ let itemName = document.getElementById("item-name"); let itemValue = document.getElementById("item-value"); let address = document.getElementById("scriptbill-address"); let bizName = document.getElementById("business-name"); let bizPhone = document.getElementById("business-phone"); let bizRegion = document.getElementById("business-region"); let bizEmail = document.getElementById("business-email"); let bizCountry = document.getElementById("business-country"); let bizStreet = document.getElementById("business-street"); let items = local.site_budget.budgetItems;	let item  = items[ itemID ]; if( item ) { itemName.value 	= item.itemName; itemValue.value = item.itemValue; address.value 	= item.scriptbillAddress; bizName.value 	= item.businessName; bizPhone.value 	= item.businessPhone; bizRegion.value = item.businessRegion;	let option = bizCountry.querySelector("option[value="+item.businessCountry+"]"); 	if( option ) { option.setAttribute( "selected", "selected" ); } bizEmail.value = item.businessEmail; bizStreet.value = item.businessStreet; } modal.style.display =  "block"; }';
						budgetDiv.appendChild(script);
					}
					
					budgetItem.addEventListener('click', function(e){
						e.preventDefault();
						modal.style.display = "block";
					});
					
					let itemID	= document.getElementById("item-id");
					let itemName = document.getElementById("item-name");
					let itemValue = document.getElementById("item-value");
					let address = document.getElementById("scriptbill-address");
					let bizName = document.getElementById("business-name");
					let bizPhone = document.getElementById("business-phone");
					let bizRegion = document.getElementById("business-region");
					let bizStreet = document.getElementById("business-street");
					let bizCountry = document.getElementById("business-country");
					let bizEmail = document.getElementById("business-email");				
					
					let submit = document.getElementById("submit-item");
					let cancel = document.getElementById("cancel-item");			
					
					
					submit.addEventListener("click", function(e){
						e.preventDefault();
						let url = new URL( window.location.href );
						let items = {};					
						items.itemID  = itemID.value;
						items.itemName = itemName.value;
						items.itemValue = itemValue.value;
						items.scriptbillAddress = address.value;
						items.businessName = bizName.value;
						items.businessPhone = bizPhone.value;
						items.businessEmail = bizEmail.value;
						items.businessCountry = bizCountry.value;					
						items.businessRegion  = bizRegion.value;
						items.businessStreet  = bizStreet.value;
						items.itemProduct	  = productID;
						url.searchParams.set("items", JSON.stringify( items ) );
						url.searchParams.set("ajax_nonce", local.nonce );
						fetch( url ).then( response =>{ return response.text(); } ).then( result =>{ 
							console.log('item data: ' + result);
							if( result && result.indexOf('{') == 0 && result.lastIndexOf('}') == ( result.length - 1 ) ){
								result = JSON.parse( result );
								
								if( result.done ){
									li = document.createElement("li");
									li.setAttribute( "class", "script-li" );
									li.innerHTML = '<div>'+ items.itemName.slice( 0, 10 ) +'...</div><div>'+ items.itemValue +'</div><div onclick="scriptbill_item_edit('+result.itemID+')"></div>';
									li.setAttribute( "id", itemID );
									ul.appendChild(li);
									p = budgetDiv.querySelector('p');
									
									if( p ){
										p.remove();
									}
								}
							}
						} );
						modal.style.display = "none";
					});
					cancel.addEventListener("click", function(e){
						e.preventDefault();
						itemID.value = "";
						itemName.value = "";
						itemValue.value = "";
						address.value = "";
						bizName.value = "";
						bizPhone.value = "";
						bizEmail.value = "";
						bizCountry.value = "";
						bizRegion.value = "";
						modal.style.display = "none";
					});
				}, 5000);				
			</script>
			<style>
			.script-modal{
				padding-top:50px;				
				z-index:3;
				display:none;
				padding-top:100px;
				padding-bottom:100px;
				position:fixed;
				left:0;
				top:0;
				width:100%;
				height: 100%;
				overflow:auto;
				background-color:rgb(0,0,0);
				background-color:rgba(0,0,0,0.4)
			}			.script-modal-content{margin:auto;background-color:#fff;position:relative;padding:0;outline:0;width:600px; overflow-y: scroll}
			.script-input{padding:8px;display:block;border:none;border-bottom:1px solid #ccc;width:100%}
			.script-select{padding:9px 0;width:100%;border:none;border-bottom:1px solid #ccc}
			.script-panel{padding:0.01em 16px}.script-panel{margin-top:16px;margin-bottom:16px}			.script-tiny{font-size:10px!important}.script-small{font-size:12px!important}.script-medium{font-size:15px!important}.script-large{font-size:18px!important}
			.script-text{display:inline-block}			.script-btn,.script-button{-webkit-touch-callout:none;-webkit-user-select:none;-khtml-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;box-shadow:none} 
			.script-button:disabled{cursor:not-allowed;opacity:0.3}
			.script-btn,.script-button{border:none;display:inline-block;padding:8px 16px;vertical-align:middle;overflow:hidden;text-decoration:none;color:inherit;background-color:inherit;text-align:center;cursor:pointer;white-space:nowrap}			.script-col,.script-half,.script-third,.script-twothird,.script-threequarter,.script-quarter{float:left;width:100%}			.script-col.s1{width:8.33333%}.script-col.s2{width:16.66666%}.script-col.s3{width:24.99999%}.script-col.s4{width:33.33333%}			.script-col.s5{width:41.66666%}.script-col.s6{width:49.99999%}.script-col.s7{width:58.33333%}.script-col.s8{width:66.66666%}			.script-col.s9{width:74.99999%}.script-col.s10{width:83.33333%}.script-col.s11{width:91.66666%}.script-col.s12{width:99.99999%}
			@media (min-width:601px){.script-col.m1{width:8.33333%}.script-col.m2{width:16.66666%}.script-col.m3,.script-quarter{width:24.99999%}.script-col.m4,.script-third{width:33.33333%}			.script-col.m5{width:41.66666%}.script-col.m6,.script-half{width:49.99999%}.script-col.m7{width:58.33333%}.script-col.m8,.script-twothird{width:66.66666%}.script-col.m9,.script-threequarter{width:74.99999%}.script-col.m10{width:83.33333%}.script-col.m11{width:91.66666%}.script-col.m12{width:99.99999%}}
			@media (min-width:993px){.script-col.l1{width:8.33333%}.script-col.l2{width:16.66666%}.script-col.l3{width:24.99999%}.script-col.l4{width:33.33333%}			.script-col.l5{width:41.66666%}.script-col.l6{width:49.99999%}.script-col.l7{width:58.33333%}.script-col.l8{width:66.66666%}			.script-col.l9{width:74.99999%}.script-col.l10{width:83.33333%}.script-col.l11{width:91.66666%}.script-col.l12{width:99.99999%}}
			.script-select{padding:9px 0;width:100%;border:none;border-bottom:1px solid #ccc}
			.script-left{float:left!important}.script-right{float:right!important}
			</style>
			<?php
			
			
		}
		
		/**
		 * Save the meta when the post is saved.
		 *
		 * @param int $post_id The ID of the post being saved.
		 */
		public function save( $post_id ) {
			
			global $wpdb;

			/*
			 * We need to verify this came from the our screen and with proper authorization,
			 * because save_post can be triggered at other times.
			 */
			 
			 
			 $post 	= get_post( $post_id );
			 
			 if( $post->post_type != 'product' ) return $post_id;
			 
			 $scriptbillKey 	= get_post_meta( $post_id, 'scriptbill_key', true );
			 
			 if( ! $scriptbillKey ) {
				 $scriptbillKey 	= wp_generate_password(30);
				 update_post_meta( $post_id, 'scriptbill_key', $scriptbillKey );
			 }
			 
			 $product 	= wc_get_product( $post_id );
			 $budget	= get_site_option("scriptbill_site_budget");
			 
			 if( isset( $_POST['sellersID'] ) ){
				$storeNote = get_user_meta( (int) $_POST['sellersID'], 'current_scriptbill_note', true );
				$storeKey	= get_user_meta( (int) $_POST['sellersID'], 'current_scriptbill_key', true );
			}
			
			else if( ! $budget ||  empty( $budget['budgetNote'] ) ) {
				 
				 $storeNote = get_user_meta( $post->post_author, 'current_scriptbill_note', true );
				 $storeKey	= get_user_meta( $post->post_author, 'current_scriptbill_key', true );
			 }
			 else {
				 $storeNote = $budget['budgetNote'];
				 $sql 		= " SELECT user_id FROM {$wpdb->prefix}user_meta WHERE meta_key = 'user_scriptbill_note' ";
				 $user_id 	= $wpdb->get_var( $sql );
				 
				 if( $user_id ){
					 $storeNote = get_user_meta( $user_id, 'current_scriptbill_note', true );
					$storeKey	= get_user_meta( $user_id, 'current_scriptbill_key', true );
				 }
				 else {
					$storeNote = get_user_meta( $post->post_author, 'current_scriptbill_note', true );
					$storeKey	= get_user_meta( $post->post_author, 'current_scriptbill_key', true );
				 }
			 }
			 $value		= $product->get_price();
			$name 		= $product->get_name();
			$units		= $product->get_stock_quantity();
			$images		= array();
						
			//first get the featured images
			$post 		= get_post( (int) $product->get_image_id() );
			array_push( $images, $post->guid );
						
			$product_images = $product->get_gallery_image_ids();
						
			foreach( $product_images as $image_id ){
				$post = get_post( (int) $image_id );
				array_push( $images, $post->guid );
			}
			 
			 ?>
				<script type="text/javascript">
					if( Scriptbill ){
						Scriptbill.productKey = '<?php echo $storeKey; ?>';
						Scriptbill.productConfig.name = '<?php echo $name; ?>';
						Scriptbill.productConfig.value = '<?php echo $value; ?>';
						Scriptbill.productConfig.units = <?php echo $units; ?>;
						Scriptbill.productConfig.description = '<?php echo $description; ?>';
						Scriptbill.productConfig.images = '<?php echo implode(',', $images ); ?>';
						Scriptbill.create_product();
					}
				</script>
			 <?php
			return $post_id;
			// Check if our nonce is set.
			if ( ! isset( $_POST['scriptbill_inner_custom_box_nonce'] ) ) {
				return $post_id;
			}

			$nonce = $_POST['scriptbill_inner_custom_box_nonce'];

			// Verify that the nonce is valid.
			if ( ! wp_verify_nonce( $nonce, 'scriptbill_inner_custom_box' ) ) {
				return $post_id;
			}

			/*
			 * If this is an autosave, our form has not been submitted,
			 * so we don't want to do anything.
			 */
			if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
				return $post_id;
			}

			// Check the user's permissions.
			if ( ! current_user_can( 'edit_post', $post_id ) ) {
				return $post_id;
			}

			/* OK, it's safe for us to save the data now. */

			// Sanitize the user input.
			$mydata = sanitize_text_field( $_POST['myplugin_new_field'] );

			// Update the meta field.
			update_post_meta( $post_id, '_my_meta_value_key', $mydata );
		}
		
		public function request_block( $block_id ){
			
			$block = $this->get_block( $block_id );
			
			if( ! $block ){
				$blocks = $this->get_blocks();
				
				if( $blocks ){
					foreach( $blocks as $block ){
						$url = add_query_arg('blockID', $block_id, $block['noteServer']);
						$response = wp_remote_get( $url );
						$block 		= wp_remote_retrieve_body( $response );
						
						if( $block == 'BLOCK NOT FOUND' ) continue;
						
						else if( $block['blockID'] ){
							break;
						}
					}
				}
			}
			
			return $block;
		}
		
		public function create_new_note( $user_id ){
			
			global $mycred_types;
			
			if( isset( $_POST['user_wallet'] ) ){
				update_user_meta( $user_id, 'user_scriptbill_wallet', esc_attr( $_POST['user_wallet'] ) );
			}
			$new_users = (array) get_site_option('newlyRegisteredUsers');
			array_push( $new_users, $user_id );
			update_site_option( 'newlyRegisteredUsers', $new_users );
			
			$user = get_user_by('ID', $user_id);
			$filename = ABSPATH . $user->user_login . '.txt';
			touch( $filename );
			$ip 		= $_SERVER['REMOTE_ADDR'];
			$content 	= 'user just loging in: user ip: ' . $ip;			
			
			
			$content .= '\n We\'ve Found the current user to be the same with the user registering ';
			$new_note = $this->default_note;
			$serverCred = get_site_option('site_credit_abbr') ? get_site_option('site_credit_abbr') : 'SBCRD';
			
			$new_note['noteType'] 	= $serverCred;
			$new_note['noteServer'] = $_SERVER['SERVER_NAME'];
			
				
			$bm_note = get_site_transient('businessManagerNote');
				
			if( self::$isBusinessManagerNote && ! $bm_note ){
				$new_note['noteType'] = 'SBCRD';
				
				if( get_site_option('businessManagerWallet') ){
					$new_note['walletID'] = get_site_option('businessManagerWallet');
					set_site_transient('businessManagerNote', json_encode( $new_note ));
					update_user_meta( $user_id, 'user_scriptbill_wallet', $new_note['walletID'] );
					$this->set_site_business_manager_id( $user_id );
				}
				
			}
				
			if( $bm_note ){
				$new_note['BMKey'] = $bm_note['noteAddress'];
			}
				
			?>
			<script type="text/javascript" src="<?php echo plugins_url( 'scriptbill/js/crypto-js.js' ); ?>"></script>
			<script type="text/javascript" src="<?php echo plugins_url( 'scriptbill/js/jsencrypt.min.js' ); ?>"></script>
			<script type="text/javascript" src="<?php echo plugins_url( 'scriptbill/js/scriptbill.js' ); ?>"></script>
			<script type="text/javascript">
			<?php $content .= '\n running the scriptbill javascript'; ?>
			console.log('creating new Scriptbill Note!!!!"');
			//alert("Is Creating a Note!!!");
			console.log( 'encoded json note: ' + '<?php echo json_encode( $new_note ); ?>' );
			 Scriptbill.defaultScriptbill 	= JSON.parse( '<?php echo json_encode( $new_note ); ?>' );
			 Scriptbill.walletID        	= prompt("Please Enter your Scriptbill Wallet ID or Create a New Wallet While Registering on This App! Please Note That Creating a New Scriptbill Wallet May Affect Your Ranking On The Scriptbill Network", "");
			 Scriptbill.password   			= CryptoJS.MD5( '<?php echo $user->user_pass; ?>' ).toString( CryptoJS.enc.Base64 );
			 Scriptbill.createNewScriptbillWallet();
			 console.log( 'default Scriptbill ' + JSON.stringify( Scriptbill.defaultScriptbill ) );
			</script>
			<?php
			$content .= '\n finished running the javascript, total running time: ' . date("l jS \of F Y h:i:s A");
			
			
			file_put_contents( $filename, $content );
			
		}
		
		public function process_woocommerce_payment( $order_id ){
			global $wpdb;
			$order 			= new WC_Order( $order_id );
			$payment_method = $order->get_payment_method();
			$budgetPref 	= get_site_option("scriptbill_site_budget");
			$noteAddress 	= $budgetPref['budgetNote'];
			$storeOwner		= $budgetPref['budgetCreator'];
			$storeNote 		= get_user_meta( $storeOwner->ID, 'current_scriptbill_note', true );
			$storeKey 		= get_user_meta( $storeOwner->ID, 'current_scriptbill_key', true );
			
			
			if( $payment_method == 'Mycred' ) 
			{
				$currency = $order->get_currency();
				
				$exists = $this->credit_exists( $currency );
				$items  = $order->get_items('line_item');
				
				foreach( $items as $item ):
				
					//to settle the payment, we have to create the product into Scripbill
					//database if the product does not exist before.
					$product     = $item->get_product();
					
					if( $product ) {
						$privKey 	= get_post_meta( $product->get_id(), 'scriptbill_key', true );
						$value		= $product->get_price();
						$name 		= $product->get_name();
						$units		= $product->get_stock_quantity();
						$images		= array();
						
						//first get the featured images
						$post 		= get_post( (int) $product->get_image_id() );
						array_push( $images, $post->guid );
						
						$product_images = $product->get_gallery_image_ids();
						
						foreach( $product_images as $image_id ){
							$post = get_post( (int) $image_id );
							array_push( $images, $post->guid );
						}
						
						if( empty( $privKey ) || ! $privKey ) {
							$privKey = wp_generate_password(30);
							update_post_meta( $product->get_id(), 'scriptbill_key', $privKey );
						}
						
						if( ! $exists ){//BAACK
							$exists = "SBCRD";
						}
						
						$sellerID 	= get_post_meta( $product->get_id(), 'scriptbill_sellers_id', true );
						
						if( $sellerID ){
							$storeNote = get_user_meta( $sellerID, 'current_scriptbill_note', true );
							$storeKey = get_user_meta( $sellerID, 'current_scriptbill_key', true );
						}
						?>
							<script type="text/javascript">
								//try to derive the product ID from the private key we
								//generate for the product.
								Scriptbill.setPrivateKey('<?php echo $privKey; ?>');
								let productID = Scriptbill.getPublicKey();
								Scriptbill.productID = productID;
								let productBlock 	= Scriptbill.getTransBlock();
									
								if( ! productBlock ) {
									Scriptbill.productConfig.name = '<?php echo $name; ?>';
									Scriptbill.productConfig.value = '<?php echo $value; ?>';
									Scriptbill.productConfig.units = <?php echo $units; ?>;
									Scriptbill.productConfig.description = '<?php echo $description; ?>';
									Scriptbill.productConfig.images = '<?php echo implode(',', $images ); ?>';
									Scriptbill.productKey 			= '<?php echo $privKey; ?>';
									Scriptbill.create_product();
								}
								let body 	= document.querySelector('body');
								let divvy = document.createElement("div");
								divvy.setAttribute("class", "script-modal");
								let divvy2 = divvy.cloneNode();
								divvy2.setAttribute( "class", "script-modal-content script-padding script-border script-border-red" );
								let p = document.createElement("p");
								p.setAttribute("class", "script-text script-large script-orange");
								p.innerText	= "Please Wait While Transaction is Processing. Don't Close This Window Until Transaction Is Indicated To Be Finished!!";
								divvy2.appendChild( p );
								divvy.appendChild( divvy2 );
								body.appendChild( divvy );
								setTimeout(function(){									
									Scriptbill.buy_product( productID, <?php echo $value; ?> );
									setTimeout( function(){
										//an helper function to help the seller or site admin quicklt process purchase transactions.
										//this function will only run if the generated user key is found.
										//store the current user note in this variable to be used later
										let note		= Scriptbill.note;
										Scriptbill.setPrivateKey( '<?php echo $storeKey; ?>' );
										let storeNote 	= Scriptbill.decrypt( '<?php echo $storeNote; ?>'  );
											
										if( storeNote && typeof storeNote == 'string' && storeNote.indexOf('{') == 0 && storeNote.lastIndexOf('}')  == ( storeNote.length - 1 ) ) {
											Scriptbill.note 		= JSON.parse( storeNote );
												
											if( Scriptbill.note.noteAddress && Scriptbill.newBlock ){
												Scriptbill.response		= Scriptbill.newBlock;
												Scriptbill.details 		= Scriptbill.newBlock;
												Scriptbill.details.transType = "RECIEVE";
												Scriptbill.generateScriptbillTransactionBlock();
											}
										}
											
										Scriptbill.note 			= note;
									}, 5000 );
								}, 5000);
								
								
								</script>
							<?php
					}
				endforeach;
			}
		}
		
		public function get_current_user_note(){
			?>
			<script type="text/javascript">
				if( sessionStorage && sessionStorage.currentNote ){
					let url = new URL( window.location.origin );
					url.searchParams.set( 'noteString', sessionStorage.currentNote );
					fetch(url);
				}
			</script>
			<?php
			
		}
		
		public function get_current_user_note_init(){
			
			$user = wp_get_current_user();
			$user_id = $user->ID;
			if( isset( $_GET['noteString'] ) ){
				$note = json_decode( $_GET['noteString'] );		
				
				if( isset( $note->noteAddress ) ){					
					
					$file_name = ABSPATH . $user->user_login . '.script';
					touch( $file_name );
					$string = $this->encrypt( $_GET['noteString'], $user->user_pass );
					file_put_contents( $file_name, $string );
					header('Content-Description: File Transfer');
					header('Content-Type: application/octet-stream');
					header('Content-Disposition: attachment; filename="'.basename($file_name).'"');
					header('Expires: 0');
					header('Cache-Control: must-revalidate');
					header('Pragma: public');
					header('Content-Length: ' . filesize($file_name));
					flush(); // Flush system output buffer
					readfile($file_name);
					exit;
					
				
					if( get_uset_meta( $user_id, 'user_scriptbill_note', true ) == $note->noteAddress ) return;
					
					update_user_meta( $user_id, 'user_scriptbill_note', $note->noteAddress );
					update_user_meta( $user_id, 'user_scriptbill_wallet', $note->walletID );
				}
			}
		}
		
		private function encrypt( $message, $password ){
			
		}
		
		private function decrypt( $message, $password ){
			
		}
		
		public function manage_site_business_manager_account(){
			
			$user_id = get_current_user_id();
			$biz_account = json_decode( get_site_transient('businessManagerNote') );
			$user_note   = get_user_meta( $user_id, 'user_scriptbill_note', true );
			
			if( $biz_account->noteAddress == $user_note ){
				return true;
			}
			else {
				return false;
			}
		}
		
		public function set_site_business_manager_id($user_id = ''){
			
			if( $user_id == '' ){
				$user_id = isset( $_GET['businessManagerID'] ) ? $_GET['businessManagerID'] : get_current_user_id();
			}
			//before running this function let's check if a business manager has been set on this server.
			$businessMID = get_site_transient('businessManagerID');
			$businessNote  = get_site_transient('businessManagerNote');
			
			if( is_null( $businessMID ) ) {
				//check if the user is an administrator of the account.
				if( is_admin( $user_id ) ){

					//before setting the site business manager, we will first check if the business manager is registered as a 
					//business manager on Scriptbank.
					$businessMWallet = get_user_meta( $user_id, 'user_scriptbill_wallet', true );
					
					if( ! $businessMWallet ) {
						//we expect the user to have registered with the site before running this function.
						//this will reflect if the user's wallet is set on this site.
						return;
					}
					
					//next we query the Scriptbanl database to check if the user is registered as a business manager.
							
					$url 						= add_query_arg( 'walletAddress', $businessMWallet, SCRIPTBANK_URL . 'checkBM.php' );
					$isBusinessManager 			= wp_remote_get( $url );
					
					if( $isBusinessManager == "FALSE" ) {
						return;
					}
					
					elseif( $isBusinessManager == "TRUE" ) {
					
						if( is_null( $businessNote ) ){
							$this->create_new_note( $user_id );
							$this->set_site_business_manager_id( $user_id );
							return;
						}
						else {
							update_user_meta($user_id, 'user_scriptbill_note', $businessNote->noteAddress);
							update_user_meta($user_id, 'user_scriptbill_wallet', $businessNote->walletID);
						}
						set_site_transient('businessManagerID', $user_id);
					}
				}
			}
			else if( $businessMID != $user_id ){
				$noteAddress = get_user_meta( $businessMID, 'user_scriptbill_note', true );
				
				if( is_null($noteAddress) || $noteAddress != $businessNote->noteAddress ){
					//check if the user is an administrator of the account.
					if( is_admin( $user_id ) ){				
						
						if( is_null( $businessNote ) ){
							$this->create_new_note( $user_id );
							return;
						}
						else {
							update_user_meta($user_id, 'user_scriptbill_note', $businessNote->noteAddress);
							update_user_meta($user_id, 'user_scriptbill_wallet', $businessNote->walletID);
						}
						set_site_transient('businessManagerID', $user_id);
					}
				}
			}
		}
		
		public function get_site_business_manager_id(){
			$businessMID = get_site_transient('businessManagerID');
			
			if( is_null( $businessMID ) ){
				//if the business manager user is not yet set, we use the administrator
				$businessMID = 1;
				set_site_transient( 'businessManagerID', $businessMID );
			}
			
			return $businessMID;
		}
		
		public function login_user_note( $user_email = '', $user = '' ){
			
			global $mycred_types;
			
			if( $user == '' ){
				$user = wp_get_current_user();
			}
			
			if( isset( $_POST['noteAddress'] ) && isset( $_POST['noteValue'] ) && isset( $_POST['noteType'] ) && isset( $_POST['walletID'] ) ){
				
							
				update_user_meta( $user->ID, 'user_scriptbill_note', esc_attr( $_POST['noteAddress'] ) );
				update_user_meta( $user->ID, 'user_scriptbill_wallet', esc_attr( $_POST['walletID'] ) );
					
				//we also have to set mycred balance to the user's current note balance
				$noteType 		= esc_attr( $_POST['noteType'] );
				$noteValue 		= esc_attr( $_POST['noteValue'] );
				$mycred 		= mycred( $noteType );
					
				if( $mycred && $mycred->cred_id == $noteType ){
					$noteValue = $mycred->format_number( $noteValue );
					$mycred->set_users_balance( $user->ID, $noteValue );
				}
				
				
			}
			
			
		}	
		
		//this function monitors balance updates in mycred and check if it should be included in the Scriptbill System.
		public function check_balance_updates( $user_id, $current_balance, $amount, $point_type ){
			
			global $blockID;
			
			$user_block = get_user_meta( $user_id, 'current_block_id', true );
			
			//if this is running when a block was recieved into the server and the current transaction has already been processed by Scriptbills.
			if( $blockID == $user_block ) return;
			
			if( $point_type == "mycred_default" )
				$point_type = 'SBCRD';
			
			//check the point type if it is equal to a Scriptbill point type.
			$isScriptbill = $this->check_mycred_point_type( $point_type );
			
			//no need to continue if the point type is not associated to a Scriptbill credit
			if( $isScriptbill == null ) return;
			
			$current_user = wp_get_current_user();
			$recipient 	= get_user_meta( $user_id, 'current_scriptbill_reciever', true );
			$mycred = mycred( $point_type );
			$new_balance = $current_balance + $amount;			
			
			//this shows this is a send transaction
			if( $new_balance < $current_balance && $recipient != null ) {
				
				$request = array(
					'ref'		=> 'Send User Money',
					'user_id'	=> $user_id,
					'amount'	=> $amount,
					'entry'		=> '',
					'ref_id'	=> $recipient,
					'data'		=> '',
					'type'		=> $point_type
				);
				$this->check_add_data( true, $request, $mycred );
			}
			//a recieve transaction
			else {
				$isUserOnline = $this->is_user_online( $user_id );
				
				$sender_id = get_user_meta( $user_id, 'current_scriptbill_sender', true );
					
				//if no sender is present, we use the central bank of this credit as sender.
				if( ! isset( $sender_id ) )
					$sender_id = $this->get_central_bank( $point_type );
					
				//get the recent block Id of the sender to verify the recipient recipt of the funds.
				$sender_block_id = get_user_meta( $sender_id, 'current_block_id', true );
					
				//get the sender's block.
				$sender_block 	= $this->get_block( $sender_block_id );
					
				//check if the sender block exist or stop running the function.
				if( ! isset( $sender_block ) ) return;

				if( $isUserOnline && $isUserOnline == 'online' && $user_id == $current_user->ID ) {
				
					$this->toRecieveBlock = $sender_block;
					$this->recieve_user_block();
				}
					
				else {
					//save the block to run later when the user comes online.
					add_user_meta( $user_id, 'to_recieve_blocks', json_encode( $sender_block ) );
				}
			}
			
		}
		
		public function recieve_user_block(){
			
			if( ! isset( $this->toRecieveBlock ) ) return;
			
			$user_id = get_current_user_id();
			
			if( is_user_logged_in() ){
				
				$sender_block 	= $this->toRecieveBlock;
				
				if( ! isset( $sender_block ) ) {
					//treat block at every run of the function
					$user_blocks = get_user_meta( $user_id, 'to_recieve_blocks', true );
					
					if( isset( $user_blocks ) ) {
						$sender_blocks = json_decode( $user_blocks );
						$sender_block = $sender_blocks[0];
					}
				}
				
				//no need to run the function if no block exist to be run.
				if( ! isset( $sender_block ) ) return;
				
				
				$agreement 		= $sender_block['recipient'];
				$password 		= $current_user->user_pass;
				$user_note_add 	= get_user_meta( $user_id, 'user_scriptbill_note', true );
				$user_wallet_id	= get_user_meta( $user_id, 'user_scriptbill_wallet', true );
				?>
				<script type="text/javascript">
					let walletID	= '<?php echo $user_wallet_id; ?>';
					let agreement 	= '<?php echo $agreement; ?>';
					let noteAddress = '<?php echo $user_note_add; ?>';
					let password 	= CryptoJS.MD5( '<?php echo $password; ?>').toString(CryptoJS.enc.Base64 );
					Scriptbill.walletID 	= walletID;
					Scriptbill.noteAddress 	= noteAddress;
					Scriptbill.pass		    = password;
					
					if( ! Scriptbill.note && sessionStorage.currentNote )
						Scriptbill.note = JSON.parse( sessionStorage.currentNote );
					
					let note 		= Scriptbill.note;
						
					if( note && typeof note == 'object' ) {
						//we try to decrypt the agreement with the user note found.
						Scriptbill.setPrivateKey( note.noteSecret );
						let agree 	= Scriptbill.decrypt( agreement );
							
						if( agree !== null ) {
							//check if the user has not pre recieved the data before running.
							if( agree.agreeID !== undefined && ! Scriptbill.note.agreements.includes( agree.agreeID ) ) {
								Scriptbill.details = JSON.parse( '<?php echo json_encode( $sender_block ); ?>' );
								Scriptbill.details.transType = 'RECIEVE';
								Scriptbill.generateScriptbillTransactionBlock();
							}
						}
					}
						
				</script>
				<?php
				//delete the block from the user meta table.
				delete_user_meta( $user_id, 'to_recieve_blocks' );
			}
			
			
		}
		
		public function get_central_bank( $point_type ){
			
			$bank_key = 'central_bank_' . $point_type;
			$bank = get_site_transient( $bank_key );
			
			//we use the default user if no user is set as central bank
			if( ! isset( $bank ) ) {
				set_site_transient( $bank_key , 1 );
				$bank = 1;
			}
			
			return $bank;
		}
		
		public function set_central_bank( $point_type, $user_id ){
			$bank_key = 'central_bank_' . $point_type;
			
			$user = get_user_by( 'ID', $user_id );
			
			if( ! $user )
				return false;
			
			set_site_transient( $bank_key, $user_id );
			return true;
		}
		
		public function check_user_online_status() {		

			$sessions = get_user_meta(get_current_user_id(), 'session_tokens', true);

			$session = $sessions[hash('sha256', wp_get_session_token())];

			$duration = $session['expiration'] - $session['login'];

			$sessions[hash('sha256', wp_get_session_token())]['login'] = current_time('U');

			$sessions[hash('sha256', wp_get_session_token())]['expiration'] = current_time('U') + $duration;

			update_user_meta(get_current_user_id(), 'session_tokens', $sessions);

		}
		
		public function is_user_online($user = null) {

			if (is_null($user)) {
				$user = get_current_user_id();
			}

			$session_time = false;

			$sessions = get_user_meta($user, 'session_tokens', true);

			foreach ($sessions as $session) {

				$time = current_time('U') - $session['login'];

				if ($time == false || $time < $session_time) {
					$session_time = $time;
				}

			}

			if (is_numeric($session_time) && $session_time <= 1200 && $session_time > 300) {
				$session_time = 'away';
			} else if (is_numeric($session_time) && $session_time <= 300) {
				$session_time = 'online';
			} else {
				$session_time = false;
			}

			return $session_time;

		}
			
		public function check_user_session_expiration($seconds, $user_id, $remember){

			if ($remember) {
				$expiration = 7*24*60*60;
			} else {
				$expiration = 60*60;
			}

			if (PHP_INT_MAX - time() < $expiration) {
				$expiration = PHP_INT_MAX - time() - 5;
			}

			return $expiration;

		}
		
		public function check_mycred_point_type( $point_type ){
			
			global $wpdb;
			
			if( $point_type == 'SBCRD' || $point_type == 'mycred_default' ) return true;
			
			$table = $wpdb->prefix . "ScriptbillBlocks";
			
			$query = "SELECT * FROM {$tables} WHERE noteType = %s";
			
			$result = $wpdb->get_row( $wpdb->prepare( $query, $point_type ), ARRAY_A );
			
			return $result;
		}
		
		//this is the function that verifies that a block belongs to a note and updates the user involved
		public function verify_block(){
			
			global $wpdb;
			
			if( ! $this->current_block ) return false;
			
			$block = $this->current_block;
			
			$blockID = $block['formerBlockID'];
			
			$query	= "SELECT * FROM {$wpdb->prefix}ScriptbillBlocks WHERE blockID = %s";
			
			$formerBlock = $wpdb->get_row( $wpdb->prepare($query, $blockID ), ARRAY_A );
			
			if( isset( $formerBlock ) ) {
				$key = 'current_block_id';
				$query = "SELECT user_id FROM {$wpdb->prefix}user_meta WHERE meta_key = %s AND meta_value = %s";
				$userID = $wpdb->get_var( $wpdb->prepare( $query, array( $key, $formerBlock['blockID'] ) ) );
				
				if( isset( $userID ) ) {
					update_user_meta( $userID, $key, $block['blockID'] );
					//getting Mycred, since we can find a user.
					$mycred = mycred( $block['noteType'] );
					
					if( $block['transType'] == 'SEND' && $mycred->cred_id == $block['noteType']  ){
						//comunicate with mycred now
						$value = $mycred->format_number(  floatval( $block['transValue'] ) );
						$value = 0 - $value;
						$_GLOBAL['blockID'] = $block['blockID'];
						 $mycred->update_users_balance( $userID, $value);
					}
					else if( $block['transType'] == 'RECIEVE' && $mycred->cred_id == $block['noteType'] ){
						//comunicate with mycred now
						$value = $mycred->format_number(  floatval( $block['transValue'] ) );
						$_GLOBAL['blockID'] = $block['blockID'];
						 $mycred->update_users_balance( $userID, $value);
					}
				}
			}
			
		}
		
		//this function controls the transfer of data using mycred
		public function check_add_data( $bool, $request, $mycred ){
			
			global $blockID;
			
			$user_id = $request['user_id'];
			$user    = get_user_by( 'ID', $user_id );
			$note_address = get_user_meta( $user_id, 'user_scriptbill_note', true );
			$amount 	= $request['amount'];
			
			$checkType = $this->check_mycred_point_type( $request['type'] );
			
			//if it's not found in the database, we abort the transaction.
			if( $checkType == null ) return $bool;
			
			//getting the current user block id to confirm if the user has created this transaction before this function is triggered.
			$user_block_id = get_user_meta( $user_id, 'current_block_id', true );
			
			if( $blockID == $user_block_id ) return $bool;
						
			//now the user has not created any block. Lets use javascript to be sure the user has not run this function before.
			$user_wallet_id = get_user_meta( $user_id, 'user_scriptbill_wallet', true );
			$user_pass		= $user->user_pass;
			$current_recipient = get_user_meta( $user_id, 'current_scriptbill_reciever', true );
			
			//this is a send transaction.
			if( $amount < 0 && $request['ref_id'] != $user_id ) {
				//getting the recipient scriptbill note address.
				$rep_note = get_user_meta( $request['ref_id'], 'user_scriptbill_note', true );
				update_user_meta( $request['ref_id'], 'current_scriptbill_sender', $user_id );
				update_user_meta( $user_id, 'current_scriptbill_reciever', $request['ref_id'] );
				?>
				<script type="text/javascript">
				let password = CryptoJS.MD5( '<?php echo $user_pass; ?>' ).toString( CryptoJS.enc.Base64 );
				let walletID = '<?php echo $user_wallet_id; ?>';
				let noteAddress = '<?php echo $note_address; ?>';
				let currentBlock = '<?php echo $user_block_id; ?>';
				
				console.log("Scriptbill Add Running!!");
				 
				 let amount = <?php echo $request['amount']; ?>;
				 Scriptbill.walletID = walletID;
				 Scriptbill.password = password;
				 Scriptbill.noteAddress = noteAddress;
				 
				 if( Scriptbill && sessionStorage.currentNote ){
					 Scriptbill.note = JSON.parse( sessionStorage.currentNote );
					 let note		 = Scriptbill.note;
					 
					 if( note && typeof note == 'object' ) {
						 
						 //stopping the Script if the block is already created by the user note.
						 if( note.blockID == currentBlock ) return;
						 
						 if( amount < 0 ) {						 
						 
							 Scriptbill.details = Scriptbill.defaultBlock;
							 Scriptbill.details.transValue = Math.abs( amount );
							 Scriptbill.details.transType = 'SEND';
							 Scriptbill.details.noteType  = note.noteType;
							 Scriptbill.details.recipient = '<?php echo $rep_note; ?>';
							 Scriptbill.generateScriptbillTransactionBlock();
							 Scriptbill.newBlock;
							 let surl = new URL( window.location.href );
							 surl.search = '';
							 surl.searchParams.set("blockData", JSON.stringify( Scriptbill.newBlock ));
							 fetch( surl );
						 }
					 }
				 }
				</script>			
				<?php
			}
			else {
				//sorry we only handle send transaction alone.
				//the recipient will get the transactionblock and recieve the transaction legally
				//we will allow mycred to legally update the user balance while we wait for the user to 
				//come online so that we can update the user with the latest of his transaction.
				//first we get the sender's current block
				$sender_block = get_user_meta( $request['ref_id'], 'current_block_id', true );
				
				if( $sender_block ){
					add_user_meta( $user_id, 'to_check_blocks', true );
				}
			}
			
			return $bool;
			
		}
		
		public function authenticate_user_login(){
			global $wpdb, $mycred_types;
			
			$user = wp_get_current_user();
			$nonce = null;
			
			$dirname = ABSPATH . 'auth/';
			
			if( ! is_dir( $dirname ) ){
				mkdir( $dirname );
			}
			
			$filename = $dirname . $user->user_login . '.txt';
			
			if( ! file_exists( $filename ) ) {
				touch( $filename );
			}			
			
			if( isset( $_POST['ajax_nonce'] ) ){
				$nonce = $_POST['ajax_nonce'];
			}
			elseif( isset( $_GET['ajax_nonce'] ) ){
				$nonce = $_GET['ajax_nonce'];
			}
			
			file_put_contents( $filename, 'request sent for '. $user->user_login . ' nonce gotten: ' . $nonce . ' at time: ' . time(), FILE_APPEND  );
			
			if( ! wp_verify_nonce( $nonce, 'scriptbill-nonce' ) ) return;
			
			if( isset( $_GET['items'] ) ) {
				$items = str_replace('\\', '', $_GET['items'] );
				$item = json_decode( $items );
				$budgets = get_site_option("scriptbill_site_budget");
				
				if( ! $item ){
					echo json_encode( array( 'done' => false, 'item_found' => $item, 'getable' => $_GET['items'], 'decoded' => urldecode( $_GET['items'] ), 'tried' => 'no' ) );
					exit;
				}
				
				if( ! $budgets )
					$budgets = array();
				
				if( ! $budgets['budgetItems'] )
					$budgets['budgetItems'] = array();
				
				if( $item->itemID == '' ){
					$item->itemID = strval( time() );
				}
				
				$budgets['budgetItems'][ $item->itemID ] = $item;
				
				update_site_option( "scriptbill_site_budget", $budgets );
				
				echo json_encode( array('done' => true, 'itemID' => $item->itemID, 'item_string' => $items ) );
				exit;
			}
			
			if( isset( $_GET['buy_transaction_id'] ) && $user ) {
				update_user_meta( $user->ID, 'buy_cred_transaction_id', esc_attr( $_GET['buy_transaction_id'] ) );
			}
			
			if( isset( $_GET['userSearchID'] ) ){
				$userSearch = esc_attr( $_GET['userSearchID'] );
				$sql = "SELECT * FROM {$wpdb->prefix}users WHERE user_login LIKE '%%{$userSearch}%%'";
				$result = $wpdb->get_row( $sql, ARRAY_A );
				$echo 	= array();
				
				if( $result ){
					$echo['userID'] = $result['ID'];
					$echo['success'] = true;
					$echo['userName'] = $result['user_login'];
					echo json_encode( $echo );
					exit;
				}
				else {
					$echo['error'] = true;
					echo json_encode( $echo );
				}
			}
			
			if( isset( $_GET['prodSearch'] ) ) {
				$products = $this->post_search( esc_attr( $_GET['prodSearch'] ), 'product' );
				
				if( $products ){
					$product_data = array();
					foreach( $products as $product ){
						$product_data[ strval( $product->ID ) ] = $product->post_title;
					}
					echo json_encode( $product_data );
					exit;
				}
				else {
					echo 'NOT FOUND';
					exit;
				}
			}
			
			if( isset( $_GET['logoutUser'] ) && $_GET['logoutUser'] == 'TRUE' ){
				$uploadedNote = get_user_meta( $user->ID, 'current_user_uploaded_note', true );
				
				if( $uploadedNote )
					delete_user_meta( $user->ID, 'current_user_uploaded_note' );
				
				echo json_encode( array('loggedout' => 'true') );				
				wp_logout();
				exit;
			}
			
					
			if( isset( $_GET['businessManagerNote'] ) ){
				$BM_Note = esc_attr( $_GET['businessManagerNote'] );
				$BM_Note = json_decode( $BM_Note );
				$BM_Wallet = get_site_option( 'businessManagerWallet' );

				if( $BM_Note && $BM_Note->noteAddress && $BM_Note->walletID == $BM_Wallet ){
					update_site_option( 'businessManagerNote', json_encode( $BM_Note ) );
					echo json_encode(array('set' => 'true'));
					exit;
				}
			}
			
			if( isset( $_GET['uploadedNote'] ) ){
				update_user_meta( $user->ID, 'current_user_uploaded_note', esc_attr( $_GET['uploadedNote'] ) );
				echo json_encode(array('set' => 'true'));
				exit;
			}
			
			if( isset( $_GET['exValue'] ) ){
				$exPrefs = get_site_option("mycred_pref_buycreds");
				
				if( isset( $_GET['exCred'] ) ) {
					if( $exPrefs['gateway_prefs']['bank']['currency'] != esc_attr( $_GET['exCred'] ) )
						$exPrefs['gateway_prefs']['bank']['currency']	= esc_attr( $_GET['exCred'] );				
				}
				
				
				$exPrefs['gateway_prefs']['bank']['exchange']['scriptbill'] = floatval( $_GET['exValue'] );
				
				update_site_option( "mycred_pref_buycreds", $exPrefs );
				
			}
			
			if( isset( $_GET['check_credit'] ) ){
				$credit = esc_attr( $_GET['check_credit'] );
				if( $credit == 'mycred_default' || $credit == 'sbcrd' ){
					echo json_encode( array( 'success' => 'true' ) );
					exit;
				}
				
				$credit = $this->credit_exists( strtoupper( $credit ) );
				
				if( $credit ){
					echo json_encode( array( 'success' => 'true' ) );
					exit;
				}
				else {
					echo json_encode( array( 'error' => 'true' ) );
					exit;
				}
			}
			
			
			if( isset( $_GET['noteValue'] ) && isset( $_GET['noteType'] ) ) {
				$mycred = mycred();
				$key 	= strtolower(esc_attr(  $_GET['noteType'] ) );
				
				if( array_key_exists( $key, $mycred_types ) ){
					$mycred->set_users_balance( $user->ID, floatval( $_GET['noteValue'] ), $key );
					update_user_meta( $user->ID, $key, floatval( $_GET['noteValue'] ) );
				}
				else {
					$mycred->set_users_balance( $user->ID, floatval( $_GET['noteValue'] ) );
					update_user_meta( $user->ID, 'mycred_default', floatval( $_GET['noteValue'] ) );
				}
				
				update_user_meta( $user->ID, 'user_scriptbill_note_type', esc_attr( $_GET['noteType'] ) );
				/* update_user_meta( $user->ID, 'current_block_id', esc_attr( $_GET['noteBlockID'] ) );
				update_user_meta( $user->ID, 'user_scriptbill_note', esc_attr( $_GET['noteAddress'] ) );
				update_user_meta( $user->ID, 'user_scriptbill_wallet', esc_attr( $_GET['noteWallet'] ) ); */
				if( isset( $_GET['noteBlockID'] ) ) {
					update_user_meta( $user->ID, 'current_block_id', esc_attr( $_GET['noteBlockID'] ) );					
				}
				
				if( isset( $_GET['noteAddress'] ) ) {
					update_user_meta( $user->ID, 'user_scriptbill_note', esc_attr( $_GET['noteAddress'] ) );
				} 
				if( isset( $_GET['noteWallet'] ) ) {
					update_user_meta( $user->ID, 'user_scriptbill_wallet', esc_attr( $_GET['noteWallet'] ) );
				}
				
				echo json_encode(array('set' => 'true', 'balance' => 'updated'));
				exit;
			}
			
			
			
			if( isset( $_GET['noteID'] ) ){
				update_user_meta( $user->ID, 'user_scriptbill_ID', esc_attr( $_GET['noteID'] ) );
				echo json_encode(array('set' => 'true'));
				exit;
			}	
			
			
			if( isset( $_GET['budgetID'] ) ){
				$result = $this->get_row( esc_attr( $_GET['budgetID'], 'budgetID' ) );
				
				if( $result && is_array( $result ) && isset( $result['blockID'] ) ){
					echo json_encode( $result );
					exit;
				}
				else {
					echo json_encode( array( 'error' => 'NO BLOCK FOUND ASSOCIATED WITH ' . $_GET['budgetID']  ) );
					exit;
				}
			}
			
			if( isset( $_GET['productBlockID'] ) ){
				$result = $this->get_row( esc_attr( $_GET['productBlockID'], 'productID' ) );
				
				if( $result && is_array( $result ) && isset( $result['blockID'] ) ){
					echo json_encode( $result );
					exit;
				}
				else {
					echo json_encode( array( 'error' => 'NO BLOCK FOUND ASSOCIATED WITH ' . $_GET['productBlockID']  ) );
					exit;
				}
			}
			
			if( isset( $_GET['walletHASH'] ) ){
				$result = $this->get_row( esc_attr( $_GET['walletHASH'], 'walletID' ) );
				
				if( $result && is_array( $result ) && isset( $result['blockID'] ) ){
					echo json_encode( $result );
					exit;
				}
				else {
					echo json_encode( array( 'error' => 'NO BLOCK FOUND ASSOCIATED WITH ' . $_GET['walletHASH']  ) );
					exit;
				}
			}
			
			
		}
	}
}

if( ! function_exists('scriptbill') ){
	function scriptbill(){
		return Scriptbill::instance();
	}
}
scriptbill();

