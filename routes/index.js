var express = require('express');
var router = express.Router();
const request = require("request");
const debug = require("debug");
const mongoose = require('mongoose');


//Fill in your info below
const apiKey = "XXXX";
var productSkus = ['XXXX'];
const mongoDB = "XXXX";


/** DATABASE **/
//Set up default mongoose connection
mongoose.connect(mongoDB, {});

//Get the default connection
const db = mongoose.connection;

//Bind connection to error event (to get notification of connection errors)
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', function () {
    debug("connected to mongo");
});

var Schema = mongoose.Schema;

const timeSchema = new Schema({
    lastUpdated: {type: Number},
    id: {type: Number}
});
var timeModel = mongoose.model('Time', timeSchema, 'Time');

const productSchema = new Schema({
    "warehouses": [Schema.Types.Mixed],
    "value": {type: Number},
    "sku": {type: String}
});
var productModel = mongoose.model("Products", productSchema, "Products");


productModel.find({"sku": "33388915215"}, function(err, found){
    console.log("found?");
    console.log(found);
});

/** ROUTES **/
var missing = [];
function updateProduct(skus) {
    for (var i = 0; i < skus.length; i++) {
        var shipHeroRequest = {
            url: ' https://api-gateway.shiphero.com/v1.2/general-api/get-product/?token=' + apiKey + '&sku=' + skus[i],
            method: 'GET',
            headers: {
                // 'User-Agent': 'Super Agent/0.0.1',
                // 'Content-Type': 'application/x-www-form-urlencoded',
                'x-api-key': apiKey
            }
        };
        //Use an anonymous function as per here: http://bonsaiden.github.io/JavaScript-Garden/#function.closures
        (function (e) {
            request(shipHeroRequest, function (error, response, body) {
                body = JSON.parse(body);
                body = body.products[0];
                if (body !== undefined) {
                    // console.log(body);
                    productModel.findOneAndUpdate({"sku": skus[e]}, {$set: body}, {"upsert": true}, function (err, oldDoc) {
                        console.log(skus[e] + " err: " + err);
                    });
                }
                else {
                    console.log("MISSING: " + skus[e]);
                    missing.push(skus[e]);
                }
            });
        })(i);
    }
}

router.get('/', function (req, res, next) {
    //make sure it's been 30 minutes since they last requested
    timeModel.findOne({id: 1}, function (err, time) {
        console.log(time);
        if (Date.now() - time.lastUpdated > (30 * 60 * 1000)) { //30 minutes in milliseconds
            res.write("Updating products, this should take around 15 minutes...");
            timeModel.findOneAndUpdate({id: 1}, {$set: {lastUpdated: Date.now()}}, function(err, old){});
            var productsToAdd = [];
            for (var i = 0; i < productSkus.length; i++) {
                productsToAdd.push(productSkus[i]);
                if (i % 2 === 1) {
                    debug("product skus");
                    // console.log(productsToAdd);
                    //have to wait 1 second every two requests
                    setTimeout(updateProduct.bind(null, productsToAdd), (i - 1) / 2 * 1000); //wait ten seconds before continuing
                    productsToAdd = [];
                }
                //if it was false then they are an even number and about to end so the last guy will never get found
                else if (i === productSkus.length - 1) {
                    setTimeout(updateProduct.bind(null, productsToAdd), ((i - 1) / 2 * 1000) + 1000); //wait ten seconds before continuing
                }
            }
            res.end();
        }
        else {
            res.status(403).end("You already sent a request less than 30 minutes ago!"); //too soon, junior
        }
    });
});

router.get('/data', function (req, res) {
    var key = req.get("x-api-key");
    if (key === apiKey) {
        productModel.find({}, function (err, products) {
            //have to use this format because that's what the excel vba script expects b/c that's how shiphero did it
            var result = {"products": products};
            res.send(result);
        });
    }
    else {
        res.status(401).send({});
    }
});


module.exports = router;
