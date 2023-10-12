const express = require('express');
const app = express();

app.set('view engine', 'ejs');

app.get('/', (req, res)=>{
	//res.send('See töötab!');
	//res.download('index.js');
	res.render('index');
});

app.get('/test', (req, res)=>{
	res.send('Testi lehekülg');
});

app.listen(5104);