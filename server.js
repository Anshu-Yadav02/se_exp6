const express = require("express")
const mysql = require("mysql2")
const bodyParser = require("body-parser")
const cors = require("cors")

const app = express()

app.use(cors())
app.use(bodyParser.json())
app.use(express.static("public"))

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "Anshu%1",
    database: "se_exp6"
})

db.connect(err => {
    if (err) throw err
    console.log("Database Connected")
})

// Track login attempts per email: { attempts: Number, lockedUntil: timestamp|null }
let loginAttempts = {}

// Email validation regex
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

// ───────────── REGISTER ─────────────
app.post("/register", (req, res) => {

    const { firstname, lastname, email, phone, gender, dob, password } = req.body

    // Validate required fields
    if (!firstname || !lastname || !email || !password) {
        return res.json({ success: false, message: "Please fill all required fields" })
    }

    // Email format check
    if (!emailRegex.test(email)) {
        return res.json({ success: false, message: "Invalid Email Address" })
    }

    // Password length check
    if (password.length < 6) {
        return res.json({ success: false, message: "Password must be at least 6 characters" })
    }

    const sql = `
        INSERT INTO users(firstname, lastname, email, phone, gender, dob, password)
        VALUES(?, ?, ?, ?, ?, ?, ?)
    `

    db.query(sql, [firstname, lastname, email, phone, gender, dob, password], (err, result) => {

        if (err) {
            if (err.code === "ER_DUP_ENTRY") {
                return res.json({ success: false, message: "Email already registered" })
            }
            return res.json({ success: false, message: "Registration failed due to a server error" })
        }

        res.json({ success: true, message: "Registration Successful" })
    })
})

// ───────────── LOGIN ─────────────
app.post("/login", (req, res) => {

    const { email, password } = req.body

    // Validate required fields
    if (!email || !password) {
        return res.json({ success: false, message: "Email and password are required" })
    }

    // Email format check
    if (!emailRegex.test(email)) {
        return res.json({ success: false, message: "Invalid Email Address" })
    }

    // ── Check if account is locked ──
    const record = loginAttempts[email]

    if (record && record.attempts >= 3 && record.lockedUntil) {
        const now = Date.now()

        if (now < record.lockedUntil) {
            // Still within the 30-second lock window
            const secondsLeft = Math.ceil((record.lockedUntil - now) / 1000)
            return res.json({
                success: false,
                message: `Too many failed attempts. Please try again after ${secondsLeft} seconds.`
            })
        }

        // Lock period has expired — reset and allow the attempt
        loginAttempts[email] = { attempts: 0, lockedUntil: null }
    }

    // ── Query the database ──
    const sql = "SELECT * FROM users WHERE email = ? AND password = ?"

    db.query(sql, [email, password], (err, result) => {

        if (err) {
            return res.json({ success: false, message: "Server error during login" })
        }

        if (result.length > 0) {
            // Correct credentials — reset attempts
            loginAttempts[email] = { attempts: 0, lockedUntil: null }
            return res.json({ success: true, message: "Login Successful" })
        }

        // Wrong credentials — increment attempts
        if (!loginAttempts[email]) {
            loginAttempts[email] = { attempts: 0, lockedUntil: null }
        }

        loginAttempts[email].attempts += 1

        const attemptsUsed = loginAttempts[email].attempts
        const remaining = 3 - attemptsUsed

        if (attemptsUsed >= 3) {
            // Lock the account for 30 seconds
            loginAttempts[email].lockedUntil = Date.now() + 30000
            return res.json({
                success: false,
                message: "Too many failed attempts. Please try again after 30 seconds."
            })
        }

        res.json({
            success: false,
            message: `Invalid email or password. ${remaining} attempt(s) remaining.`
        })
    })
})

app.listen(5000, () => {
    console.log("Server running on port 5000")
})