import express from 'express';
import mongoose from 'mongoose'; // using mongoose to connect to MongoDB
import cors from 'cors';
import bodyParser from 'body-parser';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB connection
// This connects our app to the local MongoDB database called 'tasker'
mongoose.connect('mongodb://localhost:27017/tasker', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
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
