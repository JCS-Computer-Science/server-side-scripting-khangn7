const express = require("express");

const fs = require('fs')
const path = require("path")

const app = express();
//All your code goes here

// https://stackoverflow.com/questions/7172784/how-do-i-post-json-data-with-curl
// note: res.send doesn't stop function

app.use(express.static('public'))
app.use(express.json())


// https://stackoverflow.com/questions/18386361/read-a-file-in-node-js
const COURSES_PATH = path.join(__dirname, "database/courses.json")
const courses = JSON.parse(fs.readFileSync(COURSES_PATH, 'utf8'))
const USERS_PATH = path.join(__dirname, "database/users.json")
const users = JSON.parse(fs.readFileSync(USERS_PATH, "utf-8"))

class User {
    constructor(username, password, id) {
        this.username = username;
        this.password = password;
        this.id = id;
        this.courses = [];
    }
}

app.get('/courses', async (req, res) => {
    let code = req.query.code;
    let num = req.query.num;
    let requested;
    if (code && num) {
        requested = courses.filter((course) => { 
            return (course.code === code) && course.num.startsWith(num)
        });
    } else if (code) {
        requested = courses.filter((course) => course.code === code);
    } else if (num) {
        requested = courses.filter((course) => course.num.startsWith(num));
    } else {
        requested = courses
    }
    res.send(requested)
});

// returns false if doesn't exist
function findUser(id, username, password=false) {
    if (id) {
        for (let obj of users) {
            if (obj.id == id) {
                return obj // reference
            }
        }
    } else {
        for (let obj of users) {
            if (obj.username === username) {
                if (password && obj.password != password) {
                    continue
                }
                return {"userId": obj.id}
            }
        }
    }
    return false
}

app.get("/account/:id", (req, res) => {
    let user = findUser(Number(req.params.id))
    let response
    if (!user) {
        res.status(404)
        response = {"error": "id doesn't exist"}
    } else {
        response = {
            "user": {
                username: user.username,
                id: user.id,
                courses: user.courses
            }
        }
    }
    res.send(response)
})

app.post("/users/login", (req, res) => {
    let username = req.body.username,
        password = req.body.password
    let userId = findUser(false, username, password)
    if (!userId) {
        userId = {"error": "wrong username or password"}
        // if username exists
        if (users.find(u => u.username == username)) {
            res.status(401)
        } else {
            res.status(404)
        }
    }
    res.send(userId)
})

app.post("/users/signup", (req, res) => {
    let username = req.body.username,
        password = req.body.password
    let userId = findUser(false, username)
    let response
    if (userId) {
        response = {error: "username already in use"}
        res.status(409)
    } else {
        let newId = users.length + 1
        let newUser = new User(username, password, newId)
        users.push(newUser)
        fs.writeFileSync(USERS_PATH, JSON.stringify(users, null, 4), "utf-8")
        response = {"userId": newId}
        res.status(201)
    }
    res.send(response);
})

app.patch("/account/:id/courses/:action", (req, res) => {
    let action = req.params.action
    if (action !== "add" && action !== "remove") {
        res.redirect("fake path")
        return
    }

    let reqcourse = req.body;

    // check if request course is valid
    let course_to_add = courses.find(course => 
        course.code === reqcourse.code &&
        course.num === reqcourse.num &&
        course.name === reqcourse.name
    );
    if (!course_to_add) {
        res.status(400)
        res.send({"error": "course doesn't exist"})
        return
    }

    // check if valid id
    let user = findUser(Number(req.params.id))
    if (!user) {
        res.status(401)
        res.send({"error": "id doesn't exist"})
        return
    } 

    // check if course is in users course list
    let course_index = user.courses.findIndex(c => 
        c.code === course_to_add.code &&
        c.num === course_to_add.num &&
        c.name === course_to_add.name);
    if (action == "add" && course_index != -1)
    {
        res.status(409)
        res.send({"error": "course already in user list"})
        return
    }
    if (action == "remove" && course_index == -1) {
        res.status(409)
        res.send({"error": "course not in user list"})
        return
    }

    // else add to/remove from user courses
    // note that user is reference to obj in users
    if (action == "add") {
        user.courses.push(JSON.parse(JSON.stringify(course_to_add)))
        fs.writeFileSync(USERS_PATH, JSON.stringify(users, null, 4), "utf-8")
        res.status(201)
        res.send({courses: user.courses})
    } else {
        user.courses.splice(course_index, 1);
        fs.writeFileSync(USERS_PATH, JSON.stringify(users, null, 4), "utf-8")
        res.status(200)
        res.send({courses: user.courses})
    }
});

//Do not remove this line. This allows the test suite to start
//multiple instances of your server on different ports
module.exports = app;
