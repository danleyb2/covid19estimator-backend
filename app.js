var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var logger = require('morgan');

const cors = require('cors');

var mongoose = require('mongoose');

const apiRouter = require('./routes/api');
const Log = require('./models/log');

var app = express();

app.enable('trust proxy');

// mongoose
mongoose.connect(`mongodb://${process.env.DB_HOST}/${process.env.DB_NAME}`, {
    useCreateIndex: true,
    useNewUrlParser: true
});

// end mongoose

app.use(logger('dev'));
// todo app.use(logger('dev', { stream: winston.stream }));

app.use(express.json());

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.use(cookieParser());


app.use(express.static(path.join(__dirname, 'public')));


var whitelist = ['http://example1.com', 'http://example2.com','http://localhost:63342'];
var corsOptionsDelegate = function (req, callback) {
    var corsOptions = {};
    if (whitelist.indexOf(req.header('Origin')) !== -1) {
        corsOptions['origin']= true;  // reflect (enable) the requested origin in the CORS response
    } else {
        corsOptions['origin'] = false; // disable CORS for this request
    }

    callback(null, corsOptions) // callback expects two parameters: error and options
};

const getDurationInMilliseconds  = (start) => {
    const NS_PER_SEC = 1e9;
    const NS_TO_MS = 1e6;
    const diff = process.hrtime(start);

    return (diff[0] * NS_PER_SEC + diff[1]) / NS_TO_MS
};

async function  logRequest(m,p,s,t){
    await Log.create({
        method: m,
        path: p,
        status: s,
        time: t
    });
}

app.use((req, res, next) => {
    console.log(`${req.method} ${req.originalUrl} [STARTED]`);
    const start = process.hrtime();

    res.on('finish', () => {
        const durationInMilliseconds = getDurationInMilliseconds (start);
        logRequest(req.method,req.originalUrl,res.statusCode,durationInMilliseconds);
        console.log(`${req.method} ${req.originalUrl} [FINISHED] ${durationInMilliseconds.toLocaleString()} ms`);
    });

    next()
});

app.use('/api',cors(corsOptionsDelegate), apiRouter);


module.exports = app;
