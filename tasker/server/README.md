# Tasker Server

A Node.js/Express backend for the Tasker application with MongoDB support.

## Features

- REST API for task management
- Flexible MongoDB configuration (local or Atlas)
- Environment variable support

## Configuration

The server supports two methods of configuration:

### Method 1: Using config.json (Recommended)

1. Copy `config.example.json` to `config.json` (already created with defaults)
2. Edit `config.json` and set the `database.type` field:
   - Set to `"local"` for local MongoDB
   - Set to `"atlas"` for MongoDB Atlas
3. Update the appropriate URI:
   - For local: Update `database.local.uri` if needed
   - For Atlas: Update `database.atlas.uri` with your connection string

Example for local MongoDB:
```json
{
  "database": {
    "type": "local",
    "local": {
      "uri": "mongodb://localhost:27017/tasker"
    }
  },
  "server": {
    "port": 3000
  }
}
```

Example for MongoDB Atlas:
```json
{
  "database": {
    "type": "atlas",
    "atlas": {
      "uri": "mongodb+srv://username:password@cluster.mongodb.net/tasker?retryWrites=true&w=majority"
    }
  },
  "server": {
    "port": 3000
  }
}
```

### Method 2: Using Environment Variables

1. Copy `.env.example` to `.env`
2. Set `DB_TYPE` to either `local` or `atlas`
3. Set the appropriate MongoDB URI variable:
   - `LOCAL_MONGODB_URI` for local MongoDB
   - `ATLAS_MONGODB_URI` for MongoDB Atlas

Example `.env` file:
```
DB_TYPE=local
LOCAL_MONGODB_URI=mongodb://localhost:27017/tasker
PORT=3000
```

Or for Atlas:
```
DB_TYPE=atlas
ATLAS_MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/tasker?retryWrites=true&w=majority
PORT=3000
```

**Note:** Environment variables take precedence over config.json settings.

## Installation

```bash
npm install
```

## Running the Server

```bash
npm start
```

The server will start on the configured port (default: 3000) and connect to the specified MongoDB instance.

## Prerequisites

### For Local MongoDB:
- MongoDB installed and running locally on port 27017
- Or update the URI in config.json to point to your MongoDB instance

### For MongoDB Atlas:
- A MongoDB Atlas account
- A cluster created
- Database access user configured
- Network access configured (IP whitelist)
- Connection string from Atlas dashboard

## API Endpoints

- `GET /tasks` - Get all tasks
- `POST /tasks` - Create a new task
- `PUT /tasks/:id` - Update a task
- `DELETE /tasks/:id` - Delete a task
