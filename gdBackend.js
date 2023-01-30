function gdProcess(){
	getGifts(endpoint, timeParams);
	validateGifts(gifts);
	truncateGifts(gifts, dbLengths);
	insertGifts(gifts);
}

function truncateGifts(gifts, dbLengths){
	console.log(dbLengths);

	for (gift in gifts){
		gift.lengthTooLong = true;
		if (gifts[gift].lengthTooLong){
			truncateValues(gift);
		}
	}
}
// vanaukenmarcie is making changes
// marcievanauken making changes now

gdProcess();