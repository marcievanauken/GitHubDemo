function gd(){
	getGifts(endpoint, timeParams);
	validateGifts(gifts);
	insertGifts(gifts);
}