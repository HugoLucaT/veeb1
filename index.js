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
//asünkrooseks töötamiseks
const async = require('async');
//paroolide krüpteerimiseks
const bcrypt = require('bcrypt');
//sessiooni jaoks
const session = require('express-session');
const pool = require('./src/databasepool').pool

app.use(session({secret: 'minuAbsoluutseltSalajaneVõti', saveUninitialized: true, resave: false}));
let mySession;

const dbInfo = require('../../vp23config');
const timeInfo = require('./src/datetime_et');
//const database = 'if23_hugoluca_ti';

app.set('view engine', 'ejs');
app.use(express.static('public'));
//kui ainult tekst siis "extended: false", kui muud siis allolev.
app.use(bodyparser.urlencoded({extended: true}));

//andmebaasi ühendus
/*const conn = mysql.createConnection({
	host: dbInfo.configData.host,
	user: dbInfo.configData.user,
	password: dbInfo.configData.password,
	database: dbInfo.configData.database
});*/

const newsRouter = require('./routes/news');
app.use('/news', newsRouter);

let privateGallery = 3

app.get('/', (req, res)=>{
	//res.send('See töötab!');
	//res.download('index.js');
	res.render('index');
});

app.get('/signup', (req, res)=>{
	res.render('signup');
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

app.get('/eestifilm/addfilmrelation', (req, res)=>{
	//kasutadaes async moodulis paneme mitu tegevust parallelselt tööle, kõige pealt tegevuste loend
	const myQueries = [
		function(callback){
			pool.getConnection((err, connection)=>{
				if(err){
					throw err;
				}
				else {
					connection.execute('SELECT id, first_name, last_name FROM person', (err, result) =>{
						if (err){
							return callback(err)
						} else {
							return callback(null, result);
						}	
					});
				}
			});
		},
		function(callback){
			pool.getConnection((err, connection)=>{
				if(err){
					throw err;
				}
				else {
					connection.execute('SELECT id, title FROM movie', (err, result) =>{
						if (err){
							return callback(err)
						} else {
							return callback(null, result);
						}	
					});
				}
			});
		}
	];
	async.parallel(myQueries, (err, results)=>{
		if (err){
			throw err
		} else {
			//siin kõik asjad mis vaja teha
			let personInfo = results[0];
			let movieInfo = results[1];
			res.render('addfilmrelation', {personInfo: personInfo, movieInfo: movieInfo});
		}
	});
});

app.get('/eestifilm/singlemovie', (req, res)=>{
	let movieTableInfo = 'SELECT COUNT(title) FROM movie';
	pool.getConnection((err, connection)=>{
		if(err){
			throw err;
		}
		else {
			connection.execute(movieTableInfo, (err, result)=>{
				if (err){
					throw err;
					//conn.end();
					connection.release();
				}
				else {
					console.log(result[0]['COUNT(title)']);
					res.render('singlemovie', {maxSize: result[0]['COUNT(title)']});
					//conn.end();
					connection.release();
				}
			});
		}
	})
});

app.get('/photoupload', checkLogin, (req, res)=>{
	res.render('photoupload');
});

app.get('/photogallery', (req, res)=>{
	let privateGallery = 2
	if(req.session.userid){
		privateGallery = 1
	}
	
	let gallerySQL = 'SELECT id, filename, alttext FROM vpgallery WHERE privacy > ? OR ? = userid AND deleted IS NULL';
	pool.getConnection((err, connection)=>{
		if(err){
			throw err;
		}
		else {
			connection.execute(gallerySQL, [privateGallery, req.session.userid] ,(err, result)=>{
				if (err){
					throw err;
					//let info = 'Pilte ei suutud lugeda';
					//console.log(result)
					//res.render('gallery', {allPictures: info});
					connection.release();
				}
				else {
					res.render('photogallery', {allPictures: result});
					connection.release();
				}
			});
		}
	});
});

app.post('/', (req, res)=>{
	let notice = "Sisesta oma kasutaja konto andmed!";
	if(!req.body.emailInput || !req.body.passwordInput){
		console.log('Paha');
		res.render('index', {notice: notice});
	}
	else {
		let sql = 'SELECT id, password FROM vpusers WHERE email = ?';
		pool.getConnection((err, connection)=>{
			if(err){
				throw err;
			}
			else {
				connection.execute(sql, [req.body.emailInput], (err, result)=>{
					if (err){
						notice = 'Tehnilise vea tõttu ei saa sisse logida';
						res.render('index', {notice: notice});
						connection.release();
					} else {
						if(result[0] != null){
							//console.log(result[0])
							bcrypt.compare(req.body.passwordInput, result[0].password, (err, compareresult)=>{
								if (err){
									throw err;
									connection.release();
								} else {
									if(compareresult){
										mySession = req.session;
										mySession.userName = req.body.emailInput;
										mySession.userid = result[0].id;
										notice = mySession.userName + " on sisselogitud";
										console.log(mySession.userName)
										res.render('index', {notice: notice});
										connection.release();
									} else {
										notice = "Kasutajatunnus või parool on vale";
										res.render('index', {notice: notice});
										connection.release();
									}
								}
							});
						} else {
							notice = "Kasutajatunnus või parool on vale";
							res.render('index', {notice: notice});
							connection.release();
						}
					}
				});
			}
		});
	}
	
});

app.post('/logout', (req, res)=>{
	let notice = "Sisesta oma kasutaja konto andmed!";
	if(!req.body.emailInput || !req.body.passwordInput){
		console.log('Paha');
		res.render('index', {notice: notice});
	}
	else {
		let sql = 'SELECT password FROM vpusers WHERE email = ?';
		pool.getConnection((err, connection)=>{
			if(err){
				throw err;
			}
			else {
				connection.execute(sql, [req.body.emailInput], (err, result)=>{
					if (err){
						notice = 'Tehnilise vea tõttu ei saa sisse logida';
						res.render('index', {notice: notice});
					} else {
						if(result[0] != null){
							//console.log(result[0])
							bcrypt.compare(req.body.passwordInput, result[0].password, (err, compareresult)=>{
								if (err){
									throw err;
									connection.release();
								} else {
									if(compareresult){
										mySession = req.session;
										mySession.userName = req.body.emailInput;
										notice = mySession.userName + " on sisselogitud";
										res.render('index', {notice: notice});
										connection.release();
									} else {
										notice = "Kasutajatunnus või parool on vale";
										res.render('index', {notice: notice});
										connection.release();
									}
								}
							});
						} else {
							notice = "Kasutajatunnus või parool on vale";
							res.render('index', {notice: notice});
							connection.release();
						}
					}
				});
			}
		});
	}
	
});

app.get('/logout', (req, res)=>{
	req.session.destroy();
	mySession = null;
	notice = 'Väljalogitud';
	res.render('index', {notice: notice});
});

app.post('/signup', (req, res)=>{
	//console.log(req.body);
	let notice = 'Andmete ootel!';
	if(!req.body.firstNameInput || !req.body.lastNameInput || req.body.passwordInput.length < 8 || req.body.passwordInput !== req.body.confirmPasswordInput || !req.body.genderInput || !req.body.emailInput || !req.body.birthInput){
		notice = 'Andmeid on puudu või pole nad korrektsed!';
		res.render('signup', {notice: notice});
	}
	else {
		console.log('Ok!');
		bcrypt.genSalt(10, (err, salt)=> {
			bcrypt.hash(req.body.passwordInput, salt, (err, pwdhash)=>{
				let sql = 'INSERT INTO vpusers (firstname, lastname, birthdate, gender, email, password) VALUES (?,?,?,?,?,?)';
				pool.getConnection((err, connection)=>{
					if(err){
						throw err;
					}
					else {
						connection.execute(sql, [req.body.firstNameInput, req.body.lastNameInput, req.body.birthInput, req.body.genderInput, req.body.emailInput, pwdhash], (err, result) =>{
							if(err){
								console.log(err);
								notice = 'Kontot ei suudetud tehnilisted põhjustel luua';
								res.render('signup', {notice: notice});
								connection.release();
							} else {
								notice = 'Konto edukalt loodud';
								res.render('signup', {notice: notice});
								connection.release();
							}
						});
					}
				});
			});
		});
	}
	//res.render('signup');
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
	('./public/gallery/orig/' + fileName).onload = function() {
		console.log('width ' + this.width)
		console.log('height '+ this.height);
	}
	sharp('./public/gallery/orig/' + fileName).resize(100,100).jpeg({quality : 90}).toFile('./public/gallery/thumbs/' + fileName);
	sharp('./public/gallery/orig/' + fileName).metadata().then((metadata)=>{
		if (metadata.width / 800 >= metadata.height / 600){
			let newHeight = Math.floor(metadata.height / (metadata.width / 800))
			sharp('./public/gallery/orig/' + fileName).resize(800, newHeight).jpeg({quality : 90}).toFile('./public/gallery/normal/' + fileName);
		}
		if (metadata.width / 800 < metadata.height / 600){
			let newWidth = Math.floor(metadata.width / (metadata.height / 600))
			sharp('./public/gallery/orig/' + fileName).resize(newWidth,600).jpeg({quality : 90}).toFile('./public/gallery/normal/' + fileName);
		}
	});
	//foto andmed andmetabelisse
	let sql = 'INSERT INTO vpgallery (filename, originalname, alttext, privacy, userid) VALUES(?,?,?,?,?)';
	pool.getConnection((err, connection)=>{
		if(err){
			throw err;
		}
		else {
			connection.execute(sql, [fileName, req.file.originalname, req.body.altInput, req.body.privacyInput, req.session.userid], (err, result)=>{
				if (err){
					throw err
					notice = 'Foto andmete salvestamine ebaõnnestus!';
					res.render('photoupload', {notice: notice});
					connection.release();
				}
				else {
					notice = 'Foto ' + req.file.originalname + ' laeti edukalt üles!';
					res.render('photoupload', {notice: notice});
					connection.release();
				}	
			});
		}
	});
});

app.post('/eestifilm/singlemovie', (req, res)=>{
	let sql = 'SELECT * FROM movie where id=?';
	let sqlResult = [];
	pool.getConnection((err, connection)=>{
		if(err){
			throw err;
		}
		else {
			connection.execute(sql, [req.body.idNum], (err, result)=>{
				if (err){
					throw err;
					res.render('singlemovielist', {filmlist: sqlResult});
					connection.release();
				}
				else {
					res.render('singlemovielist', {filmlist: result, id: req.body.idNum});
					//conn.end();
					connection.release();
				}
			});
			//res.render('filmlist');
		}
	})
});

app.post('/eestifilm/addfilmperson', (req, res)=>{
	//;
	//res.send("Andmed");
	let notice = '';
	let sql = 'INSERT INTO person (first_name, last_name, birth_date) VALUES(?,?,?)';
	pool.getConnection((err, connection)=>{
		if(err){
			throw err;
		}
		else {
			connection.execute(sql, [req.body.firstNameInput, req.body.lastNameInput, req.body.birthDateInput], (err, result) =>{
				if (err) {
					notice = 'Andmete salvestamine ebaõnnestus!';
					res.render('addfilmperson', {notice: notice});
					throw err;
					connection.release();
				}
				else {
					notice = req.body.firstNameInput + ' ' + req.body.lastnameInput + ' andmete salvestamine õnnestus!';
					res.render('addfilmperson', {notice: notice});
					connection.release();
				}
			});
		}
	});
});

function checkLogin(req, res, next){
	console.log('Kontrollime Sisselogimist');
	if(mySession != null){
		console.log('Mysession on olemas')
		if(mySession.userName){
			next();
		} else {
			res.redirect('/');
		}
	} else {
		res.redirect('/');
	}
}



app.listen(5104);