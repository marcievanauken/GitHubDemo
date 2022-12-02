function gdProcess(){
	getGifts(endpoint, timeParams);
	validateGifts(gifts);
	insertGifts(gifts);
}

gdProcess();