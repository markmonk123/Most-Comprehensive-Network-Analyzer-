# Most Comprehensive Network Analyzer - Backend

## Overview
The backend of the Most Comprehensive Network Analyzer project is built using Node.js and Express. It serves as the API layer that interacts with the frontend and handles requests related to network analysis.

## Project Structure
- **src/**: Contains the source code for the backend application.
  - **controllers/**: Contains the logic for handling incoming requests and responses.
  - **routes/**: Defines the API routes and links them to the appropriate controllers.
  - **services/**: Contains the business logic for interacting with external APIs, such as RIPEstat.
  - **utils/**: Includes utility functions that can be reused throughout the application.
  - **app.js**: Initializes the Express application and sets up middleware and routes.

## Setup Instructions
1. Clone the repository:
   ```
   git clone <repository-url>
   ```
2. Navigate to the backend directory:
   ```
   cd Most-Comprehensive-Network-Analyzer/backend
   ```
3. Install the dependencies:
   ```
   npm install
   ```
4. Start the server:
   ```
   npm start
   ```

## API Usage
The backend exposes several API endpoints for network analysis. Refer to the documentation in the `routes` directory for detailed information on available endpoints and their usage.

## Contributing
Contributions are welcome! Please submit a pull request or open an issue for any enhancements or bug fixes.