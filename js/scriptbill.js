class Scriptbill {

	static noteID;//The id of the note which changes on every transaction made.
	static noteAddress;//the address of the current note the user wants to use.
	static noteType		= 'SBCRD';//the class of the note.
	static l = localStorage;//Scriptbill may represent the permanent storage of a particular user. Since Scriptbill torage is limited, few things can be stored on the user's database, so we strink data everyday to ensure spaces are available for use on Scriptbill storage.
	static s = sessionStorage;//Scriptbill storage is used to save things that would not be beyyond the current browaer session of the user, if data expected to be on Scriptbill storage is not found, then the user would be asked to log in again to rebuild the data
	
	static walletID; //Scriptbill is the unique identifier of a particular user in the network. With Scriptbill, all Scriptbill note that the person holds will be in one place.
	//scriptbill will store all the responses it gets from servers it communicate with in Scriptbill variable. 
	//set to be static to help it eaily accessed outside the scope of Scriptbill class.
	static response;
	
	//the interest rate set by Scriptbank on crediter who will choose to use Scriptbill credit instead of demanding for it.
	static interestRate = 0.2;
	
	//the rate at which the interest will be calculated. Values include PT for "Per Transaction", DL for "Daily", 
	//HL for "Hourly" E{N}D for "Every N Days", E{N}H for "Every N Hours", E{N}M for "Every N Minutes", E{N}W for 
	//"Every N weeks" WL for "Every Week" E{N}M for "Every N Months" ML for "Monthly"
	static interestType = "PT";
	
	//JSEncrypt = new JSEncrypt({default_key_size: 2048});
	static default_key_size = 10;
	//important to set the default scriptbill server as a constant here so that the script can easily 
	//work with it and won't be causing difficulty while updating.
	static default_scriptbill_server = "https://dev-cmbf-bank.pantheonsite.io/";
	//the current Scriptbill note that is being instantiated will rest in Scriptbill variable.
	//the session storage variable helps further share the information on the latest note.
	//the session storage of the current note is updated everytime a note is saved or gotten from the database.
	static #note;
	//the current note. Contains public keys of the private key stored on the note variable.
	static currentNote;
	//data that would be sent will be stored on this variable
	static data;
	//user inputted password that may be required to decrypt or encypt some important financial data from
	//the Scriptbill note.
	static #password;	
	//the exchange transaction variables for selling a credit type.
	static sellCredit;
	//the exchange transaction variable for buying a credit type.
	static buyCredit;
	//the transaction value of a particular transaction may be kept here for transactions like credit
	//and stock exchanges.
	static transValue;
	
	//used majorly to store strings that will be hashed later by the hash functions.
	static string;
	
	//alpha numeric
	static #alpha_numeric = "aAbBcCdDeEfFgGhHiIjJkKlLmMnNoOpPqQrRsStTuUvVwWxXyYzZ1234567890";
	
	//extended varchar.
	static #varchar       = "~`!@#$%^&*()-_=+[]{}\\|;:\"'<,>.?/";
	
	//send transaction types in array.
	static transSend = ['SEND'/*Normal Sending Money*/, 'INVEST'/*A Special Transaction Type That Describes an Investment, Different From Defined Stock or Bond Investment*/, 'STOCKPAY'/*Describes a Dividend Payment*/, 'BUYPRODUCT'/*Describes the Purchase of a Product*/, 'BUYSTOCK'/*Describes the Purchase of a Stock*/, 'BUYBOND'/*Describes the Purchase of a Bond*/, 'BONDPAY'/*Describes an Interest Payment*/, 'PROFITSHARING'/*Describes a Profit Sharing Transaction*/, 'PRODUCTSUB'/*Describes a Product Subscription Transaction*/, 'CANCELLED'/*Describes a Cancelled Transaction*/, 'INTERESTPAY'/*A transaction type to pay interest from a loan*/];
	
	//recieve transaction types in array.
	static transRecieve = ['RECIEVE'/*Normal Recieve Transaction From SEND*/, 'INVESTRECIEVE'/*Describes the reception of an Investment from INVEST*/, 'PROFITRECIEVE'/*Describes the reception of profit from PROFITSHARING*/, 'STOCKRECIEVE'/*Describes the reception of a Stock when purchased*/, 'BONDRECIEVE'/*Describes the reception of Bond when Purchased*/];
	
	//other transaction types that do not update the value of the note.
	static otherTrans   = ['UPDATE'/*A transaction type that describes the Update of a Particular Value in the Note without Updating the Value*/, 'CREATEPRODUCT'/*Just like Update Transaction, it helps the note include a Product to the database*/, 'CREATE'/*This transaction describes that a new note or wallet has been created*/, 'CREATEBUDGET'/*This transaction helps include a budget into the datatable*/, 'EXCHANGE'/*This transaction describes an exchange request in the database*/, 'AGREEMENTSIGN'/*This transaction type is an update transaction that describes that an agreement is being signed by the sender, telling the network that the sender is satisfied with a transaction*/, 'AGREEMENTREQUEST'/*This is a transaction type sent by the reciever of a transaction, requesting that the sender cancels the execution of a set agreement in a transaction*/, 'SELLSTOCK'/*This is a transaction request by a stock note seller, telling the nettwork he has stocks to be sold.*/, 'QUOTESTOCK'/*This transaction request that helps the invest create an actual stock note.*/, 'QUOTE', 'SOLDSTOCK'/*This is a transaction request telling the network that a particular stock has been sold.*/, 'SELLBOND'/*Transtype desribing a request to sell bonds*/, 'SOLDBOND'/*a transaction request telling the network a particular bond have been sold.*/, 'QUOTEBOND'/*a transaction request to quote a bond note, just like a create transType*/];
	
	//neccessary for programmers to determine whether to alert the account details in an exchange
	//transaction or not.
	static alertDetails = true;
	//to help insert a product into the Scriptbill database that can be accessed and even used by any 
	//server in the world. we design the static product config variable that will guide the product 
	//creator on the right kind of information needed to insert a product successfully in the Scriptbill 
	//database.
	static productConfig = {
		'value'			: 0,//the original value of the product.
		'units'			: 0,//the units of products available in the System
		'totalUnits'	: 0,//total units of product included to the scriptbill systems
		'name'			: '', // the name of the product.
		'description'	: '',//description of product, HTML allowed
		'images'		: '',//urls to images that describe the product
		'videos'		: '', //urls to videos that describe the product
		'creditType'	: '', //the type of credit which the product is being valued.
		'sharingRate'	: 0.2,//the profit sharing rate on the product
		'blockExpiry'	: '1 months', //tells time the transaction block of the buyer will expire.
	};
	
	//this is the ranks that will be inherited by Scriptbill users based on their
	//rank value.
	static #scriptbillRanks = {
				"IFVSSKJBHKSBUD" 	: { "min" : 0, "max" : 10, "fellowship" : "CMBF Beginner"/*Fellowship Rank*/, "military" : "CMBF Recruit"/*Military Rank*/, "business" : "CMBF Apprentice"/*Business Rank*/, "businessManager" : "CMBF Trainee"/*Business Manager Rank*/, "political" : "CMBF Council Member"/*Political Rank*/, "investment" : "CMBF Asset Seeker"/*Investment Rank*/,"credit_level": 100/*Number of Scriptbill Credit the user can get per transaction when balance is low*/, "code": "IFVSSKJBHKSBUD"/*This is the code that tells the network about the user rank*/, "slot": 1/*This is the number of users that can fit in to ranks in this level*/, "level": 1},
				"BJHVKDKNVKDXHCIJ" 	: {"min" : 10, "max" : 100, "fellowship":"CMBF Member", "military":"CMBF Recruit Two","business":"CMBF Apprentice Two", "businessManager":"CMBF Executive Trainee", "political":"CMBF Council Member Two", "investment":"CMBF Asset Taker", "credit_level": 1000, "code": "BJHVKDKNVKDXHCIJ", "slot": 0.9, "level": 2},			
				"SJUSGRFIDUGVDISCSI"	: { "min": 100, "max": 1000, "fellowship":"CMBF Trainee Worker", "military":"CMBF Private", "business":"CMBF Establisher", "businessManager":"CMBF Officer", "political":"CMBF Councilor", "investment":"CMBF Asset Bringer","credit_level": 10000, "code": "SJUSGRFIDUGVDISCSI" , "slot": 0.8/*Telling the rate of persons that can particpate against the total population in the world*/, "level": 3},
				"HFOSBTIUSHGLDJNXK"	: { "min": 1000, "max": 5000, "fellowship":"CMBF Worker", "military":"CMBF Private Two", "business":"CMBF Proprietor", "businessManager":"CMBF Assistant Business Officer", "political":"CMBF Senior Councilor", "investment":"CMBF Asset Owner", "credit_level": 50000, "code": "HFOSBTIUSHGLDJNXK", "slot": 0.7, "level": 4},
				"LDUIDLNFBPVUADBJKNA"	: { "min":5000, "max": 10000, "fellowship":"CMBF Senior Worker", "military":"CMBF Private Second Class", "business":"CMBF Senior Proprietor", "businessManager":"CMBF Assistant Senior Business Officer", "political":"CMBF Local Councilor", "investment":"CMBF Asset Raiser", "credit_level": 100000, "code": "DUIDLNFBPVUADBJKNA", "slot": 0.6, "level": 5 },
				"OVUBSAFBVDSILFNSOH" : { "min":10000, "max":20000, "fellowship":"CMBF Assistant Deacon", "military":"CMBF Private First Class", "business":"CMBF Executive Proprietor", "businessManager":"CMBF Business Officer", "political":"CMBF Area Councilor", "investment":"CMBF Asset Multiplier", "credit_level": 200000, "code": "OVUBSAFBVDSILFNSOH", "slot": 0.5, "level": 6 },
				"DIBVOSIBASVOVS"	: { "min":20000, "max": 50000, "fellowship":"CMBF Deacon", "military":"CMBF Lance Corporal", "business":"CMBF Senior Proprietor", "businessManager":"CMBF Deputy Business Officer",  "political":"CMBF Inspecting Councilor", "investment":"CMBF Asset Grader", "credit_level": 500000, "code": "DIBVOSIBASVOVS", "slot": 0.45, "level": 7},
				"DFOBVODBVJODZBN"	: {"min":50000, "max":100000, "fellowship":"CMBF Senior Deacon", "military":"CMBF Corporal", "business":"CMBF Senior Executive Proprietor", "businessManager":"CMBF Senior Deputy Business Officer", "political":"CMBF Deputy Local Chairman", "investment":"CMBF Asset Manager Gold", "credit_level": 1000000, "code":"DFOBVODBVJODZBN", "slot": 0.4, "level": 8},
				"OBSFBVIAPVVPAVSB"	: {"min":100000, "max": 250000, "fellowship":"CMBF High Deacon", "military":"CMBF High Corporal", "business":"CMBF Sleeping Business Partner", "businessManager":"CMBF Business Officer", "political":"CMBF Local Chairman Adviser", "investment":"CMBF Asset Manager Platinum", "credit_level": 2500000, "code":"OBSFBVIAPVVPAVSB", "slot": 0.35, "level": 9},
				"OBVISBAUBVIFBUI"	: {"min": 250000, "max": 500000, "fellowship":"CMBF Assistant Priest", "military":"CMBF Sergent", "business":"CMBF Assisting Business Partner", "businessManager":"CMBF Deputy Senior Business Officer", "political":"CMBF Local Chairman Cabin Member", "investment":"CMBF Asset Manager Diamond", "credit_level": 5000000, "code":"OBVISBAUBVIFBUI", "slot": 0.3, "level": 10},
				"BDSBVSDIPBFUIDBVUB"	: {"min":500000, "max":1000000, "fellowship":"CMBF Priest", "military":"CMBF Senior Sergent", "business":"CMBF Acting Business Partner", "businessManager":"CMBF Senior Business Officer", "political":"CMBF Local Chairman", "investment":"CMBF Asset Manager Star", "credit_level":10000000, "code":"BDSBVSDIPBFUIDBVUB", "slot": 0.25, "level": 11},
				"GSUAJBVDFSBUISBUIBSDUIB"	: {"min":1000000, "max":2500000, "fellowship":"CMBF High Priest", "military":"CMBF Staff Sergent", "business":"CMBF Business Partner", "businessManager":"CMBF Assistant Business Manager", "political":"CMBF Local Inspector", "investment":"CMBF Asset Manager Galaxy", "credit_level":25000000, "code":"GSUAJBVDFSBUISBUIBSDUIB", "slot": 0.2, "level": 12},
				"BVAHKBVSDIUFVUIGAUBUIDA"	: {"min":2500000, "max":5000000, "fellowship":"CMBF Senior High Priest", "military":"CMBF Warrant Officer", "business":"CMBF Senior Business Partner", "businessManager":"CMBF Acting Business Manager", "political":"CMBF Honourable", "investment":"CMBF High Asset Manager Gold", "credit_level":50000000, "code":"BVAHKBVSDIUFVUIGAUBUIDA", "slot": 0.15, "level": 13},
				"IBDIBDVIBSDZIBFIUFBBDXKJV"	: {"min":5000000, "max":10000000, "fellowship":"CMBF Chief Priest", "military":"CMBF Senior Warrant Officer", "business":"CMBF Business Gold Partner", "businessManager":"CMBF Business Manager", "political":"CMBF Golden Honourable", "investment":"CMBF High Asset Manager Platinum", "credit_level":100000000, "code":"IBDIBDVIBSDZIBFIUFBBDXKJV", "slot": 0.1, "level": 14},
				"HASBVHIOADIYVBDIHABIDB"	: {"min":10000000, "max":25000000, "fellowship":"CMBF High Chief Priest", "military":"CMBF Deputy Chief Warrant Officer", "business":"CMBF Business Platinum Partner", "businessManager":"CMBF Assistant Local Business Manager", "political":"CMBF Platinum Honourable", "investment":"CMBF High Asset Manager Diamond", "credit_level":250000000, "code":"HASBVHIOADIYVBDIHABIDB", "slot": 0.05, "level": 15},
				"OADBVIUDBFVUBSDUFBDA"	: {"min":25000000, "max":50000000, "fellowship":"CMBF Assistant Bishop", "military":"CMBF Chief Warrant Officer 1", "business":"CMBF Business Star Partner", "businessManager":"CMBF Local Business Manager", "political":"CMBF Star Honourable", "investment":"CMBF High Asset Manager Star", "credit_level":500000000, "code":"OADBVIUDBFVUBSDUFBDA", "slot": 0.025, "level": 16},				
				"JAFBVJPBDIOVPBADBABUABV"	: {"min":50000000, "max":100000000, "fellowship":"CMBF Area Bishop", "military":"CMBF Chief Warrant Officer 2", "business":"CMBF Business Product Inventor", "businessManager":"CMBF Assistant Area Business Manager", "political":"CMBF House Clerk", "investment":"CMBF Senior Asset Manager", "credit_level":1000000000, "code":"JAFBVJPBDIOVPBADBABUABV", "slot": 0.0125, "level": 17},
				"JSBDVIABVIDUHVADUPHUAH"	: {"min":100000000, "max":125000000, "fellowship":"CMBF Assistant State Bishop", "military":"CMBF Chief Warrant Officer 3", "business":"CMBF Business Golden Product Inventor", "businessManager":"CMBF Area Business Manager", "political":"CMBF Deputy Chief Whip", "investment":"CMBF Senior Asset Manager Gold", "credit_level":1250000000, "code":"JSBDVIABVIDUHVADUPHUAH", "slot": 0.00625, "level": 18},//Deputy Lieutenant
				"HIOADSOVHOIAHIOHOVHOHHVOAIH"	: {"min":125000000, "max":150000000, "fellowship":"CMBF State Bishop", "military":"CMBF Chief Warrant Officer 4", "business":"CMBF Business Platinum Product Inventor", "businessManager":"CMBF Assistant State Business Manager", "political":"CMBF Chief Whip", "investment":"CMBF Senior Asset Manager Platinum", "credit_level":1500000000, "code":"HIOADSOVHOIAHIOHOVHOHHVOAIH", "slot": 0.003125, "level": 19},//
				"NKSLFNMKLNDSBFKLNDKNLKDNLKAD"	: {"min":150000000, "max":200000000, "fellowship":"CMBF Assistant Regional Bishop", "military":"CMBF Chief Warrant Officer 5", "business":"CMBF Business Diamond Product Inventor", "businessManager": "CMBF State Business Manager", "political":"CMBF Deputy Majority Leader", "investment":"CMBF Senior Asset Manager Star", "credit_level":200000000, "code":"NKSLFNMKLNDSBFKLNDKNLKDNLKAD", "slot": 0.0015625, "level": 20},//
				"AOJBHVUOHSUOBVSJBVUJABUIOABU"	: {"min":200000000, "max":225000000, "fellowship":"CMBF Regional Bishop","military":"CMBF Deputy Lieutenant", "business":"CMBF Business Star Product Inventor", "businessManager":"CMBF Assistant Regional Business Manager", "political":"CMBF Majority Leader", "investment":"CMBF Asset Director", "credit_level":2250000000, "code":"AOJBHVUOHSUOBVSJBVUJABUIOABU", "slot": 0.00078125, "level": 21},//Regional Lieutenant
				"Level 19"	: {"min":225000000, "max":250000000, "fellowship":"CMBF Assistant National Bishop", "military":"CMBF Second Lieutenant", "business":"CMBF Business Product Manager", "businessManager":"CMBF Regional Business Manager", "political":"CMBF Deputy Speaker", "investment":"CMBF Asset Director Gold", "credit_level":2500000000, "code":"OHSBUBSVUIBSDIUBVSUIB", "slot": 0.000390625, "level": 22},//
				"SDBUIFBVSIBISBVHBVIUBSDI"	: {"min":250000000, "max":300000000, "fellowship":"CMBF National Bishop", "military":"CMBF Lieutenant", "business":"CMBF Business Gold Product Manager", "businessManager":"CMBF Assistant National Business Manager", "political":"CMBF House Speaker", "investment":"CMBF Asset Director Platinum", "credit_level":3000000000, "code":"SDBUIFBVSIBISBVHBVIUBSDI", "slot": 0.0001953125, "level": 23},
				"IAVBIBAIABUBDIUBVIBUIDZ"	: {"min":300000000, "max":350000000, "fellowship":"CMBF ArchBishop", "military":"CMBF State Lieutenant", "business":"CMBF Business Platinum Product Manager", "businessManager":"CMBF National Business Manager", "political":"CMBF Deputy State Governor", "investment":"CMBF Asset Director Diamond", "credit_level":3500000000, "code":"IAVBIBAIABUBDIUBVIBUIDZ", "slot": 0.00009765625, "level": 24 },//Captain
				"DFBIHBVSIBIUSDBIUVBIS"	: {"min":350000000, "max":400000000, "fellowship":"CMBF Senior ArchBishop", "military":"CMBF National Lieutenant", "business":"CMBF Business Star Product Manager", "businessManager":"CMBF Assistant Continental Business Manager", "political":"CMBF State Governor", "investment":"CMBF Asset Director Star", "credit_level":4000000000, "code":"DFBIHBVSIBIUSDBIUVBIS", "slot": 0.000048828125, "level": 25},//Senior Captain
				"HBHDVIDBZHVBDILBUIDB"	: {"min":400000000, "max":500000000, "fellowship":"CMBF Continental ArchBishop", "military":"CMBF Captain", "business":"CMBF Business Product Director", "businessManager":"CMBF Continental Business Manager", "political":"CMBF State Inspector", "investment":"CMBF Asset Commander", "credit_level":5000000000, "code":"HBHDVIDBZHVBDILBUIDB", "slot": 0.0000244140625, "level": 26},
				"DJBVFIBDIUBVUIDBUIDUI"	: {"min":500000000, "max":600000000, "fellowship":"CMBF Senior Continental ArchBishop", "military":"CMBF Senior Captain", "business":"CMBF Business Gold Product Director", "businessManager":"CMBF Assistant General Business Manager", "political":"CMBF Deputy Minister of State", "investment":"CMBF Asset Commander", "credit_level":6000000000, "code":"DJBVFIBDIUBVUIDBUIDUI", "slot": 0.00001220703125, "level": 27 },
				"SJBVISBSIVBIPDBVBIDBUBDVZJKL"	: {"min": 600000000, "max":750000000, "fellowship":"CMBF Chief ArchBishop", "military":"CMBF Chief Captain", "business":"CMBF Business Platinum Product Director", "businessManager":"CMBF Assistant General Business Manager", "political":"CMBF Minister of State", "investment":"CMBF Asset Commander Gold", "credit_level":7500000000, "code":"SJBVISBSIVBIPDBVBIDBUBDVZJKL", "slot": 8.138020833333333e-6, "level": 28},
				"HIVDHVBDHDIBVIADUIBU"	: {"min":750000000, "max":900000000, "fellowship":"CMBF Senior ArchBishop", "military":"CMBF Captain Major", "business":"CMBF Business Diamond Product Director", "businessManager":"CMBF Deputy General Business Manager", "political":"CMBF Assistant Regional Minister", "investment":"CMBF Asset Commander Platinum", "credit_level":9000000000, "code":"HIVDHVBDHDIBVIADUIBU", "slot": 6.781684027777778e-6, "level": 29},
				"HBVIHADVFIBVSJKLBKBAS"	: {"min":900000000, "max": 1100000000, "fellowship":"CMBF Assistant National Cardinal", "military":"CMBF Major", "business":"CMBF Business Star Product Director", "businessManager":"CMBF General Business Manager", "political":"CMBF Regional Minister", "investment":"CMBF Asset Commander Star", "credit_level":11000000000, "code":"HBVIHADVFIBVSJKLBKBAS", "slot": 5.651403356481481e-6, "level": 30},
				"BDHBSVIDBVIUSFGIBVAYH"	: {"min": 1100000000, "max":1300000000, "fellowship":"CMBF National Cardinal", "military":"CMBF Chief Major", "business":"CMBF Business Product Chairman", "businessManager":"CMBF Assistant State Business Director", "political":"CMBF Assistant National Minister", "investment":"CMBF Asset Analyst", "credit_level":13000000000, "code":"BDHBSVIDBVIUSFGIBVAYH", "slot": 5.651403356481481e-6, "level": 31},
				"DHBFVSSDHBJHVDBJKSDJHKBV"	: {"min":1300000000, "max": 1500000000, "fellowship":"CMBF Assistant Continental Cardinal", "military":"CMBF Lieutenant Colonel", "business":"CMBF Business Gold Product Chairman", "businessManager":"CMBF State Business Director", "political":"CMBF National Minister", "investment":"CMBF Gold Asset Analyst", "credit_level":15000000000, "code":"DHBFVSSDHBJHVDBJKSDJHKBV", "slot": 5.651403356481481e-6, "level": 32 },
				"KSDBHFBVGYIOGVYISBGBDYIF"	: {"min":1500000000, "max":1750000000, "fellowship":"CMBF Continental Cardinal", "military":"CMBF Colonel", "business":"CMBF Business Platinum Product Chairman", "businessManager":"CMBF Assistant Regional Business Director", "political":"CMBF National House Member", "investment":"CMBF Platinum Asset Analyst", "credit_level":17500000000, "code":"KSDBHFBVGYIOGVYISBGBDYIF", "slot": 4.467512534767969e-6, "level": 33},
				"OJBDFAUBVIDUBUISBUISD"	: {"min":1750000000, "max":2000000000, "fellowship":"CMBF Pope Carbinet Member", "military":"CMBF Colonel Major", "business":"CMBF Business Diamond Product Chairman", "businessManager":"CMBF Regional Business Director", "political":"CMBF National House Leader", "investment":"CMBF Diamond Asset Analyst", "credit_level":20000000000, "code":"OJBDFAUBVIDUBUISBUISD", "slot": 3.722927112306641e-6, "level": 34},
				"JOBAFDUBVSDUIBSDIPGBUFUIA"	: {"min":2000000000, "max":2300000000, "fellowship":"CMBF Pope Carbinet Leader", "military":"CMBF Brigadier General","business":"CMBF Business Star Product Chairman", "businessManager":"CMBF Assistant National Business Director", "political":"CMBF National House Minority Whip", "investment":"CMBF Star Asset Analyst", "credit_level":23000000000, "code":"JOBAFDUBVSDUIBSDIPGBUFUIA", "slot": 2.978341689845313e-6, "level": 35},
				"OFBNIBFVIFBISBJKLSNVJB"	: {"min":2300000000, "max":2600000000, "fellowship":"CMBF Pope Carbinet Minority Whip Leader", "military":"CMBF Brigadier General Star 2", "business":"CMBF Business Vice Executive State Product Chairman", "businessManager":"CMBF Deputy National Business Director", "political":"CMBF National House Majority Whip", "investment":"CMBF Asset Trader", "credit_level":26000000000, "code":"OFBNIBFVIFBISBJKLSNVJB", "slot": 2.291032069111779e-6, "level": 36 },
				"IHBSDIVBSUIOBUISDBUISDFI"	: {"min":2600000000, "max":3000000000,"fellowship":"CMBF Pope Carbinet Majority Whip Leader", "military":"CMBF Brigadier General Star 3", "business":"CMBF Business Executive State Product Chairman", "businessManager":"CMBF National Business Director", "political":"CMBF Assistant National House Overseer", "investment":"CMBF Gold Asset Trader", "credit_level":30000000000, "code":"IHBSDIVBSUIOBUISDBUISDFI", "slot": 1.697060791934651e-6, "level": 37},
				"HKLBVDAHBVUSUIHBKDJNDKFN"	: { "min":3000000000, "max":3400000000,"fellowship":"CMBF Pope Assistant Carbinet Overseer", "military":"CMBF Brigadier General Star 4", "business":"CMBF Business Vice Executive Regional Product Chairman", "businessManager":"CMBF Vice Continental Business Director", "political":"CMBF National House Overseer", "investment":"CMBF Platinum Asset Trader", "credit_level":34000000000, "code":"HKLBVDAHBVUSUIHBKDJNDKFN", "slot": 1.212186279953322e-6, "level": 38},
				"OJBNSUIBVDUIBVDIIUD"	: {"min":3400000000, "max":3800000000,"fellowship":"CMBF Pope Carbinet Overseer", "military":"CMBF Brigadier General Star 5", "business":"CMBF Business Executive Regional Product Chairman", "businessManager":"CMBF Continental Business Director", "political":"CMBF National House Assistant Counsellor", "investment":"CMBF Diamond Asset Trader", "credit_level":38000000000, "code":"OJBNSUIBVDUIBVDIIUD", "slot": 8.081241866355482e-7, "level": 39},
				"JSFBHBSDVOBDBSDLJD"	: {"min":3800000000, "max":4200000000,"fellowship":"CMBF Pope Carbinet Assistant Counsellor", "military":"CMBF Major General", "business":"CMBF Business Vice Executive National Product Chairman", "businessManager":"CMBF Vice Principal Business Director", "political":"CMBF National House Counsellor", "investment":"CMBF Star Asset Trader", "credit_level":42000000000, "code":"JSFBHBSDVOBDBSDLJD", "slot": 5.050776166472176e-7, "level": 40},
				"JNDJNSDFKVJNJDONVUOSDBUISD"	: {"min":4200000000, "max":4700000000,"fellowship":"CMBF Pope Carbinet Counsellor", "military":"CMBF Major General Star 2", "business":"CMBF Business Executive National Product Chairman", "businessManager":"CMBF Principal Business Director", "political":"CMBF National Minority House Leader", "investment":"CMBF Asset Market Leader", "credit_level":47000000000, "code":"JNDJNSDFKVJNJDONVUOSDBUISD", "slot": 2.971044803807163e-7, "level": 41},
				"BHIBFFVUIBUISBVIFLKJDZSHJ"	: {"min":4700000000, "max":5200000000,"fellowship":"CMBF Pope Carbinet Minority Leader", "military":"CMBF Major General Star 3", "business":"CMBF Business Vice Executive Continental Product Chairman", "businessManager":"CMBF Principal Gold Business Director", "political":"CMBF National Majority House Leader", "investment":"CMBF Gold Asset Market Leader", "credit_level":52000000000, "code":"BHIBFFVUIBUISBVIFLKJDZSHJ", "slot": 1.650580446559535e-7, "level": 42},
				"KLBSDHBVFISBJKLSFZIDL"	: {"min":5200000000, "max":5700000000,"fellowship":"CMBF Pope Carbinet Majority Leader", "military":"CMBF Major General Star 4", "business":"CMBF Business Executive Continental Product Chairman", "businessManager":"CMBF Principal Platinum Business Director", "political":"CMBF National Council House Chair", "investment":"CMBF Platinum Asset Market Leader", "credit_level":57000000000, "code":"KLBSDHBVFISBJKLSFZIDL", "slot": 8.687265508208077e-8, "level": 43},
				"JBSDVIBUIBDUIVBUBDSU"	: {"min":5700000000, "max":6300000000,"fellowship":"CMBF Pope Carbinet Council Chair", "military":"CMBF Major General Star 5", "business":"CMBF Business Principal", "businessManager":"CMBF Principal Diamond Business Director", "political":"CMBF National House Secretary", "investment":"CMBF Star Asset Market Leader", "credit_level":63000000000, "code":"JBSDVIBUIBDUIVBUBDSU", "slot": 4.343632754104039e-8, "level": 44},
				"HIBSVHUBSDUYBSDVUSZJKZS"	: {"min":6300000000, "max":6900000000,"fellowship":"CMBF Pope Carbinet Council Secretary", "military":"CMBF Lieutenant General", "business":"CMBF Business Don", "businessManager":"CMBF Principal Star Business Director", "political":"CMBF National House Vice President", "investment":"CMBF Asset Holder", "credit_level":69000000000, "code":"HIBSVHUBSDUYBSDVUSZJKZS", "slot": 4.343632754104039e-8, "level": 45},
				"IHDBYHSDBZYUHDSFJIAFUYVBGV"	: {"min":6900000000, "max":7500000000,"fellowship":"CMBF Pope Carbinet Vice Chairman", "military":"CMBF Lieutenant General Star 1", "business":"CMBF Business Don King", "businessManager":"CMBF Business Vice Chairman", "political":"CMBF National House President", "investment":"CMBF Gold Asset Holder", "credit_level":75000000000, "code":"IHDBYHSDBZYUHDSFJIAFUYVBGV", "slot": 2.17181637705202e-8, "level": 46},
				"JBJIBDISBSDVHIBDZXJKS"	: {"min":7500000000, "max":8200000000,"fellowship":"CMBF Pope Carbinet Chairman", "military":"CMBF Lieutenant General Star 2", "business":"CMBF Business Don King 5", "businessManager":"CMBF Business Vice Chairman Advicer", "political":"CMBF National Adviser", "investment":"CMBF Platinum Asset Holder", "credit_level":82000000000, "code":"JBJIBDISBSDVHIBDZXJKS", "slot": 1.447877584701346e-8, "level": 47},
				"HSDBHBDFVYIBSHBNVSINBSDIL"	: {"min":8200000000, "max":8900000000,"fellowship":"CMBF Pope Adviser", "military":"CMBF Lieutenant General Star 3", "business":"CMBF Business Don King 4", "businessManager":"CMBF Special Business Vice Chairman Advicer", "political":"CMBF Special National Adviser", "investment":"CMBF Diamond Asset Holder", "credit_level":89000000000, "code":"HSDBHBDFVYIBSHBNVSINBSDIL", "slot": 1.034198274786676e-8, "level": 49},
				"SBIBFGUIBNXSDIBNVIBDFSIBNSI"	: {"min":8900000000, "max":9600000000,"fellowship":"CMBF Pope Special Adviser", "military":"CMBF Lieutenant General Star 4", "business":"CMBF Business Don King 3", "businessManager":"CMBF Business Vice Chairman", "political":"CMBF National Chief of Staff", "investment":"CMBF Star Asset Holder", "credit_level":96000000000, "code":"SBIBFGUIBNXSDIBNVIBDFSIBNSI", "slot": 8.618318956555631e-9, "level": 50},
				"HIBSDIBFVUISDBUISDBIUB"	: {"min":9600000000, "max":10300000000,"fellowship":"CMBF Pope Special Adviser", "military":"CMBF Lieutenant General Star 5", "business":"CMBF Business Don King 2", "businessManager":"CMBF Business Chairman Adviser", "political":"CMBF National Senate Vice President", "investment":"CMBF Investor", "credit_level":103000000000, "code":"HIBSDIBFVUISDBUISDBIUB", "slot": 8.618318956555631e-9, "level": 51},
				"HBADYIVBADYBCIBDAIBUID"	: {"min":10300000000, "max":11100000000,"fellowship":"CMBF Assistant Pope", "military":"CMBF General", "business":"CMBF Business Don King 1", "businessManager":"CMBF Special Business Chairman Adviser", "political":"CMBF National Senate President", "investment":"CMBF Special Investor", "credit_level":111000000000, "code":"HBADYIVBADYBCIBDAIBUID", "slot": 8.601116723109412e-9, "level":52 },
				"BJDIYBVISBUIDFBIUDBUI"	: {"min":11100000000, "max":12000000000,"fellowship":"CMBF Deputy Pope", "military":"CMBF General Star 2", "business":"CMBF Don Knight", "businessManager":"CMBF Business Chairman Adviser", "political":"CMBF National Vice President", "investment":"CMBF Principal Investor", "credit_level":120000000000, "code":"BJDIYBVISBUIDFBIUDBUI", "slot": 8.432467375597463e-9, "level": 53},
				"SIHFBFVIDBXLBKVLJD"	: {"min":12000000000, "max":20000000000,"fellowship":"CMBF Pope Knight", "military":"CMBF General Star 3", "business":"CMBF High Knight", "businessManager":"CMBF Business Chairman", "political":"CMBF National President", "investment":"CMBF Investor General", "credit_level":200000000000, "code":"SIHFBFVIDBXLBKVLJD", "slot": 4.216233687798731e-10, "level": 54},
				"IBSFUIVBDFUIBGVIUSDUISDUBVUB"	: {"min":20000000000, "max":Infinity,"fellowship":"CMBF Pope", "military":"CMBF Commander General", "business":"CMBF Don King 1", "businessManager":"CMBF Business Chairman", "political":"CMBF National President", "investment":"CMBF Investor General", "credit_level":Infinity, "code":"IBSFUIVBDFUIBGVIUSDUISDUBVUB", "slot": 1.686493475119493e-10, "level": 55}				
	};
	
	//bitcoin addresses to accept payment from Scriptbill Demanders
	static #bitcoinAddresses = [
		"qqek83j3x9d7hyt65fstv8u38xe6shn05szn6fm3xn",
		"qrl0p9jz99pk5qhumw583p9ndet6s7v83yg0dg89hf",
		"qru8q8s8uvr28wx8m8ekqz53azq3p3tytvh84t6u6d",
		"qrp4yyqfk65w7few96daysnh5cglcn4ynvl2e8jtdf",
		"qrpz8hvppvawygceplnm3858qyja607xpy2rcdmtdh",
		"qz98nprmx7fzpgvtr7at7fp9wd29hmpuc59s5jvlgy ",
		"qqekp2w80px9nlhzqr2r2gg4gyxlu6n9psqaxzz4kv",
		"qqtrkpal8f4hlw5870g0n9j2qsp4zxngncylsjta6r",
		"qppj7csyg0kkdqwwwul3swkxzgg5hspel5lvj2hrp7",
		"qpdc564qs4jtt2larm9dh9lck6wqsp9l9vryh0y70l",
		"qqc8genq6789pcunncmeup64jhzupshkcvywnvn3j7",
		"qpal0nfkxh0cc0nk92vc6l45wasc6qunvu066lpfjg",
		"qzwr7ktsqls8cq4vq3nwug8wv32lz7frvqvjn3v5as",
		"qp2zjvnkrykc3dwa0re6ghvcmfl6d79nqq6g0d7307",
		"qrxy83rpssn0jhqq3nfxy5dxw3pvw4afkg0flua567",
		"qr59p7n5vqaqyyq00xqkj2vuphl73jvf3qyxv2jv2m",
		"qpnnsyg0x609kv6vp4n86w35l6jlsvhkcs2aq9dhcr",
		"qquhh0ke4ul7fud0svl2t7mqydvpvzev0yc3h9j3sg",
		"qzg4thwm09ph22hajyh8xnaq3y4jgmnk2utg95m2mh",
		"qpqueyjh6raz7ex5t5knfg32c3j0smk9pvdt3desqc",
		"qpd48rtufwffzthca5vjzvev4tudc3572sejtm88wz",
		"qruna6w2xwvwz6u5p9eh58qetujgglevyqceh9jlvh",
		"qp0etnyyjt6gf5zhsh2pa6nj0ufkrcczqunvf684qu",
		"qqdlqhs745dtwvn37kf47z6cmwjypwp55u6epnhaqk",
		"qqks52fp3n2a0ufqm4pw5ulx0342j0hd55wd2mfl55",
		"qpklwp95zyy9mafkxazx8z2srlxcv3vt3y07wrmv7z",
		"qzme8pazg5x5xtf35rnw55wsglldn6469sm8zxf63v",
		"qrll9a8h6hnnq3w7sqjxh8hj4e2r4dz9uymjdkvs5y",
		"qzjfxg0e4x6xajhfmpk95wsx9c0ah8wqksewukrpxm",
		"qq4reyt35jcxyjaw8kcctnvtyde6glgnhs255l5r6v",
		"qzaf96kxjnjf6e2yw433zslxve8h9085jvh8kr52zt",
		"qq0xr8canzjzgwntw6mh9eev640ytmrlugncjrcg54",
		"qz86pypgtjpgpsycq7n3frfs5rswmd9ryuau9lstny",
		"qqe6znf37twtcneez6q48d2r5mehpxe4fccwcwwhft",
		"qqy02zjp7f3f3mxl82dqlhyddqz4ktpvysj4k5sn9l",
		"qqk54qhg3y6mune3y6rxfkpafyggxdkpevwtg0eljw",
		"qqqqxpac4et4ph5ahtwrp90nty0t30kmpumwggxeu9",
		"qrcvaem0wmryyca5mqc7r2tdlgjkdhj5zvgdp4p7cw",
		"qzwp4a3skw8u3qfmh0dzwcrq4j0jj4x4p5jca9ry7d",
		"qq6dnkwtdulf0kl93dkke9emrq6dtsukzsl2kn6fk7",
		"qp94r2sh4emchlvssymxa6yczdej9lcufutg294r7y",
		"qze95plz8xr8py05r7k699q4a5yf9d78ug98clqkre",
		"qpx3w3r9dckpq6jk0u7kztd5sez0kvy5vudxcv6zun",
		"qprh2p5jhe9x900hwuz84tfauze0n08zuuykpnw405",
		"qrwxs4sw0j6hrvsz0xam0kahmrqku24pwuala9jvaj",
		"qzq9a62axjx2aphxrd30hl38skhgfhnqyqrgw65kvc",
		"qrun69znw4892gett5zs0y90upxl2ydl6c94avqnt8",
		"qqtfzl4hcn4azy2ytlzm2qsun92eu2n6wgjvy5jdf8",
		"qregmnms0xs84gqp9kpxr2emw896l3vkrsfr8r7839",
		"qpqryqrmaplt8rmhehz5nsm823srtcuw4cl5u7vsln",
		"qpqgwjrqy6dacxcglk0wtajlr93s4tdhysvvce7g48",
	];
	
	//the default content of a Scriptbill note. This does not means that Scriptbill is limited to Scriptbill
	//content alone. Scriptbill could stand as database to decentralized application who take financial
	//security serious.
	static defaultScriptbill = {
		walletID 	: '',//Scriptbill is the unique wallet ID of the user, Scriptbill data is used to cryptographically link all the account of a particular user to a wallet. So that it can be recognized everywhere it is found.
		noteID		: '0000',//Scriptbill a unique nonce of the note, it increase everytime there is a transaction using Scriptbill note
		noteAddress	: '', //Scriptbill is the public key of the note, it is used to encrypt data that should be read by Scriptbill note alone.
		noteSecret	: '', //Scriptbill is the private key of the note, used by the note owner to recieve funds sent to Scriptbill note address. If you think your note Secret is compromized, you can recreate it and change your note address. To aviod it not affecting business, you can use the connectedNote parameter to link your new note to the compromized note and maintain the security on your note.
		noteKey		: '', //Scriptbill is the increment value of the nonce above, Scriptbill means the noteKey divided by the current note ID should give us the total transaction done by Scriptbill note.
		noteValue 	: 0, //Scriptbill is the value of the note. 
		noteType	: 'SBCRD',//Scriptbill is the unique code of the note you are using, anything that changes Scriptbill note type would change the transactional value of the note to the new note type.
		transValue	: 0, //Scriptbill is the last transaction value of the note. 
		transTime 	: 0, //Scriptbill is the last time stamp of the transaction on the note.
		transType	: 'CREATE',//Scriptbill is the type of transaction conducted by the note.
		rankPref	: 'fellowship',//the prefered Scriptbill ranking structure, the user can change this later
		transHash	: '',//Scriptbill is half of the hash of the last transaction block Scriptbill note created. To create a new transaction block, then Scriptbill note must verify Scriptbill hash.
		transKey	: '', //Scriptbill is the private key of the last bock produced by Scriptbill note.
		profitKeys	: [],//Scriptbill is the private key of the product block held by the note for profit sharing.
		noteServer	: this.default_scriptbill_server, //the server where the note is hosted. The note will be found of sending request to Scriptbill server to connect to the network.
		noteHash	: '',//Scriptbill is the last hash value of the note
		noteSign	: '', //Scriptbill is the signature built using the noteHash and the secret of the note.
		noteSubs	: [], //Scriptbill is an array of the total subsription on Scriptbill note
		noteBudgets	: [], //Scriptbill is an array of the total budget on Scriptbill note.
		noteProducts : [], //an array of private keys of products produced by the note.
		agreements 	: [], //Scriptbill is an array of private keys of agreements held by Scriptbill note.
		blockKey	: '',//Scriptbill is the private key to the note's current block. Used to verify that the note actually signed the block it created.
		blockHash	:'',//Scriptbill is the hash of the total hash of the transaction block concerned. This is required to verify if the note created the transaction block it is processing wiith.
		BMKey		: '', //Scriptbill is the note address of the business manager that controls Scriptbill note network.
		walletRank	: '',//the Scriptbill ranking of the current wallet. This is calculated by getting all transactions connected to the wallet. To get transactions connected to the wallet, you encrypt the current block wallet hash with the wallet id as key. If the result equals the nextWalletHASH then the block belongs to the current wallet, and the rank can be added to the note as walletRank.
		
	};
	//used with the defaultBlock to configure transactional request to the transaction block generator function
	//Scriptbill property is designed to be static because transactions can be designed outside of Scriptbill class.
	static details;
	//the default scriptbill block content.	
	static defaultBlock = {
		blockID 		:	'', //Scriptbill is the unique identifier of the block, always generated by using the noteSecret in combination with the noteID.
		formerBlockID 	: 	0, //Scriptbill is the unique idetifier of the block before Scriptbill block, the default value is zero if it is created for a new note who do not have a fomer block.
		nextBlockID		: '', //Scriptbill is the unique identifier of the next block of the current note, calculated by using the noteSecret and the projected next noteID.
		noteHash		: '', //Scriptbill is the remaining half version of the hash of the note that owns Scriptbill note. If the hash on the note do not match Scriptbill hash the note is invalid.
		transHash		: '', //Scriptbill is the remaining half of the hash to the transaction block of the note, it is expected that the current note would have the hash of Scriptbill block handy.
		realHash		: '', //Scriptbill is the hash of the note supplied by the note, it must match the total hash when put together with the note hash of the last block.
		totalHash		: '', //Scriptbill is the hash of the total hash of the note's block history.
		blockHash		: '', //Scriptbill is the transaction block hash supplied by the note. Scriptbill must also match the total hash when combined together with the transhash of the last block.
		noteServer		: this.default_scriptbill_server, //the current server from which the note is being managed
		noteValue		: 0, //Scriptbill is the value of the note that produced Scriptbill note.
		noteType 		: "SBCRD", //the note type of the note creating this transaction
		transValue 		: 0, //Scriptbill is value of the transaction made by the note.
		transType		: 'CREATE', //This is the transaction type the note in the network conducted.
		transTime		: '', //time stamp that describes when the transaction on Scriptbill note occurred.
		recipient		: '', //an agreement encrypted using the recipients public key and should only be decrypted by the owner of the key.
		walletHASH		: '', //an hash value used to locate the wallet on the database.
		formerWalletHASH : '', //stored to test the value of the walletHASH when the note's wallet key is changed by the wallet for security reason.
		walletSign		: '', //Scriptbill is a signature that tells and confirms that the note that created THIS block owns the walletHASH.
		blockKey		: '', //Scriptbill is the public key of the block of whose private key is held by the note that create Scriptbill block chain.
		blockSign		: '', //Scriptbill is the signature of the wallet using the block private key, stored on the block's note as a signing reference.
		blockRef		: '', //Scriptbill is the reference key of the block, to the sender it is a public key whose private key will be stored in the agreement on the transaction. The recipient must still add the public key of Scriptbill reference to the block, so that verifiers can locate the senders block using Scriptbill key.
		signRef			: '', //Scriptbill is a dynamically generated text for a sender and a signature for a reciever of a transaction. Verifiers will use the blockRef and the text to verify Scriptbill transaction. The security of Scriptbill is that no two block must have the same blockRef except the sender and RECIEVEr blocks.
		agreements		: {}, //Scriptbill is all the agreement on Scriptbill note, can be executed by any node on the network. As the agreements are getting
		noteID			: '',//Scriptbill is the current Note ID of the note when the transaction block is created. This note ID must match the note ID stored on the note when incremented with the noteKey.
		expiry			: 0,//Scriptbill gives us a picture of when the block should be deleted from the database to save space. It's given to the current node to obey Scriptbill, because they can delete any block as long as the block's note has a new transaction block in pace. Sometimes blocks can be used to search out profit Sharing recipients.
		interestRate 	: 0.2,//this is the interest rate that will be deducted from the note transaction whenever he is on credit and his receiving a credit.
		interestType    : 'PT',//this tells the code on how to handle the interest calculation. you can see this.interestType for possible values of what this can get. Most of the time these values change when the note graduates from on rank to another.
		budgetRefs		: [],//this is an array of keys to the budget created by the notes		
		exchangeNote 	: {
			exchangeID		: "iMN+11q3i+bjfnf",//this is the unique ID to exchange Credits to this credit type. 
			exchangeKey		: "MIIEowIBAAKCAQEAm/rj7Tj63Rq/sE",//this is the unique private key to the exchange of this credit. Request made to the exchange market using this exchange
			exhcangeValue	: 0, //total credit supplied to the exchange market.
			noteType 		: "EXCRD",//all exchange note type.
			transValue 		: 0, //the last transaction value of the exchange market
			transType		: "CREATE", //the last transaction type that occur to the exchange market.
			exchangeAccount	: "", //this is the account from which the exchange market will be settling payment, always valid for a non Scriptbill credit type.
			transTime 		: "", //the unique time stamp when the exchange occurs.
		},//since the exchange note is somewhat dynamic and sometimes determined by the nodes in the network
		//transaction hashes will only be done without the exchange note attached to the transaction block
		//if the note have to update, the last transaction block on the will be affected until the whole 
		//network updates their too.
		
	};
	//the default content n an agreement.
	static defaultAgree = {
		agreeID			: '', //this is the unique identifier of the agreement.
		agreeSign		: '', //this is the unique signature of the agreement, to be signed by the initiator of the agreement
		agreeKey		: '', //this is the public key to the agreement, used to verify the agreement signature and to verify the beneficiary account.
		senderSign		: '', //this is the unique signature of the sender,
		senderID		: '', //this is the block ID of the sender, used as a signature text for the signature.
		senderKey		: '', //key used by sender to sign this agreement
		recieverID		: '', //this is the identifier of the block of the reciever, this is useful when other nodes want to accept the new agreement as valid.
		recieverKey		: '', //key used by reciever to sign this agreement
		maxExecTime		: '', //this is the maximum time allowed for the agreement to last on the block chain. If this time elapses, the agreement would be executed by force,  forcing the note of the creator to reduce even to a negative value.
		agreeType		: 'normal',//this describes the type of agreement we are hanling. values are "normal", which denotes that the agreement should be handled normally, that is if terms are not met agreement should be reverted to the sender. The "sendTo" type ensures that the funds are sent to a particular or an array of note addresses, specifying the values to be sent per address when the execution time reach or when the agreement terms are not met. "Loan" type specifies that the money was borrowed to the recipient and must be returned at the specified time. The "loan" type works with interest rates. "contract" agreement type works like budget for the recipient, because it tells how the recipient should use the money, base on an initial quote sent by the recipient in a QUOTE transaction
		ExecTime		: '', //this is the execution time for the agreement, this will only successfully run the agreement if and only if the note that holds the agreement has enough funds to sponsor the agreement, else agreement would not run but would wait until their is a RECIEVE transaction that would update the note's value.
		value			: 0, //this is the total value of the agreement, the transaction value of a transaction is mostly used here. For security reasons, this value cannot be larger than the value of the transaction.
		isPeriodic		: false, //a boolean value that tells whether this should run periodically, if it will run periodically, the periodic value will be calculated
		times			: 0, //works with the isPeriodic, if set to true, the value of this variable will be used against the value variable to determine how much the account will spend
		payTime			: 0, //this is the time for the next payment, works when isPeriodic is set to true, else the execTime determines the payment
		payPeriod		: '1 week', //this is the spread of payment that controls how scripts should set the payTime. If 1 week, when the payment has been executed, the pay period is used to calculate the next payTime.
		delayInterest	: 0, //this determine the amount of interest that would be charged if the execTime is exceeded before the contract ends.
		interestType	: 'SIMPLE', //This is the type of interest that would be charged; accepts SIMPLE & COMPOUND.
		interestSpread	: '1 day', //this determine the spread at which the interest will be calculated.
		interestRate    : 0,
		timeStamp		: '', //this is the signature of the timestamp of the agreement. This is designed to avoid duplicate agreement issues.
		realNonce		: '',//hashed of the current note ID.
		agreeSign 		: '',//this is the signature on the agreement which is signed by the sender with the senders key to verify that the agreement has been met by the reciever. The sender will have to create an AGREEMENTSIGN transaction, referencing the blockID to the AGREEMENTREQUEST transaction sent by the reciever to obey this.
		quoteID			: '',//this is the block ID to the reference block that has the quote to the agreement in a contract based agreement.
		sendAddress		: '',//this is the address or group of addresses to send the agreement value to, this correspond to a sendTo agreement type. if it is a group, then values to be sent to each address should be specified. If the execution time for each address is different, then this should be specified, else the general execution time will be followed for all address. 
		
	};
	
	//because most product on the scriptbill network will be bought using subscription, we design the static subscription configuration property to guife subscribers on how to integrate it.
	static subConfig   = {
		'value'			: 0,//the value of the subscription
		'productID'		: '',//the product id subscribed to
		'subSpread'		: '1 weeks',//the value of the spread of the subscription
		'nextSub'		: 0,//the timestamp when the next subscription will be held.
	};
	
	static creditConfig = {
		'value'		: 0,
		'noteType'	: 'SBCRD',//the note type of the recipient credit
		'recipient'	: '',//the account or Scriptbill note that would recieve the money
		'expiry'	: '',//time when Scriptbill credit will play on the user's note. If the expiry is exceeded the credit start playing recursively on the user note.
		
	};
	
	//other important variable.
	static formerBlock;
	static nextBlock;
	static rankValue;
	static noBlock;
	static workedID;
	static endBlockID;
	static startBlockID;
	static walletHASH;
	static budgetID;
	
	

	static constructor(walletID = '', noteAddress = '', password = '', note = ''){
		//before scriptbill initializes, let's check if Scriptbill can communicate with the current server
		if( window.location.protocol != 'https:' && ! window.location.href.includes("localhost") ) {
			alert('Sorry! Scriptbill Won\'t run in a non https environment! You Can Contact The Site Admin For Assistance');
			return;
		}
		this.recieveResponse();
		this.monitorScriptbillBudget();
		
		this.#password = password;
		console.log( "password gotten: " + this.#password );

		var note;
		
		console.log("uploaded note: " + note);
		
		if( note && ! this.s.currentNote ){
			this.#note = false;
			//a note is always saved in binary format if the note is downloaded from the user's table.
			this.binary = note;
			
			//testing the binary note to be sure that the note is actually a binary string.
			if( this.binary.match(/[2-9]/g) != null || this.binary.match(/[a-z]/gi) != null ) return this.binary;
			
			let noteEncrypt = this.debinarilize();
			console.log("inside note and was not returned, debinarilized note: " + noteEncrypt);
			
			if( ! password )
				this.#password = prompt("Please enter password for the uploaded note! ", "");
			
			else
				this.#password = password;
			
			if( this.#password ){
				this.setPrivateKey( this.#password );
				console.log( "private key set: " + this.privateKey );
				note = this.decrypt( noteEncrypt );
				
				console.log( "decrypted note: " + note, typeof note );
				
				if( this.isJsonable( note ) ) {
					this.#note = JSON.parse(note);
					this.noteAddress = this.#note.noteAddress;
					this.walletID 	= this.#note;
					this.#password 	= this.pass ? this.pass : "";
					this.saveNote();
					this.shareData();
					return;
				}				
			}
		}
		
		if( this.s.currentNote ){			
			
			if( this.#password || password ) {
				if( ! this.#password )
					this.#password = password;
				
				this.#note = this.#parseNote( this.s.currentNote );
				this.walletID = this.#note.walletID;
				this.noteAddress = this.#note.noteAddress;
				let encryptP, hashedP;
				
				this.shareData();
				
				this.saveNote();
				return;
			}
		}
		
		if( walletID ){
			//required to idetify a user for ranking purposes in the Scriptbill network. The reason is that it is assumed users will have many notes to deal with
			//knowing the user wallet will help the user recieve the atrribution given to a particular note in the network.
			//if the user has many wallets, atrribution given to each note will be distirbuted per wallet, the user may not have any good promotion through out the network,
			//may hold may post that require different responsibilities at the same time.
			this.walletID = walletID;
		}
		
		if( ! this.walletID ){
			this.walletID = prompt("Please enter your Scriptbill Wallet ID, required to use Scriptbill on Scriptbill website, leave empty to create a new Scriptbill Wallet", "SCRIPTBILLWALLET");
		}
		
		if( noteAddress ){
			this.noteAddress = noteAddress;
		}
		
		if( this.walletID && this.walletID != 'SCRIPTBILLWALLET' && ! this.noteAddress ){
			this.noteAddress = prompt( "Please enter the note Address you want to use on Scriptbill site for " + this.walletID + " leave empty to create a new Scriptbill Note",""  );
		}

		if( password ){
			this.#password = password;
		}
		
		if( this.noteAddress && this.walletID && this.walletID != 'SCRIPTBILLWALLET' && ! this.#password ){
			this.#password = prompt( "Please enter your password to fetch your note stored locally on Scriptbill drive. If not found, you'll have to upload a binary Scriptbill file to use Scriptbill note " + this.noteAddress + " on Scriptbill site ", "" );
		}
			

		if( this.#password && this.walletID && this.walletID != "SCRIPTBILLWALLET" && this.noteAddress )
			this.setUpDatabase();

		else
			this.requireLogin();//where registeration happens	
	}
	
	static #parseNote( currentNote ){
		if( ! this.#password && this.pass ) 
			this.#password = this.pass;
		
		if( ! this.#password ) return false;
		
		if( ! this.isJsonable( currentNote ) ) return false;
		
		let note = JSON.parse( currentNote );
		
		if( typeof this.#note != 'object' )
			this.#note = {};
		
		this.setPrivateKey( this.#password );
		let note_data, key;
				
		for( key in note ){
			note_data = note[ key ];
			
			if( key == 'noteSecret' ){
				this.#note.noteSecret = this.decrypt( note_data );
			}
			else if( key == 'blockKey' ) {
				this.#note.blockKey = this.decrypt( note_data );
			}
			else if( key == 'profitKeys' ) {
				let profitKeys = this.decrypt( note_data );
				
				if( this.isJsonable( profitKeys ) ){
					this.#note.profitKeys = JSON.parse( profitKeys );
				}
				else {
					this.#note.profitKeys = [];
				}
			}
			else if( key == 'noteProducts' ){
				let noteProducts = this.decrypt( note_data );
				
				if( this.isJsonable( noteProducts ) ){
					this.#note.noteProducts = JSON.parse( noteProducts );
				}
				else {
					this.#note.noteProducts = [];
				}
			}
			else if( key == 'noteBudgets' ){
				let noteBudgets = this.decrypt( note_data );
				
				if( this.isJsonable( noteBudgets ) ){
					this.#note.noteBudgets = JSON.parse( noteBudgets );
				}
				else {
					this.#note.noteBudgets = [];
				}
			}
			else if( key == 'noteSubs' ){
				let noteSubs = this.decrypt( note_data );
				
				if( this.isJsonable( noteSubs ) ){
					this.#note.noteSubs = JSON.parse( noteSubs );
				}
				else {
					this.#note.noteSubs = {};
				}
			}
			else if( key == 'agreements' ){
				let agreements = this.decrypt( note_data );
				
				if( this.isJsonable( agreements ) ){
					this.#note.agreements = JSON.parse( agreements );
				}
				else {
					this.#note.agreements = {};
				}
			}
			else {
				this.#note[key] = note_data;
			}
		}
		
		return this.#note;
		
	}
	
	static setCurrentNote(){
		
		if( ! this.#note && this.s.currentNote ){
			this.#note = this.getCurrentNote();
		}
		
		if( ! this.#note || ! this.#password ) return false;
		
		this.setPrivateKey( this.#password );
		
		this.currentNote = {};
		
		let key, note_data;
		
		for( key in this.#note ){
			note_data = this.#note[ key ];
			if( key == 'noteSecret' ){
				this.currentNote.noteSecret = this.encrypt( note_data  );
			}
			else if( key == 'blockKey' ) {
				this.currentNote.blockKey = this.encrypt( note_data );
			}
			else if( key == 'profitKeys' ) {
				this.currentNote.profitKeys = this.encrypt( JSON.stringify( note_data ) );
			}
			else if( key == 'noteProducts' ){
				this.currentNote.noteProducts = this.encrypt( JSON.stringify( note_data ) );				
			}
			else if( key == 'noteBudgets' ){
				this.currentNote.noteBudgets = this.encrypt( JSON.stringify( note_data ) );
			}
			else if( key == 'agreements' ){
				this.currentNote.agreements = this.encrypt( JSON.stringify( note_data ) );
			}
			else {
				this.currentNote[key] = note_data;
			}
		}
		this.s.currentNote = JSON.stringify( this.currentNote );
		
		return this.currentNote;
	}
	
	static getCurrentNote(){		
		
		if( ! this.#password && ! this.pass ){
			if( this.s.user_pass ){
				this.#password = CryptoJS.MD5( this.s.user_pass ).toString( CryptoJS.enc.Base64 );
			}
		}
		
		console.log( "this.password: " + this.#password, "this.pass: than " + this.pass );
		
		if( ! this.s.currentNote || ( ! this.#password && ! this.pass ) ) return false;
		
		if( this.pass && ! this.#password )
			this.#password = this.pass;
		
		console.log( "getting.password: " + this.#password );
		
		this.setPrivateKey( this.#password );
		
		let currentNote = JSON.parse( this.s.currentNote ), note_data, decrypted, key;
		
		//this shows that the keys weren't encrypted...a bad practice though because it exposes the privatekeys in the note.
		if( typeof currentNote.profitKeys == 'object' && typeof currentNote.noteBudgets == 'object' && typeof currentNote.noteProducts == 'object' && typeof currentNote.noteSubs == 'object' && typeof currentNote.agreements == 'object' ) {
			this.#note = currentNote;
			return currentNote;
		}
		
		for( key in currentNote ){
			note_data = currentNote[ key ];
			
			if( key == 'noteSecret' ){
				currentNote.noteSecret = this.decrypt( note_data  );
			}
			else if( key == 'blockKey' ) {
				currentNote.blockKey = this.decrypt( note_data );
			}
			else if( key == 'profitKeys' ) {
				decrypted = this.decrypt( note_data );
				currentNote.profitKeys = this.isJsonable( decrypted ) ? JSON.parse( decrypted ) : decrypted;
			}
			else if( key == 'noteProducts' ){
				decrypted = this.decrypt( note_data );
				currentNote.noteProducts = this.isJsonable( decrypted ) ? JSON.parse( decrypted ) : decrypted;				
			}
			else if( key == 'noteBudgets' ){
				decrypted = this.decrypt( note_data );
				currentNote.noteBudgets = this.isJsonable( decrypted ) ? JSON.parse( decrypted ) : decrypted;
			}
			else if( key == 'agreements' ){
				decrypted = this.decrypt( note_data );
				currentNote.agreements = this.isJsonable( decrypted ) ? JSON.parse( decrypted ) : decrypted;
			}
		}
		
		this.#note = currentNote;
		return currentNote;
	}
	
	static recieveResponse(){
				
		let server;
		if( ! this.#note ){
			if( this.s.currentNote ){
				this.#note = this.getCurrentNote();
			}
			else {
				server = this.default_scriptbill_server;
			}
		}
		else {
			server = this.#note.noteServer;
		}
		
		let url = new URL( server );
		url.searchParams.set('response', '');
		console.log("function recieveResponse", "server: " + server  );
		fetch( url ).then( response => { return response.text()}).then( data => { 
			this.setPrivateKey( this.#note.blockKey );
			console.log( data, typeof data );
			data = this.decrypt( data );			
			
			if( data && data != null && data.indexOf('{') == 0 && data.lastIndexOf('}') == ( data.length - 1 ) ) {
				data = JSON.parse( data );
				if( data.responseID == this.#note.blockID ){
					alert( data.code );
				}
				else {
					this.errorMessage( data.code );
				}
				
			}
			else {
				try {
					//checking if we are recieving a block data.
					data = JSON.parse( data );
					if( data.blockID ){										
						this.response = data;
						this.verifyData();
					}
				} catch(e){
					this.errorMessage( e );
				}
			}
		});		
		
		
	}
	
	static getWalletRank(){
		if( this.#note ){
			if( this.#note.blockID ){
				let block = this.getTransBlock();
				if( block && block.rankCode){
					this.setPrivateKey( this.#note.walletID );
					let rankCode = this.decrypt( block.rankCode );
					
					if( rankCode && typeof rankCode == "string" ) {
						let ranks = this.#scriptbillRanks;
						let rank;
						
						for( level in ranks ){
							rank = ranks[level];
							
							if( rank.code == rankCode ) break;
						}
						
						if( this.#note.rankPref ){
							return rank[ this.#note.rankPref ];
						}
					}
				}
			}
			
			else {
				return this.calculateWalletRank();
			}
		}
		else {
			return this.calculateWalletRank();
		}
	}
	
	//this function is meant to calculate the rank for the current wallet
	static calculateWalletRank(){
		let transBlock;
		if( ! this.formerBlock || ! this.nextBlock ) {
			this.blockID 		= undefined;
			//getting the current transaction block for the current note
			transBlock 			= this.getTransBlock();
		}
		let noteValue, noteType, blockID, nextBlockID, formerBlockID, formerWalletHASH, exValue, rankValue;
		
		//this will store the total note found under this wallet
		if( ! this.noteFound )
			this.noteFound = 0;
		
		//this will give us the total value of the whole note found under this wallet in
		//scriptbills.
		if( ! this.rankValue )
			this.rankValue = 0;
		
		if( ! this.formerBlock && transBlock && transBlock.blockID && transBlock.walletHASH ){
			this.notefound++;
			this.walletHASH 		= transBlock.nextWalletHASH;
			noteValue 				= transBlock.noteValue;
			noteType				= transBlock.noteType;
			nextBlockID				= transBlock.nextBlockID;
			formerBlockID 			= transBlock.formerBlockID;
			formerWalletHASH		= transBlock.formerWalletHASH;
			blockID					= transBlock.blockID;
			let noteValue			= transBlock.noteValue;
			
			if( this.transSend.includes( transBlock.transType ) )
				noteValue			-= transBlock.transValue;
			
			else if( this.transRecieve.includes( transBlock.transType ) )
				noteValue			+= transBlock.transValue;
			
			if( transBlock.noteType != 'SBCRD' && ! transBlock.noteType.includes("STK") ) {
				exValue 				= this.getExchangeValue( transBlock.noteType, 'SBCRD' );
				
				if( exValue )
					rankValue 			= noteValue * exValue[1];

				else 
					rankValue 			= noteValue;
			}
			 else {
				rankValue 			= noteValue;
			}
			this.workedID		= transBlock.blockID;
			this.rankValue		+= rankValue;
			this.formerBlock 	= transBlock;			
			transBlock 			= this.getTransBlock();//getting the next trans block from the wallet hashes.
			
			if( transBlock ){
				this.nextBlock = transBlock;
				this.startBlockID = blockID;
				this.calculateWalletRank();
			} else {
				this.endBlockID 	= blockID;
				this.nextBlock 	= this.formerBlock;
				this.walletHASH	= this.nextBlock.formerWalletHASH;
				transBlock				= this.getTransBlock();
				
				if( transBlock ) {
					this.formerBlock = transBlock;
					this.calculateWalletRank();
				}
			}
		}
		else if( this.formerBlock && this.nextBlock ){
			if( this.formerBlock.nextBlockID != this.nextBlock.blockID || this.formerBlock.noteType != this.nextBlock.noteType ) {
				this.noteFound++;
				transBlock 			= this.nextBlock;
				if( transBlock.noteType != 'SBCRD' && ! transBlock.noteType.includes("STOCK") ) {
					exValue 			= this.getExchangeValue( transBlock.noteType, 'SBCRD' );
					
					if( exValue )
						rankValue 			= transBlock.noteValue * exValue[1];

					else 
						rankValue 			= transBlock.noteValue;
				}
				else {
					rankValue 			= transBlock.noteValue;
				}
				this.rankValue 	+= rankValue;
			}
			
			let isNextBlock = false;
			
			if( this.workedID && this.workedID == this.formerBlock.blockID ) {
				this.walletHASH = this.nextBlock.nextWalletHASH;
				isNextBlock = true;
			}			
			else if( this.workedID == this.nextBlock.blockID )
				this.walletHASH	= this.formerBlock.formerWalletHASH;
			
			transBlock 				= this.getTransBlock();
			
			if( transBlock && isNextBlock ){
				this.formerBlock = this.nextBlock;
				this.nextBlock	= transBlock;
				this.calculateWalletRank();
			}
			else if( transBlock && ! isNextBlock ) {
				this.formerBlock 	= transBlock;
				this.nextBlock	= this.formerBlock;
				this.calculateWalletRank();
			}
			else if( ! transBlock ){
				if( this.startBlockID && ! this.noBlock ){
					this.blockID = this.startBlockID;
					transBlock			= this.getTransBlock();
					
					if( transBlock ) {
						this.walletHASH	= transBlock.formerWalletHASH;
						this.nextBlock	= transBlock;
						this.formerBlock	= this.getTransBlock();
						
						if( this.formerBlock ){
							this.noBlock		= true;
							this.calculateWalletRank();
						}
					}
				}else if( this.endBlockID && ! this.noBlock ){
					this.blockID 		= this.endBlockID;
					transBlock 			= this.getTransBlock();
					
					if( transBlock ) {
						this.walletHASH = transBlock.nextWalletHASH;
						this.formerBlock	= transBlock;
						this.nextBlock 	= this.getTransBlock();
						
						if( this.nextBlock ){
							this.noBlock = true;
							this.calculateWalletRank();
						}
					}
				}
				else {
					return [ this.rankValue, this.noteFound ];
				}
				
			}
		}
	}
	
	static scriptbillAssignRanks(){
		
		this.calculateWalletRank();
		
		if( ! this.rankValue && ! this.walletID && ! this.#note ) return;
		
		let ranks = this.#scriptbillRanks;
		let level, rank;
		this.blockID = undefined;
		let transBlock = this.getTransBlock();
		let levelFound;
		
		for( level in ranks ){
			rank = ranks[ level ];
			
			if( rank.min >= this.rankValue && rank.max <= this.rankValue ) {
				levelFound = level;
				break;
			}
		}
		if( levelFound ) {
			rank = ranks[ levelFound ];
		}	
		else {
			//simply revert to the default ranking
			rank = ranks[ Object.keys( ranks )[0] ];
		}				
		this.details 			= this.defaultBlock;				
		//calculating the rank code.
		//first set the wallet ID as a private key to encrypt the rank code.
		this.setPrivateKey( this.#note.walletRank );
		this.details.rankCode  = this.encrypt( rank.code );
		this.details.noteValue = this.#note.noteValue;
		this.details.transType = "UPDATE";
		this.generateScriptbillTransactionBlock();
		
	}
	
	static currentTime(){
		return Date.now().toString();
	}
	
	static setUpDatabase(){		
		
		//set up the database here
		if( ! this.l.personal ){
			if( ! this.#password ) {
				let password = prompt("Please Create A New Password For Your Wallet", "");
				this.#password = password;
			}

			if( ! this.walletID ){
				this.walletID = this.generateKey(20);
			}
			let object = {
				walletID : this.walletID,
				password  : this.#password,
				transTime : this.currentTime()				
			}
			let o = object;
			this.string  = JSON.stringify( o );
			o.hash = this.hashed();

			this.l.personal = JSON.stringify( o );
		}
		
		this.loginUserDetails();
		
	}
	
	static generateKey( num = 10 ){
		if( JSEncrypt ){
			let encrypt = new JSEncrypt({default_key_size: 2048});
			return encrypt.getPrivateKeyB64().substr( 0, num );
		}
		return false;
	}
	
	static setPublicKey( key ){
		this.publicKey = key;

		if( this.privateKey ){
			this.privateKey = undefined;
		}
	}
	
	static setPrivateKey( key ){
		this.privateKey = key;		
	}
	
	static getPrivateKey(){
		let encrypt = new JSEncrypt({default_key_size: 2048});
		if( this.privateKey )
			return this.privateKey;
		
		else if( JSEncrypt ){
			let privKey = encrypt.getPrivateKeyB64().substr( 0, 20 );
			
			if( privKey != null )
				return privKey;
			
			return false;
		}
	}
	
	//for security purposes, the publicKey variable can't be trusted,it must be in line with the privateKey of Scriptbill function.
	//so to get the expected publicKey when running Scriptbill function, you must set a private key that will return your expected public key.
	static getPublicKey(){

		if( ! JSEncrypt ) return;
		
		let encrypt     = new JSEncrypt({default_key_size: 2048});
		if( this.privateKey){ //the public key is the hash of the private key.
			this.string 	= this.privateKey;
			this.publicKey 	= CryptoJS.MD5( this.privateKey ).toString( CryptoJS.enc.Base64 ).substr( 0, 15 );
			return this.publicKey;
		}
		else if( this.publicKey ) {						
			return this.publicKey;
		}
		//generate a public key if none is found.
		else {
			this.privateKey = encrypt.getPrivateKeyB64().substr(0, 20);//default private key length is 20
			this.publicKey	= CryptoJS.MD5( this.privateKey ).toString( CryptoJS.enc.Base64 ).substr( 0, 15 );
			return this.publicKey;
		}
	}
	
	//Scriptbill method stores and attempt to output error messages to the user when running Scriptbill class
	static errorMessage( message ){
		//the message must be in string format for the function to work
		if( typeof message != 'string' ) return;
		
		if( this.s.eMessages == undefined )
			this.s.eMessages = JSON.stringify({});
		
		let messages 	= JSON.parse(this.s.eMessages);
		let key 		= this.currentTime();
		messages[ key ]	= message;
		
		this.s.eMessages = JSON.stringify( messages );
		console.log( message );
	}
	
	static successMessage( message ){
		//the message must be in string format for the function to work
		if( typeof message != 'string' ) return;
		
		if( this.s.sMessages == undefined )
			this.s.sMessages = JSON.stringify({});
		
		let messages 	= JSON.parse(this.s.sMessages);
		let key 		= this.currentTime();
		messages[ key ]	= message;
		
		this.s.sMessages = JSON.stringify( messages );
		console.log( message );
	}
	
	static encrypt( data ){
		
		this.publicKey = this.getPublicKey();
		
		if( ! this.publicKey || ! CryptoJS ) return false;

		let encrypt = CryptoJS.AES;
		
		if( typeof data == 'object' )
			data = JSON.stringify( data );
		
		if( this.publicKey && typeof data == 'string' ){
			return encrypt.encrypt( data, this.publicKey ).toString();
		}
		else return false;
	}
	
	static decrypt( data ){
		
		this.privateKey = this.getPrivateKey();
		
		if( ! this.privateKey || ! CryptoJS ) return false;
		
		let decrypt = CryptoJS.AES;
		
		//serializing the data if it's an object.
		if( typeof data == 'object' )
			data = JSON.stringify( data );
		
				
		if( this.privateKey && typeof data == 'string' ){
			this.publicKey = this.getPublicKey();
			console.log( "public key gotten: " + this.publicKey );
			try {
				return decrypt.decrypt( data, this.publicKey ).toString( CryptoJS.enc.Utf8 );
			} catch(e){
				this.errorMessage( "error decrypt message: " + JSON.stringify( e ) );
				return false;
			}
		}
		else return false;
	}

	static recieveData(){
		//without the wallet id, no recipient
		if( ! this.walletID ) return;
		
		let url = new URL( window.location.href );
		url.search = "";
		url.searchParams.set("latest", "true");
		
		
		fetch(url).then( response => {
			return response.json();
		}).then( data => {
			this.response = data;
		});
		
		if( ! this.response.data ) return;
		
		this.IP 	  = 	this.response.IP;
		this.PORT	  = 	this.response.port;
		this.response = JSON.parse( this.response.data );
		let x;

		if( this.response.length != undefined ){
			let response = this.response;
			for( x = 0; x < response.length; x++ ){
				this.response = response[x];
				this.verifyData();
			}
		} else {
			this.verifyData();
		}	
	}
	
	static sendData() {
		
		if( this.response || this.data ) {
			if( this.response )
				this.data = this.response;
							
		}
		
		if( ! this.data ) return;
		
		let url = window.location.href;
		console.log( 'origin: ' + url );
		url = new URL( url );
		if( this.data.blockID ) {
			url.searchParams.set('blockData', JSON.stringify( this.data ));
			console.log( 'blockID ' + this.data.blockID );
		}
		
		url.searchParams.set('data', JSON.stringify( this.data ));
				
		fetch(url).then( response => {
			return response.json();
		}).then( data => {
			this.response = data;
			return this.response;
		});
		
	}
	
	static shareData(){
		if( ! this.l )
			this.l = localStorage;
		try {
			let storage = JSON.parse( this.l );		
		
			let block, nextBlock, time;
			for( blockID in storage ){		
				
				if( blockID == 'personal' || blockID == 'storage' ) continue;
				
				block = storage[ blockID ];
				if( ! this.isJsonable( block ) ) continue;
					
				block = JSON.parse( block );
				
				if( ! block.blockID ) continue;
				
				//checking if the block has expired
				time = this.currentTime();
				
				if( block.expiry <= time )
					this.deleteBlock( block.blockID );
				
				//handle the agreement on the block.
				this.block = block;
				this.handleAgreement();
				this.handleSubscriptions();
				
				//next is to check if the current block has a next block saved.
				if( block && block.nextBlockID && storage[ block.nextBlockID ] != undefined )
					continue;
				
				else {
					//we first of all set the current window as location url, if not we revert to the default server.
					//scriptbill will upgrade her servers soon.
					let url = new URL( window.location.href );
					//test if the current server is a Scriptbill Server.
					let isScriptbill = false;
					url.searchParams.set('scriptbillPing', '');
					fetch( url ).then( response => {
						return response.text();
					}).then( data => {
						data = this.isJsonable( data ) ? JSON.parse( data ) : data;
						
						if( typeof data == 'object' && data.isScriptbillServer == 'TRUE' ){
							isScriptbill = true;
						}
					});
					
					if( ! isScriptbill )
						url = new URL(this.default_scriptbill_server);
					
					url.searchParams.delete('scriptbillPing');
					url.searchParams.set('blockID', block.nextBlockID);
					
					fetch( url ).then( response => {
						return response.text();
					}).then( data => {
						if( data != 'BLOCK NOT FOUND' && this.isJsonable( data ) ){
							this.newBlock = JSON.parse( data );
							if( this.newBlock.blockID ) {
								this.profitSharing( this.newBlock );
								this.response = this.newBlock;
								this.monitorScriptbillCredit();
								this.response = this.newBlock;
								if( this.transSend.includes( this.newBlock.transType ) && this.verifyData() ){
									this.details = this.newBlock;
									this.details.transType = 'RECIEVE';
									this.generateScriptbillTransactionBlock();
								}								
							}
						}
						url.searchParams.delete("blockID");
						//send the current block data to the server who will reshare it to the network, so that nodes that
						//don't have this current block data could have them.
						url.searchParams.set( "blockData", JSON.stringify( block ) );
						fetch(url);
					})
				}
			}
		} catch(e){
			return false;
		}
	}
	
	static deleteBlock( blockID ){
		if( this.l[ blockID ] ){
			let block = this.l[ blockID ];
			
			if( block && this.isJsonable( block ) ){
				block = JSON.parse( block );
				
				if( block.budgetID && block.transType == "CREATEBUDGET" ){
					this.errorMessage("Can't Delete an Original Budget Block");
					return false;
				}
				
				//if it is a product or budget block, we don't delete except we find another block that connects to it.
				if( block.blockID && block.blockID == blockID ){
					
					let expiry 		= parseInt( block.expiry );
					let time 		= parseInt( this.currentTime() );
					
					if( block.productID || block.budgetID ){
					//first check the expiry date.						
						if( expiry > time ){
							
							//next we check if the block has another block connected with it.
							this.blockID 	= block.nextBlockID;
							let nextBlock	= this.getTransBlock();
							
							if( ! nextBlock ){						
								this.errorMessage( "Current Block " + blockID + " Can't be deleted. The block hasn't been expired." );
								return false; //we can't delete a product block that hasn't expired
							}
						}
					}
					//if a send transaction, then there must be a corresponding recieve transaction before we can delete it
					else if( this.transSend.includes( block.transType ) ){
						//first as usual we check the expiry. if a block expires then it can be deleted.					
						if( expiry > time ) {
							//checking for corresponding recieve block. We do this by setting the block ref and the transType
							this.blockRef 	= block.blockRef;
							let recieveBlock = this.getTransBlock();
							
							//we didn't find a recieved block;
							if( ! recieveBlock || ( recieveBlock.length == undefined || ( recieveBlock.blockID == block.blockID  || ! this.transRecieve.includes( block.transType ) ) ) ) {
								this.errorMessage( "Current Block " + blockID + " Can't be deleted. The block hasn't been expired." );
								return false;
							}
							else if( recieveBlock && recieveBlock.length > 1 ){
								let bleck;
								let x;
								let recieved = false;
								let cancelled = false;
								for( x = 0; x < recieveBlock.length; x++ ){
									bleck = recievBlock[x];
									
									if( bleck.blockID && bleck.blockID != block.blockID && this.transRecieve.includes( bleck.transType ) ){										
										recieved = true;
									}
									else if( bleck.blockID && bleck.blockID != block.blockID && this.otherTrans.includes( bleck.transType ) ){
										cancelled = true;
									}
								}
								
								if( ! recieved ){										
									this.errorMessage( "Current Block " + blockID + " Can't be deleted. The block hasn't been expired." );
									return false;
								}
								else if( cancelled && ! recieved ){
									if( recieveBlock.length == 2 ){
										this.errorMessage( "Current Block " + blockID + " Can't be deleted. The block hasn't been expired." );
										return false;
									}
								}
							}
						}//FOR EXCHANGE TRANSACTION TYPE
					} else if( block.transType == 'EXCHANGE' ){
						//we will only delete an exchange block if the exchange request is fulfilled.
						this.blockRef   = block.blockRef;
						let transBlock = this.getTransBlock();
						let x, bleck, buyRequest = false, sellRequest = false;
						
						if( transBlock ){
							for( x = 0; x < transBlock.length; x++ ){
								bleck = transBlock[x];
								//a response transaction type to an exchange request is a send transaction.
								if( bleck.transType == 'SEND' && bleck.noteType == block.sellCredit ){
									sellRequest = true;
								}
								
								if( bleck.transType == 'SEND' && bleck.noteType == block.buyCredit ){
									buyRequest = true;
								}
							}
						}
						
						if( ! buyRequest || ! sellRequest ){
							this.errorMessage( "Can't Delete an Exchange Block Until all Exchange Request are Fulfilled!!!" );
							return false;
						}
					}
				}				
			}
			
			delete this.l[ blockID ];
			return true;
		}
		else {
			return false;
		}
	}
	
	static isJsonable( data ){
		if( typeof data == 'string' && ( ( data.indexOf('{') == 0 && data.lastIndexOf('}') == ( data.length - 1 ) ) || ( data.indexOf('[') == 0 && data.lastIndexOf(']') == ( data.length - 1 ) ) ) )
			return true;
		
		return false;
	}

	static verifyData(){
		if( ! this.response && ! this.response.blockID ) return;
		
		//first look for the block on the current server.
		//if the block already exist, no need to verify the data because it has already been verified.
		if( this.l[ this.response.blockID ] ) return false;

		let fBlock;

		if( this.l[ this.response.formerBlockID ] ){
			fBlock = this.l[ this.response.formerBlockID ];
		}else{
			//if the note value is greater than zero, then the client must have had transaction before. Hence we check.
			if( this.response.noteValue > 0 ){
				this.blockID = this.response.formerBlockID;
				fBlock 	= this.getTransBlock();
				
			}else{
				this.storeBlock();
			}
		}
		
		//to run Scriptbill code the former blocks must be intact.
		if( fBlock ){
			
			
			//verifying the blocks.
			//verifying the block id, the next block ID test will ensure that the current note secret was used to calculate
			//the block IDs
			if( fBlock.blockID != this.response.formerBlockID || fBlock.nextBlockID != this.response.blockID) {
				this.rejectResponse('Block ID not Matched!!!');
				return;
			}
			//verifying the block hash calculation, if the transaction was created using the former block, then the hash
			//should rime
			if( fBlock.blockHash.toString().slice(0, 10) != this.response.formerBlockHash ) {
				this.rejectResponse('Block Hash Calculation Failed');
				return;
			}
			
			//verifying the note value
			if( this.transSend.includes( fBlock.transType ) ) {
				if( this.response.noteValue != ( fBlock.noteValue - fBlock.transValue ) ) {
					this.rejectResponse('note Value Not Match');
					return;
				}				
			}else if( this.transRecieve.includes( fBlock.transType ) ) {
				if( this.response.noteValue != ( fBlock.noteValue + fBlock.transValue ) ) {
					this.rejectResponse('Note Value Not Match');
					return;
				}
				
			}
			
			if( this.transSend.includes( this.response.transType ) ){
				if( ! this.response.blockRef || ! this.response.signRef ){
					this.rejectResponse("Can't Create a Send Transaction Without a Reference");
					return;
				}
				
				//checking if the transaction has been recieved before.
				this.blockRef 		= this.response.blockRef;
				let referenceBlock  = this.getTransBlock();
				
				if( referenceBlock ){
					//don't do anything until you check the recievedIds
					if( referenceBlock.recievedIDs && referenceBlock.recievedIDs.includes( this.response.blockID.slice( 0, 5 ) ) ){
						this.rejectResponse("Block has already been recieved by recipient!!");
						return;
					}
				}
			}
			else if( this.transRecieve.includes( this.response.transType ) ) {
				this.reference = this.response.blockRef;
				let sendBlock 	= this.getTransBlock();
				
				if( ! sendBlock || ! this.transSend.includes( sendBlock.transType )  ) {
					this.rejectResponse("We Couldn't Find a Corresponding Transaction to Qualify Your Recipient Funds!");
					return;
				}
				
				if( ! this.response.blockRef || ! this.response.signRef ){
					this.rejectResponse("Can't Create a Recieving Transaction Without a Reference");
					return;
				}
				
				if( ! sendBlock.blockRef || ! sendBlock.signRef ) {
					this.rejectResponse("Can't Process a Recieve Transaction Without a Valid Reference Block!!!");
					return;
				}
				
				if( sendBlock.blockRef != this.response.blockRef ) {
					this.rejectResponse("Can't Process a Recieve Transaction Without a Valid Reference Key!!!");
					return;
				}
				this.verifyText = sendBlock.signRef;
				this.verifyKey  = sendBlock.blockRef;
				this.signature  = this.response.signRef;
				
				if( ! this.Verify() ){
					this.rejectResponse("We Can't Verify Your References To This Block " + sendBlock.blockID + "!!!");
					return;
				}
			}
			//testing the credit type, a block that connects should have the same credit type.
			if( fBlock.noteType != this.response.noteType ) {
				this.rejectResponse('Note Type Not Matched');
				return;
			}
			
			//verifying the wallet IDs.
			//the wallet ID is the only way to identify a user in the Scriptbill network. However, to protect the user, the wallet ID must be hashed with the current transaction time
			//the former block transaction time
			if( fBlock.walletHASH != this.response.formerWalletHASH ){
				this.rejectResponse('Wallet ID do not match, It seems users is using block belonging to another wallet');
				return;
			}
			
			//since we've successfully verified that the current wallet is the maker of Scriptbill transaction, we move forward to test the integrity of the wallet hashes by verifying the 
			//signature on the block
			this.verifyText = this.response.walletHASH;
			this.verifyKey	= this.response.blockKey;
			this.signature 	= this.response.walletSign;
			
			if( ! this.Verify() ) {
				this.rejectResponse( 'Wallet ID provided does not belong to a verified note!' );
				return;
			}
			
			//next we verify the integrity of the block to be sure the block is created by the note we've just verified.
			this.verifyText		= this.response.blockID;
			this.verifyKey		= this.response.blockKey;
			this.signature		= this.response.blockSign;
			
			if( ! this.Verify() ){
				this.rejectResponse( 'Block was not verified to be created by a valid note!' );
				return;
			}

			//checking the agreements, budgets and subscriptions that may exists on the note.
			//first checking the agreements.
			if( this.response.agreements && this.response.agreements.length > 0 ) {
				let autoExecute = false;
				if( this.response.nextBlockID == 'AUTOEXECUTE' )
					autoExecute = true;
				
				else if( this.response.blockRef ) {
					let agreementIDs = Object.keys( this.response.agreements );
					
					//this shows that the agreement was executed on the note's node.
					if( agreementIDs.includes( this.response.blockRef ) )
						autoExecute = true;
				}
				else {
					//checking if an agreement expired without been executed, because some agreements does not need to 
					//execute as long as the agreement was fulfilled by the parties.
					//this is the current time when the transaction took place.
					let currentTime = this.response.transTime, x, agree;
					
					//we use the former block agreements as reference
					for( x = 0; x < fBlock.agreements.length; x++ ){
						agree = fBlock.agreements[x];
						
						//this shows that the agreement was fulfilled without been executed.
						//an agreement whose execution time is elapsed and agreement fulfilled will be removed from the 
						//agreement table on the transaction block without execution.
						if( agree.maxExecTime < currentTime )
							autoExecute = true;
					}
				}
				
				if( ! autoExecute && this.response.agreements.length < fBlock.agreements.length ) {
					this.rejectResponse( 'Transactional Block Data Contains Compromised Agreements!!!' );
					return;
				}
				
				//next check the agreements.
				let x, agree, value, totalValue = 0;
				let currentTime = this.response.transTime;
				for( x = 0; x < this.response.agreements; x++ ){
					agree 	= this.response.agreements[x];
					
					//only these two agreement type works in a strict mode. That is, the recipient can't use the funds 
					//except for what is intended for.
					if( agree.agreeType == "contract" || agree.agreeType == "sendTo" ) {
						value = agree.value;
						
						//since we've gotten the value, let's check if the agreement has been executed.
						if( agree.execTime > currentTime ) {
							totalValue		+= value;
						}
					}
				}
				
				//now let's check if the note is qualified to send money, if he is sending money.
				let transValue = this.response.transValue + totalValue;
				if( this.response.transType == 'SEND' || this.response.transType != "INVEST" || this.response.transType == 'STOCKPAY'  ){
					if( this.response.noteValue >= transValue ){
						this.rejectResponse("Sorry, your note does not have enough credit to fulfil this request. This may be as a result of unsettled agreements on your note!!!");
						return;
					}
				}
				//we should note that if the current response transaType is any of this, the sender may be doing a credit
				//based transaction, so we'll ignore checking that now, but can check later to be sure the 
				else if( fBlock.transType != 'BUYPRODUCT' || fBlock.transType != 'PRODUCTSUB' || fBlock.transType == 'PROFITSHARING' ){
					//the remaining note value 
					if( this.response.noteValue >= transValue  ) {
						this.rejectResponse("Sorry, your note does not have enough credit to fulfil this request. This may be as a result of unsettled agreements on your note!!!");
						return;
					}
				}
				
				this.totalValue = totalValue;
			}
			
			//for budgets, we have to understand that budgets are preferences of the note holder and we can't check for
			//compromized content because the user can update and remove the budget from the database any time
			let budgets = this.response.budgetRefs;
			let x, budget, value = 0;
			for( x = 0; x < budgets.length; x++ ){
				this.budgetID		= budgets[x];
				budget				= this.getTransBlock();
				
				if( budget && budget.agreement && budget.agreement.budgetValue ) {
					value 			+= budget.agreement.budgetValue;
				}				
			}
			
			let transValue = this.response.transValue + value + this.totalValue;
			
			if( this.response.noteValue >= transValue ){
				this.rejectResponse("Sorry, your note does not have enough credit to fulfil this request. This may be as a result of unexecuted Budgets on your note!!!");
				return;
			}
			
			this.storeBlock();
		}
	}
	
	static rejectResponse( response ){
		if( ! this.response ) return;
		
		this.setPublicKey( this.response.blockKey );
		response = this.encrypt( JSON.stringify({responseID: this.response.blockID, code: response}));
		this.data = response;
		this.sendData();
	}
	
	//Scriptbill function will help the user send money to a number of recipient;
	//configured using the sendConfig object.
	static sendConfig = {
		amount : 0,
		recipients : [],
		
	};
	
	static exchangeCredits(){
		
		if( ! this.#note && this.s.currentNote )
			this.#note = this.getCurrentNote();
		
		console.log( "this.note: " + JSON.stringify( this.#note ) );
		
			
		if( ! this.response || ! this.response.transValue || ! this.response.noteType || ! this.#note || this.#note.noteType == this.response.noteType ) return 0;//COMING
		
		
		this.details = this.response;
		this.details.transType = 'EXCHANGE';
		//the sell credit is that credit that you supply to the exchange market
		this.details.sellCredit = this.response.noteType;
		//the buy credit is that credit you demand from the exchange market.
		this.details.buyCredit	= this.#note.noteType;
		//to help traders understand where to sell their credits to, the buyer must specify an account.
		//the account must he able to hold credit specified in the buyCredit handler.
		this.details.buyAccount = this.#note.noteAddress;
		
		if( this.response.accountCredit )
			this.details.creditType = this.response.accountCredit;
		
		else
			this.details.creditType = 'scriptbills';
		
		let privKey 				= this.generateKey(30);
		this.setPrivateKey( privKey );
		this.details.blockRef		= this.getPublicKey();
		this.details.signRef		= this.generateKey( 20 );
		
		//this will help Scriptbills generate the exchange request in the network
		this.generateScriptbillTransactionBlock();
		
		//once the exchange request is created, the will now be required to 
		//settle other exchangers their request. to do this, we get the exchange block that
		//has the credit we are selling as a buy request
		this.buyCredit = this.details.sellCredit;
		
		
		
	}
	
	//withdrawal of credit must be automatically handled for it to be a transaparent transaction
	static withdrawCredit( value ){
		let accountDetails = this.#note.motherKey;
		this.noteType = this.#note.noteType;
		let exBlock = this.getTransBlock(), x, transTime, lastTime = 0, exNote;
		
		for( x = 0; x < exBlock.length; x++ ){ 
			transTime = parseInt( exBlock[x].transTime );
			
			if( transTime > lastTime ){
				exNote = exBlock[x].exchangeNote;
			}
			
			lastTime = transTime;
		}
		
		//need to access apis for this.
		if( exNote.exchangeValue >= value && this.#note.noteValue >= value ) {
		
			switch( this.#note.noteType ){
				case 'BTC':
					
				break;
				case 'USD':
					
				break;
			}
		}
	}
	
	
	static getExchangeValue( creditType1, creditType2 ){		
					
		//to get the exchange value of a credit, we have to know the total unit of a credit supplied to the exchange market.
		this.sellCredit = creditType1;
		this.transType  = 'EXCHANGE';
		let sellBlocks  = this.getTransBlock();
		//get the buyBlocks too.
		this.buyCredit = creditType2;
		let buyBlocks  = this.getTransBlock();
		let exValue 	= 1;
		
		if( sellBlocks && buyBlocks ){			
			
			if( buyBlocks ){
				let sellUnits = 1;
				let buyUnits = 1;
				for( x = 0; x < sellBlocks.length; x++ ){
					sellUnit += sellBlocks[x].transValue;
					
					if( buyBlocks[x] )
						buyUnits += buyBlocks[x].transValue;
				}
				
				if( sellBlocks.length < buyBlocks.length ){
					for( x = sellBlocks.length; x < buyBlocks.length; x++ ){
						buyUnits += buyBlocks[x].transValue;
					}
				}
				
				return [ sellUnits / buyUnits, buyUnits / sellUnits ];
			}
			else {
				return [Infinity, 1];
			}
		}
		else {
			if( buyBlocks )
				return [1,Infinity];
			
			return [1,1];	
		}
	}
	
	
	static sendMoney(){
				
		let rep = this.sendConfig.recipients;
		
		alert("walletID: " + this.#note );
		
		if( rep.length <= 0 || ! this.walletID ) return;
		
		let y, z = 0, x;
		
		for( x = 0; x < rep.length; x++ ) {
			this.details = this.defaultScriptbill;
			this.details.noteAddress = rep[x];
			if( typeof this.sendConfig.amount != 'object' )
				this.details.transValue = parseInt( this.sendConfig.amount );
			
			else {
				if( typeof this.sendConfig.amount[x] != 'undefined' ){
					if( typeof this.sendConfig.amount[x] != 'object' )
						this.details.transValue = parseInt( this.sendConfig.amount[x] );
					
					else
						this.details.transValue = 0;
				}
				else {
					for( y = x; y >= 0; y-- ){
						if( typeof this.sendConfig.amount[y] != 'undefined' ){
							if( typeof this.sendConfig.amount[y] != 'object' ){
								this.details.transValue = parseInt( this.sendConfig.amount[y] );
								break;
							}							
							else
								this.details.transValue = 0;
						}
					}
				}
			}
						
			this.details.recipient = rep[x];
			this.details.transType = 'SEND';
			this.generateScriptbillTransactionBlock();
			
		}
	}
	
	static download_note( noteAddress = '' ){
		
		let note;
		if( noteAddress ){
			note = this.getNote( noteAddress );
			this.noteAddress = noteAddress;
		}
		else if( this.noteAddress ){
			note = this.getNote( this.noteAddress );
		}
		else return false;
		
		if( note && typeof note == 'object' ){
			note = JSON.stringify( note );			
		}
		else if( this.s.currentNote ){
			note = JSON.stringify( this.getCurrentNote() );
		}
		
		if( ! this.#password && this.pass )
			this.#password = this.pass;
		
		this.setPrivateKey( this.#password );
		this.noteEncrypt = this.encrypt( note );
		let noteEncrypt = this.binarilize();
		
		if( noteEncrypt ){
			//delete any uploaded note before downloading the new note.
			if( this.s.uploadedNote ){
				delete this.s.uploadedNote;
			}
			//delte the current note.
			if( this.s.currentNote ){
				delete this.s.currentNote;
			}
			
			this.download( noteEncrypt, this.noteAddress + '.script', 'text/plain' );			
		}
	}
	
	static download( data, filename, dataType ){
		if( ! dataType ) dataType = 'application/octet-stream';
		
		var a = document.createElement('a');
		var blob = new Blob( [data, { 'type': dataType }] );
		a.href = window.URL.createObjectURL( blob );
		a.download = filename;
		a.click();
	}
	
	static binarilize(){
		
		if( ! this.noteEncrypt ) return;
		
		return this.noteEncrypt.split('').map( function ( char ) {
			return char.charCodeAt( 0 ).toString(2);
		}).join(' ');
	}
	
	static debinarilize(){
		
		if( ! this.binary ) return;
		
		if( this.binary.toString().includes(' ') ){
			return this.binary.toString().split(' ').map( function(bin) {
				return String.fromCharCode( parseInt( bin, 2 ) );
			}).join('');			
		}
		
		return String.fromCharCode( parseInt( this.binary, 2 ));
	}
	
	//Scriptbill function retrives the current note from database.
	static getNote( noteAddress = '' ){
		
		//if the note address is not set, we return the this.
		if( ( ! this.noteAddress && noteAddress == '' ) || ! this.#password  ) return;
		
		this.#note = false;
		
		if( noteAddress != '' )
			this.noteAddress = noteAddress;
		
		//looking for the local storage for the note.
		
		
		if( ! this.l.ScriptNotes || ! this.l.personal ) {
			this.errorMessage( "No Local Database to fetch the requested Scriptbill Note From" );
			return false;		
		}
		
		//the password to decrypt the note should be stored on the personal local database of the current user. 
		//if not stored on Scriptbill location, then the user should upload the note to Scriptbill server,
		let person = JSON.parse( this.l.personal );
		
		//next we test to check if the requested note was saved on Scriptbill database
		if( ! person[ this.noteAddress ] ) {
			this.errorMessage( "The requested note was not found on the local database! Please check the note address entered: " + this.noteAddress + " or try a different note" );
			return false;//KOOOOOL
		}
		
		//next, we set the supplied password as private key to decrypt the note's password.
		this.setPrivateKey( this.#password );
		
		//before decrypting test the integrity of the password and alert the user if the integrity is breached.
		this.string = person[ this.noteAddress ].password + person[ this.noteAddress ].transTime;
		let hashed = this.hashed();
		
		if( person[ this.noteAddress ].hash != hashed )
			this.errorMessage( "Personal Database Integrity Compromised!!! This May Affect The Getting Of Your Scriptbill Note" );
		
		//attempting to decrypt the password.
		let password = this.decrypt( person[ this.noteAddress ].password );
		
		if( typeof password != "string" ){
			this.errorMessage( "Password was not successfully decrypted! Please enter a correct Scriptbill Password! Thanks " + typeof password );
			return false;
		}
			
		//setting the decrypted password as private Key to get the saved note,
		this.setPrivateKey( password );
		let notes = JSON.parse( this.l.ScriptNotes );	
		let note = this.decrypt( notes[ this.noteAddress ] );
		
		if( note != null && typeof note == 'string' && note.indexOf('{') == 0 && note.lastIndexOf('}') == ( note.length - 1 ) ) {
			this.s.currentNote = note;
			this.#note = JSON.parse( note );
		}
			
		//if the note is found, it will return the note object, else an undefined variable is returned.
		return this.#note;
	}
	
	//Scriptbill function is designed to save the current note details to the database when generating a transaction.
	//everyhting is saved locally on the client's server, Scriptbill means that an attempt to log in even with the same details//on a strange server would not work, except there is an access to the current server.
	static saveNote( noteAddress = '' ){
		
		//if the note address is not set, we return the this.
		if( ( ! this.noteAddress && noteAddress == '' ) && ! this.#note ) {
			this.errorMessage("couldn't find note to save when runing Scriptbill function saveNote");
			return;			
		}
		
		this.autoInvestScriptbillBudget();		
		
		let messages = [];
		if( this.s.message )
			messages = JSON.parse( this.s.message );
		
		messages.push('We are storing the current note for ' + this.walletID);
		this.s.message = JSON.stringify( messages );
		
		if( noteAddress != '' )
			this.noteAddress = noteAddress;
		
		
		if( ! this.#password && this.pass )
			this.#password = this.pass;
		else if( this.s.user_pass ){
			this.#password = CryptoJS.MD5( this.s.user_pass ).toString( CryptoJS.enc.Base64 )
		}else
			this.#password = prompt( "Please set your wallet's password before saving your note", "" );
		
		if( ! this.#password ) {
			this.#password = this.generateKey( 30 );
			this.errorMessage("Note was saved with an autogenerated password!!! Please ensure you save this password to use later while logging in your note to the server. " + this.#password);
		}
		
		let notes;
		
		if( ! this.l.ScriptNotes )
			notes = {};
		
		else 
			notes = JSON.parse( this.l.ScriptNotes );
		
		
		let noteStr 				= JSON.stringify( this.#note );
		let password 				= this.generateKey();
		this.setPrivateKey( password );
		notes[ this.noteAddress ]	= this.encrypt( noteStr );		
		this.setCurrentNote();
		
		
		console.log("Current Note Saved!!!");
		
		this.l.ScriptNotes = JSON.stringify( notes );
		
		
		if(  this.#password ){
			
			if( ! this.l.personal ){
				let o = {};
				o.walletID = this.#note.walletID;
				o.transTime = this.currentTime();
				o.password  = this.#password;
				this.string = JSON.stringify( o );
				o.hash		= this.hashed();
				this.l.personal = JSON.stringify( o );
			}
			
			let person = JSON.parse( this.l.personal );
			this.setPrivateKey( this.#password );
			person[this.#note.noteAddress]  			= {};
			person[this.#note.noteAddress].password = this.encrypt( password );
			person[this.#note.noteAddress].transTime = this.currentTime();
			this.string 							= person[this.#note.noteAddress].password + person[this.#note.noteAddress].transTime;
			person[this.#note.noteAddress].hash 		= this.hashed();
			this.l.personal = JSON.stringify( person );
		}
	}

	static requestData(callback = false){
		if( ! this.data || typeof this.data != 'string') return;

		let xml = new XMLHttpRequest();
		let loc = window.location;
		let url = new URL(loc.origin);
		url.searchParams.set('data', this.data);
		xml.open( url, 'GET', true );
		xml.responseType = 'json';
		xml.send();
		xml.onload = function(){
			if( xml.status == 200){
				if( callback )
					callback( xml.response )
			}
		}
	}

	static storeBlock(){
				
		if( ! this.response && ! this.response.blockID ) return;

		let fBlock = this.l[this.response.formerBlockID];
		
		//monitor the transactional block for payment of stocks if the note is a stock note.
		//this.monitorScriptbillStock();
		
		//if it is a new block, then the former block id won't be present
		if( fBlock || ( this.response.noteValue == 0 && ! this.response.formerBlockID ) ){
			
			if( fBlock ) {
				let blockHashes = this.l[fBlock.blockID + '_hashes'];
				this.string 	= JSON.stringify( fBlock );
				let fHash		= this.hashed();
				this.string 	= blockHashes + fHash;
				let totalHash 	= this.hashed();
				this.l[ this.response.blockID + '_hashes' ] = totalHash;
				this.deleteBlock( this.response.formerBlockID );
				
				if( this.response.totalHash && this.response.totalHash !=  totalHash ){
					if( ! this.response.confirmed )
						this.response.confirmed = 0;
					
					this.response.confirmed--;
					this.response.totalHash = totalHash;
					if( this.response.hashRejects && this.response.hahsRejects > 1 ) {
						this.rejectResponse('Total Hash Calculation not in the same phase!!! Please Accept The New Hash Calculation!!!');
					}
					else {
						this.response.hashRejects = 0;
					}
					
					this.response.hashRejects++;									
				}				
			}		
			this.data = JSON.stringify( this.response );			
			this.l[ this.response.blockID ] = this.data;
			
			//save the product block
			if( this.response.productBlockID ){
				this.l[ this.response.productBlockID ] = this.response.blockID;
			}
			
			if( this.response.budgetID ){
				if( this.l[ this.response.budgetID ] ) {
					let ID = JSON.parse( this.l[ this.response.budgetCredit ] );
					ID.push( this.response.blockID );
					this.l[ this.response.budgetCredit ] = JSON.stringify( ID );
				}
				else
					this.l[ this.response.budgetID ]	= JSON.stringify( [ this.response.blockID ] );
			}
			
			if( this.response.budgetCredit ) {
				if( this.l[ this.response.budgetCredit ] ) {
					let credits = JSON.parse( this.l[ this.response.budgetCredit ] );
					credits.push( this.response.blockID );
					this.l[ this.response.budgetCredit ] = JSON.stringify( credits );
				}
				else
				this.l[ this.response.budgetCredit ]	= JSON.stringify( [ this.response.blockID ] );
			}
			
			if( this.response.walletHASH ){
				this.l[ this.response.walletHASH ] = this.response.blockID;
			}
			
			if( this.response.exBlockID ){
				this.l[ this.response.exBlockID ]	= this.response.blockID;
			}
			
			if( this.response.noteType || this.response.sellCredit || this.response.buyCredit ) {
				//not unique can have many values, so we check the boots first.
				let noteTypes = [];
				if( this.l[this.response.noteType] ){
					noteTypes = JSON.parse( this.l[ this.response.noteType ] );
				}
				
				noteTypes.push( this.response.blockID );
				this.l[this.response.noteType ] = JSON.stringify( noteTypes );
				
				if( this.l[ this.response.sellCredit ] ){
					noteTypes  = JSON.parse( this.l[ this.response.sellCredit ] );
				}
				
				noteTypes.push( this.response.blockID );
				this.l[this.response.sellCredit ] = JSON.stringify( noteTypes );
				
				if( this.l[ this.response.buyCredit ] ){
					noteTypes  = JSON.parse( this.l[ this.response.buyCredit ] );
				}

				noteTypes.push( this.response.blockID );
				this.l[this.response.buyCredit ] = JSON.stringify( noteTypes );
				
			}
			
			if( this.response.transType ){
				//transTypes are not also unique.
				let transTypes = [];
				if( this.l[ this.response.transType ] ){
					transTypes = JSON.parse( this.l[ this.response.transType ] );
				}
				transTypes.push( this.response.blockID );
				this.l[ this.response.transType ] = JSON.stringify( transTypes );
			}
			
			if( this.response.productID ){
				//transTypes are not also unique.
				let products = [];
				if( this.l[ this.response.productID ] ){
					products = JSON.parse( this.l[ this.response.productID ] );
				}
				products.push( this.response.productID );
				this.l[ this.response.productID ] = JSON.stringify( products );
			}
						
			this.sendData();
		}
	}

	static hashed(){
		
		if( ! this.string )
			this.string = Date.now().toString();
		
		if( CryptoJS && CryptoJS.SHA256 && this.string && typeof this.string == 'string' )
			return CryptoJS.SHA256( this.string ).toString(CryptoJS.enc.Base64);
		else
			return false;
	}
	static requireLogin(){
		let walletID;
		console.log( "Inside requireLogin" );
		if( ! this.walletID )
			walletID = prompt("please enter your wallet ID, leave empty to create a new wallet","SCRIPTBILLWALLET");
		
		let password = '';
		
		if( walletID && walletID != 'SCRIPTBILLWALLET' ) {
			
			if( ! this.#password )			
				password = prompt("Please enter your Wallet Password", "SCRIPTBILLPASSWORD");
			
			else 
				password = this.#password;

			if( password && password != "SCRIPTBILLPASSWORD" ){
				this.walletID = walletID;
				this.#password = password;
				this.loginUserDetails();
			}
			else {
				let recreate = confirm("Password Cannot Be Empty, Do You Want To Re-login?");
				
				if( recreate ){
					this.requireLogin();
				}
				else {
					let createWallet = confirm("OK! Do you want to create new wallet");
					
					if( createWallet ){
						this.createNewScriptbillWallet();
					}
				}
			}
		}
		else {
			this.createNewScriptbillWallet();
		}
	}
	
	
	static calculateTime( time ){
		//the time must be in string format for the function to run correctly.
		if( typeof time != 'string' ) return;
		
		let timeSp = time.split(' ');
		
		if( timeSp.length != 2 ) return;
		
		let timeNo = parseInt( timeSp[0] );
		let timeStr = timeSp[1];
		let timeObj = {
			'seconds' : function(no){
				no = parseInt( no );
				if( no ){
					return 1 * no;
				}
				else {
					return 1;
				}
			},
			'minutes' : function(no){
				no = parseInt( no );
				if( no ){
					return 60 * no;
				}
				else {
					return 60;
				}
			},
			'hours'	: function(no){
				let min = this.minutes( 60 );
				no = parseInt( no );
				if( no ){
					return min * no;
				}
				else {
					return min;
				}
			},
			'days'	: function(no){
				let hrs = this.hours(24);
				no = parseInt( no );
				if( no ){
					return hrs * no;
				}
				else {
					return hrs;
				}
			},
			'weeks'	: function(no){
				let dys = this.days(7);
				no = parseInt( no );
				if( no ){
					return dys * no;
				}
				else {
					return dys;
				}
			},
			'months'	: function(no){
				let wks = this.days(30);
				no = parseInt( no );
				if( no ){
					return wks * no;
				}
				else {
					return wks;
				}
			},
			'years'	: function(no){
				let mnts = this.days(365);
				no = parseInt( no );
				if( no ){
					return mnts * no;
				}
				else {
					return mnts;
				}
			}
		};
		let keys = Object.keys( timeObj );
		
		if( keys.includes( timeStr ) && timeNo ){
			let value = timeObj[ timeStr ]( timeNo );
			return value;
		}
		else {
			return timeNo;
		}
	}
	
	//Scriptbill function is designed to handle the agreement on a block.
	static handleAgreement(){
		if( ! this.block || ! this.block.blockID || ! this.block.agreements || this.block.agreements.length <= 0 ) return;
		
		let agreement, agreements = this.block.agreements, time;
		let noteValue, agreeValue, value, recVerify, sendVerify, spread, interest, x;
		//the agreement must be an array.
		for( x = 0; x < agreements.length; x++ ){
			agreement = agreements[x];
			
			if( ! agreement || ! agreement.agreeID ) 
				continue;
			
			time = this.currentTime();
				
			//before doing anything, check if the agreement is signed by both the sender and the reciever.
			if( ! agreement.senderSign || ! agreement.recieverSign )
				continue;
			
			//next we have to verify the signatures of the reciever and the sender.
			//verifying sender.
			this.verifyKey 	= agreement.senderKey;
			this.verifyText	= agreement.senderID;
			this.signature 	= agreement.senderSign;
			sendVerify 		= this.Verify();
			//verifying reciever.
			this.verifyKey 	= agreement.recieverKey;
			this.verifyText	= agreement.recieverID;
			this.signature 	= agreement.recieverSign;
			recVerify		= this.Verify();
			
			//if the agreement is not verified to be signed by either the sender or the reciever, we cancel and will not habndle the agreement
			if( ! sendVerify || ! recVerify )
				continue;
			
			//checking if the agreement is ready to be executed.
			if( time <= agreement.execTime )
				continue;
			
			//if the agreement is ready but the agreement is not ready to be paid based on periodicity.
			if( agreement.isPeriodic && time <= agreement.payTime )
				continue;
			
			//next let's check the value of the holder of Scriptbill agreement, whether or not the note can fulfil the agreement set.
			if( this.transSend.includes( this.block.transType )  )
				noteValue = this.block.noteValue - this.block.transValue;
			
			else if( this.transRecieve.includes( this.block.transType ) )
				noteValue = this.block.noteValue + this.block.transValue;
			
			else
				noteValue = this.block.noteValue;
			
			//before determining if the note could pay the agreement, we check the if the agreement is a periodic one, to determine the actual payment value.
			if( agreement.isPeriodic ) {
				value = agreement.value / agreement.times;
			}
			else {
				value = agreement.value;
			}
			
			//Scriptbill means the note can't pay up the agreement, so we abort and wait till the note can pay the agreement.
			if( noteValue < value )
				continue;
			
			//if it is a periodic agreement, then the agreement must be rewired back to the sender to update his own block to the agreement state.
			if( agreement.isPeriodic ) {
				this.defaultAgree = agreement;
				this.defaultAgree.times -= 1;
				this.defaultAgree.payTime = parseInt( this.currentTime() ) + parseInt(this.calculateTime( this.defaultAgree.payPeriod ) );
				//testing the interest.				
				if( this.defaultAgree.interestType == 'SIMPLE' ) {
					//Scriptbill will give us the number of time the interst should be calculated.
					spread 		= Math.round( this.calculateTime( this.defaultAgree.payPeriod ) / this.calculateTime( this.defaultAgree.interestSpread ) );
					interest 	= ( value * this.defaultAgree.interestRate ) * spread;
					value 		= value + interest;
				}
				else if( this.defaultAgree.interestType == 'COMPOUND' ){
					//Scriptbill will give us the number of time the interst should be calculated.
					spread 		= Math.round( this.calculateTime( this.defaultAgree.payPeriod ) / this.calculateTime( this.defaultAgree.interestSpread ) );					
					
					for( x = 0; x < spread; x++ ){
						interest 	= ( value * this.defaultAgree.interestRate );
						value 		+= interest;
					}
				}
			}
			
			//if the note can pay the agreement, we use the sender's public key to create a transaction for the note to pay up the agreement.
			//the user of the note do not need to trigger Scriptbill transaction, any node within the network can trigger Scriptbill transaction.
			//when the recipient of the agreement finds Scriptbill block, the note quickly updates itself to the latest value based on Scriptbill transaction.
			//if the sender finds Scriptbill block, the sender would recieve the note and lose the private key of the agreement in the process.
			//Scriptbill way, the note would not be able to recieve anymore transaction coming from Scriptbill same agreement
			//however, a periodic transaction will always have the same key but the agreement hash will be the filtering mechanism for the note.
			//if the agreement have the same hashes, the note must not recieve such transaction else the note would be invalid in the network.
			this.details 						= this.defaultBlock;
			this.details.transValue 			= value;
			this.details.transType 				= 'AGREESEND';
			this.details.noteValue 				= noteValue;
			this.details.recipient 				= agreement.senderKey;
			//the purpose of Scriptbill agreement is to make the recipient not recieve any other transaction of Scriptbill sort from any other nodes if the transaction created by Scriptbill node is the first to reach the recipient
			this.details.agreement 				= this.defaultAgree;
			this.details.agreement.agreeID 		= this.generateKey();
			this.signTxt 						= this.details.agreement.agreeID;
			this.signKey  						= this.generateKey();
			this.setPrivateKey( this.signKey );
			this.details.agreement.agreeSign 	= this.Sign();
			this.details.agreement.value 		= value;
			//the agreement will not expire and won't be saved.
			this.details.agreement.execTime 	= Infinity;
			this.details.agreement.senderID 	= this.generateKey();
			this.details.agreement.senderKey 	= this.block.blockKey;
			this.signTxt 						= this.details.agreement.senderID;
			this.signKey  						= this.details.agreement.senderKey;
			this.details.agreement.senderSign 	= this.Sign();
			this.string 						= JSON.stringify( this.details.agreement );
			//the note will only save Scriptbill hash, Scriptbill will change the hash value of the note significantly and make the note not to recieve transactions from
			//the same agreement.
			this.details.agreement.hash 		= this.hashed();
			this.autoExecute 					= true;
			this.generateScriptbillTransactionBlock();					
		}
	}
	
	static createNewScriptbillWallet(){
		
		console.log("Inside createNewScriptbillWallet");
		
		//if the personal database have been created
		if( ( ! this.walletID || this.walletID == 'SCRIPTBILLWALLET' ) && this.l.personal ){
			let personal = JSON.parse( this.l.personal );
			
			if( personal.walletID )
				this.walletID = personal.walletID;
		}
		//we can't create a new wallet, if we already have a wallet ID
		else if( this.walletID && this.walletID != 'SCRIPTBILLWALLET' && this.noteAddress && ! this.createNote ) return;
		
		else if( ! this.l.personal )		
			this.walletID = this.hashed();//using the current time as seed makes the new wallet ID being created very unique.
		
		//for the wallet to stand, we need to create a note for it.
		this.details = this.defaultBlock;
		this.#note 	= this.defaultScriptbill;
		this.s.defaultNote = JSON.stringify( this.#note );
		this.generateScriptbillTransactionBlock();
	}
	
	static verifyScriptbillTransactionBlock(){
		
		console.log("Start Of verifyScriptbillTransactionBlock", "The Block " + JSON.stringify( this.block ) );
		
		//escape CREATE transactions.
		if( this.block.transType == "CREATE" )
			return this.block;
		
		if( ! this.block || ! this.block.blockID ) return this.block;
		
		//verify block iss not for new block
		if( this.block.blockKey != '' && this.block.transType != 'CREATE' && this.#note.blockKey != '') {
			
			this.setPrivateKey( this.#note.blockKey );
			let blockKey = this.getPublicKey();
			
			if( blockKey != this.block.blockKey ){
				this.errorMessage('Note Block With Block ID: '+ this.block.blockID + ' Was Not Verified To Be Signed By Current Note With Address: ' + this.#note.noteAddress + ' Current Transaction Will Now Be Aborted!!!');
				return false;
			}
			
			this.verifyKey = this.block.blockKey;
			this.verifyText = this.block.blockID;
			this.signature = this.block.blockSign;
			
			if( ! this.Verify() ) {
				this.errorMessage('Note Block With Block ID: '+ this.block.blockID + ' Was Not Verified To Be Signed By Current Note With Address: ' + this.#note.noteAddress + ' Current Transaction Will Now Be Aborted!!!');
				return false;
			}
			
		}
		
		//testing the note ID of the block.
		if( this.block.noteID != '' ){
			this.setPrivateKey( this.#note.noteKey );
			let noteID = this.encrypt( this.block.noteID );
			
			if( this.#note.noteID != noteID ) {
				this.errorMessage( 'Note Block with Block ID: ' + this.block.blockID + ' Was Not Verified To Be Created By The Current Note With Note Address: ' + this.#note.noteAddress + '; The Note ID From the Block Didn\'t Match The Note\'s. Transaction Will Now Be Aborted!!!' );
				return false;
			}
		}		
		
		//checking the agreements.
		if( this.block.transType == 'RECIEVE' && typeof this.block.recipient == 'object' && typeof this.block.agreements == 'object' ){
			this.block.agreements[ this.block.recipient.agreeID ] = this.block.recipient;
		}
		
		//testing of transaction block hashes before continuing the block generation.
		let formerHash 	= this.block.realHash;
		let halfHash	= this.block.noteHash;
		let halfTrans 	= this.block.transHash;
		let noteHash 	= this.#note.noteHash;//Scriptbill is the remaining half of the hash		
		//get the total hash of the note by removing the noteHash calculation from the note.
		let transHash 	= this.#note.transHash;
		let totalHASH	= this.block.totalHASH;
		
		//attempting to get correct hash value of the note.
		delete this.#note.noteHash;
		delete this.#note.transHash;
		let stringNote = JSON.stringify( this.#note );
		this.string    = stringNote;
		let realHash = this.hashed();
		
		//attempting to get the correct hash value of the former transaction block.
		delete this.block.noteHash;
		delete this.block.transHash;
		let stringTrans 	= JSON.stringify( this.block );
		this.string 		= stringTrans;
		let transBlockHash 	= this.hashed();
		
		this.#note.noteHash = noteHash;
		this.#note.transHash = transHash;
		
		//comparing the two hashes gotten.
		let concatHash = halfHash + noteHash;		
		
		//fake note detected.
		if( realHash != concatHash && this.#note.noteAddress != '' && this.#note.noteID != '0000' ) {
		
			this.errorMessage('The Note Block Gotten With Block ID: ' + this.block.blockID + ' Was Not Verified To Be Created By The Current Note With Address: ' + this.#note.noteAddress + ' Current Transaction Now Aborting...');
			return false;
		}
		
		//let's add the two hashes gotten both from the note and the block.
		concatHash = halfTrans + transHash;
		
		//fake block detected.
		if( transBlockHash != concatHash && this.#note.noteAddress != '' && this.#note.noteID != '0000' ) {
			this.errorMessage('The Note Block Gotten With Block ID: ' + this.block.blockID + ' Was Not Verified To Be Created By The Current Note With Address: ' + this.#note.noteAddress + ' Current Transaction Now Aborting...');
			return false;
		}
		
		//restoring the variable.
		this.block.transHash 		= transBlockHash;
		this.block.noteHash			= halfHash;
		
		
		//before continuing the transaction, we test to verify the transaction block hash that has been kept.
		let testHASH 	= this.block.transHash + this.#note.transHash;
		this.string 	= testHASH;
		let reHash 		= this.hashed();
		let blockHash 	= this.#note.blockHash;
		
		if( reHash != blockHash && this.#note.noteAddress != '' && this.#note.noteID != '0000' ) {
			this.errorMessage('The Note Block Gotten With Block ID: ' + this.block.blockID + ' Was Not Verified To Be Created By The Current Note With Address: ' + this.#note.noteAddress + '. The Block Hashes Stored On This Note is Fake; Current Transaction Now Aborting...');
			return false;
		}
		
				
		//testing the note's nonce
		let nonce 		= this.block.noteID;
		this.string 	= this.#note.noteID;
		let hashedNonce = this.hashed();
		
		//fake note detected
		if( nonce != hashedNonce && this.#note.noteID != '0000' ) {
			this.errorMessage('The Note Block Gotten With Block ID: ' + this.block.blockID + ' Was Not Verified To Be Created By The Current Note With Address: ' + this.#note.noteAddress + '. The Block Couldn\'t Identify The Note...');
			return false;
		}
		
		//testing the note values.
		let blockValue 	= this.block.noteValue;
		let noteValue  	= this.#note.noteValue;
		let transValue 	= this.block.transValue;
		let transType	= this.block.transType;
		let totalValue 	= transType == 'SEND'  ? blockValue + transValue : blockValue - transValue;
		
		totalValue 		= transType == 'CREATE' ? blockValue : totalValue;
		
		//fake note detected.
		if( totalValue != noteValue ) {
			this.errorMessage('The Note Block Gotten With Block ID: ' + this.block.blockID + ' Was Not Verified To Be Created By The Current Note With Address: ' + this.#note.noteAddress + '. The Block Couldn\'t Verify The Note\'s Value...');
			return false;
		}
		
		//restoring the hashes.
		this.string			= formerHash + realHash;
		this.block.realHash = this.hashed();
		
		//checking the hashes.
		if( ! this.block.realHash.includes( this.block.nextHash ) && this.block.realHash.indexOf( this.block.nextHash ) !== 0 ) {
			this.errorMessage('The Note Block Gotten With Block ID: ' + this.block.blockID + ' Was Not Verified To Be Created By The Current Note With Address: ' + this.#note.noteAddress + '. The Block Couldn\'t Verify The Note\'s Integrity...');
			return false;
		}
		
		//restoring the hashes for the block.
		this.string 			= totalHash + transBlockHash;
		this.block.totalHASH	= this.hashed();
		
		//checking the hashes.
		if( ! this.block.totalHASH.includes( this.block.nextBlockHash ) && this.block.totalHASH.indexOf( this.block.nextBlockHash ) !== 0 ) {
			this.errorMessage('The Note Block Gotten With Block ID: ' + this.block.blockID + ' Was Not Verified To Be Created By The Current Note With Address: ' + this.#note.noteAddress + '. The Block Couldn\'t Verify The Note\'s Integrity...');
			return false;
		}
		
		//testing note budgets.
		//to store a budget, we create a key for the budget and create a transaction
		//block to allow the network interact with the budget.
		
		if( this.#note.noteBudgets.length > 0 ) {
			let budgets = this.#note.noteBudgets;
			let block, budgetValue = 0;
			for( budgetKey in budgets ){
				this.setPrivateKey( budgetKey );
				this.blockID 	= this.getPublicKey();
				block 			= this.getTransBlock();
				budgetValue 	+= block.transValue;
			}
			
			let ranks = this.#scriptbillRanks;
			this.setPrivateKey( this.#note.rankKey );
			let rankCode = this.decrypt( this.block.rankCode );
			let rank	= ranks[ rankCode.split("|")[0] ];
			let creditLevel = 0;
			if( rank ){
				creditLevel = rank.credit_level;
				
				if( this.#note.noteType != 'SBCRD'){
					creditLevel = creditLevel * this.getExchangeValue( 'SBCRD', this.#note.noteType )[1];
				}
			}
			
			if( this.details.transType == 'SEND' && budgetValue >= this.#note.noteValue ){
				let newValue = this.#note.noteValue + creditLevel;
				if( budgetValue >= newValue ){
					this.errorMessage('The Current Note with Note Address: ' + this.#note.noteAddress + ' Cannot Run The Current Transaction Because of An Unexecuted Budget');
					return false;
				}
			}
		}
		
		this.successMessage('Transaction Block Successfully Verified. Scriptbill Note Will Continue the Transaction!');
		console.log("End of verifyScriptbillTransactionBlock");
		
		return this.block;
	}//local pass OdMIg6QrO4A/qk8TvVeJxQ==
	
	//Scriptbill is the legal function for generating transaction blocks in the network.
	//to test if a block is not generated using the function the Scriptbill verify block function filter that out.
	//Scriptbill funnction will do the following: first updates all document based on the current transactional data.
	//then the function will protect the block from tampering by setting security algorithm and signatures around the blocks
	//the function is where all Scriptbill transaction types are handled.
	
	static generateScriptbillTransactionBlock(){
		console.log("Start Of generateScriptbillTransactionBlock ", "WalletID: " + this.walletID, "Details: " + JSON.stringify( this.details ), "note: " + JSON.stringify( this.#note ) );

		if( ! this.#note ){
			this.#note = this.getCurrentNote();
		}
		
		if( this.#note && ( ! this.walletID || this.walletID != this.#note.walletID ) ){
			this.walletID 	= this.#note.walletID;
		}
		
		if( ! this.details || ! this.walletID ) return;
		
		let messages = [];
		if( this.s.message )
			messages = JSON.parse( this.s.message );
		
		messages.push('Generating Transaction Block For ' + this.walletID );
		
		this.s.message = JSON.stringify( messages );
			
		
		//before doing anything, we need to ensure we have the current note set, else we won't have to run Scriptbill function.
		if( ! this.#note ){
			if( this.s.currentNote ){
				this.#note = this.getCurrentNote();
			}
			
			else if( this.noteAddress ) {
				this.getNote();				
			}
			
			if( ! this.#note ){
				this.errorMessage('No Note Found! Transaction Can\'t Be Runned Without A Valid Scriptbill Note!!!');
				return false;
			}
		}
		
		//we first check the recipient, if set, else we use the current note as recipient
		if( ! this.details.recipient )
			this.details.recipient = this.#note.noteAddress;
		
				
			
		//the agreement must be in the required format for it to work, else we revert to the default agreement.
		if( ( ! this.details.agreement || typeof this.details.agreement != 'object' || this.details.agreement.isPeriodic == undefined || this.details.agreement.times == undefined || this.details.agreement.payTime == undefined || this.details.agreement.payPeriod == undefined || this.details.agreement.delayInterest == undefined ) && this.details.transType == 'SEND' )
			this.details.agreement = this.defaultAgree;
				
		//since everything is set, we need to get the transaction block of the current note.
		this.blockID 	= undefined;
		console.log( "note: " + JSON.stringify( this.#note ) );
		let formerBlock = this.getTransBlock();
				
		if( formerBlock == undefined || ! formerBlock )
			formerBlock = this.defaultBlock;
		
		if( formerBlock.interestRate ){
			this.interestRate = formerBlock.interestRate;
			if( formerBlock.interestType ){
				this.interestType = formerBlock.interestType;
			}
		}
		
		//next is to use information on the former block to configure the new block,
		//if the information on the former block does not match that of the new block, then the note has become invalid		
		
		//before we continue, let's verify that the note actually created Scriptbill block by verifying the signature.
		this.block = formerBlock;
		
		console.log( "block gotten " + JSON.stringify( this.block ) );
		
		this.newBlock = this.verifyScriptbillTransactionBlock();	
		
		//the block was not successfully verified.
		if( this.newBlock === false ) return false;
		
		console.log( "newBlock Intact: " + JSON.stringify( this.newBlock ) );
		
		if( this.block.blockID ) {
			
			if( ! this.autoExecute ) {
				//first of all, the new block ids will have to change.
				this.newBlock.blockID 		= this.block.nextBlockID;
				this.newBlock.formerBlockID = this.block.blockID;
				this.newBlock.nextBlockID 	= this.calculateNextBlockID();
			}
			else {
				this.newBlock.blockID 		= this.details.nextBlockID;
				this.newBlock.formerBlockID = this.details.blockID;
				this.newBlock.nextBlockID	= "AUTOEXECUTE";
			}
		}
				
		//we get the current wallet block for the note.
		//this will help us stay updated with the right wallet hashes to use for the block
		let walletBlock 			= this.getCurrentWalletBlock( this.block );
		
		if( walletBlock ){
			this.newBlock.walletHASH 		= walletBlock.nextWalletHASH;
			this.newBlock.formerWalletHASH 	= walletBlock.walletHASH;
			this.seed 						= this.newBlock.walletHASH;
			let secret 						= this.#note.noteSecret;
			this.#note.noteSecret 			= this.walletID;
			this.newBlock.nextWalletHASH   	= this.calculateNextBlockID();
			this.#note.noteSecret 			= secret;
		}
		
		//before doing anything, let's add verification values to the current block
		//adding the current note value to the noteBlock
		this.newBlock.noteValue			= this.#note.noteValue;
		this.newBlock.noteID			= this.#note.noteID;		
		
			
		//next, we have to treat each transaction by details or by note type.
		//we have three different type of note, the BOND, STOCK & CREDIT note types.
		//testing the credit note type transaction
		let agreement 	= this.details.agreement;
		let privKey 	= this.generateKey(20);
		//defining loop variables
		let x;
		let subs;	
		
		if( this.#note.noteType.includes('CRD') ){
			if( this.transSend.includes( this.details.transType ) ){

				
				if( this.details.agreement && this.details.transType == "SEND" ) {
					//signing the timeStamp of the agreement.
					let currentTime = this.currentTime();
					this.signTxt = currentTime;
					this.signKey  = this.generateKey();			
					this.details.agreement.agreeSign = this.Sign();
					this.setPrivateKey( this.signKey );
					this.details.agreement.agreeID = this.getPublicKey();
					this.#note.agreements.push( this.signKey );
					this.details.agreement.agreeTime = this.signTxt;
				}
				
				//ensuring that a non product transaction does not contain the product details
				if( this.newBlock.productID && ( this.details.transType != "BUYPRODUCT" || this.details.transType != "PRODUCTSUB" ) ){
					delete this.newBlock.productID;
					delete this.newBlock.productBlockID;
					delete this.newBlock.productNextBlockID;
					delete this.newBlock.productFormerBlockID;
					delete this.newBlock.agreement;
				}
						
				console.log("Transvalue: " + this.details.transValue, "noteValue: " + this.#note.noteValue );
				if( this.details.transValue > this.#note.noteValue ) {
					console.log("Trans Greater");
					let productBlock;
					let noteVal		= this.#note.noteValue;
					if( this.details.productID ){
						this.productID = this.details.productID;
						productBlock 	= this.getTransBlock();
						
						if( productBlock && productBlock.productID ){
							//get the user ranking
							let userRank = this.newBlock.rankCode;
							let rankCredit = 100;
							let rank;
							
							if( this.#note.rankKey ) {
								this.setPrivateKey( this.#note.rankKey );
								userRank 		= this.decrypt( userRank );
								rank			= this.#scriptbillRanks[ userRank ];
								
								if( rank && rank.code == userRank ) {
									rankCredit 	= rank.credit_level;
								}
							}
							
							let remCredit 		= noteVal - this.details.transValue;
							noteVal          	+= rankCredit;
							
							if( this.details.transValue > noteVal ){
								this.errorMessage("Your Transaction Could Not Be Completed Because Your Note Value Is Not enough and You Have Reached Your Maximum Credit Level. Buy more Scriptbill Bonds To Get A Higher Credit Level.");
								return false;
							}
							
							
						}
						else {
							this.errorMessage( "Transaction Can't Be Completed, Because Your Note Value is Too Low! Please Acquire More Scriptbills To Continue." );
							return false;
						}
					}
					else {
						console.log("No Product ID in the request...");
						this.errorMessage( "Transaction Can't Be Completed, Because Your Note Value is Too Low! Please Acquire More Scriptbills To Continue." );
						return false;
					}
				}
				
				 if( ( this.details.transType == "BUYSTOCK" || this.details.transType == "BUYBOND" ) && this.details.budgetID && this.details.stock  ){
					this.budgetID 	= this.details.budgetID;
					let budgetBlock = this.getTransBlock();
					budgetBlock 	= this.getCurrentBlock( budgetBlock );
					
					if( ! budgetBlock ){
						this.errorMessage("You " + this.walletID + " are Trying to Invest on a Budget That Does Not Exist. You Can As Well Contact The Company or Organization That Gave You This ID " + this.details.budgetID + " To Confirm And Try Again!!!");
						return false;
					}
					
					if( ! budgetBlock.agreement ) {
						this.errorMessage("You " + this.walletID + " are Trying to Invest on a Budget That Does Not Have a Valid Budget Data. You Can As Well Contact The Company That Gave You This ID " + this.details.budgetID + " To Confirm And Try Again!!!");
						return false;
					}
					
					let budget = budgetBlock.agreement;
					let pouch  = budget.investorsHub;
					
					/* if( ! pouch.includes( this.details.hash ) ){
						this.errorMessage("You " + this.walletID + " are Trying to Buy a Stock Not Recognized By Budget With ID: " + this.details.budgetID + ". Please Contact The Stockholder for Help");
						return false;
					} */
					
					//next let's build the stock value. which will be calculated by multiplying the
					//stock with the budget value.
					let stockValue = budget.value * this.details.stock;
					//the transaction value is the amount the user is willing to pay for the stock.
					//however we test if the user is opting to buy a particular value.
					let transValue = stockValue * this.details.pay;
					
					//testing the note credits.
					if( budget.budgetCredit != this.#note.noteType ){
						this.details.transValue = transValue * this.getExchangeValue( budget.budgetCredit, this.#note.noteType )[1];
					}
					
					//an investor cannot invest on a budget with a credit investment.
					//he must possess the value of the credit before investment
					if( this.details.transValue != transValue && this.#note.noteValue >= transValue )
						this.newBlock.transValue = transValue;
					
					else if( this.#note.noteValue >= this.details.transValue )
						this.newBlock.transValue = this.details.transValue;
					
					else {
						this.errorMessage("You " + this.walletID + " Do Not Have Sufficient Credit to Buy this Stock With ID: "+budget.budgetID+".");
						return false;
					}
					
					//since everything is set, we encrypt the agreement to akert the recipient
					//who should be the holder of the stock
					if( ! this.details.recipient || this.details.recipient == this.#note.noteAddress ) {
						this.errorMessage("Sorry No Valid Recipient Was Found To Sell the Stocks or Bond.");
						return false;
					}				
					
					//before encrypting the budget let's add references to our block
					privKey 				= this.generateKey( 20 );
					this.setPrivateKey( privKey );
					this.newBlock.blockRef	= this.getPublicKey();
					this.newBlock.signRef	= this.generateKey( 20 );
					budget.privateKey		= privKey;
					this.setPublicKey( this.details.recipient );
					this.newBlock.recipient = this.encrypt( JSON.stringify( budget ) );
					this.newBlock.pay 		= this.details.pay;
					this.newBlock.stock 	= this.details.stock;
					this.newBlock.transType = this.details.transType;
					
				}
				 //encrypt the public key with the recipient provided.
				else if( this.details.transType == 'BUYPRODUCT' && this.details.productID &&  agreement.units > 0 ) {
					this.setPublicKey( this.details.productID );
					agreement.units					-= 1;
					this.newBlock.agreement 		= agreement;
				}
				else if( this.details.transType == 'PRODUCTSUB' && this.details.productID && agreement.units > 0 && ( ! agreement.subUnit || agreement.subUnit > 0 ) ) {
					this.setPublicKey( this.details.productID );
					agreement.units					-= 1;
					
					//add the subscription unit if not found.
					if( ! agreement.subUnit ){
						agreement.subUnit 					= Math.round( agreement.value / this.details.transValue );
						this.details.subConfig.value  		= this.details.transValue;
						let subTime 						= this.calculateTime( this.details.subConfig.subSpread );
						this.details.subConfig.nextSub 		= parseInt( this.currentTime() ) + subTime;
						this.details.subConfig.productID 	= this.details.productID;
						this.#note.noteSubs.push( JSON.stringify( this.details.subConfig ) );
						agreement.subConfig 				= this.details.subConfig;
					}
					else {
						agreement.subUnit 				-= 1;
						let subTime 					= this.calculateTime( this.details.subConfig.subSpread );
						this.details.subConfig.nextSub 	= parseInt( this.currentTime() ) + parseInt( subTime );
						
						for( x = 0; x < this.#note.noteSubs; x++ ){
							subs = JSON.parse( this.#note.noteSubs[x] );
							
							if( subs.productID == this.details.productID ) {
								subs.nextSub 	= this.details.subConfig.nextSub;
								delete this.#note.noteSubs[x];
								this.#note.noteSubs.push( JSON.stringify( subs ) );
								break;
							}
						}
						agreement.subConfig				= this.details.subConfig;
					}				
				}
				else if( this.details.transType == 'PRODUCTSUB' && agreement.subUnit && agreement.subUnit <= 0 ){
					this.newBlock.transType = 'UPDATE';
					this.newBlock.transValue = 0;					
					if( this.#note.noteSubs && typeof this.#note.noteSubs == 'object' ) {
						for( x = 0; x < this.#note.noteSubs.length; x++ ){
							subs = JSON.parse( this.#note.noteSubs[x] );
							
							if( subs.productID == this.details.productID ){
								delete this.#note.noteSubs[x];
							}
						}
					}
				}
				else if( this.details.transType == 'SEND' )
					this.setPublicKey( this.details.recipient );
				
				//if purchasing items, the details should carry the information on the user's block
				if( ( this.details.transType == 'BUYPRODUCT' || this.details.transType == 'PRODUCTSUB' ) && this.details.productID ) {
					this.seed 				= this.details.productBlockID;
					
					//the calculate block id functions uses the note secret as private keys
					//we can overide Scriptbill behaviour by setting our own key as private key in the noteSecret handler.
					let secret 							= this.#note.noteSecret;
					this.#note.noteSecret				= this.details.productID;
					this.newBlock.productID				= this.details.productID;
					this.newBlock.productBlockID 		= this.details.productNextBlockID;
					this.newBlock.productFormerBlockID 	= this.details.productBlockID;
					this.newBlock.productNextBlockID 	= this.calculateNextBlockID();
					this.#note.noteSecret				= secret;
				}
				
				agreement.senderID 				= this.generateKey(10);
				let agreeKey 					= this.generateKey( 30 );
				this.setPrivateKey( agreeKey );
				agreement.senderKey				= this.getPublicKey();
				this.signTxt					= agreement.senderID;
				this.signKey					= agreement.senderKey;
				agreement.senderSign			= this.Sign();
				this.#note.noteValue 			-= this.details.transValue;				
				//we generate the key that would be used to sign the agreement.
				this.setPrivateKey( privKey );
				if( typeof this.#note.agreements != 'object' )
					this.#note.agreements = [];
				
				//setting the privateKey on the note makes the note the only legal recipient of the agreement when found in the network.
				this.#note.agreements.push( privKey );
				agreement.agreeID = this.getPublicKey();
				
				//before we encrypt the agreement, let's verify the block by sending important secrets to the reciever about Scriptbill transaction block.
				//we regenerate the private key.
				privKey 	= this.generateKey(20);
				agreement.privateKey = privKey;
				
				//use the private key to generate a public key that would be stored on Scriptbill block.
				this.setPrivateKey( privKey );
				this.newBlock.blockRef = this.getPublicKey();
				//the recipient would use Scriptbill text to sign his own block and allow verifiers to believe he had actually recieved the money from Scriptbill block.
				this.newBlock.signRef  = this.generateKey();
				
				
				
				this.newBlock.recipient = this.encrypt( JSON.stringify( agreement ) );

				//check if the sender is actually making payment for an exchange transaction.
				if( this.details.exBlockID ){
					if( this.details.exBlockID != 'SCRIPTBILLMINED' )
						this.deleteBlock( this.details.exBlockID );
				}
				
				//also check the former block to see what transaction type exist, if SEND then check if the recipient recieved the transaction 
				let sendkey = this.block.blockRef;
				
				
			}
			//this function does not recognize the response variable. However, to verify a recieve transaction
			//we want to have access to the send block transaction
			else if( ( this.transRecieve.includes( this.details.transType ) ) && this.response && ( this.transSend.includes( this.response.transType ) ) ){	
				
				this.setPrivateKey( this.#note.noteSecret );				
				agreement = this.decrypt( this.details.recipient );
				
				//the response object should be used to configure the recieve details.
				if( ! this.details.blockID || ! this.response.blockID || this.response.blockID != this.details.blockID )
					return false;
				
				let blockIN = this.details.blockID.slice( 0, 5);
				
				if( this.block.recievedIDs && this.block.recievedIDs.indexOf( blockIN ) >= 0 ){
					this.errorMessage( "Block Already Recieved!!! Transaction Now Aborting" );
					return false;
				}
				
				
				if( this.isJsonable( agreement ) && this.details.noteType == this.#note.noteType ){
					if( this.newBlock.productID ){
						delete this.newBlock.productID;
						delete this.newBlock.productBlockID;
						delete this.newBlock.productNextBlockID;
						delete this.newBlock.productFormerBlockID;
						delete this.newBlock.agreement;
					}
									
					if( this.details.transTime == this.#note.recievedTime ) {
						this.errorMessage( "Block Already Recieved!!! Transaction Now Aborting" );
						return false;
					}
					else if( this.details.blockID == this.#note.recievedBlockID ){
						this.errorMessage( "Block Already Recieved!!! Transaction Now Aborting" );
						return false;
					}
					
					this.#note.recievedBlockID = this.details.blockID;
					this.#note.recievedTime	  = this.details.transTime;
					
					if( ! this.newBlock.recievedIDs )
						this.newBlock.recievedIDs = [];
										
					//saving a 5bit id help save space while storing large number of ids.
					//IDS more than 2 weeks old may leave the recieved Ids handler.
					//if a block rolls after two weeks to help a note recieve, that transaction 
					//will be regarded null by the network.
					//to help matters, transaction that are not recieved after two weeks are cancelled.
					this.newBlock.recievedIDs.push( this.details.blockID.slice(0, 5) );
					
					//the recieved id store can't take more than 10 kilobytes of data
					if( this.newBlock.recievedIDs.length > 2000 ) {
						delete this.newBlock.recievedIDs[ this.newBlock.recievedIDs.length - 1 ];
					}
					
					agreement 	= JSON.parse( agreement );
					this.signKey = agreement.privateKey;
					this.setPrivateKey( this.signKey );
					this.pubKey = this.getPublicKey();
					
					if( this.pubKey != this.response.blockRef ){
						this.errorMessage("This block is invalid!!! the reference key is not equal with key supplied! Your Recieved Block Reference: " + this.response.blockRef + ". Recieved Transaction Now Aborting!!!");
						return false;
					}
					let privateKey   = agreement.privateKey;
					delete agreement.privateKey;
					//storing the agreement this way on the block makes it executable
					//by any node in the network.
					//the reciepient note will not be able to recieve the block transaction
					//more than once because the transaction will be referenced to the 
					//current block, re recieving the funds means having two or more 
					//blocks in the network having the same reference key, that will be
					//invalid, so scriptbill default behaviour is to do away with the 
					//first private key of the agreement to prevent the note from
					//re recieving agreements again.
					this.newBlock.agreements.push( agreement );
					
					if( this.details.transType == 'RECIEVE' ) {
					
						let conf = confirm('You are about recieving ' + this.details.transValue + ' and the details on the agreement: agreement value = ' + agreement.value + '; the agreement will end in: ' + this.timeToString( agreement.execTime ) + '; You\'ll be given a grace of: ' + this.timeToString( agreement.maxExecTime - agreement.execTime ) + '; The Payment is ' + ( agreement.isPeriodic ? 'going to be periodic and the periodic times will be ' + agreement.times + ' with an interest rate of ' + agreement.interestRate + ' which will be calculated as a ' + agreement.interestType + ' interest and would be calculated every ' + agreement.interestSpread : 'not going to be periodic' ) +  '. Do you which to continue recieving Scriptbill transaction or click cancel to cancel the transaction? ' );
							
						if( ! conf ){ 
							this.errorMessage( this.response.blockID + " Recieved Transaction Now Being Cancelled!!!");
							//create a transaction block to cancel the transa
							this.details.transType 	= "CANCELLED";
							this.details.recipient 	= this.response.blockKey;
							this.details.transValue = this.response.transValue;
							this.details.noteValue 	= this.#note.noteValue;
							this.details.noteType	= this.#note.noteType;
							this.details.agreement 	= agreement;
							//adding the block reference to be sure.
							this.details.agreement.privateKey = privateKey;
							this.details.blockRef 	= this.response.blockRef;
							this.generateScriptbillTransactionBlock();
							return false;
						}
					
					}
					
					//
					
										
				}
				else if(  this.isJsonable( agreement ) && this.details.noteType != this.#note.noteType ){
					let conf = confirm('You are about recieving ' + this.details.transValue + ' with a Credit Type of: ' + this.details.noteType + '. To Recieve Scriptbill Credit you need to create a new Scriptbill Note of Scriptbill type. Do you Wish to Continue?' );
						
					if( ! conf ) {
						let noteAdd = prompt('Please enter the note Address to recieve Scriptbill credit. Cancel if you don\'t want to recieve Scriptbill credit or you want to exchange Scriptbill credit directly!!!');
						
						if( noteAdd != null ){
							this.details.recipient = noteAdd;
							this.#note.noteValue 	+= this.details.transValue;
							this.generateScriptbillTransactionBlock();
						}
						else {
							this.response = this.details;
							this.exchangeCredits();
						}
					
					}else {
						//save the current note ro preserve the note's information
						//then create a new note th
						this.saveNote();
						agreement 							= JSON.parse( agreement );
						this.defaultBlock 					= this.details;
						this.defaultBlock.agreement 		= agreement;
						this.defaultScriptbill.noteType 	= this.details.noteType;
						this.defaultScriptbill.noteServer 	= this.details.noteServer;
						this.defaultScriptbill.walletID		= this.#note.walletID;
						this.createNewScriptbillWallet();
						return false;
					}
				}
				//if the current note cannot decrypt the agreement sent, then the agreement is not meant for the current note.
				else  /*if( this.details.noteType == this.#note.noteType )*/{
					//before returning, we test other private keys that exists on Scriptbill note that can be used to send data to Scriptbill note.
					//first test the note products, incase the note is selling a product.
					let products = this.#note.noteProducts;
					if( typeof products == 'object' ){						
						for( x = 0; x < products.length; x++ ){
							privKey = products[x];
							this.setPrivateKey( privKey );
							agreement = this.decrypt( this.details.recipient );
							if( this.isJsonable( agreement ) ){
								if( this.details.noteType != this.#note.noteType ){
									this.response = this.details;
									this.exchangeCredits();//BAAACK
									return;
								}
								agreement 	= JSON.parse( agreement );
								this.signKey = agreement.privateKey;
								delete agreement.privateKey;
								this.newBlock.agreements.push( agreement );
								break;
							}
						}					
					}
					//next we need to check the agreements the note has made whether it's the transaction block offered in the details.
					if( typeof this.#note.agreements == 'object' ){
						for( x = 0; x < this.#note.agreements.length; x++ ){
							privKey = this.#note.agreements[x];
							this.setPrivateKey( privKey );
							agreement = this.decrypt( this.details.recipient );
							if( this.isJsonable( agreement ) ){
								agreement = JSON.parse( agreement );
								this.signKey = agreement.privateKey;
								delete agreement.privateKey;
								delete this.#note.agreement[x];
								break;
							}
						}
					}
					
					//the profit keys are added to the note whenever the note makes a payment for a product
					//the profit keys will remain on the note as long as the block carrying the public key has 
					//not expired
					if( this.details.transType == 'PROFITRECIEVE' && this.#note.profitKeys && typeof this.#note.profitKeys == 'object' ){
						for( x = 0; x < this.#note.profitKeys.length; x++ ){
							privKey = this.#note.profitKeys[x];
							this.setPrivateKey( privKey );
							agreement = this.decrypt( this.details.recipient );
							if( this.isJsonable( agreement ) ){
								agreement = JSON.parse( agreement );
								this.signKey = agreement.privateKey;
								delete agreement.privateKey;
								break;
							}
						}
					}
					//the recieve action can't be completed if the agreement is not decrypted.
					if( typeof agreement != 'object' ) {
						this.newBlock = undefined;
						return false;
					}
				}				
				this.newBlock.transValue = this.details.transValue;
				this.signTxt 			 = this.details.signRef;				
				
				if( this.signTxt && this.signKey ){
					this.newBlock.signRef = this.Sign();
				}
				else return false;
				
				this.setPrivateKey( this.signKey );
				this.newBlock.blockRef = this.getPublicKey();
				
				if( this.details.productID ){
					this.details.transValue = this.details.transValue - ( this.details.transValue * agreement.sharingRate );
				}
				
				if( this.details.transType != 'STOCKRECIEVE' )
					this.#note.noteValue += this.details.transValue;
				
				else {
					
					//configuring the default stock note for the User.
					this.defaultScriptbill.walletID		= this.#note.walletID;
					this.defaultScriptbill.stockKey 	= agreement.transKey;
					this.defaultScriptbill.noteValue	= agreement.stock;
					this.defaultScriptbill.transValue	= agreement.pay;
					this.defaultScriptbill.noteType 	= agreement.budgetCredit;
					
					if( this.details.budgetProducts && this.details.budgetProducts.length > 0 )					
						this.defaultScriptbill.stockProducts = this.details.budgetProducts;
					
					this.createNewScriptbillWallet();
				}
				
				//signing the agreement.
				this.signTxt 		= this.generateKey( 20 );
				this.signKey		= this.generateKey( 30 );
				agreement.recieverSign	= this.Sign();
				agreement.recieverID	= this.signTxt;
				agreement.recieverKey	= this.signKey;
				
				if( ! this.newBlock.agreements || ! this.newBlock.agreements.length )
					this.newBlock.agreements = [];
				
				//configuring the new block
				this.newBlock.agreements.push( agreement );
				this.newBlock.transType = this.details.transType;
				this.newBlock.transValue = this.details.transValue;
				this.newBlock.noteType 	= this.details.noteType;
			}
			
			else if( this.details.transType == 'CREATEPRODUCT' ) {
				//first configure the product ID
				let productKey 			= this.generateKey(20);
				
				if( this.productKey )
					productKey = this.productKey;
				
				this.setPrivateKey( productKey );
				this.newBlock.productID = this.getPublicKey();
				
				if( this.details.businessKey ){
					this.newBlock.businessKey = this.details.businessKey;
				}
				else {
					let rurl = new URL( this.default_scriptbill_server );
					rurl.searchParams.set( "BMKey", "" );
					fetch( rurl ).then( response =>{ return response.text() } ).then( result =>{
						this.newBlock.businesskey = result;
					} );
				}
				
				if( this.#note.noteProducts && this.#note.noteProducts.length > 0 ) {
					let product = this.#note.noteProducts[0];
					this.setPrivateKey( product );
					this.productID = this.getPublicKey();
					let prodBlock = this.getTransBlock();
					
					if( prodBlock.budgetID ){
						this.newBlock.budgetID = prodBlock.budgetID;
					}
				}				
				//trying to get the budget id which this product will be under.
				else if( this.#note.noteBudgets && this.#note.noteBudgets.length > 0 ){
					let budgets = this.#note.noteBudgets, budget;
					for( x = 0; x < budgets.length; x++ ){
						budget = budgets[x];
						this.setPrivateKey( budget );
						this.budgetID = this.getPublicKey();
						budget 		= this.getTransBlock();
						
						if( budget && ( budget.budgetType == 'straight' || budget.budgetType == 'recursive') ){
							this.newBlock.budgetID = this.budgetID;
							break;
						}
					}
				}
				
				//save the key in the current note.
				this.#note.noteProducts.push( productKey );
				
				//create the note's block IDs
				this.string 						= this.currentTime();
				this.newBlock.productBlockID 		= this.hashed();
				this.seed							= this.newBlock.productBlockID;
				let secret 							= this.#note.noteSecret;
				this.#note.noteSecret				= this.newBlock.productID;
				this.newBlock.productNextBlockID 	= this.calculateNextBlockID();
				this.newBlock.productFormerBlockID	= "";
				this.#note.noteSecret				= secret;
				
				//add the business manager key to the block as a refferal.
				if( this.#note.BMKey ){
					this.newBlock.businessKey		= this.#note.BMKey;
				}
				
				else {
					this.newBlock.businessKey		= this.#note.noteAddress;
				}
				
				//add the value of the product as the transaction value of the product.
				this.newBlock.transValue			= this.details.transValue;
				this.newBlock.transType				= this.details.transType;
				
				//add the product details as agreement tot the block.
				this.newBlock.agreement 			= this.details.agreement;
			}else if( this.details.transType == "CREATEBUDGET" ){
				
				privKey = this.generateKey(20);
				this.setPrivateKey( privKey );
				this.#note.noteBudgets.push( privKey );
				this.details.budgetID = this.getPublicKey();				
				
				//testing the type of the budget,
				if( this.details.agreement.budgetType && ( this.details.agreement.budgetType == 'straight' || this.details.agreement.budgetType == 'recursive' ) ) {
					let products = this.#note.noteProducts;
					let x, product, productID, productBlock;
					if( ! this.newBlock.budgetProducts )
						this.newBlock.budgetProducts = [];
					for( x = 0; x < products.length; x++ ){
						product = products[x];
						this.setPrivateKey( product );
						this.productID = this.getPublicKey();
						productBlock = this.getTransBlock();
						
						if( productBlock ){
							this.newBlock.budgetProducts.push( this.productID );
						}
					}
				}
				
				this.newBlock.budgetID 		= this.details.budgetID;
				this.newBlock.agreement 	= this.details.agreement;
				this.newBlock.budgetCredit 	= this.details.agreement.budgetCredit;
				this.newBlock.expiry 		= Infinity;
			}
		
			else if( this.details.transType == 'INVESTRECIEVE' ){
				if( ( this.#note.noteBudgets && this.#note.noteBudgets.length > 0 ) || ( this.response && this.response.transType == "SELLSTOCK" ) ) {
					let budget, agreement;
					
					if( this.response.transType == 'INVEST' || this.response.transType == "SOLDSTOCK" || this.response.transType == "SOLDBOND" ){
						//this transaction is for the note that made the payment to purchase the stock or bond or any other investment based transactions
					
						this.setPrivateKey( this.#note.blockKey );
						agreement = this.decrypt( this.details.recipient );
							
						if( this.isJsonable( agreement ) ){
							//if we find out that the investment was directed to our store, we check the value of the investment from the product information.
							//to do Scriptbill we get the recent product block from the database.
							this.budgetID		= this.details.budgetID;
							let productBlock 	= this.getTransBlock();
								
							if( productBlock ){
								if( productBlock.length ){
									productBlock = this.getCurrentBlock( productBlock );
								}
								
								let prodAgree = productBlock.agreement;
								let budgetValue = prodAgree.value;
								let rankFound = false
									
								//this is because the notte can have more than one ranks
								if( prodAgree.companyRanks && this.#note.companyRanks && typeof this.#note.companyRanks == 'object' ) {
									let ranks = this.#note.companyRanks;
									let q;
										
									for( q = 0; q < ranks.length; q++ ) {
										privKey = ranks[q];
										this.setPrivateKey( privKey );
										pubKey  = this.getPublicKey();
										this.setPrivateKey( pubKey );
										pubKey  = this.getPublicKey();
										
										//compare the pubkey gotten with the companyRank key
										//supplied.
										if( prodAgree.companyRanks.includes( pubKey ) ) {
											rankFound = true;
											break;
										}
									}
								}
								let t, percent, stock, amount, total, pay;
								if( rankFound ) {
									t = prodAgree.workingPartner;
									percent = prodAgree.workingPartnerShare;
								} else {
									t = prodAgree.sleepingPartner;
									percent = prodAgree.sleepingPartnerShare;
								}
								switch(t){
									case 'percent-high':
										amount = this.details.transValue * percent;
										total  = this.details.transValue + amount;
										stock  = total/budgetValue;
										pay    = stock;
									break;
									case 'percent-low':
										amount = this.details.transValue * percent;
										total  = this.details.transValue - amount;
										stock  = total/budgetValue;
										pay    = stock;
									break;
									case 'percent-equal':
										stock  = this.details.transValue / budgetValue;
										pay = stock;
									break;
									case 'dividend-high':
										stock  	= this.details.transValue / budgetValue;
										pay 	= stock + percent;
									break;
									case 'dividend-equal':
										stock  	= this.details.transValue / budgetValue;
										pay 	= stock;
									break;
									case 'dividend-low':
										stock  	= this.details.transValue / budgetValue;
										pay 	= stock - percent;
									break;
									default :
										stock  	= this.details.transValue / budgetValue;
										pay 	= stock;
									break;
								}
									
								//creating the new stock note for the investor.
								//we will be able to target the investor with the public key
								//on his block
								let details = this.details;
								this.details = producBlock;
								this.setPublicKey( this.#note.noteAddress );							
								this.details.agreement = prodAgree;
								this.details.transType = 'QUOTESTOCK';
								this.details.agreement.pay = pay;
								this.details.agreement.stock = stock;
								let privKey 				= this.generateKey( 20 );
								this.details.agreement.transkey = privkey;
								this.details.recipient = this.encrypt( JSON.stringify( this.details.agreement ) );
								this.generateScriptbillTransactionBlock();
								return;
							}
						}
					} else if( this.response.transType == "SELLSTOCK" ){
						//a sellestock trasanaction will come from the stock note associated
						//with this note. This means only the noteSecret that would be able 
						//to decruypt the agrreement on this block
						this.setPrivateKey( this.#note.noteSecret );
						agreement 		= this.decrypt( this.details.recipient );
						let budget;
						
						if( typeof agreement == 'string' && agreement.indexOf('{') == 0 && agreement.lastIndexOf('}') == ( agreement.length - 1 ) ){ 
							budget 		= JSON.parse( agreement );
							privKey		= budget.privateKey;
							
							//since the agreement has been confirmed to be owned by this note
							//we add the value to the note.
							
							if( this.#note.noteType == this.details.noteType )
								this.#note.noteValue += this.details.transValue;
							
							else {
								this.details.transValue = this.details.transValue * this.getExchangeValue( this.#note.noteType, this.details.noteType )[1];
								this.#note.noteValue += this.details.transValue;
							}
							
							//trying to sign the new block
							this.signKey  = privKey;
							this.signText = this.details.signRef;
							this.newBlock.signRef = this.Sign();
							this.setPrivateKey( privKey );
							this.newBlock.blockRef = this.getPublicKey();
							this.newBlock.transType = "SOLDSTOCK";
							this.newBlock.budgetID 	= this.details.budgetID;
							
							//now let's get the recipient.
							//we should note that the recipient will not be in the recipient
							//handler as the agreement was set there. We don't expect
							//transactions like this to be programmed but automated with running
							//blocks.
							this.setPublicKey( this.details.budgetID );
							this.newBlock.recipient = this.encrypt( JSON.stringify( budget ) );this.newBlock.blockKey 	= this.details.blockKey;							
						} else if( this.details.budgetID && this.details.stock && this.details.pay && this.#note.noteBudgets.length > 0 ) {
							let budgets = this.#note.noteBudgets, x, budget, budgetID, block;
							for( x = 0; x < budgets.length; x++ ){
								budget = budgets[x];
								this.setPrivateKey( budget );
								budgetID = this.getPublicKey();
								
								if( budgetID != this.details.budgetID ) continue;
								
								this.budgetID = budgetID;
								block = this.getTransBlock();
								
								if( block ) break;
							}
							
							//no associate budget was ffound on this note, we'll like to search
							//else where.
							if( ! block ) return;
							
							//if found we decrypt the agreement to get the transHash stored.
							this.setPrivateKey( budgets[x] );
							agreement = this.decrypt( this.details.agreement );
							
							//break the function if we can't find an agreement
							if( ! this.isJsonable( agreement ) ) return false;
							
							budget = block.agreement;
							
							if( ! budget || ! budget.budgetID || ! budget.investorsHub || ! budget.budgetValue ) return false;
							
							let pouch 	= budget.investorsHub;
							//this should be the hashed version of the stock note's transaction key.
							//if you add your direct key to this handler it may be stolen.
							this.string = agreement.transKey;
							
							if( ! pouch.includes( this.hashed() ) ) {
								this.rejectResponse( "The Budget Does Not Recognize Your Stock Note As A Valid Investor. Please Ensure You Use Your StockKey From Your Note in Combination With Your Pay & Stock Value. Any Wrong Information Will Falsify The Request!" );
								return false;
							}
							
							//if the client was found, then we examine his selling request.		
							let stockValue = budget.value * this.details.stock;
							let requestValue = stockValue * this.details.pay;
							
							//checking the note value. The note will not fulfil a request on credit.
							if( requestValue > this.#note.noteValue ){
								this.rejectResponse( "The Budget Note Does Not Have Enough Credit To Fulfil This Request! Try Again Later or With a Smaller Pay Value. Your Current Pay Value is: " + this.details.pay );
								return false;
							}

							//continue with the payment as everything is good.
							this.newBlock.transValue = requestValue;
							this.newBlock.transType  ='SEND';
							this.#note.noteValue 	-= requestValue;							
							privKey					= this.generateKey();
							this.setPrivateKey( privKey );
							this.newBlock.blockRef	= this.getPublicKey();
							agreement.privateKey	= privKey;
							this.setPublicKey( this.details.blockKey );
							agreement = this.encrypt( agreement );
							this.newBlock.recipient = agreement;
							this.newBlock.signRef 	= this.generateKey();
						}
					}
				}
			}else if( this.details.transType == "QUOTESTOCK" || this.details.transType == "QUOTEBOND" ){
				//first decrypt the agreement handler.
				this.setPrivateKey( this.#note.noteSecret );
				agreement 		= this.decrypt( this.details.recipient );
				//Note that only the note that issues stock can really run this transaction.
				//the details should be able to tell us the budget creating this stocks or we return the function
				//because we don't know what budget we are creating the stocks for.
				if( this.details.budgetID ){
					
					this.budgetID = this.details.budgetID;
					this.budgetBlock = this.getTransBlock();
					
					if( ! this.budgetBlock ){
						this.errorMessage("The budget ID " + this.budgetID + " was not found connected to any valid budget, Please try again with a differenct Budget ID");
						return false;
					}
					
					//test the agreement to see if it is a valid budget configuration.
					if( agreement.budgetID != this.details.budgetID || ! agreement.investorsHub  ) return false;
					
					//the note will store all the stock note public key on the noteBudgets handler
					if( ! agreement.transKey )
						agreement.transKey = this.generateKey( 20 );
					
					this.setPrivateKey( agreement.transKey );
					let noteAddress = this.getPublicKey();
					this.#note.noteBudgets.push( noteAddress );
					
					
					//before encrypting the agreement for the recipient, let's add the recipient
					//as a valid investor to the budget.
					
					if( this.response.transType == "QUOTESTOCK" )
						this.string 			= noteAddress + this.details.agreement.pay.toString() + this.details.agreement.stock.toString();
					
					else if( this.response.transType == "QUOTEBOND" )
						this.string 			= noteAddress + this.details.transValue.toString();
					
					
					this.string 			= this.hashed();
					this.details.agreement.investorsHub.push( this.hashed() );
					this.setPublicKey( this.details.recipient );
					this.newBlock.recipient = this.encrypt( this.details.agreement );
					//help the network quickly discover this block using the budget id.
					this.newBlock.budgetID 	= this.details.budgetID;
					
					//save the current note so that we can configure the stock note already.
					this.saveNote();
					
					this.noteAddress		= this.#note.noteAddress;
					this.s.realNote  		= JSON.stringify( this.#note );
					this.#note 				= this.defaultScriptbill;
					this.#note.noteAddress  = noteAddress;
					this.#note.noteValue 	= this.details.agreement.pay;
					this.#note.stock		= this.details.agreement.stock;
					this.#note.motherKey 	= this.noteAddress;
					this.#note.transValue 	= this.details.transValue;
					this.#note.noteType		= this.details.agreement.stockID;
					this.#note.noteServer	= this.default_scriptbill_server;
					this.#note.walletID		= this.walletID;
					this.#note.blockID		= this.newBlock.blockID;
					
					//the main data that will be transaferred to the recipient will be deleted
					//before adding the budget data to a public view in the agreement handler.
					delete this.details.agreement.transKey;
					delete this.details.agreement.stock;
					delete this.details.agreement.pay;
					
					this.newBlock.agreement = this.details.agreement;
					this.newBlock.transValue 	= this.detils.transValue;
					this.newBlock.transType = this.details.transType;
					this.newBlock.noteValue 	= this.#note.noteVlaue;
					this.newBlock.noteType 		= this.#note.noteType;
					
					
					//CONTINUE
					
					
				} else return false;
				
			}else if( this.details.transType == "EXCHANGE" ) {
				
				console.log("Inside Exchange");
					
				let blockID 				= this.newBlock.blockID;
				let formerBlockID 			= this.newBlock.formerBlockID;
				let nextBlockID 			= this.newBlock.nextBlockID;
				this.newBlock 				= this.details;
				this.newBlock.blockID 		= blockID;
				this.newBlock.formerBlockID = formerBlockID;
				this.newBlock.nextBlockID 	= nextBlockID;
			
				if( ! this.details.sellCredit || ! this.details.buyCredit ) {
					this.errorMessage("Can't continue an Exchange Transaction Without Appropraite Credits!!!");
					return false;
				}
				
				this.buyCredit = this.details.buyCredit;
				this.noteType  = this.#note.noteType;
				let buyBlock	= this.getTransBlock();
				this.sellCredit = this.details.sellCredit;
				let sellBlock 	= this.getTransBlock();
				
				if( ! buyBlock ) {
					this.errorMessage("Can't buy Credit from an Unincluded Credit.");
					return false;
				}
				
				if( this.#note.noteType == this.details.noteType || this.#note.noteType == this.details.sellCredit ){
					if( this.#note.noteValue < this.details.transValue ){
						this.errorMessage("You Don't Have Sufficient Credit to Initiate the Exchange, Please try again with a Note with Higher Value");
						return false;
					}
				}
				else if( this.response && this.response.transValue < this.details.transValue && this.transSend.includes( this.response.transType ) ){
					this.errorMessage("Your Transaction Block Value is Lesser Than The Requested Block Value. Exchange Transaction Now Aborting!!!");
					return false;
				}
				else if( ! this.response ){
					this.errorMessage("You Cannot Ignite an Exchange Transaction Without a Readiness to Supply Credits to the Exchange market!!!");
					return false;
				}
				
				let secret;
				if( ! sellBlock || ! sellBlock.length || ! sellBlock[0].exBlockID ) {
					//generating the exchange keys and IDs
					this.newBlock.exchangeKey 	= this.generateKey( 30 );
					this.setPrivateKey( this.newBlock.exchangeKey );
					this.newBlock.exchangeID 	= this.getPublicKey();
					
					//generating the exchange block IDs.
					secret = this.#note.noteSecret;
					this.#note.noteSecret 		= this.newBlock.exchangeKey;
					this.newBlock.exBlockID 	= this.calculateNextBlockID();
					this.seed					= this.newBlock.exBlockID;
					this.newBlock.exNextBlockID = this.calculateNextBlockID();
					this.newBlock.exFormerBlockID = "";
					this.#note.noteSecret 		= secret;
					
					//adding the totalUnits.
					this.newBlock.totalUnits 	= this.details.transValue;
				} else {
					sellBlock					= this.getCurrentBlock( sellBlock );
					this.newBlock.exchangeKey = sellBlock.exchangeKey;
					this.newBlock.exchangeID  = sellBlock.exchangeID;
					
					//generating the exchange block IDs.
					secret 						= this.#note.noteSecret;
					this.#note.noteSecret		= this.newBlock.exchangeKey;
					this.seed 					= sellBlock.exBlockID;
					this.newBlock.exBlockID 	= this.calculateNextBlockID();
					this.seed					= this.newBlock.exBlockID;
					this.newBlock.exNextBlockID	= this.calculateNextBlockID();
					this.newBlock.exFormerBlockID = sellBlock.exBlockID;
					
					//adding the total units.
					this.newBlock.totalUnits 	= parseInt( sellBlock.totalUnits ) + parseInt( this.details.transValue );
				}				
			} else if( this.details.transType == "UPDATE" || this.details.transType == "UPDATEBUDGET"){
				let uBlockID = this.newBlock.blockID;
				let uNextBlockID = this.newBlock.nextBlockID;
				let uFormerBlockID = this.newBlock.formerBlockID;
				
				this.newBlock   			= this.details;
				this.newBlock.blockID		= uBlockID;
				this.newBlock.nextBlockID	= uNextBlockID;
				this.newBlock.formerBlockID	= uFormerBlockID;
				this.newBlock.transValue    = 0;
				this.newBlock.noteValue 	= this.#note.noteValue;
				this.newBlock.noteType		= this.#note.noteType;
				
			}
			else if( this.details.transType == "AGREEMENTREQUEST" ){
				
			}
			else if( this.details.transType == "AGREEMENTSIGN" ){
				
			}
			
		}
		else if( this.#note.noteType.lastIndexOf('STK') == ( this.#note.noteType.length - 3 ) ){
			//only a stock note type that does sell stocks
			//the note will take the motherKey parameter on the note to locate the beneficiary
			//note. Only a buy stock transaction will be able to initiate a sellstock transaction.
			if( this.details.transType == "SELLSTOCK" && this.#note.motherKey && this.response.transType == "BUYSTOCK" ){
				//confirming if the transaction was actually directed to us
				//the transaction block key will be used instead.
				this.setPrivateKey( this.#note.blockKey );
				agreement 			= this.decrypt( this.details.recipient );
				
				if( ! this.isJsonable( agreement ) ) {
					return false;
				}
				
				let budget = JSON.parse( agreement );
				let totalValue, Pay;
				//check the stock value. If not equal then we only reconfigure the pay.
				if( this.details.stock != this.#note.noteValue ) {
					totalValue = budget.value * this.#note.noteValue;
					Pay 		= totalValue * this.details.pay;						
				} else {
					totalValue  = budget.value;
					Pay			= totalValue * this.details.pay;
				}
				
				let exValue;
				
				//we have to configure the pay to obey the exchange values of the credits 
				//involve in the transaction.
				if( this.details.noteType != budget.budgetCredit ){
					exValue 	= this.getExchangeValue( this.details.noteType, budget.budgetCredit );
					Pay 	= Pay * exValue[1];
					totalValue = totalValue * exValue[1];
				}
					
				if( Pay != this.details.transValue ){
					this.details.pay 	= this.details.transValue / totalValue;
				}
				
				budget.pay 		= this.details.pay;
				budget.stock 	= this.details.transValue / budget.value;
				
				//sending the funds to the recipient note.
				//configuring it to favour the recipient and the sender of the transaction
				if( ! this.isBudget )
					this.setPublicKey( this.#note.motherKey );
				
				else 
					this.setPublicKey( budget.budgetID );
				
				this.newBlock 				= this.details;
				this.newBlock.recipient		= this.encrypt( JSON.stringify( budget ) );		
				
				//update the note value.
				this.#note.noteValue 		-= this.details.pay;
				
			}
			else if( this.details.transType == 'STOCKPAY' ) {
				if( ! this.budgetBlock && this.details.budgetID ) {
					this.budgetID 		= this.details.budgetID;
					this.budgetBlock 	= this.getTransBlock();
				}
				
				if( ! this.budgetBlock ){
					this.errorMessage("Sorry we can't process a stock pay transaction without a valid budget block. Please try again by checking the budget ID.");
					return false;
				}
				
				if( this.budgetBlock && this.budgetBlock.length ){
					this.budgetBlock 	= this.getCurrentBlock( this.budgetBlock );
				}				
					
				let investorsHub 	= this.budgetBlock.agreement.investorsHub;
				this.string 		= this.details.reference;
				let hashKey			= this.hashed();
					
				if( ! investorsHub.indexOf( hashKey ) ) {
					this.errorMessage("Sorry, We couldn't find your stock note as a valid investor on this budget. Please try again with a different stock note.");
					return false;
				}
				
				if( ! this.details.agreement )
					this.details.agreement 	= this.budgetBlock.agreement;
				
				this.details.agreement.privateKey = this.generateKey( 30 );
				
				if( ! this.details.recipient || this.details.recipient != this.#note.motherKey )
					this.details.recipient 	= this.#note.motherKey;
				
				this.setPrivateKey( this.details.recipient );
				this.newBlock.recipient 	= this.encrypt( this.details.agreement );
					
				this.newBlock.budgetID 		= this.details.budgetID;
				this.newBlock.pay			= this.details.pay;
				this.newBlock.blockRef		= this.getPublicKey();
				this.newBlock.signRef		= this.generateKey(20);
			}
			else if( this.details.transType == "SELLSTOCK" && ( ! this.response || this.response.transType != "BUYSTOCK" ) ){
				this.budgetID 		= this.#note.budgetID;
				this.budgetBlock 	= this.getTransBlock();
				
				if( ! this.budgetBlock ){
					this.errorMessage("You are trying to sell a Stock with an invalid Stock note!");
					return false;
				}
				
				this.details.recipient = this.#note.budgetID;
				
				if( this.budgetBlock && this.budgetBlock.length ){
					this.budgetBlock = this.getCurrentBlock( this.budgetBlock );
				}
				
				if( ! this.details.agreement || ! this.details.agreement.investorsHub || ! this.details.agreement.budgetID || ! this.details.agreement.budgetValue || ! this.details.agreement.budgetCredit  )
					this.details.agreement = this.budgetBlock.agreement;
				
				this.details.agreement.privateKey = this.generateKey( 30 );
				
				this.newBlock.noteValue = this.#note.noteValue;
				this.#note.noteValue 	-= this.details.transValue;
				this.setPublicKey( this.details.recipient );
				this.newBlock.recipient  = this.encrypt( this.details.agreement );
				this.newBlock.transValue = this.details.transValue;
				this.newBlock.transType  = this.details.transType;
				this.setPrivateKey(  this.details.agreement.privateKey );
				this.newBlock.blockRef	 = this.getPublicKey();
				this.newBlock.signRef    = this.generateKey( 20 );
			}
			else if( this.details.transType == "STOCKRECIEVE" ){
				this.setPrivateKey( this.#note.noteSecret );
				agreement 			= this.decrypt( this.details.agreement );
				
				if( ! this.isJsonable( agreement ) || ! agreement.motherKey || ! agreement.motherKey == this.#note.motherKey ){
					return false;
				}
				
				//test the bond we are about recieving
				this.budgetID = this.#note.budgetID;
				this.budgetBlock = this.getTransBlock();
				
				if( ! this.budgetBlock ){
					this.errorMessage( "No Budget Block to Process the Recieve Request!!" );
					return false;
				}
				
				if( this.budgetBlock && this.budgetBlock.length ){
					this.budgetBlock = this.getCurrentBlock( this.budgetBlock );
				}
				
				let budgetNote = this.budgetBlock.agreement.stockID;
				
				if( budgetNote != this.#note.noteType ){
					this.newBlock.transType = "QUOTESTOCK";
					this.newBlock.agreement = agreement;
					agreement.privateKey    = this.generateKey(30);
					agreement.transKey		= this.generateKey( 30 );	
					this.setPublicKey( agreement.motherKey );
					this.newBlock.recipient  = this.encrypt( JSON.stringify( agreement ) );
					this.newBlock.transValue = this.details.transValue;
					this.setPrivateKey( agreement.privateKey );
					this.newBlock.blockRef	= this.getPublicKey();
					this.newBlock.signRef 	= this.generateKey(20);
				}
				else {
					
					if( this.newBlock.recievedIDs.length && this.newBlock.recievedIDs.indexOf( this.details.blockID.slice(0,5) ) ){
						this.errorMessage("The Block you are processing has already been recieved by you!!!");
						return false;
					}
					
					if( this.#note.recieveBlockID == this.details.blockID ){
						this.errorMessage("The Block you are processing has already been recieved by you!!!");
						return false;
					}
					
					let transValue = agreement.value * this.details.transValue;
					let stockValue = this.#note.stock * this.#note.noteValue;
					
					if( agreement.value != this.#note.stock ){
						let noteValue 			= stockValue / agreement.value;
						this.#note.noteValue 	= noteValue;
					}				
					
					//adding the transactional value amount to the note.
					this.#note.noteValue 	+= this.details.transValue;
					this.#note.recievedBlockID = this.details.blockID;
					this.newBlock.transType = this.details.transType;
					this.newBlock.agreement = agreement;
					this.setPrivateKey( agreement.privateKey );
					this.newBlock.blockRef = this.getPublicKey();
					this.signTxt 			= this.details.signRef;
					this.signKey			= agreement.privateKey;
					this.newBlock.signRef 	= this.Sign();
					this.newBlock.transValue = this.details.transValue;
					
					if( ! this.newBlock.recievedIDs || ! this.newBlock.recievedIDs.length ){
						this.newBlock.recievedIDs = [];
					}
					
					this.newBlock.recievedIDs.push( this.details.blockID.slice(0,5) );
					
					if( this.newBlock.recievedIDs.length >= 2000 ){
						delete this.newBlock.recievedIDs[ 0 ];
					}
				}
			}
		}
		else if( this.#note.noteType.includes('BND') ){
			//only a stock note type that does sell stocks
			//the note will take the motherKey parameter on the note to locate the beneficiary
			//note. Only a buy stock transaction will be able to initiate a sellstock transaction.
			if( this.details.transType == "SELLBOND" && this.#note.motherKey && this.response.transType == "BUYBOND" ){
				//confirming if the transaction was actually directed to us
				//the transaction block key will be used instead.
				this.setPrivateKey( this.#note.blockKey );
				agreement 			= this.decrypt( this.details.recipient );
				
				if( ! this.isJsonable( agreement ) ) {
					return false;
				}
				
				let budget = JSON.parse( agreement );
				let totalValue, Pay;
				//check the stock value. If not equal then we only reconfigure the pay.
				if( this.details.noteType != budget.budgetCredit ) {
					totalValue 	=  this.#note.noteValue;
					Pay 		= totalValue * this.getExchangeValue( this.details.noteType, budget.budgetCredit )[1];
					
				} else {
					Pay			= this.#note.noteValue;
				}
				
				if( Pay > this.details.transValue ){
					this.details.transValue = Pay;
				}
								
				//sending the funds to the recipient note.
				//configuring it to favour the recipient and the sender of the transaction
				if( ! this.isBudget )
					this.setPublicKey( this.#note.motherKey );
				
				else 
					this.setPublicKey( budget.budgetID );
				
				this.newBlock 				= this.details;
				this.newBlock.recipient		= this.encrypt( JSON.stringify( budget ) );
				this.newBlock.transType 	= "SOLDBOND";
				
				//update the note value.
				this.#note.noteValue 		-= this.details.transValue;
				
			}else if( this.details.transType == "SELLBOND" && ( ! this.response || this.response.transType != "BUYBOND" ) ){
				this.budgetID 		= this.#note.budgetID;
				this.budgetBlock 	= this.getTransBlock();
				
				if( ! this.budgetBlock ){
					this.errorMessage("You are trying to sell a bond with an invalid Bond note!");
					return false;
				}
				
				this.details.recipient = this.#note.budgetID;
				
				if( this.budgetBlock && this.budgetBlock.length ){
					this.budgetBlock = this.getCurrentBlock( this.budgetBlock );
				}
				
				if( ! this.details.agreement || ! this.details.agreement.investorsHub || ! this.details.agreement.budgetID || ! this.details.agreement.budgetValue || ! this.details.agreement.budgetCredit  )
					this.details.agreement = this.budgetBlock.agreement;
				
				this.details.agreement.privateKey = this.generateKey( 30 );
				
				this.newBlock.noteValue = this.#note.noteValue;
				this.#note.noteValue 	-= this.details.transValue;
				this.setPublicKey( this.details.recipient );
				this.newBlock.recipient  = this.encrypt( this.details.agreement );
				this.newBlock.transValue = this.details.transValue;
				this.newBlock.transType  = this.details.transType;
				this.setPrivateKey(  this.details.agreement.privateKey );
				this.newBlock.blockRef	 = this.getPublicKey();
				this.newBlock.signRef    = this.generateKey( 20 );
			}
			else if( this.details.transType == 'BONDPAY' ) {
				if( ! this.budgetBlock && this.details.budgetID ) {
					this.budgetID 		= this.details.budgetID;
					this.budgetBlock 	= this.getTransBlock();
				}
				
								
				if( ! this.budgetBlock ){
					this.errorMessage("Sorry we can't process a bond pay transaction without a valid budget block. Please try again by checking the budget ID.");
					return false;
				}
				
				if( this.budgetBlock && this.budgetBlock.length ){
					this.budgetBlock 	= this.getCurrentBlock( this.budgetBlock );
				}				
					
				let investorsHub 	= this.budgetBlock.agreement.investorsHub;
				this.string 		= this.details.reference;
				let hashKey			= this.hashed();
					
				if( ! ( investorsHub.indexOf( hashKey ) + 1 ) ) {
					this.errorMessage("Sorry, We couldn't find your stock note as a valid investor on this budget. Please try again with a different stock note.");
					return false;
				}
				
				if( ! this.details.agreement )
					this.details.agreement 	= this.budgetBlock.agreement;
				
				this.details.agreement.privateKey = this.generateKey( 30 );
				
				if( ! this.details.recipient || this.details.recipient != this.#note.motherKey )
					this.details.recipient 	= this.#note.motherKey;
				
				this.setPrivateKey( this.details.recipient );
				this.newBlock.recipient 	= this.encrypt( this.details.agreement );
					
				this.newBlock.budgetID 		= this.details.budgetID;
				this.newBlock.pay			= this.details.pay;
				this.newBlock.blockRef		= this.getPublicKey();
				this.newBlock.signRef		= this.generateKey(20);
			}
			else if( this.details.transType == "BONDRECIEVE" ){
				this.setPrivateKey( this.#note.noteSecret );
				agreement 			= this.decrypt( this.details.agreement );
				
				if( ! this.isJsonable( agreement ) || ! agreement.motherKey || ! agreement.motherKey == this.#note.motherKey ){
					return false;
				}
				
				//test the bond we are about recieving
				this.budgetID = this.#note.budgetID;
				this.budgetBlock = this.getTransBlock();
				
				if( ! this.budgetBlock ){
					this.errorMessage( "No Budget Block to Process the Recieve Request!!" );
					return false;
				}
				
				if( this.budgetBlock && this.budgetBlock.length ){
					this.budgetBlock = this.getCurrentBlock( this.budgetBlock );
				}
				
				let budgetNote = this.budgetBlock.agreement.stockID;
				
				if( budgetNote != this.#note.noteType ){
					this.newBlock.transType = "QUOTEBOND";
					this.newBlock.agreement = agreement;
					agreement.privateKey    = this.generateKey(30);
					agreement.transKey		= this.generateKey( 30 );	
					this.setPublicKey( agreement.motherKey );
					this.newBlock.recipient  = this.encrypt( JSON.stringify( agreement ) );
					this.newBlock.transValue = this.details.transValue;
					this.setPrivateKey( agreement.privateKey );
					this.newBlock.blockRef	= this.getPublicKey();
					this.newBlock.signRef 	= this.generateKey(20);
				}
				else {
					
					if( this.newBlock.recievedIDs.length && this.newBlock.recievedIDs.indexOf( this.details.blockID.slice(0,5) ) ){
						this.errorMessage("The Block you are processing has already been recieved by you!!!");
						return false;
					}
					
					if( this.#note.recieveBlockID == this.details.blockID ){
						this.errorMessage("The Block you are processing has already been recieved by you!!!");
						return false;
					}
					
					//adding the transactional value amount to the note.
					this.#note.noteValue 	+= this.details.transValue;
					this.#note.recievedBlockID = this.details.blockID;
					this.newBlock.transType = this.details.transType;
					this.newBlock.agreement = agreement;
					this.setPrivateKey( agreement.privateKey );
					this.newBlock.blockRef = this.getPublicKey();
					this.signTxt 			= this.details.signRef;
					this.signKey			= agreement.privateKey;
					this.newBlock.signRef 	= this.Sign();
					this.newBlock.transValue = this.details.transValue;
					
					if( ! this.newBlock.recievedIDs || ! this.newBlock.recievedIDs.length ){
						this.newBlock.recievedIDs = [];
					}
					
					this.newBlock.recievedIDs.push( this.details.blockID.slice(0,5) );
					
					if( this.newBlock.recievedIDs.length >= 2000 ){
						delete this.newBlock.recievedIDs[ 0 ];
					}
				}
			}
		}
		
		//creating and configuring the new note if none found
		if( this.#note.noteAddress == '' && this.#note.noteValue == 0 && this.details.transType == 'CREATE' ){
			privKey = this.generateKey(20);
			console.log( 'Setting Private Key: ' + privKey );
			this.setPrivateKey( privKey );
			this.#note.noteAddress = this.getPublicKey();
			this.#note.noteSecret = this.getPrivateKey();
			this.#note.noteKey = this.generateKey(15);
			this.#note.walletRank = this.generateKey( 30 );//30 bytes
			
			this.setPrivateKey( this.#note.walletRank );
			this.newBlock.rankCode  = this.encrypt( this.#scriptbillRanks[ Object.keys( this.#scriptbillRanks )[0] ] );
			
			if( ! this.walletID ) {
				this.#note.walletID	= this.generateKey(20);
				this.walletID 		= this.#note.walletID;
				//calculating the wallet hashes
				let secret					= this.#note.noteSecret;
				this.#note.noteSecret 		= this.#note.walletID;
				//help configure the seed by creating it from here else the note's block ID will be used instead.
				this.seed 					= this.currentTime();
				this.newBlock.walletHASH    = this.calculateNextBlockID();
				this.seed 					= this.newBlock.walletHASH;
				this.newBlock.nextWalletHASH = this.calculateNextBlockID();
				this.newBlock.formerWalletHASH = "";
				this.#note.noteSecret 			= secret;
			}
			else {				
				this.#note.walletID   = this.walletID;
				//since we can't configure the wallet HAShes without getting the former blocks we trace the blocks if they exists.
				this.isWalletSearch  = true;
				let walletBlock 	 = this.traceBlockIDFromAddress( this.walletID );
				
				console.log( "wallet Search Block: " + JSON.stringify( walletBlock ) );
				
				if( walletBlock ) {
					//we ensure its the latest block we got.
					walletBlock			= this.getCurrentWalletBlock( walletBlock );			
					
					//configure the block, since we've gotten the latest blocks
					this.newBlock.walletHASH		= walletBlock.nextWalletHASH;
					this.newBlock.formerWalletHASH	= walletBlock.walletHASH;
				}
				else {
					let secret 						= this.#note.noteSecret;
					this.#note.noteSecret			= this.walletID;
					this.seed						= this.currentTime();
					this.newBlock.walletHASH 		= this.calculateNextBlockID();
					this.newBlock.formerWalletHASH	= "";
					this.#note.noteSecret			= secret;
				}
				
				//now calculating the next wallet hashes.
				let secret 						= this.#note.noteSecret;
				this.#note.noteSecret 			= this.walletID;
				this.seed						= this.newBlock.walletHASH;
				this.newBlock.nextWalletHASH	= this.calculateNextBlockID();
				this.#note.noteSecret			= secret;
				
			}
			//the server used to create the note remains the orginal server but it must be a Scriptbill Server.
			let server = window.location.href;
			server = server.toString();
			
			if( ! server.includes('https') || ! server.includes('http') )
				this.#note.noteServer = this.default_scriptbill_server;
			
			else {
				var xhtp = new XMLHttpRequest();
				xhtp.onreadystatechange = function(){
					if( this.readyState == 4 && this.status == 200 ){
						let response = JSON.parse( xhtp.responseText );
						
						if( response.isScriptbillServer && response.isScriptbillServer == 'TRUE' ) {
							this.#note.noteServer = server;
						}
						else {
							this.#note.noteServer = this.default_scriptbill_server;
						}
					}
				}
				xhtp.open( 'GET', server + '?scriptbillPing=yes', true );
				xhtp.send();
			}
			
			this.newBlock.noteServer = this.#note.noteServer;
			
			console.log( "Calculating Block IDS" );
			
			this.seed 					= this.currentTime();
			//calculating the blockIDs for the new note.
			this.newBlock.blockID 		= this.calculateNextBlockID();
			this.#note.blockID 			= this.newBlock.blockID;
			this.newBlock.nextBlockID 	= this.calculateNextBlockID();
			this.newBlock.formerBlockID = "";				
						
		}
		
		//add the current block ID to the note.
		this.#note.blockID = this.newBlock.blockID;
		
		//cdn: https://cdnjs.cloudflare.com/ajax/libs/jsencrypt/3.2.1/jsencrypt.min.js
		//next we configure the transaction block to make it useful for the network. Since everything is perfect on the network
		this.newBlock.transTime 		= this.currentTime();
		
		if( ( this.response && this.response.transType != 'SELLSTOCK' ) || this.details.transType != 'SELLSTOCK' ) {
			this.signTxt 					= this.newBlock.walletHASH;
			this.signKey  					= this.generateKey(15);
			this.setPrivateKey( this.signKey );				
			this.newBlock.walletSign 		= this.Sign();
			this.#note.blockKey				= this.signKey;
			this.newBlock.blockKey			= this.getPublicKey();
		}
		this.newBlock.transType			= this.details.transType;
		
		//let's sign the transaction block.
		this.signTxt					= this.newBlock.blockID;
		this.signKey					= this.#note.blockKey;
		this.newBlock.blockSign			= this.Sign();
		
		//adding the expiry time to the block
		this.newBlock.expiry			= parseInt(this.currentTime()) + parseInt(this.calculateTime("2 weeks"));
		
		//next let's calculate the note ID
		console.log( "Note Key: " + this.#note.noteKey );
		this.setPrivateKey( this.#note.noteKey );
		this.#note.noteID 				= this.encrypt( this.#note.noteID );
		console.log( "Encrypted Note ID: " + this.#note.noteID );
		
		//parsing the argument so that other details from the details handler will be 
		//added to the newBlock forming a possibility of adding extra data to 
		//transaction blocks
		this.newBlock 		= this.parseArgs( this.newBlock, this.details );
		
				
		//calculate the transaction hashes of the block, before calculating the total hash of both the note and the block.
		this.string = JSON.stringify( this.newBlock );
		let transHash 	= this.hashed();
		this.newBlock.transHash   	= transHash.slice( 0, transHash.length / 2 );
		this.#note.transHash 		= transHash.slice( transHash.length / 2, transHash.length );
		
		//since the transaction hash is gotten, we save the transaction hash from being manipulated by hashing the total hash of the block in the note.
		this.string 				= transHash;
		this.#note.blockHash			= this.hashed();
		
		//hashing the note before saving the transaction block
		this.string 				= JSON.stringify( this.#note );
		let noteHash					= this.hashed();
		this.newBlock.noteHash		= noteHash.slice( 0, noteHash.length / 2 );
		this.#note.noteHash			= noteHash.slice( noteHash.length / 2, noteHash.length );
		
		//creating the total hash variable.				
		this.string 				= JSON.stringify( this.newBlock ) + this.newBlock.totalHASH;
		let totalHash 				= this.hashed();
		this.newBlock.totalHASH		= totalHash;
		
		//creating the real hash variable.
		this.string					= JSON.stringify( this.#note ) + this.newBlock.realHash;
		this.newBlock.realHash		= this.hashed();
		
		//adding budget ids to the block
		let d, key, pKey;
		for( d = 0; d < this.#note.noteBudgets.length; d++ ){
			key 	= this.#note.noteBudgets[d];
			this.setPrivateKey( key );
			pKey 	= this.getPublicKey();
			
			if( typeof this.newBlock.budgetRefs != 'object' )
				this.newBlock.budgetRefs = [];
			
			if( ! this.newBlock.budgetRefs.includes( pKey ) ){
				this.newBlock.budgetRefs.push( pKey );
			}
		}
		
		console.log('Current Note: ' + JSON.stringify(this.#note));		
		//saving the current note.
		this.saveNote();
		
		console.log('Current Block: ' + JSON.stringify( this.newBlock ) );
		//save the current block
		this.response = this.newBlock;
		this.storeBlock();
		
		if( ( this.newBlock.productID && ( this.newBlock.transType == 'BUYPRODUCT' || this.newBlock.transType == 'PRODUCTSUB' ) ) || this.newBlock.transType == 'PROFITSHARING' ){
			this.profitSharing( this.newBlock );
		}
		else if( this.newBlock.transType == 'PROFITRECIEVE' ){
			this.details.transValue = this.details.origValue - this.details.transValue;
			this.details.transType 	= 'PROFITSHARING';
			this.productBlockID 	= this.details.nextRecipient;
			let block 				= this.getTransBlock()//PERERE
			
			if( ! block || block.blockID == this.#note.blockID || block.blockID == '' ) return;
			
			this.details.recipient = block.blockKey;
			this.details.agreement = agreement;
			this.generateScriptbillTransactionBlock();
		}
		
		if( ! this.details.rankCode && this.details.transType != "UPDATE" ) {
			this.scriptbillAssignRanks();
		}
	}
	
	
	static getCurrentBlock( blocks ){
		if( ! blocks.length ){
			return blocks;
		}
		let x, lastBlock = {}, realBlock;
		for( x = 0; x < blocks.length; x++ ){
			if( lastBlock.transTime && lastBlock.transTime > blocks[x].transTime  )
				realBlock = lastBlock;
			
			else 
				realBlock = blocks[x];
			
			lastBlock = blocks[x];
		}
		
		return realBlock;
		
	}
	
	static calculateInterestRate( interestType, interestRate ){
		switch( interestType ){
			case "PT":
				return interestRate;
			break;
			case "DL":
				return interestRate;
			break;
			case "HL":
				return interestRate / 24;
			break;
			case "E1H":
				return interestRate / 24;
			break;
			case "E2H":
				return interestRate / 12;
			break;
			case "E3H":
				return interestRate / 8;
			break;
			case "E4H":
				return interestRate / 6;
			break;
			case "E5H":
				return interestRate / 4.8;
			break;
			case "E6H":
				return interestRate / 4;
			break;
			case "E7H":
				return interestRate / 3.43;
			break;
			case "E8H":
				return interestRate / 3;
			break;
			case "E9H":
				return interestRate / 2.67;
			break;
			case "E10H":
				return interestRate / 2.4;
			break;
			case "E11H":
				return interestRate / 2.2;
			break;
			case "E12H":
				return interestRate / 2;
			break;
			case "E13H":
				return interestRate / 1.85;
			break;
			case "E14H":
				return interestRate / 1.71;
			break;
			case "E15H":
				return interestRate / 1.6;
			break;
			case "E16H":
				return interestRate / 1.5;
			break;
			case "E17H":
				return interestRate / 1.41;
			break;
			case "E18H":
				return interestRate / 1.33;
			break;
			case "E19H":
				return interestRate / 1.26;
			break;
			case "E20H":
				return interestRate / 1.2;
			break;
			case "E21H":
				return interestRate / 1.14;
			break;
			case "E22H":
				return interestRate / 1.09;
			break;
			case "E23H":
				return interestRate / 1.04;
			break;
			case "E24H":
				return interestRate;
			break;
			case "E1D":
				return interestRate;
			break;
			case "E2D":
				return interestRate * 2;
			break;
			case "E3D":
				return interestRate * 3;
			break;
			case "E4D":
				return interestRate * 4;
			break;
			case "E5D":
				return interestRate * 5;
			break;
			case "E6D":
				return interestRate * 6;
			break;
			case "E7D":
				return interestRate * 7;
			break;
			case "E8D":
				return interestRate * 8;
			break;
			case "E9D":
				return interestRate * 9;
			break;
			case "E10D":
				return interestRate * 10;
			break;
			case "E11D":
				return interestRate * 11;
			break;
			case "E12D":
				return interestRate * 12;
			break;
			case "E13D":
				return interestRate * 13;
			break;
			case "E14D":
				return interestRate * 14;
			break;
			case "E15D":
				return interestRate * 15;
			break;
			case "E16D":
				return interestRate * 16;
			break;
			case "E17D":
				return interestRate * 17;
			break;
			case "E18D":
				return interestRate * 18;
			break;
			case "E19D":
				return interestRate * 19;
			break;
			case "E20D":
				return interestRate * 20;
			break;
			case "E21D":
				return interestRate * 21;
			break;
			case "E22D":
				return interestRate * 22;
			break;
			case "E23D":
				return interestRate * 23;
			break;
			case "E24D":
				return interestRate * 24;
			break;
			case "E25D":
				return interestRate * 25;
			break;
			case "E26D":
				return interestRate * 26;
			break;
			case "E27D":
				return interestRate * 27;
			break;
			case "E28D":
				return interestRate * 28;
			break;
			case "E29D":
				return interestRate * 29;
			break;
			case "E30D":
				return interestRate * 30;
			break;
			case "ML":
				return interestRate * 30;
			break;
			case "E2M":
				return interestRate * 60;
			break;
			case "E3M":
				return interestRate * 90;
			break;
			case "E4M":
				return interestRate * 120;
			break;
			case "E5M":
				return interestRate * 150;
			break;
			case "E6M":
				return interestRate * 180;
			break;
			case "E7M":
				return interestRate * 210;
			break;
			case "E8M":
				return interestRate * 240;
			break;
			case "E9M":
				return interestRate * 270;
			break;
			case "E10M":
				return interestRate * 300;
			break;
			case "E11M":
				return interestRate * 330;
			break;
			case "E12M":
				return interestRate * 360;
			break;
			case "YL":
				return interestRate * 360;
			break;
			case "E2Y":
				return this.calculateInterestRate( "YL", interestRate ) * 2;
			break;
			case "E3Y":
				return this.calculateInterestRate( "YL", interestRate ) * 3;
			break;
			case "E4Y":
				return this.calculateInterestRate( "YL", interestRate ) * 4;
			break;
			case "E5Y":
				return this.calculateInterestRate( "YL", interestRate ) * 5;
			break;
			case "E6Y":
				return this.calculateInterestRate( "YL", interestRate ) * 6;
			break;
			case "E7Y":
				return this.calculateInterestRate( "YL", interestRate ) * 7;
			break;
			case "E8Y":
				return this.calculateInterestRate( "YL", interestRate ) * 8;
			break;
			case "E9Y":
				return this.calculateInterestRate( "YL", interestRate ) * 9;
			break;
			case "E10Y":
				return this.calculateInterestRate( "YL", interestRate ) * 10;
			break;
			default:
				return interestRate;
			break;
		}			
	}
	
	static calculateInterestType( rank = false ){
		if( ! rank ) {
			rank = this.#scriptbillRanks[Object.keys( this.#scriptbillRanks )[0]];
		}
		
		let level = rank.level;
		
		switch(level){
			case 1:
				return "PT";
			break;
			case 2:
				return "PT";
			break;
			case 3:
				return "PT";
			break;
			case 4:
				return "E3H";
			break;
			case 5:
				return "E6H";
			break;
			case 6:
				return "E12H";
			break;
			case 7:
				return "E18H";
			break;
			case 8:
				return "E21H";
			break;
			case 9:
				return "DL";
			break;
			case 10:
				return "E1D";
			break;
			case 11:
				return "E2D";
			break;
			case 12:
				return "E3D";
			break;
			case 13:
				return "E4D";
			break;
			case 14:
				return "E5D";
			break;
			case 15:
				return "E6D";
			break;
			case 16:
				return "WL";
			break;
			case 17:
				return "E8D";
			break;
			case 18:
				return "E10D";
			break;
			case 19:
				return "E12D";
			break;
			case 20:
				return "E2W";
			break;
			case 21:
				return "E16D";
			break;
			case 22:
				return "E18D";
			break;
			case 23:
				return "E20D";
			break;
			case 24:
				return "E3W";
			break;
			case 25:
				return "E24D";
			break;
			case 26:
				return "E27D";
			break;
			case 27:
				return "ML";
			break;
			case 28:
				return "E40D";
			break;
			case 29:
				return "E5W";
			break;
			case 30:
				return "E6W";
			break;
			case 31:
				return "E7W";
			break;
			case 32:
				return "E8W";
			break;
			case 33:
				return "E2M";
			break;
			case 34:
				return "E10W";
			break;
			case 35:
				return "E12W";
			break;
			case 36:
				return "E3M";
			break;
			case 37:
				return "E16W";
			break;
			case 38:
				return "E4M";
			break;
			case 39:
				return "E18W";
			break;
			case 40:
				return "E19W";
			break;
			case 41:
				return "E20W";
			break;
			case 42:
				return "E5M";
			break;
			case 43:
				return "E21W";
			break;
			case 44:
				return "E22W";
			break;
			case 45:
				return "E23W";
			break;
			case 46:
				return "E24W";
			break;
			case 47:
				return "E6M";
			break;
			case 48:
				return "E25W";
			break;
			case 49:
				return "E26W";
			break;
			case 50:
				return "E9M";
			break;
			default:
				return "PT";
			break;
		}
	}
	
	
	static getObjKey(obj, value) {
	  return Object.keys(obj).find(key => obj[key] === value);
	}
	static getObjKeys(obj, value) {
	  return Object.keys(obj).filter(key => obj[key] === value);
	}
	
	static parseArgs( array1, array2 ){
		let arrKeys1 = Object.keys( array1 );
		let arrKeys2 = Object.keys( array2 );
		let x, val;
		
		//checking the keys in array1 that is not in 2
		for( x = 0; x < arrKeys1.length; x++ ){
			val = arrKeys1[x];
			
			if( arrKeys2.includes( val ) ){
				delete arrKeys2[ this.getObjKey( arrKeys2, val ) ];
			}
		}
		
		for( x = 0; x < arrKeys2.length; x++ ){
			val 	= arrKeys2[x];
			array1[ val ]	= array2[val];
		}
		
		return array1;
	}
	
	static getCurrentWalletBlock( referenceBlock ){
		
		//the current note must have a wallet ID and a reference block with the tight wallet hashes to get the wallet blocks
		if( ! this.walletID || ! referenceBlock.nextWalletHASH ) return;//REEET
		
		//look for block with the wallet Hash.
		this.walletHASH = referenceBlock.nextWalletHASH;
		let block 		= this.getTransBlock();
		
		if( block ){
			return this.getCurrentWalletBlock( block );
		}
		
		else {
			return referenceBlock;
		}
		
	}
	
	static Sign(){
		if( CryptoJS && CryptoJS.SHA256 ){
			try {
				if( this.signTxt && this.signKey ){
					console.log("SignText: " + this.signTxt, "Sign Key: " + this.signKey );
					this.setPrivateKey( this.signKey );
					let pubKey = this.getPublicKey();
					let sign = this.signTxt + pubKey;
					return CryptoJS.SHA256( sign ).toString( CryptoJS.enc.Base64 );
				}
				else {
					return false;
				}
					
			} catch(ex) {
				return false;
			}
		}
		else {
			return false;
		}
	}

	static Verify(){
		if( CryptoJS && CryptoJS.SHA256 ) {
			try {
				if( this.verifyText && this.verifyKey && this.signature ){
					console.log("VerifyText: " + this.verifyText, "Sign Key: " + this.verifyKey, "signature: " + this.signature );
					let verify = this.verifyText + this.verifyKey;
					let verified = CryptoJS.SHA256( verify ).toString( CryptoJS.enc.Base64 );
					return verified == this.signature;
				}
				else {
					return false;
				}
			}
			catch (ex){
				return false;
			}
		}
		else {
			return false;
		}
	}
	//Scriptbill function can help us trace the blocks that belong to a particular note
	static calculateNextBlockID( depth = 1 ){
		
		if( ! this.runned )
			this.runned = 0;
		
		//the note secret is the key the note has used to calculate the note's unique block ID.
		//the first seed of the note is the current time the note was created. From that time the seed will now be the 
		//current block ID
		if( ! this.run ) 
			this.run = 1;			
		
		
		if( this.#note.noteSecret ){
			if( this.#note.blockID && ! this.seed ){
				this.seed = this.#note.blockID;
			}
			
			else if( ! this.seed ){
				this.seed = this.currentTime().toString();
			}
			
			this.setPrivateKey( this.#note.noteSecret );
			
			console.log( "FUNC: calculateNextBlockID: Params: noteSecret: " + this.#note.noteSecret + " seed: " + this.seed + " runned: " + ++this.runned );
			
			if( this.run == depth ) {
				this.run = 0;
				let value = this.encrypt( this.seed );
				this.seed = false;
				return value;
			}
			else {
				this.seed = this.encrypt( this.seed );
				this.run--;
				this.calculateNextBlockID( depth );				
			}
		} else {
			return this.seed;
		}
		
	}
	
	static calculateFormerBlockID( depth = 1 ){
		
		if( ! this.frunned )
			this.frunned = 0;
		
		//the note key is a private key to the note secret, while the note secret is a private key to the note address. 
		//the note address is what is generally known in the network.
		if( ! this.run )
			this.run = 1;		
		
		
		if( ! this.#note )
			this.#note = this.getCurrentNote();
		
		if( JSEncrypt && this.#note && this.#note.noteKey ){
			if( this.#note.blockID && ! this.seed ){
				this.seed = this.#note.blockID;
			}
			
			else if( ! this.seed ){
				this.seed = this.currentTime().toString();
			}
			this.setPrivateKey( this.#note.noteKey );
			
			console.log( "FUNC: calculateFormerBlockID: Params: noteKey: " + this.#note.noteKey + " seed: " + this.seed + " runned: " + ++this.frunned );
			
			if( this.run == depth ) {
				this.run = 0;
				let value = this.decrypt( this.seed );
				this.seed = false;
				return value;
			}
			else {
				this.seed = this.decrypt( this.seed );
				let seed = parseInt( this.seed );
				
				if( seed )
					return this.seed;
				
				this.run--;
				this.calculateFormerBlockID();				
			}
		} else {
			return this.seed;
		}
	}
	
	static traceBlockIDFromAddress( address = undefined ){
		
		if( ! this.#note && this.s.currentNote )
			this.#note  = this.getCurrentNote();
		
		if( ! this.#note || typeof this.#note != 'object' )
			return false;
		
		//Scriptbill function is meant for external note address of which the current note want to transact with.
		//if the address is not set, then the function assumes you want to run the getTransBlock function
		if( address == undefined ) {
			return this.getTransBlock();			
		}
		let scriptbill = this;
		this.getTransactions(function(block, key){
			console.log("the blocks: " + JSON.stringify( block ), "type: " + typeof block, " loop key: " + key );
			//to test if the current block belongs to the current address we encrypt the blockID 
			//to see if it would return the next Block ID.
			//we'll test if the runner wants to search using wallet ID
			if( block && block.blockID ){
				if( ! scriptbill.isWalletSearch ) {
					let blockID = block.blockID;
					scriptbill.setPublicKey( address );
					let nextID = scriptbill.encrypt( blockID );
					
					if( nextID == block.nextBlockID ) {
						scriptbill.stop = true;
						scriptbill.s.currentBlock = JSON.stringify( block );
					}
				}
				else {
					let walletHash = block.walletHASH;
					scriptbill.setPrivateKey( address );
					let nextHASH 	= scriptbill.encrypt( walletHash );
					
					if( nextHASH == block.nextWalletHASH ) {
						scriptbill.stop = true;
						scriptbill.s.currentBlock = JSON.stringify( block );
					}
				}
			}
			//we stop the loop after 10000 times
			if( key > 10000 ){
				scriptbill.stop = true;
				return false;
			}
		});
		
		let block = false;
		
		if( this.s.currentBlock != undefined )
			block = JSON.parse( this.s.currentBlock );
		
		return block;
		
	}
	
	static compare(array1, array2, type = 'merge'){
		if( typeof array1 != 'object' || typeof array2 != 'object' ) return [];
		let length;
		let array;
		if( array1.length >= array2.length )
			length = array1.length;
		else
			length = array2.length;
		
		if( type = 'merge' ){
			for( x = 0; x < length; x++ ){
				if( array1[x] == array2[x] && ! array.includes( array1[x] ) ){
					array.push( array1[x] );
				}
				else  {
					if( array.includes( array1[x] ) && ! array.includes( array2[x] ) ){
						array.push( array2[x] );
					}
					if( ! array.includes( array1[x] ) && array.includes( array2[x] ) ) {
						array.push( array1[x] );
					}
				}
			}
		}
		return array;
	}
	
	//Scriptbill function is recursive, ensures that the block is gotten, even though it's not stored on the server.
	//Scriptbill way, the function allows the note to get data from the server that holds it.
	static getTransBlock(){
		if( ! this.#note && this.s.currentNote )
			this.#note = this.getCurrentNote();
		
		if( ! this.#note || ! this.blockID || ! this.productBlockID || ! this.walletHASH || ! this.transType || ! this.noteType || ! this.productID || ! this.sellCredit || ! this.buyCredit || ! this.budgetID || ! this.blockRef ) return;
		
		if( this.blockRef ){
			let blockIDs = JSON.parse( this.isJsonable( this.l[ this.blockRef ] ) ? this.l[ this.blockRef ] : '[]' );
			let x, block;
			this.blockRef = undefined;
			for( x = 0; x < blockIDs.length; x++ ){
				this.blockID = blockIDs[x];
				block        = this.getTransBlock();
				if( block ){
					blockIDs[x] = block;
				}
				else {
					blockIDs[x] = {};
				}
			}
			
			return blockIDs;
		}
		//if the block reference is combined with the transaction type.
		else if( this.blockRef && this.transType ){
			let transType 	= this.transType;
			this.transType 	= undefined;
			let blocks      = this.getTransBlock();
			let blecks 		= [];
			let x, block = false;
			for( x = 0; x < blocks.length; x++ ){
				block = blocks[x];
				if( block.transType && block.transType == transType ){
					blecks.push( block );
				}
			}
			return bleck;
		}
		else if( this.productBlockID ){
			this.blockID = this.l[ this.productBlockID ];
			if( ! this.blockID ){
				let url = new URL( this.#note.noteServer );
				url.searchParams.set( 'productBlockID', this.productBlockID );
				fetch( url ).then( response =>{ 
					return response.text();
				}).then( result =>{
					if( this.isJsonable( result ) ) {
						result = JSON.parse( result );
						
						if( result.blockID ) {
							return result;
						} else if( result.error ){
							this.errorMessage( result.error );
							return false;
						}
						
						return false;
					}
					else {
						return false;
					}
				});
			}
		}
		else if( this.walletHASH ){
			this.blockID = this.l[ this.walletHASH ];
			if( ! this.blockID ){
				let url = new URL( this.#note.noteServer );
				url.searchParams.set( 'walletHASH', this.walletHASH );
				fetch( url ).then( response =>{ 
					return response.text();
				}).then( result =>{
					if( this.isJsonable( result ) ) {
						result = JSON.parse( result );
						
						if( result.blockID ) {
							return result;
						} else if( result.error ){
							this.errorMessage( result.error );
							return false;
						}
						
						return false;
					}
					else {
						return false;
					}
				});
			}
		}
		else if( this.budgetID ){
			this.blockID = this.l[ this.budgetID ];
			if( ! this.blockID ){
				let url = new URL( this.#note.noteServer );
				url.searchParams.set( 'budgetID', this.budgetID );
				fetch( url ).then( response =>{ 
					return response.text();
				}).then( result =>{
					if( this.isJsonable( result ) ) {
						result = JSON.parse( result );
						
						if( result.blockID ) {
							return result;
						} else if( result.error ){
							this.errorMessage( result.error );
							return false;
						}
						
						return false;
					}
					else {
						return false;
					}
				});
			}
		}
		else if( this.noteType && this.transType ){
			let transBlockIDs 	= JSON.parse( this.isJsonable( this.l[ this.transType ] ) ? this.l[ this.transType ] : '{}' );
			let noteBlockIDs   	= JSON.parse( this.isJsonable( this.l[ this.noteType ] ) ? this.l[ this.noteType ] : '{}' );
			let blockIDs 		= this.compare( transBlockIDs, noteBlockIDs, 'merge' );
			let blocks 			= [];
			for( x = 0; x < blockIDs.length; x++ ) {
				this.blockID = blockIDs[x];
				
				if( this.l[ this.blockID ] )
					blocks.push( JSON.parse( this.isJsonable( this.l[ this.blockID ] ) ? this.l[ this.blockID ] : '{}' ) );
			}
			
			return blocks;
		}
		else if( this.productID && this.noteType && this.transType ) {
			let prodsBlockIDs = JSON.parse( this.isJsonable( this.l[ this.productID ] ) ? this.l[ this.productID ] : '{}' );
			let transBlockIDs 	= JSON.parse( this.isJsonable( this.l[ this.transType ] ) ? this.l[ this.transType ] : '{}' );
			let noteBlockIDs   	= JSON.parse( this.isJsonable( this.l[ this.noteType ] ) ? this.l[ this.noteType ] : '{}' );
			let prodTransBlock 	= this.compare( prodsBlockIDs, transBlockIDs, 'merge' );
			let blockIDs 		= this.compare( prodTransBlock, noteBlockIDs, 'merge' );
			
			let blocks 			= [];
			for( x = 0; x < blockIDs.length; x++ ) {
				this.blockID = blockIDs[x];
				
				if( this.l[ this.blockID ] )
					blocks.push( JSON.parse( this.isJsonable( this.l[ this.blockID ] ) ? this.l[ this.blockID ] : '{}' ) );
			}
			
			return blocks;
			
		} 
		else if( this.sellCredit && this.transType ) {
			let sellBlockIDs = JSON.parse( this.isJsonable( this.l[ this.sellCredit ] ) ? this.l[ this.sellCredit ] : '{}' );
			let transBlockIDs = JSON.parse( this.isJsonable( this.l[ this.transType ] ) ? this.l[ this.transType ] : '{}' );
			let blockIDs 		= this.compare( sellBlockIDs, transBlockIDs, 'merge' );
			
			let blocks 			= [];
			for( x = 0; x < blockIDs.length; x++ ) {
				this.blockID = blockIDs[x];
				
				if( this.l[ this.blockID ] )
					blocks.push( JSON.parse( this.isJsonable( this.l[ this.blockID ] ) ? this.l[ this.blockID ] : '{}' ) );
			}
			
			return blocks;
		}
		else if( this.buyCredit && this.transType ) {
			let buyBlockIDs = JSON.parse( this.isJsonable( this.l[ this.buyCredit ] ) ? this.l[ this.buyCredit ] : '{}' );
			let transBlockIDs = JSON.parse( this.isJsonable( this.l[ this.transType ] ) ? this.l[ this.transType ] : '{}' );
			let blockIDs 		= this.compare( buyBlockIDs, transBlockIDs, 'merge' );
			
			let blocks 			= [];
			for( x = 0; x < blockIDs.length; x++ ) {
				this.blockID = blockIDs[x];
				
				if( this.l[ this.blockID ] )
					blocks.push( JSON.parse( this.isJsonable( this.l[ this.blockID ] ) ? this.l[ this.blockID ] : '{}' ) );
			}
			
			return blocks;
		}
		else if( this.productID ){
			let blockIDs = JSON.parse( this.isJsonable( this.l[this.productID] ) ? this.l[this.productID] : '{}' );
			let blocks 		= [];
			for( x = 0; x < blockIDs.length; x++ ) {
				this.blockID = blockIDs[x];
				
				if( this.l[ this.blockID ] )
					blocks.push( JSON.parse( this.isJsonable( this.l[ this.blockID ] ) ? this.l[ this.blockID ] : '{}' ) );
				
				else {
					//LLLL
				}
			}
			
			return blocks;
		}
		else if( this.buyCredit ){
			let blockIDs = JSON.parse( this.l[this.buyCredit] );
			let blocks 		= [];
			for( x = 0; x < blockIDs.length; x++ ) {
				this.blockID = blockIDs[x];
				
				if( this.l[ this.blockID ] )
					blocks.push( JSON.parse( this.l[ this.blockID ] ) );
			}
			
			return blocks;
		}
		else if( this.sellCredit ) {
			let blockIDs = JSON.parse( this.l[this.sellCredit] );
			let blocks 		= [];
			for( x = 0; x < blockIDs.length; x++ ) {
				this.blockID = blockIDs[x];
				
				if( this.l[ this.blockID ] )
					blocks.push( JSON.parse( this.l[ this.blockID ] ) );
			}
			
			return blocks;
		}
		else if( this.transType ){
			let blockIDs = JSON.parse( this.l[this.transType] );
			let blocks 		= [];
			for( x = 0; x < blockIDs.length; x++ ) {
				this.blockID = blockIDs[x];
				
				if( this.l[ this.blockID ] )
					blocks.push( JSON.parse( this.l[ this.blockID ] ) );
			}
			
			return blocks;
		}
		else if( this.noteType ){
			let blockIDs = JSON.parse( this.l[this.noteType] );
			let blocks 		= [];
			for( x = 0; x < blockIDs.length; x++ ) {
				this.blockID = blockIDs[x];
				
				if( this.l[ this.blockID ] )
					blocks.push( JSON.parse( this.l[ this.blockID ] ) );
			}
			
			return blocks;
		}
		
		let block;
		
		if( ! this.blockID )
			this.blockID = this.#note.blockID;		
		
		if( this.l[ this.blockID ] ){
			block 	= this.l[ this.blockID ];
			
			if( ! block ){
				//try using promise.
				let url;
				if( this.#note && this.#note.noteServer ){
					url = new URL( this.#note.noteServer );
				}
				else {
					url = new URL( this.default_scriptbill_server );
				}
				url.searchParams.set( "blockID", this.blockID );
				fetch( url ).then( response => {
					return response.text();
				}).then( result =>{
					if( ! result.includes( "NOT FOUND" ) )
						this.l.block = result;
				});				
			}
			
			if( this.l.block ) {
				block = this.l.block;
				delete this.l.block;
			}
			if( block && typeof block == 'string' )
				return JSON.parse( block );
			
			else if( typeof block == 'object' )
				return block;
			
			else if( ! block )
				return this.defaultBlock;
		}		
		else if( ! this.blockID )
			return this.defaultBlock;
		
		else {
			//try using promise.
			let url;
			if( this.#note && this.#note.noteServer ){
				url = new URL( this.#note.noteServer );
			}
			else {
				url = new URL( this.default_scriptbill_server );
			}
			url.searchParams.set( "blockID", this.blockID );
			fetch( url ).then( response => {
				return response.text();
			}).then( result =>{
				if( ! result.includes( "NOT FOUND" ) )
					this.l.response = result;
			});
			return JSON.parse( this.l.response );
		}
	}
	
	static getTransactions( callback ){
		
		if( this.key == undefined )
			this.key = 0;
		
		this.data = this.l;
		let keys = Object.keys( this.data );
		let key 	= keys[ this.key ];
		let block = false;
		let x;
		
		if( key == undefined ) return;
		
		console.log( 'blcokkey: ' + key );
		//10000 * 10000 means an 100 million maximum loop
		for( x = 0; x < 10000; x++ ) {

			if( this.stop )
				break;
			
			
			this.key++;
			key = keys[ this.key ];
			
			if( key == undefined ) break;
			
			if( key != 'personal' || key != 'account' || key != 'ScriptNotes' || key != null ) {
				let data 	= this.data[ key ];
				
				if( data && typeof data == 'string' && data.indexOf('{') == 0 && data.lastIndexOf('}') == ( data.length - 1 ) )
					block = JSON.parse( data );
				
				//handling the agreements on the note.
				this.response = block;
				/* this.handleAgreement();
				this.monitorScriptbillCredit(); */
				
				if( block && typeof block == 'object' )
					callback( block, this.key );
			}
			
		}
		
		this.key++;
		
		if( key != null || ! this.stop )
			this.getTransactions(callback);
	}
	
	static changeLoginPassword( newPassword, oldPassword ){
		this.#password = oldPassword;
		if( ! this.#note && this.s.currentNote ){
			this.#note = this.getCurrentNote();
		}
		else if( this.noteAddress ){
			this.#note = this.getNote();
		}
		
		if( ! this.#note ){
			this.errorMessage("Cannot Change The Login Password When The Current Note is Note Initialized!");
			return false;
		}
		
		this.#password = newPassword;
		this.saveNote();
		
		this.#note = this.getNote();
		
		if( this.#note && this.#note.noteAddress && this.#note.noteBudgets && this.#note.noteBudgets.length )
			return true;
		
		return false;
	}	
	
	//creating a product is just simply creating a transaction block optimized for product creation. For now we are not creating budgets
	static create_product(){
		
		//run Scriptbill function only if the product config has been truely configured.
		if( ! this.productConfig.value || ! this.productConfig.units || ! this.productConfig.name || ! this.productConfig.description ) return;
		
		if( ! this.productConfig.totalUnits || this.productConfig.totalUnits < this.productConfig.units )
			this.productConfig.totalUnits = this.productConfig.units;
		
		this.details = this.defaultBlock;
		this.details.transValue = this.productConfig.value;
		this.details.agreement = this.productConfig;
		this.details.transType = 'CREATEPRODUCT';
		//the business manager key is the public key to the Business Manager's note, where he will be recieving proceeds from the Profit SHaring on Scriptbill 
		//product
		if( this.#note.BMKey ){
			this.details.businessKey = this.#note.BMKey;
		}
		this.generateScriptbillTransactionBlock();
	}
	
	static buy_product( productID, value = 0 ){
		
		//first look for the product on the Scriptbill database.
		this.productID = productID;
		let block = this.getTransBlock();
		
		if( ! block ) {
			this.errorMessage("No Product Found Associated With This Product ID: " + this.productID + ". Please Check The Product ID and Try Again!");
			return false;
		}
		
		let prodValue = block.agreement.value;
		this.details = block;
		this.details.recipient = this.details.productID;
		//check if the current note has the value of the product.
		if( this.#note.noteValue >= prodValue && ! value ){
			
			this.details.transType = 'BUYPRODUCT';
			this.details.transValue = prodValue;
			this.generateScriptbillTransactionBlock();
		}
		else {
			
			this.details = block;			
			
			if( ! value ) {
				let con = confirm( "Your Note Value is: " + this.#note.noteValue + " and you are about to purchase a product of value: " + prodValue + " You'll Need " + ( prodValue - this.#note.noteValue ) + " To Complete this Transaction Without a Credit. You Can Choose to Buy A Credit To Complete This Transaction or Continue With a Scriptbank Credit and Pay a Compound Interest of " + ( this.interestRate * 100 ) + "% Daily. Click Okay To Continue, Cancel to continue the transaction as a credit and Cancel to Subscribe to this Product..." );
				
				if( ! con ){
					this.details.transValue = this.#note.noteValue;
					this.details.transType = 'PRODUCTSUB';
					this.details.subConfig = this.subConfig;
					this.details.subConfig.value = this.details.transValue;
					this.details.subConfig.productID = this.details.productID;
				}
				else {
					this.details.transType = "BUYPRODUCT";
					this.details.transValue = prodValue;					
				}
			}
			else {
				this.details.transValue = value;
				this.details.transType = 'PRODUCTSUB';
				this.details.subConfig = this.subConfig;
				this.details.subConfig.value = this.details.transValue;
				this.details.subConfig.productID = this.details.productID;
			}
			
			
			this.generateScriptbillTransactionBlock();
			
		}		
		
		
	}
	
	static profitSharing( block ){
		
		//the block must be configured as an object for the function to work.
		if( typeof block != 'object' ) return;
		
		//the block must be a product block for Scriptbill to work or it must also be a profit sharing block for upline sharing		
		if( ( ( ! block.productID && ! block.blockKey && ! block.recipient ) || block.transType != 'PROFITSHARING' ) ) return;
		
		if( ! this.#note ){
			if( this.s.currentNote ){
				this.#note = this.getCurrentNote();
			}
			else return;
		}
		
		let agreement = null, productKey;
		
		for( x = 0; x < this.#note.profitKeys.length; x++ ){
			//set the block private keys.
			this.setPrivateKey( this.#note.profitKeys[x] );
			agreement = this.decrypt( block.recipient );
			
			if( typeof agreement == 'string' && agreement.indexOf('{') == 0 && agreement.lastIndexOf('}') == ( agreement.length - 1 ) ){
				agreement = JSON.parse(agreement);
				productKey = this.getPublicKey();
			}
			else if( typeof agreement != 'object' || ! agreement.sharingRate ){
				agreement = null;
			}
		}
		
		//if the agreement wasn't succesfully decrypted, then the profit wasn't for us.
		if( agreement == null || typeof agreement != 'object' || ! agreement.sharingRate ) return;
		
		block.agreement = agreement;
		
		this.details 			= this.defaultBlock;
		this.details.recipient 	=  this.#note.BMKey.length > 0 && (block.transType == 'BUYPRODUCT' || block.transType == 'PRODUCTSUB') ? this.#note.BMKey : block.blockKey;
		this.details.agreement 	= block.agreement;
		//the transaction value is based on the transaction type. The first benefitiary of the transaction is the business manager 
		//note. Who will get the sharingrate of the shared profit gotten.
		this.details.transValue = block.transType == 'BUYPRODUCT' || block.transType == 'PRODUCTSUB' ? ( ( block.transValue * block.agreement.sharingRate ) * block.agreement.sharingRate ) : ( block.transValue * block.agreement.sharingRate );
		this.details.origValue 	= block.transType == 'BUYPRODUCT' || block.transType == 'PRODUCTSUB' ? ( block.transValue * block.agreement.sharingRate ) : block.transValue;
		this.details.productKey = productKey;
		this.details.transType 	= 'PROFITRECIEVE';
		this.details.noteValue 	= this.#note.noteValue;		
		this.details.nextRecipient = this.#note.BMKey.length > 0 && (block.transType == 'BUYPRODUCT' || block.transType == 'PRODUCTSUB') ? '' : block.formerProductBlockID;
		this.generateScriptbillTransactionBlock();
		
		//if the transaction type is a buyproduct or productsub transaction, then we pay the recipient after we have paid the business
		//manager.
		if( ( block.transType == 'BUYPRODUCT' || block.transType == 'PRODUCTSUB' ) && this.#note.BMKey ){
			this.details.recipient = block.blockKey;
			this.details.transValue = this.details.transValue * block.agreement.sharingRate;
			this.details.origValue = this.details.transValue;
			this.details.nextRecipient = block.formerProductBlockID;
			this.generateScriptbillTransactionBlock();
		}
	}

	/*
		Logining in a user to the server will be done with the user's walletID as the username, the user's password and the note address.
		If the user note address is not found, the user may be logeddin to the Scriptbill Application but will not be able to use any funds associated with that account 
		on the app. 
	*/
	static loginUserDetails(){
		if( ! this.#password ) return;
		
		if( ! CryptoJS || ! CryptoJS.MD5  ) {
			this.errorMessage('CryptoJS Hashing Libraries Are Needed To Log You In Securely. Please Include and Rerun Scriptbill Class Again!!!');
			return false;
		}
		
		console.log( "personal: " + this.l.personal, "string: " + this.string, "hash: " + this.hashed() );
		if( this.l.personal ){
			let local = JSON.parse( this.l.personal );
			let blockID, note, noteBlock, noteHash;
			
			if( local ){
				
				let localHash 	= local.hash;
				delete local.hash;
				this.string 	= JSON.stringify( local );				
				let hash 		= this.hashed();

				if( hash != localHash ) {
					//if we don't trust the local data we use the database information.
					if( this.s.currentNote ){
						note = JSON.parse( this.s.currentNote );
						noteBlock = JSON.parse( this.l[ note.blockID ] );
						noteHash =  noteBlock.walletHASH;
							
						//the current block of a particular wallet carries the current walletHASH and it's signature.
						//if the hash gotten is not equal to the hash saved, then there is a tamper error on the wallet
						//Scriptbill may have to block the wallet from taken anymore transaction.
						//Scriptbill shows that there is no tamper error on the walletHASH, the fault came from the client who had entered a wrong password
						if( noteHash == local.hash ){
							this.errorMessage('Password Entered Was Incorrect and Won\'t Be Able To Decrypt Important Note Information!!!');
							return;
						}
						else{
							this.errorMessage('Invalid Scriptbill Note or Password!!!');
							return;
						}
								
					}
					else {
						this.errorMessage(' Incorrect Password Entered!!! ');
					}
				}
				else {
					//the user has proven that he is the rightful owner of the current wallet.
					//if the note aaddress is supplied, we attempt getting the note from his local server.
					
					if( this.noteAddress ){
						this.setPrivateKey( local.hash );
						this.#password = this.decrypt( local[ this.noteAddress ].password );
						this.#note = this.getNote();//HERERE
						
						if( this.#note && typeof this.#note == 'object' && this.#note.noteAddress == this.noteAddress ) {
							this.successMessage('Scriptbill Note Successfully Found. Scriptbill Now Initializing!!!');
							this.shareData();
						}
						return;
					}
					else {
						this.defaultScriptbill.walletID = this.walletID;
						this.createNewScriptbillWallet();
						return;
					}
				}

					
				
				let loc = window.location;
				let url = new URL(loc.origin);
				url.searchParams.set('walletHASH', hash);
				url.searchParams.set('transTime', local.transTime);
				fetch( url).then( response =>{
					return response.text();
				}).then( result =>{
					
					if( typeof result == 'string' && result.indexOf('{') == 0 && result.lastIndexOf('}') == ( result.length - 1 ) ) { 
						this.response = xml.response;
						this.recieveData();
					}
				});				
							
			}
			
			else {
				local = {};
				local.walletID = this.walletID;
				local.transTime = this.currentTime();
				this.string = local.walletID + this.#password + local.transTime;
				local.hash	= this.hashed();
				this.l.personal = JSON.stringify( local );
			}
		}
		
	}
	
	//invest on a budget or company.
	//when creating a budget, it will be added as a product in the database
	//this will avoid it being expired after a long time as long as the stocks are being 
	//traded, the transaction block or the budget will remain active in the database.
	static invest( budgetID, value ){
		this.budgetID 			= budgetID;
		
		//this will get the most recent transaction block that carries the budget.
		let productBlock 		= this.getTransBlock();
		
		if( productBlock && typeof productBlock == 'object' && productBlock.budgetID == this.budgetID ) {
			let agreement = productBlock.agreement;
			
			if( typeof agreement != 'object' )
				agreement = JSON.parse( agreement );
			
			if( agreement ){
				//the budget must have Scriptbill variable to be true, value, items, investors pouch
				let budget = typeof agreement == 'string' ? JSON.parse( agreement ) : agreement;
				
				if( budget.value && budget.budgetItems && budget.investorsHub ){
					//looop through the items to be sure that it is a valid item.
					let items = typeof budget.budgetItems == 'string' ? JSON.parse( budget.budgetItems ) : budget.budgetItems;
					let itemDetails, values = 0;
					for( itemID in items ){
						itemDetails = typeof items[ itemID ] == 'string' ? JSON.parse( items[ itemID ] ) : items[ itemID ];
						
						if( itemDetails.itemValue && itemDetails.itemName && itemDetails.scriptbillAddress && itemDetails.description ) {
							values += itemDetails.itemValue;
						}
					}
					
					//the budget value may be escalated by investors, or the proprietor of the 
					//bsuiness, so may be larger than the item values;
					if( values <= budget.value ){
						this.details = this.defaultBlock;
						this.details.transValue = value;
						
						if( this.details.transType == "CREATE" )
							this.details.transType = 'INVEST';
						
						this.details.recipient = budgetID;
						this.details.agreement = agreement;
						this.generateScriptbillTransactionBlock();
					}
				}
			}
		}
	}
	
	static budgetConfig = {
		"name"					: "", //unique name for the budget, can be a business or website name.
		"value"					: 0, //the total value of a Scriptbill Budget. Always Used to Increase stock value manually
		"max_exec"				: "1 Month", //maximum time the budget would execute.
		"budgetID"				: "",//the public Key of the Budget,the private ke would be set on the note with the block ID where the budget is kept.
		"sleepingPartner" 		: "percent-low", //this is the description for a sleeping investor.
		"workingPartner"		: "perent-high", //this is the description for a working investor.
		"sleepingPartnerShare"	: 0.1, //this is the rate that describes the sleepig investor share.
		"workingPartnerShare"	: 0.1, //this is the rate that describes the sleepig investor share.
		"budgetItems"			: [],//items that are in the budget that constitute the budget
		"budgetSign"			: "", //the signature on the budget
		"budgetRef"				: "",//reference to the budget signature.
		"budgetType"			: "straight", //telling whether this budget is a "straight" or "recursive" 
		//budget. If straight the budget block expires when the budget executes. but if recursive, the budget 
		//block will renew until the time for the recursion stops. "personal" & "family" tells that this budget 
		//is not business related budget and won't accept investment. Any investment to this budget type will not 
		//issue any stocks. "governmental" budget will issue bonds not stocks to the investor and used by 
		//business managers and any persons or organization who support the economy
		"recursion"				: Infinity,//used to describe how many times the budget will execute if the budget is a recursive budget
		"budgetSpread"			: "1 week", //time required for the budget to spread after it has executed. Works for a recursive budgetType
		"budgetCredit"			: "SBCRD", //the acceptable credit for investing and executing this budget.
		"budgetDesc"			: "", //the description of the budget. This will give investors view of what product or products that will be produced under this budget, and everything investors need to know about this budget.
		"budgetImages"			: [],//array of image url that can describe the budget products and effects.
		"budgetVideos"			: [], //array of videos that describe the budgets to investors.
		"companyRanks"			: [],//rank codes that will be occupied by users in the company. If you are employed in the company, a special rank code will be assigned you and the public key stored on the budget block
		"stockID"				: "SBCRDSTK",//default scriptbill stocks code.
		"investorsHub"			: [],//an array of hashes that can only be verified by people who hold stocks to this budget. This hash also test for the values on their stock note.
		//if an investor sell his stock, the exchange market must test to see if the stock is 
		//true by testing the hashes, deduct the sold value from his account, issue out money 
		//to the seller and updating the hub hashes if only the investor hash stocks with the company who owns this budget. InvestorHub works majorly for striaght, recursive and 
		//governmental budget types. Personal and Family budget types will not trade their 
		//stocks because it does not have a real business value.
		
	};
	
	static defaultItem  = {
		"itemName"	: "Scriptbill Adverts",//the name of the item, note really neccessary but used to ID the item on the budget
		"itemValue"	: 10,
		"itemProduct"	: "", //the product ID that would be affected when this item is executed.
		"scriptbillAddress"	: "SCRIPTBILLADVERTS", //this is the scriptbill note address of the item. If this is empty, the create budget function will automatically create a Scriptbill note and send to the recipient
		"businessName"	: "",//the business name or storeID of the business that wants to sell this item. storeID is not a Scriptbill language but a Scriptbank System of storing businesses in the network. Scriptbill recognizes business using their noteAddress or budget ID.
		"businessPhone"	: "",//phone number of the merchant.
		"businessEmail"	: "",//email address of the merchant
		"businessAddress"	: "",//the street address of the merchant's business
		"businessRegion"	: "",//the region where the business resides.
		"businessCountry"	: "",//the country where the business resides.
		"execTime"			: "1 month", //time when this item would execute		
	};
	
	//this function allows a user to employ a Scriptbill worker to his own company. This will allow the user buy 
	//stocks from the company with special priviledges.
	static employScriptbillWorker( budgetID, workerNote ){
		if( ! this.#note || ! this.#note.noteBugdets  || ! this.#note.noteBudgets.length || ! this.#note.noteBudgets.includes( budgetID ) ) return false;
		
		this.budgetID = budgetID;
		let budgetBlock = this.getTransBlock();
		
		if( ! budgetBlock || ! budgetBlock.agreement ){
			this.errorMessage("You can't employ a worker to the a Budget that Doesn't Exist. Please Check the Budget ID and Try Again. Budget ID worked with is: " + budgetID );
			return false;
		}
		
		let agreement = budgetBlock.agreement;
		let privKey 	= this.generateKey(30);
		this.setPrivateKey( privKey );
		let pubKey 		= this.getPublicKey();
		this.setPrivateKey( pubKey );
		agreement.companyRanks.push( this.getPublicKey() );
		budgetBlock.agreement = agreement;
		this.details	 	= budgetBlock;
		this.details.transType = "EMPLOY";
		this.details.transValue = 0;
		this.details.noteValue = this.#note.noteValue;
		this.details.recipient = workerNote;
		this.generateScriptbillTransactionBlock();	
	}
	
	//before calling this function please set the budget Config variable to your desired value
	static createScriptbillBudget(){
		
		if( ! this.#note && this.s.currentNote){
			this.#note = this.getCurrentNote();
		}
		
		//we need at least the name and value set before continuing
		if( ! this.budgetConfig.name || ! this.budgetConfig.value ) return false;
		
		let budgetItems = this.budgetConfig.budgetItems;
		let x, item, found = false, value = 0;
		let time 	=  parseInt( this.currentTime() );
		let maxExecTime;
		let budgetID;
		
		//we loop through the budget items to calculate the value and check if an advert budget was included
		if( budgetItems.length > 0 ){
			for( x = 0; x < budgetItems.length; x++ ) {
				item = budgetItems[ x ];
				value += item.itemValue;
				if( item.itemName == 'Scriptbill Adverts' )
					found = true;
				
				if( typeof item.execTime == 'string' ){
					maxExecTime = this.calculateTime( item.execTime );
					item.execTime = time + maxExecTime;
				}
			}
		}
		
		if( this.budgetConfig.value != value )
			this.budgetConfig.value = value;
		
		if( typeof this.budgetConfig.max_exec == 'string' ) {
			maxExecTime = this.calculateTime( this.budgetConfig.max_exec );
			
			if( maxExecTime ){
				this.budgetConfig.max_exec = time + maxExecTime;
			}
		}
		
		if( ! found ){
			//check the budget credit.
			let itemCredit = this.budgetConfig.budgetCredit;
			let itemValue  = this.defaultItem.itemValue;
			
			if( itemCredit != "SBCRD" ){
				itemValue = ItemCredit * this.getExchangeValue( itemCredit, "SBCRD" )[1];
			}
			
			this.defaultItem.itemValue = itemValue;
			if( typeof this.budgetConfig.budgetItems != 'object')
				this.budgetConfig.budgetItems = [];
			
			this.budgetConfig.budgetItems.push( this.defaultItem );
		}
		
		let isFound = false;
		//generate the budget id.
		if( this.budgetConfig.budgetID ) {			
			for( x = 0; x < this.#note.noteBudgets.length; x++ ){
				this.setPrivateKey( this.#note.noteBudgets[x] );
				budgetID 	= this.getPublicKey();
				if( this.budgetConfig.budgetID == budgetID )
					isFound		= true;		
			}
		} 
		
		if( ! isFound ){
			budgetID  = this.generateKey( 20 );
			this.setPrivateKey( budgetID );
			this.budgetConfig.budgetID = this.getPublicKey();
			this.#note.noteBudgets.push( budgetID );
		}
		
		this.details = this.defaultBlock;
		this.details.transType = "CREATEBUDGET";
		this.details.agreement = this.budgetConfig;
		this.details.recipient = this.budgetConfig.budgetID;
		this.details.expiry		= this.budgetConfig.max_exec;
		this.details.transValue = this.budgetConfig.value;
		this.generateScriptbillTransactionBlock();
	}
	
	//to run auto investment. we run it locally on the server first and the network gets to know based on the 
	//transactional data sent afterwards
	static autoInvestScriptbillBudget(){
		
		if( ! this.#note && this.s.currentNote ){
			this.#note = this.getCurrentNote();
		}
		
		//testing to see if a scriptbill note is set and has budget on which could run with
		if( ! this.#note || this.#note.noteBudgets.length <= 0 ) return false;
		
		let budgets = this.#note.noteBudgets;
		let budgetKey, budgetID, budgetValue = 0;
		let budgetBlock, budget;
		let x, item;
		let time = this.currentTime(), week	= 604800, day 	= 86400, hour 	= 3600;
		let execTime, itemExec, execResult, value = 0;
		let noteValue = this.#note.noteValue;
		
		for( x = 0; x < budgets.length; x++ ){
			budgetKey = budgets[x];
			this.setPrivateKey( budgetKey );
			this.budgetID = this.getPublicKey();			
			budgetBlock = this.getTransBlock();
			
			if( budgetBlock ){
				budget 		= budgetBlock.agreement;
				//for auto investment to work, the budget must belong to a valid product
				//a governmental budget type will only attract investment from investors in the bond market
				//auto investment will not work with such budget.
				if( budget.budgetType != "straight" || budget.budgetType != "recursive" ) 
					continue;			
			
				budgetValue = budget.value;
				
				//check the execution time for each item, we will invest on budget whose execution time is at 
				//least three weeks
				execTime = budget.max_exec;
				
				let budgetItems = budget.budgetItems;
				for( y = 0; y < budgetItems.length; y++ ){
					item 	= budgetItems[y];
					execResult = item.execTime - time;
					
					//any item lesser than 4 weeks in the execution time 
					if( ( execResult / week ) < 4 ) continue;
					
					value += item.itemValue;
				}
				
				if( value ) {
					if( budget.budgetCredit != "SBCRD" )
						value = value * this.getExchangeValue( budget.budgetCredit, "SBCRD" )[1];
					
					//checking the note value
					//we can only auto invest if the value on the note is lesser than the budget value.
					if( value > noteValue ){
						//to invest we check if the BM Key is there to create the transaction.
						if( this.#note.BMKey && this.#note.BMKey != "" ) {
							this.details   = this.defaultBlock;
							this.details.transType = "INVEST";
							this.details.transValue = value;
							this.details.noteType   = budget.budgetCredit;
							this.details.recipient  = budget.budgetID;
							budget.recipient 		= this.#note.BMKey;
							this.details.agreement  = budget;
							this.generateScriptbillTransactionBlock();
						}
					}
				}
			}
			
			
		}
	}
	
	static monitorScriptbillStock(){
		if( ( ! this.response || ! this.response.blockID ) && ( ! this.#note || ! this.#note.noteType.includes("STK") && ! this.response.productID ) ) return false;
		
		//et the budget ID of the current stock to know if the current product block belongs to the current budget.
		this.budgetID 	= this.#note.budgetID;
		let budgetBlock	= this.getTransBlock();
		
		if( ! budgetBlock ){
			this.errorMessage( "This Stock note with budget ID: " + this.#note.budgetID + " appears to be invalid! Budget Associated with the stock was not found. Please contact the company you bought this stock from for assistance."); 
			return false;
		}
		
		let products 	= budgetBlock.budgetProducts;
		let budget		= budgetBlock.agreement;
		let x, productID, pay, productBlock, prodAgree, soldValue, purchaseValue, y, item, profitRate, profit, stockProfit;
		
		if( products.indexOf( this.response.productID ) ) {
			productID 	= this.response.productID;
			//the pay value of the stock describe the amount from the profit that would be paid to the stock note per transaction.
			pay			= this.#note.pay;
			//to get the right amount of money to be paid, the profit from this transaction must be calculated.
			//to get the right profit, we have to get the product block to understand the value
			this.productID 		= productID;
			producBlock			= this.getTransBlock();
			prodAgree			= productBlock.agreement;
			soldValue 			= prodAgree.units * prodAgree.value;
			//to get the profit rate we need to get the purchase value of the product. we'll have to loop through the budget items
			//to find the purchase value.
			purchaseValue = 0;
			for( y = 0; y < budget.budgetItems.length; y++ ){
				item = budget.budgetItems[y];
				if( item.itemProduct == productID ){
					purchaseValue 	+= item.itemValue;
				}
			}
				
			//we can now calculate the profit we get from the profit rate gotten through the purchase value.
			profitRate		= (soldValue - purchaseValue)/soldValue;
			profit			= this.response.transValue * profitRate;
			stockProfit 	= profit * pay;
			
			//letting the budget block discoverable.
			this.budgetBlock 		= budgetBlock;
			
			//generate a transaction that will pay up the mother note of this stock.
			this.details 			= this.defaultBlock;
			this.details.recipient = this.#note.motherKey;
			this.details.transType = "STOCKPAY";
			//the block verifiers will need the stock note to reference the budget in his transactional request to confirm the 
			//transaction. to do this, we need to provide both the budgetID and stock hashes.
			this.string				= this.#note.stockKey + this.#note.pay + this.#note.noteValue;
			this.details.reference	= this.hashed();
			this.details.budgetID	= budget.budgetID;
			this.details.transValue = stockProfit;
			this.details.noteType 	= budget.budgetCredit;
			this.details.blockID	= this.response.blockID;
			this.generateScriptbillTransactionBlock();			
		}		
	}
	
	//the stock ID, if the stock will be bought directly from the note.
	//the value of stock you want to buy
	//the noteAddress if the stock will be bought from a stock note holder. the note address should be the 
	//note address of the recipient stock. the recipient mother key will be used to recieve the funding.
	static buyScriptbillStocks( stockID, value ){
		
		if( this.#note.noteType.includes("STK") || this.#note.noteType.includes("BND") ){
			this.errorMessage("You Can't Use A Stock or Bond Note To Purchase a Scriptbill Stock! Please Try Again With a Valid Credit Note.");
			return false;
		}
		
		if( this.#note.noteValue < value ){
			this.errorMessage("You don't have sufficient Scriptbill Credit to Complete this Transaction!");
			return false;
		}
		
		this.budgetID = stockID;
		let stockBlock = this.getTransBlock();
		
		if( ! stockBlock ){
			this.errorMessage("Sorry, No Transaction Block Was Found Associated With Ths Stock Note!");
			return false;
		}
		
		let budget 	= stockBlock.agreement;
		
		if( budget.budgetType != "straight" || budget.budgetType != "recursive" ){
			this.errorMessage("The Stock ID " + stockID + " Was Not Found Associated With Any Valid Scriptbill Stock. Please Check and Try Again or Contact Your Company");
			return false;
		}
		
		if( stockBlock.transType == "SELLSTOCK" ){
			this.blockRef = stockBlock.blockRef;
			let blocks = this.getTransBlock();
			let soldstock = false, x;
			
			if( blocks && blocks.length ){
				for( x = 0; x < blocks.length; x++ ){
					if( blocks[x].transType == "SOLDSTOCK" )
						soldstock = true;
				}
			}
			
			if( ! soldstock ){
				this.stockNoteAddress = stockBlock.blockKey;
			}
		}
		
		this.defaultBlock.transType = "BUYSTOCK";		
		return this.invest( stockID, value );
	}
	
	static sellScriptbillStocks( stockRate ){
		
		if( stockRate > 1 ){
			this.errorMessage("Please Set Your Stock Rate equal to or Lesser Than 1!");
			return false;
		}
		
		if( ! this.#note && this.s.currentNote ){
			this.#note = this.getCurrentNote();
		}
		
		if( ! this.#note || this.#note.noteType.lastIndexOf( "STK" ) != ( this.#note.noteType.length - 3 ) ) {
			this.errorMessage("Only Scriptbill Stock Note Can Sell a Scriptbill Stock");
			return false;
		}
		
		let stockValue = this.#note.noteValue * stockRate;
		
		if( this.#note.noteValue < stockValue ){
			this.errorMessage("Your Stock note Value is low Compare to What you Applied To Sell!");
			return false;
		}
		
		if( ! this.#note.budgetID ){
			this.errorMessage("Your Stock note doesn't Appear to Be Valid. No Budget ID Stored on this Note. Please Contact Your Company For Rectification!");
			return false;
		}
		
		this.budgetID 		= this.#note.budgetID;
		let budgetBlocks  	= this.getTransBlock();
				
		if( ! budgetBlocks || ! budgetBlocks.length || ! budgetBlocks[0].agreement || ! budgetBlocks[0].agreement.value ){
			this.errorMessage("Your Stock note doesn't Appear to Be Valid. No Budget Block Was Found Associated With The Budget ID on this Note!");
			return false;
		}
		
		if( ! budgetBlocks[0].agreement.budgetType || budgetBlocks[0].agreement.budgetType != "straight" ||  budgetBlocks[0].agreement.budgetType != "recursive" || ! budgetBlocks[0].agreement.budgetProducts || ! budgetBlocks[0].agreement.budgetProducts.length || ! budgetBlocks[0].agreement.budgetProducts.length > 0 ){
			this.errorMessage("Your Stock note doesn't Appear to Be Valid. The Budget on Your Stock Note Does Not Appear to Belong To a Valid Company!");
			return false;
		}
		
		let x, budgetBlock = false, buyBlocks, y, sold = false;
		
		for( x = 0; x < budgetBlocks.length; x++ ){
			
			if( budgetBlocks[x].transType != "BUYSTOCK" ) continue;
			
			budgetBlock = budgetBlocks[x];
			this.blockRef = budgetBlock.blockRef;
			buyBlocks 		= this.getTransBlock();
			
			if( buyBlocks && buyBlocks.length ) {
				for( y = 0; y < buyBlocks.length; y++ ) {
					if( buyBlocks[x].transType == "SOLDSTOCK" ){
						sold = true;
						break;
					}
				}
			}
			if( ! sold  ){
				//check the transaction value to be equal to the stock value.
				let transValue = budgetBlock.agreement.value * stockValue;
				
				if( budgetBlock.transValue >= transValue  ){					
					break;
				}
				else {
					budgetBlock = false;
				}
					
			}
				
		}
		
		if( ! budgetBlock || ( budgetBlock && sold ) ){
			this.details = budgetBlocks[0];
			this.details.recipient = this.#note.budgetID;
			this.details.transValue = budgetBlocks[0].agreement.value * stockValue;
			this.details.transType	= "SELLSTOCK";
		}
		else if( budgetBlock && ! sold ) {
			this.details = budgetBlock;
			this.details.recipient = budgetBlock.blockKey;
			this.details.transValue = budgetBlock.agreement.value * stockValue;
			this.details.transType	= "SOLDSTOCK";
		}
		
		this.isBudget 			= true;		
		this.details.stock		= this.#note.noteValue;
		this.details.pay 		= stockValue;		
		this.generateScriptbillTransactionBlock();
	}
	
	static buyScriptbillBonds( bondID, value ){
		
		if( this.#note.noteValue < value ){
			this.errorMessage("You don't have sufficient Scriptbill Credit to Complete this Transaction!");
			return false;
		}
		
		this.budgetID 	= bondID;
		let blocks 		= this.getTransBlock();
		
		if( ! blocks || ! blocks.length ){
			this.errorMessage("No Transaction Block Was Found Associated With The Current Bond With This ID: "+bondID+"!");
			return false;
		}
		
		//confirming if it is a bond block.
		let budget 		= blocks[0].agreement;
		
		if( budget.budgetType != "governmental" ){
			this.errorMessage( "The Current Bond With ID: " + bondID + " Can't be Bought as a Bond. Please Try Purchasing as a Stock Instead" );
		}
		
		//looking for a SELLBOND request in the network to fulfill rather.
		let x, y, block = false, sellBlocks, bought = false;
		
		for( x = 0; x < blocks.length; x++ ){
			
			if( blocks[x].transType != "SELLBOND" ) continue;
			
			block = blocks[x];
			this.blockRef = block.blockRef;
			sellBlocks 		= this.getTransBlock();
			
			if( sellBlocks && sellBlocks.length ) {
				for( y = 0; y < sellBlocks.length; y++ ) {
					if( sellBlocks[x].transType == "SOLDBOND" ){
						bought = true;
						break;
					}
				}
			}
			if( ! bought  ){
				//check the transaction value to be equal to the stock value.
				let transValue = block.agreement.value * value;
				
				if( block.transValue >= transValue  ){
					this.stockNoteAddress = block.blockKey;
					break;
				}								
			}
			
		}
		
		this.defaultBlock.transType = "BUYBOND";
		return this.invest( bondID, value );
	}
	
	static sellScriptbillBonds( bondValue ){
		
		if( ! this.#note && this.s.currentNote ) {
			this.#note = this.getCurrentNote();
		}
		
		if( ! this.#note || this.#note.noteType.lastIndexOf( "BND" ) != ( this.#note.noteType.length - 3 ) ) return false;
		
		if( this.#note.noteValue < bondValue ){
			this.errorMessage("Your Bond note Value is low Compare to What you Applied To Sell!");
			return false;
		}
		
		if( ! this.#note.budgetID ){
			this.errorMessage("Your Bond note doesn't Appear to Be Valid. No Exchange ID Stored on this Note. Please Contact Your Company For Rectification!");
			return false;
		}
		
		this.budgetID = this.#note.budgetID;
		let budgetBlocks  = this.getTransBlock();
		
		if( ! budgetBlocks || ! budgetBlocks.length || ! budgetBlocks[0].agreement || ! budgetBlocks[0].agreement.value ){
			this.errorMessage("Your Bond note doesn't Appear to Be Valid. No Exchange Block Was Found Associated With The Exchange ID on this Note!");
			return false;
		}
		
		
		let x, budgetBlock = false, buyBlocks, y, sold = false;
		
		for( x = 0; x < budgetBlocks.length; x++ ){
			
			if( budgetBlocks[x].transType != "BUYBOND" ) continue;
			
			budgetBlock = budgetBlocks[x];
			this.blockRef = budgetBlock.blockRef;
			buyBlocks 		= this.getTransBlock();
			
			if( buyBlocks && buyBlocks.length ) {
				for( y = 0; y < buyBlocks.length; y++ ) {
					if( buyBlocks[x].transType == "SOLDBOND" ){
						sold = true;
						break;
					}
				}
			}
			if( ! sold  ){
				//check the transaction value to be equal to the stock value.
				let transValue = budgetBlock.agreement.value * bondValue;
				
				if( budgetBlock.transValue >= transValue  ){					
					break;
				}
				else {
					budgetBlock = false;
				}
					
			}
				
		}
		
		if( ! budgetBlock || ( budgetBlock && sold ) ){
			this.details = budgetBlocks[0];
			this.details.recipient = this.#note.budgetID;
			this.details.transValue = budgetBlocks[0].agreement.value * stockValue;
			this.details.transType	= "SELLBOND";
		}
		else if( budgetBlock && ! sold ) {
			this.details = budgetBlock;
			this.details.recipient = budgetBlock.blockKey;
			this.details.transValue = budgetBlock.agreement.value * stockValue;
			this.details.transType	= "SOLDBOND";
		}
		
		this.isBudget 			= true;		
		this.details.stock		= this.#note.noteValue;
		this.details.pay 		= bondValue;		
		this.generateScriptbillTransactionBlock();	
	}
	/*
	*/
	static monitorScriptbillBudget(){
		
		if( ! this.#note ) return;
		
		this.budgetCredit = this.#note.noteType;
		this.transType    = "CREATEBUDGET";
		let budgetBlocks  = this.getTransBlock();		
		let x, budget, agreement, govBudget, budgetItems = {}, budgetValue = 0, govBlock;
		let tenMins  = parseInt( this.calculateTime( "10 minutes" ) );
		let execTime = this.s.budgetRunned ? ( parseInt( this.s.budgetRunned ) + tenMins) : 0;
		let currentTime = parseInt( this.currentTime() );
		
		if( currentTime < execTime ) return false;		
		
		if( budgetBlocks && budgetBlocks.length ){
			for( x = 0; x < budgetBlocks.length; x++ ){
				budget = budgetBlocks[x];
				agreement = budget.agreement;
				
				if( agreement.budgetType && agreement.budgetType == "governmental" ){
					govBudget 	= agreement;
					govBlock 	= budget;
				}
				else if( agreement.budgetItems && agreement.budgetType ){
					budgetItems[agreement.budgetID] = agreement;
					budgetValue += agreement.value;
					
					//next, checking the if the value of the current budget is equal to the items value.
					let item, itemID, value = 0;
					for( itemID in agreement.budgetItems ) {
						item = agreement.budgetItems[ itemID ];
						value += item.itemValue;
					}
					
					if( agreement.value && agreement.value != value ){
						agreement.value = value;
						this.details =  budget;
						this.details.transType = "UPDATEBUDGET";
						this.details.transValue = 0;
						this.details.agreement = agreement;
						this.details.recipient = agreement.budgetID;
						this.generateScriptbillTransactionBlock();
					}
				}
			}
		}
		
		if( govBudget && govBudget.value != budgetValue ){
			govBudget.value = budgetValue;
			govBudget.budgetItems = budgetItems;
			this.details = govBlock;
			this.details.transType = "UPDATEBUDGET";
			this.details.agreement = govBudget;
			this.details.recipient = govBudget.budgetID;
			this.generateScriptbillTransactionBlock();
		}
		
		this.s.budgetRunned = this.currentTime();
	}
	/*
		Monitoring Scriptbill Credit means Monitoring any transactions that are linked with the current node
		or any note whose block we have access to.
		This function should be runned in a mood where all blocks are accessed.
	*/
	static monitorScriptbillCredit(){
		
		if( ! this.#note && this.s.currentNote ) {
			this.#note = this.getCurrentNote();
		}
		
		//
		if( ! this.#note || this.#note.noteValue > 0 || ! this.response ) return false;
		
		if( this.#note.noteValue < 0 ) {
			this.response = this.getTransBlock();			
		}
		
		if( ! this.response || ! this.response.blockID || ! this.response.noteValue ) return false;
		
		//first we check the current note value of the block.
		let noteValue = this.response.noteValue;
		
		//calculating the note value entails checking the transaction type.
		let transType = this.response.transType;
		
		if( this.transSend.includes( transType ) ){
			noteValue 	+= this.response.transValue; 
		}
		else if( this.transRecieve.includes( transType ) ){
			noteValue  	-= this.response.transValue;
		}
		
		//non credit holders are not going to be monitored.
		if( noteValue >= 0 ) return false;
		
		//next we check the transaction type. if is related to recieving we take our interest rate.
		if( this.transRecieve.includes( transType ) ){			
			this.details 			= this.response;
			//the nonce parameter is used to caliberate the auto transactions in the scriptbill network.
			//the nonce is created using the block ID hashes. This means the value will be the same for
			//every node that create the nonce. Transactions with the latest transtime and the same nonce
			//will be honoured by the node using it.
			this.string 			= this.details.blockID;
			this.details.nonce		= this.hashed();
			//the interest type are written on the transaction block of crediters
			if( this.response.interestType && this.response.interestType == 'PT' )
				this.details.transValue 	= this.response.transValue * this.response.interestRate;
			
			else {
				//check if the interest is due and ready to be paid.
				if( this.response.payTime <= this.currentTime() ){
					this.response.interestRate = this.calculateInterestRate( this.response.interestType, this.response.interestRate );
					let amount = Math.abs( this.response.noteValue ) * this.response.interestRate;
					
					if( amount > this.response.transValue ){
						this.details.transValue = this.response.transValue;
						this.details.toPay		= amount - this.response.transValue;
					}
				}
			}
			
			this.details.transType 	= "INTERESTPAY";
			this.details.recipient	= "SCRIPTBANK";
			this.generateScriptbillTransactionBlock();
		}
		
	}
	
	static handleSubscriptions(){
		if( ! this.block || ! this.block.blockID || this.block.transType != "PRODUCTSUB" || ! this.block.agreement || ! this.block.agreement.subUnit  ){
			return false;
		}
		
		let spread 	= this.block.agreement.subConfig.subSpread;
		let nextSub	= this.block.agreement.subConfig.nextSub;
		let time 	= this.currentTime();
		
		if( nextSub <= time ){
			this.block.agreement.subConfig.nextSub = parseInt( time ) + parseInt( this.calculateTime( this.block.agreement.subConfig.subSpread ) );
			this.details 			= this.block;			
			this.details.transValue = this.block.agreement.subConfig.value;
			this.details.recipient  = this.block.productID;
			this.autoExecute		= true;
			this.generateScriptbillTransactionBlock();
		}
		
		if( this.#note && this.#note.noteSubs && this.#note.noteSubs.length ){
			let x, sub;
			for( x = 0; x < this.#note.noteSubs.length; x++ ){
				sub 	= this.#note.noteSubs[x];
				
				if( sub.nextSub <= time ){
					sub.nextSub = parseInt( time ) + parseInt( this.calculateTime( sub.subSpread ) );
					this.details	= this.block;
					this.details.transValue = sub.value;
					this.details.recipient = sub.productID;
					this.generateScriptbillTransactionBlock();
				}
			}
		}
	}
}



