# ShipHero "Get All Products" Fix

## The Problem

As of April 7th 2018, the [current method](https://shipheropublic.docs.apiary.io/#reference/products/get-product/get-product) for getting all products through the ShipHero API does not work. It merely returns a subset of all the products. The other option is to manually query for each SKU you have to get information about it, but with the newly implemented 2 requests/second limit, that could take a significant amount of time.

## The Solution
This method gets all the data for your products by individually querying each SKU you provide, stores the products in a database, and allows you to make a GET request to the /data endpoint and get all the data instantly. By getting the data daily at times when you aren't using the data, this tool saves you the burden of having to wait for all the individual SKUs to be queried.

## How to Use This

### Inputting Your Information
In the index.js file in the routes path, edit the api key, MongoDB url to store your products so they can be retrieved quickly, and product SKUs that you want to query for.

### Running
`npm install`

`npm start`

It is recommended to run this on a cloud server such as Heroku since it may take some time for all the SKUs to be queried and having this run on a cloud would mean the querying continues if your computer shuts off.
