var express = require('express');
var fs = require('fs');

var app = express();


app.use("/", express.static('src'));

app.listen(5000);