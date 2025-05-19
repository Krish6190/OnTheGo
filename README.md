# OnTheGo

A hotel search web application that helps users find accommodations by city and date range. OnTheGo provides a simple and efficient way to search for hotels and view their details.

## Features

- Search hotels by city, state, and date range
- View hotel details including pricing, ratings, and amenities
- Responsive design that works on both desktop and mobile devices
- Clean and intuitive user interface

## Technologies Used

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express.js
- **APIs**: SerpAPI for hotel data
- **Dependencies**:
  - express: Web framework for Node.js
  - cors: Cross-Origin Resource Sharing middleware
  - dotenv: Environment variables management
  - node-fetch: Fetching resources from APIs

## Installation & Setup

1. Clone the repository:
   ```
   git clone https://github.com/Krish6190/OnTheGo.git
   ```

2. Navigate to the project directory:
   ```
   cd OnTheGo
   ```

3. Install dependencies:
   ```
   npm install
   ```

4. Create a `.env` file in the root directory with the following variables:
   ```
   PORT=3000
   SERPAPI_KEY=your_serpapi_key_here
   ```

5. Start the development server:
   ```
   npm start
   ```

6. Open your browser and navigate to `http://localhost:3000`

## Usage

1. Enter the city and state you want to search hotels in
2. Select your check-in and check-out dates
3. Click the "Search" button
4. Browse through the list of available hotels and their details

## Environment Variables

- `PORT`: The port on which the server will run (default: 3000)
- `SERPAPI_KEY`: Your SerpAPI API key (required for hotel searches)

## API Endpoints

### GET /api/hotels
Fetches hotel information based on location and dates.

**Query Parameters:**
- `checkin`: Check-in date in DD-MM-YYYY format
- `checkout`: Check-out date in DD-MM-YYYY format
- `city`: City name
- `state`: State name

**Example:**
```
GET /api/hotels?checkin=01-06-2025&checkout=05-06-2025&city=New%20York&state=NY
```

**Response:**
Returns a JSON array of hotel objects with details including name, address, price, rating, etc.

## Deployment

The application is currently deployed on Render.com and can be accessed at:
[https://onthego-jiti.onrender.com](https://onthego-jiti.onrender.com)

To deploy your own instance:
1. Create an account on [Render](https://render.com)
2. Connect your GitHub repository
3. Add the required environment variables
4. Deploy as a Web Service

## License

This project is licensed under the ISC License - see the LICENSE file for details.

## Implemented by

Krish

---

Feel free to contribute to this project by creating issues or pull requests.

