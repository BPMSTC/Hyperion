import express from 'express';
import mongoose from 'mongoose'; // using mongoose to connect to MongoDB
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables from .env file
dotenv.config();

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load configuration
let config;
try {
  const configPath = join(__dirname, 'config.json');
  config = JSON.parse(readFileSync(configPath, 'utf8'));
} catch (error) {
  console.error('Error loading config.json:', error.message);
  console.error('Using default configuration');
  config = {
    database: {
      type: 'local',
      local: {
        uri: 'mongodb://localhost:27017/tasker'
      }
    },
    server: {
      port: 3000
    }
  };
}

// Determine database type from environment variable or config file
const dbType = process.env.DB_TYPE || config.database.type || 'local';

// Get MongoDB URI based on database type
let mongoURI;
if (dbType === 'atlas') {
  mongoURI = process.env.ATLAS_MONGODB_URI || config.database.atlas.uri;
  console.log('Using MongoDB Atlas');
} else {
  mongoURI = process.env.LOCAL_MONGODB_URI || config.database.local.uri;
  console.log('Using local MongoDB');
}

const app = express();
const PORT = process.env.PORT || config.server.port || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB connection
// This connects our app to MongoDB (either local or Atlas based on configuration)
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log(`Connected to MongoDB (${dbType})`);
});

// Task model
// This schema defines how a task is stored in MongoDB
const taskSchema = new mongoose.Schema({
  title: String,
  description: String,
  dueDate: String,
  location: String,
  category: String,
  completed: Boolean,
  importance: { type: String, enum: ['High', 'Medium', 'Low'], required: false, default: undefined }
});

// This model lets us interact with the tasks collection in MongoDB
const Task = mongoose.model('Task', taskSchema);

// REST API routes
// Get all tasks from MongoDB
app.get('/tasks', async (req, res) => {
  const tasks = await Task.find();
  res.json(tasks);
});

// Add a new task to MongoDB
app.post('/tasks', async (req, res) => {
  const task = new Task(req.body);
  await task.save();
  res.status(201).json(task);
});

// Update a task in MongoDB
app.put('/tasks/:id', async (req, res) => {
  const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(task);
});

// Delete a task from MongoDB
app.delete('/tasks/:id', async (req, res) => {
  await Task.findByIdAndDelete(req.params.id);
  res.status(204).send();
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
