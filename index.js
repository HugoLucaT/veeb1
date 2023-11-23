const express = require('express');
const app = express();
const fs = require("fs");
const mysql = require('mysql2');
const bodyparser = require('body-parser');
//fotode laadimiseks
const multer = require('multer');
//seadistame vahevara (middleware), mis määrab üleslaadimise kaaloogi.
const upload = multer({dest: './public/gallery/orig/'});
const sharp = require('sharp');

const dbInfo = require('../../vp23config');
const timeInfo = require('./datetime_et');
//const database = 'if23_hugoluca_ti';

app.set('view engine', 'ejs');
app.use(express.static('public'));
//kui ainult tekst siis "extended: false", kui muud siis allolev.
app.use(bodyparser.urlencoded({extended: true}));

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

app.get('/news', (req, res)=> {
	res.render('news');
});

app.get('/news/add', (req, res)=> {
	res.render('addnews');
});

app.get('/news/read', (req, res)=> {
	//let allNews = 'SELECT * FROM "vpnews" WHERE expire > ? AND deleted IS NULL ORDER BY id DESC';
	let timeSQL = timeInfo.dateSQLformated()
	let allNews = 'SELECT title, content FROM vpnews WHERE expire > ? AND deleted IS NULL ORDER BY id DESC';
	//console.log(allNews);
	conn.query(allNews, [timeSQL], (err, result)=>{
	//conn.query(allNews,  (err, result)=>{
		if (err){
			throw err;
			let info = 'Uudiseid ei suutud lugeda';
			console.log(result)
			res.render('readnews', {allNews: info});
		}
		else {
			res.render('readnews', {allNews: result});
		}
	});
});

app.get('/news/read/:id', (req, res)=> {
	//res.render('readnews');
	console.log(req.query);
	res.send('Tahame uudist mille id on ' + req.params.id);
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
	let movieTableInfo = 'SELECT COUNT(title) FROM movie';
	conn.query(movieTableInfo, (err, result)=>{
		if (err){
			throw err;
			//conn.end();
		}
		else {
			console.log(result[0]['COUNT(title)']);
			res.render('singlemovie', {maxSize: result[0]['COUNT(title)']});
			//conn.end();
		}
	});
});

app.get('/photoupload', (req, res)=>{
	res.render('photoupload');
});

app.get('/photogallery', (req, res)=>{
	let gallerySQL = 'SELECT id, filename, alttext FROM vpgallery WHERE deleted IS NULL';
	conn.query(gallerySQL, (err, result)=>{
		if (err){
			throw err;
			//let info = 'Pilte ei suutud lugeda';
			//console.log(result)
			//res.render('gallery', {allNews: info});
		}
		else {	
			res.render('photogallery', {allPictures: result});
		}
	});
});

app.post('/news/add', (req, res)=>{
	let notice = '';
	let sql = 'INSERT INTO vpnews (Title, Content, Expire, userid) VALUES(?,?,?,1)';
	conn.query(sql, [req.body.titleInput, req.body.contentInput, req.body.expireInput], (err, result) =>{
		if (err) {
			notice = 'Andmete salvestamine ebaõnnestus!';
			res.render('addnews', {notice: notice});
			throw err;
		}
		else {
			res.render('addnews');
		}
	});
});

app.post('/photoupload', upload.single('photoInput'), (req, res)=>{
	let notice = '';
	//console.log(req.file);
	//console.log(req.body);
	const fileName = 'vp_' + Date.now() + '.jpg';
	//fs.rename(req.file.path, './public/gallery/orig/' + req.file.originalname, (err)
	fs.rename(req.file.path, './public/gallery/orig/' + fileName, (err) =>{
		console.log('Faili laadimise viga: ' + err);
	});
	//loome kaks väiksema mõõduga pildi varianti
	sharp('./public/gallery/orig/' + fileName).resize(100,100).jpeg({quality : 90}).toFile('./public/gallery/thumbs/' + fileName);
	sharp('./public/gallery/orig/' + fileName).resize(800,600).jpeg({quality : 90}).toFile('./public/gallery/normal/' + fileName);
	//foto andmed andmetabelisse
	let sql = 'INSERT INTO vpgallery (filename, originalname, alttext, privacy, userid) VALUES(?,?,?,?,1)';
	conn.query(sql, [fileName, req.file.originalname, req.body.altInput, req.body.privacyInput], (err, result)=>{
		if (err){
			throw err
			notice = 'Foto andmete salvestamine ebaõnnestus!';
			res.render('photoupload', {notice: notice});
		}
		else {
			notice = 'Foto ' + req.file.originalname + ' laeti edukalt üles!';
			res.render('photoupload', {notice: notice});
		}	
	});
});

app.post('/eestifilm/singlemovie', (req, res)=>{
	let sql = 'SELECT * FROM movie where id=?';
	let sqlResult = [];
	conn.query(sql, [req.body.idNum], (err, result)=>{
		if (err){
			throw err;
			res.render('singlemovielist', {filmlist: sqlResult});
			conn.end();
		}
		else {
			res.render('singlemovielist', {filmlist: result, id: req.body.idNum});
			//conn.end();
		}
	});
	//res.render('filmlist');
});

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