const express = require('express');
const timeInfo = require('./datetime_et');
const app = express();
const fs = require("fs");

app.set('view engine', 'ejs');
app.use(express.static('public'));

app.get('/', (req, res)=>{
	//res.send('See töötab!');
	//res.download('index.js');
	res.render('index');
});

app.get('/timenow', (req, res)=>{
	//res.send('Testi lehekülg');
	const dateNow = timeInfo.dateETformated();
	const timeNow = timeInfo.timeETnewformated();
	res.render('timenow', {nowD: dateNow, nowT: timeNow});
});

app.get('/wisdom', (req, res)=>{
	let folkWisdom = [];
	fs.readFile('public/txtfiles/vanasonad.txt', 'utf8', (err, data)=>{
		if (err){
			throw err;
		}
		else {
			folkWisdom = data.split(';');
			res.render('justlist', {h1: 'Vanasõnad', list: folkWisdom});
		}
	});
	//res.render('index')
});

app.get('/namelog', (req, res)=>{
	let listInfo = [];
	fs.readFile('public/txtfiles/namelog.txt', 'utf8', (err, data)=>{
		if (err){
			throw err;
		}
		else {
			let listInfoFull = data.split(';');
			let i = 0;
			let writenCode = "";
			for (let line of listInfoFull){
				let innerList = line.split(',');
				let listInfoNew = [];
				listInfoNew.push(innerList);
				console.log(listInfoNew);
				writenCode += ('Eesnimi: ' + listInfoNew[i][0] + ', Perekonnanimi:' + listInfoNew[i][1] + 'Kuupäev: ' + listInfoNew[i][2] + ';');
				i++;
			}
			let listinfo = writenCode.split(';');
			res.render('justlist', {h1: 'Nimede list', list: listInfo});
		}
	});
});

/*app.get('/namelog', (req, res)=>{
	let listInfo = [];
	data = fs.readFileSync('public/txtfiles/namelog.txt', 'utf8')
	let listInfoFull = data.split(';');
	let i = 0;
	let writenCode = "";
	for (let line of listInfoFull){
		let innerList = line.split(',');
		let listInfoNew = [];
		listInfoNew.push(innerList);
		console.log(listInfoNew);
		//writenCode += ('Eesnimi: ' + listInfoNew[i][0] + ', Perekonnanimi:' + listInfoNew[i][1] + 'Kuupäev: ' + listInfoNew[i][2] + ';');
		i++;
	}
	let listinfo = writenCode.split(';');
	res.render('justlist', {h1: 'Nimede list', list: listInfo});

});*/


app.listen(5104);