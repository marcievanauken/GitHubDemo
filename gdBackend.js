function gdProcess(){
	getGifts(endpoint, timeParams);
	truncateGifts(gifts, dbLengths);
	insertGifts(gifts);
}

function truncateGifts(gifts, dbLengths){
	console.log(dbLengths);
	for (gift in gifts){
		/* 
			//general validation checks
			//validations and regex etc

		*/

		if (gift[i].lengthTooLong){
			truncateVals(gift);
		}

		//adding some code
	}

}