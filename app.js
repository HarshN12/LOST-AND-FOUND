const express = require('express');
const { Pool } = require('pg');
const bodyParser = require('body-parser');
const path = require('path');
const pg = require('pg');
const multer = require('multer'); // For handling file uploads
const session = require('express-session');
require('dotenv').config();





const app = express();
app.use('/uploads', express.static('uploads'));

const db = new pg.Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
  });
  db.connect()
  .then(() => console.log('Connected to PostgreSQL database'))
  .catch(err => console.error('Connection error', err.stack));

  // Configure multer for file storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/'); // Directory to save uploaded files
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + '-' + file.originalname); // Filename format
    }
  });
  const upload = multer({ storage: storage });
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

//user session

app.use(session({
    secret: 'your-secret-key', // Replace with a secure secret key
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using HTTPS
  }));
  
  // Middleware to handle user session
  app.use((req, res, next) => {
    if (!req.session.user_id) {
      req.session.user_id = null; // Or handle not logged-in users
    }
    next();
  });

// Routes
app.get('/', (req, res) => {
    res.render('index');  // Render the homepage (index.ejs)
});

app.get('/signup', (req, res) => {
    res.render('signup');  // Render the signup page (signup.ejs)
});

app.get('/login', (req, res) => {
    res.render('login');  // Render the login page (login.ejs)
});

app.post('/signup', async (req, res) => {
    const { name, email, password } = req.body;
  
    try {
      const result = await db.query(
        'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *',
        [name, email, password]
      );
      console.log('User signed up:', result.rows[0]);
      res.redirect('/login');
    } catch (err) {
      console.error('Error during signup', err.stack);
      res.status(500).send('Error during signup');
    }
  });

  app.post('/login', async (req, res) => {
    const { email, password } = req.body;
  
    try {
      const result = await db.query(
        'SELECT * FROM users WHERE email = $1 AND password = $2',
        [email, password]
      );
      if (result.rows.length > 0) {
        console.log('User logged in:', result.rows[0]);
        const user = result.rows[0];
        req.session.user_id = result.rows[0].id; // important line to understand
        // Render a page saying "Hello, [username]" with buttons for "Lost" and "Found"
      res.render('dashboard', { name: user.name });
      } else {
        res.status(401).send('Invalid email or password');
      }
    } catch (err) {
      console.error('Error during login', err.stack);
      res.status(500).send('Error during login');
    }
  });



//   app.post('/login', async (req, res) => {
//     const { email, password } = req.body;
    
//     // Authenticate user (example logic)
//     const result = await db.query('SELECT id FROM users WHERE email = $1 AND password = $2', [email, password]);
    
//     if (result.rows.length > 0) {
//       req.session.user_id = result.rows[0].id;
//       res.redirect('/dashboard'); // Redirect to user dashboard
//     } else {
//       res.status(401).send('Invalid credentials');
//     }
//   });








  app.get('/found', (req, res) => {
    res.render('found-form'); // Render the form for found items
  });
  
  // Route to handle form submission
  app.post('/found', upload.single('photo'), async (req, res) => {
    const { itemName, description, location } = req.body;
    const photo = req.file ? req.file.filename : null;
    const userId = req.session.user_id;
  
    if (!userId) {
      return res.status(403).send('You must be logged in to submit a found item');
    }
  
    try {
      const result = await db.query(
        'INSERT INTO found_items (item_name, description, location, photo, user_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [itemName, description, location, photo, userId]
      );
      console.log('Found item submitted:', result.rows[0]);
      res.redirect('/found-items');
    } catch (err) {
      console.error('Error submitting found item', err.stack);
      res.status(500).send('Error submitting found item');
    }
  });
  
  
  // Route to list found items by other users
  app.get('/found-items', async (req, res) => {
    try {
      const result = await db.query('SELECT * FROM found_items ORDER BY created_at DESC');
      res.render('found-items-list', { items: result.rows });
    } catch (err) {
      console.error('Error fetching found items', err.stack);
      res.status(500).send('Error fetching found items');
    }
  });


  app.get('/your-listing', async (req, res) => {
    const userId = req.session.user_id;
  
    if (!userId) {
      return res.status(403).send('You must be logged in to view your listings');
    }
  
    try {
      const result = await db.query('SELECT * FROM found_items WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
      res.render('your-listing', { items: result.rows });
    } catch (err) {
      console.error('Error fetching your listings', err.stack);
      res.status(500).send('Error fetching your listings');
    }
  });
  


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
