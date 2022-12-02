function gd(){
	getGifts(endpoint, timeParams);
	validateGifts(gifts, dbLengths);
	insertGifts(gifts);
}

function validateGifts(gifts, dbLengths){
	console.log(dbLengths);
	// loop through gifts
}