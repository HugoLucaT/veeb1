const express = require('express');
//loome oma rakenduse see toimiva miniäpi
const router = express.Router(); //suur algustäht 'R' on oluline
const pool = require('../src/databasepool').pool
const timeInfo = require('../src/datetime_et');

//kuna siin on miniäpp router, siis kõik marsruudid on temaga mitte äppiga seotud
//kuna kõik siinsed marsruudid algavad /news, siis selle jätame ära

router.get('/', (req, res)=> {
	res.render('news');
});

router.get('/add', (req, res)=> {
	res.render('addnews');
});

router.get('/read', (req, res)=> {
	//let allNews = 'SELECT * FROM "vpnews" WHERE expire > ? AND deleted IS NULL ORDER BY id DESC';
	let timeSQL = timeInfo.dateSQLformated()
	let allNews = 'SELECT title, content FROM vpnews WHERE expire > ? AND deleted IS NULL ORDER BY id DESC';
	//console.log(allNews);
	pool.getConnection((err, connection)=>{
		if(err){
			throw err;
		}
		else {
			connection.query(allNews, [timeSQL], (err, result)=>{
			//conn.query(allNews,  (err, result)=>{
				if (err){
					throw err;
					let info = 'Uudiseid ei suutud lugeda';
					console.log(result)
					res.render('readnews', {allNews: info});
					connection.release();
				}
				else {
					res.render('readnews', {allNews: result});
					connection.release();
				}
			});
		}
	});
});

router.get('/read/:id', (req, res)=> {
	//res.render('readnews');
	console.log(req.query);
	res.send('Tahame uudist mille id on ' + req.params.id);
});

router.post('/add', (req, res)=>{
	let notice = '';
	let sql = 'INSERT INTO vpnews (Title, Content, Expire, userid) VALUES(?,?,?,1)';
	pool.getConnection((err, connection)=>{
		if(err){
			throw err;
		}
		else {
			connection.execute(sql, [req.body.titleInput, req.body.contentInput, req.body.expireInput], (err, result) =>{
				if (err) {
					notice = 'Andmete salvestamine ebaõnnestus!';
					res.render('addnews', {notice: notice});
					throw err;
					connection.release();
				}
				else {
					res.render('addnews');
					connection.release();
				}
			});
		}
	});
});

module.exports = router;