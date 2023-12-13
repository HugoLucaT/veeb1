window.onload = function (){
	document.querySelector("#roleInput").disabled = true;
	document.querySelector("#positionInput").addEventListener("change", checkPosition);
}

function checkPosition(){
	if(document.querySelector("#positionInput").value == "1"){
		document.querySelector("#roleInput").disabled = false;
	} else {
		document.querySelector("#roleInput").disabled = true;
	}
}