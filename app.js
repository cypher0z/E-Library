const express = require('express');
const app = express();
const { MongoClient, ObjectId } = require('mongodb'); 
const path = require('path');
const port = 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); 

app.use(express.static('public'));

const uri = "mongodb://localhost:27017";
const client = new MongoClient(uri);

async function connectToMongo() {
    try {
        await client.connect();
        console.log("Connected to MongoDB successfully! 🚀");
    } catch (err) {
        console.error("Failed to connect to MongoDB:", err);
    }
}
connectToMongo();

app.get("/", async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;

        const { title, author, subject } = req.query; // Get search parameters from URL

        let query = {}; // Initialize an empty MongoDB query object

        // Build the query dynamically based on user input
        if (title) {
            query.Title = new RegExp(title, 'i'); // 'i' for case-insensitive
        }
        if (author) {
            query.Author = new RegExp(author, 'i');
        }
        if (subject) {
            query.Subject = new RegExp(subject, 'i');
        }

        const database = client.db('Library');
        const booksCollection = database.collection('Books');
        
        // Count total documents for pagination, using the search query
        const totalBooks = await booksCollection.countDocuments(query);
        const totalPages = Math.ceil(totalBooks / limit);

        // Fetch books with pagination and filtering
        const bookData = await booksCollection.find(query)
            .skip(skip)
            .limit(limit)
            .toArray();

        // Pass the search query back to the template to persist user input
        res.render('index', { 
            bookData: bookData, 
            currentPage: page,
            totalPages: totalPages,
            searchQuery: { title, author, subject }
        });
    } catch (err) {
        console.error("Error fetching book data:", err);
        res.status(500).send("Error fetching book data.");
    }
});


app.get("/books/:id", async (req, res) => {
    try {
        const bookId = req.params.id;
        const database = client.db('Library');
        const books = database.collection('Books');
        
        const book = await books.findOne({ _id: new ObjectId(bookId) });

        if (!book) {
            return res.status(404).send('Book not found.');
        }

        res.render('book-details', { book: book });
    } catch (err) {
        console.error("Error fetching book details:", err);
        res.status(500).send("Error fetching book details.");
    }
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});