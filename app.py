from flask import Flask, render_template, request, redirect, url_for, send_from_directory, session
import os

app = Flask(__name__)
app.secret_key = 'your_secret_key_here'  # Replace this in production

BOOKS_FOLDER = os.path.join(os.getcwd(), 'books')
ALLOWED_EXTENSIONS = {'pdf'}

ADMIN_USERNAME = 'admin'
ADMIN_PASSWORD = 'password123'

# Helper: check file type
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Home page
@app.route('/')
def index():
    books = os.listdir(BOOKS_FOLDER)
    return render_template('index.html', books=books)

# Book viewer
@app.route('/book/<filename>')
def get_book(filename):
    return send_from_directory(BOOKS_FOLDER, filename)

# Admin login
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        if (request.form['username'] == ADMIN_USERNAME and 
            request.form['password'] == ADMIN_PASSWORD):
            session['admin'] = True
            return redirect(url_for('upload'))
        else:
            return render_template('login.html', error='Invalid credentials')
    return render_template('login.html')

# Admin logout
@app.route('/logout')
def logout():
    session.pop('admin', None)
    return redirect(url_for('index'))

# Upload books
@app.route('/upload', methods=['GET', 'POST'])
def upload():
    if not session.get('admin'):
        return redirect(url_for('login'))

    if request.method == 'POST':
        file = request.files['file']
        if file and allowed_file(file.filename):
            file.save(os.path.join(BOOKS_FOLDER, file.filename))
            return redirect(url_for('index'))
        else:
            return render_template('upload.html', error='Only PDF files are allowed.')
    return render_template('upload.html')

if __name__ == '__main__':
    app.run(debug=True)
