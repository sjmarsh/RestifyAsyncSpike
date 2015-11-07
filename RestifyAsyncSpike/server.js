var restify = require('restify');
var restifyClient = require('restify-clients');
var async = require('async');

/*
  spike to figure out how to do multiple async calls with restify
  Sample json data api http://jsonplaceholder.typicode.com/
*/


var client = restifyClient.createJsonClient({
    url: 'http://jsonplaceholder.typicode.com/',
    version: '*'
});

function retrieveUsers(callback) {

    client.get('/users', callback);
}

function retrievePosts(callback){
    client.get('/posts', callback);
}


function getUsers(request, response, next) {
    
    retrieveUsers(function callback(err, req, res, obj) {
        if (err) {
            throw new Error('omg' + err.message);
        }
                
        response.send(obj);
    });
    
    next();
}

function doAsyncThings(request, response, next) {
    async.waterfall([
      function (callback) {
          callback(null, 'one', 'two');
      },
      function (arg1, arg2, callback) {
          // arg1 now equals 'one' and arg2 now equals 'two'
          callback(null, 'three');
      },
      function (arg1, callback) {
          // arg1 now equals 'three'
          callback(null, 'done');
      }
      ], function (err, result) {
          // result now equals 'done'
          response.send(result);
          next();
    });
}

/*
* https://github.com/caolan/async#waterfall
* http://justinklemm.com/node-js-async-tutorial/
* http://www.sebastianseilund.com/nodejs-async-in-practice
*/
function getUserPosts(request, response, next) {
    async.waterfall([
      // first task
      function (callback) {
          retrieveUsers(function cb(err, req, res, usersObj) {
              if (err) {
                  throw new Error('omg - error retrieving users' + err.message);
              }
              callback(null, usersObj);
          })
      },
      // second task
      function (usersObj, callback) {
          retrievePosts(function cb(err, req, res, postsObj) {
              if (err) {
                  throw new Error('omg - error retrieving posts' + err.message);
              }
              callback(null, { users: usersObj, posts: postsObj });
          })
      }
    ],
    // final task
    function (err, result) {
        // result should be users & posts combined
        response.send(result);
        next();
    });
}

var server = restify.createServer();
server.get('/users', getUsers);
server.get('/asyncThings', doAsyncThings);
server.get('/userPosts', getUserPosts);

server.on('InternalServer', function (req, res, err, cb) {
    err.body = 'something is wrong!';
    return cb();
});

server.listen(1339, function () {
    console.log('%s listening at %s', server.name, server.url);
});