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
			listInfo = data.split(';');
			res.render('justlist', {h1: 'Nimede list', list: listInfo});
		}
	});
});



app.listen(5104);