const express = require('express');
const app = express();
const fs = require("fs");
const mysql = require('mysql2');
const bodyparser = require('body-parser');

const dbInfo = require('../../vp23config');
const timeInfo = require('./datetime_et');
//const database = 'if23_hugoluca_ti';

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyparser.urlencoded({extended: false}));

//andmebaasi ühendus
const conn = mysql.createConnection({
	host: dbInfo.configData.host,
	user: dbInfo.configData.user,
	password: dbInfo.configData.password,
	database: dbInfo.configData.database
});

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

app.get('/namelog', (req, res) => {
	fs.readFile('public/txtfiles/namelog.txt', 'utf8', (err, data) => {
		if (err) {
			throw err;
		} 
		else {
			const listInfoFull = data.split(';');
			const listInfo = [];
			for (const line of listInfoFull) {
				const innerList = line.split(',');
				const [firstName, lastName, date] = innerList;
				//console.log(innerList);
				const textInfo = ('Eesnimi: ' + firstName + ', Perekonnanimi: ' +  lastName + ', Kuupäev: ' + timeInfo.dateENtoDateET(date));
				//console.log(textInfo);
				listInfo.push(textInfo);
				//console.log(listInfo);
			}
		res.render('justlist', { h1: 'Nimede list', list: listInfo });
		}
  });
});


app.get('/eestifilm', (req, res)=>{
	res.render('filmindex');
});

app.get('/eestifilm/filmiloend', (req, res)=>{
	let sql = 'SELECT title, production_year, duration FROM movie';
	let sqlResult = [];
	conn.query(sql, (err, result)=>{
		if (err){
			throw err;
			res.render('filmlist', {filmlist: sqlResult});
			//conn.end();
		}
		else {
			//console.log(result)
			res.render('filmlist', {filmlist: result});
			//conn.end();
		}
	});
	//res.render('filmlist');
});

app.get('/eestifilm/addfilmperson', (req, res)=>{
	res.render('addfilmperson');
});

app.get('/eestifilm/singlemovie', (req, res)=>{
	res.render('singlemovie');
	
});


/*app.post('/eestifilm/singlemovie', (req, res)=>{
	let sql = 'SELECT * FROM movie where id=?';
	let sqlResult = [];
	conn.query(sql, [req.body.idNum] (err, result)=>{
		if (err){
			throw err;
			res.render('singlemovielist', {movieinfo: sqlResult});
			conn.end();
		}
		else {
			
			res.render('singlemovielist', {movieinfo: result});
			//conn.end();
		}
	});
	//res.render('filmlist');
});*/

app.post('/eestifilm/addfilmperson', (req, res)=>{
	//;
	//res.send("Andmed");
	let notice = '';
	let sql = 'INSERT INTO person (first_name, last_name, birth_date) VALUES(?,?,?)';
	conn.query(sql, [req.body.firstNameInput, req.body.lastNameInput, req.body.birthDateInput], (err, result) =>{
		if (err) {
			notice = 'Andmete salvestamine ebaõnnestus!';
			res.render('addfilmperson', {notice: notice});
			throw err;
		}
		else {
			notice = req.body.firstNameInput + ' ' + req.body.lastnameInput + ' andmete salvestamine õnnestus!';
			res.render('addfilmperson', {notice: notice});
		}
	});
});

app.listen(5104);