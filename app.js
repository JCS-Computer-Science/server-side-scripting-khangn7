const express = require("express");

const app = express();
//All your code goes here

// https://stackoverflow.com/questions/7172784/how-do-i-post-json-data-with-curl

app.use(express.static('public'))
app.use(express.json())

const fs = require('fs');
const path = require("path");

// https://stackoverflow.com/questions/18386361/read-a-file-in-node-js
const COURSES_PATH = path.join(__dirname, "/database/courses.json");
const courses = JSON.parse(fs.readFileSync(COURSES_PATH, 'utf8'));
const USERS_PATH = path.join(__dirname, "/database/users.json");
const users = JSON.parse(fs.readFileSync(USERS_PATH, "utf-8"));

class User {
    constructor(username, password, id) {
        this.username = username;
        this.password = password;
        this.id = id;
        this.courses = [];
    }
}

app.get('/courses', async (req, res) => {
    res.send(courses)
});

// returns false if doesn't exist
function findUser(id, username, password) {
    if (id) {
        for (let obj of users) {
            if (obj.id === id) {
                return obj
            }
        }
    } else {
        for (let obj of users) {
            if (obj.username === username && obj.password === password) {
                return {"userId": obj.id}
            }
        }
    }

}

app.get("/account/:id", (req, res) => {
    let user = findUser(req.params.id)
    if (!user) {
        user = {"error": "id doesn't exist"}
    }
    res.send(user);
});

app.post("/users/login", (req, res) => {
    let username = req.body.username,
        password = req.body.password
    let userId = findUser(false, username, password)
    if (!userId) {
        userId = {"error": "wrong username or password"}
    }
    res.send(userId)
})

app.post("/users/signup", (req, res) => {
    let username = req.body.username,
        password = req.body.password;
    let userId = findUser(false, username, password);
    let response;
    if (userId) {
        response = {"error": "username already in use"};
    } else {
        let newId = users.length + 1;
        let newUser = new User(username)
    }
})


//Do not remove this line. This allows the test suite to start
//multiple instances of your server on different ports
module.exports = app;
