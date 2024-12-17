const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Middleware
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

// Temporary data storage
let posts = [];

// Routes
// Home Page - Display all posts
app.get('/', (req, res) => {
  res.render('home', { posts });
});

// Blog Page - Display individual post
app.get('/blog/:id', (req, res) => {
  const post = posts.find(p => p.id === req.params.id);
  if (post) {
    res.render('blog', { post });
  } else {
    res.status(404).send('Blog not found');
  }
});

// Create Post - Form page
app.get('/create', (req, res) => {
  res.render('create');
});

// Create Post - Handle form submission
// Create Blog
app.post('/create', upload.array('images[]'), (req, res) => {
  const { title, paragraphs } = req.body;
  const images = req.files.map(file => file.path);

  // Map paragraphs to images
  const paragraphArray = Array.isArray(paragraphs) ? paragraphs : [paragraphs];
  const content = paragraphArray.map((para, index) => ({
    text: para,
    image: images[index] || null,
  }));

  const post = {
    id: Date.now().toString(),
    title,
    content,
  };

  posts.push(post);
  res.redirect('/');
});


// Edit Post - Form page
app.get('/edit/:id', (req, res) => {
  const post = posts.find(p => p.id === req.params.id);
  if (post) {
    res.render('edit', { post });
  } else {
    res.status(404).send('Blog not found');
  }
});

// Edit Post - Handle form submission
app.post('/edit/:id', upload.array('images[]'), (req, res) => {
  const { title, paragraphs } = req.body;
  const post = posts.find(p => p.id === req.params.id);

  if (post) {
    post.title = title;

    // Update content
    const paragraphArray = Array.isArray(paragraphs) ? paragraphs : [paragraphs];
    const images = req.files.map(file => file.path);
    post.content = paragraphArray.map((para, index) => ({
      text: para,
      image: images[index] || post.content[index]?.image || null,
    }));
  }

  res.redirect('/');
});


// Delete Post
app.post('/delete/:id', (req, res) => {
  posts = posts.filter(p => p.id !== req.params.id);
  res.redirect('/');
});

// Start server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
