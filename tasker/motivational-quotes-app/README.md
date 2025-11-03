# Motivational Quotes App

This project is a simple web application that displays a motivational quote of the day. The quote is fetched from a motivational quotes API and updates every 24 hours.

## Features

- Displays a new motivational quote every day.
- Uses local storage to remember the last displayed quote and the time it was last updated.
- Simple and clean user interface.

## Project Structure

```
motivational-quotes-app
├── src
│   ├── components
│   │   └── QuoteOfTheDay.ts       # React component for displaying the quote of the day
│   ├── api
│   │   └── quotesApi.ts            # API interaction for fetching quotes
│   ├── utils
│   │   └── quoteCycler.ts          # Utility for cycling through quotes
│   └── types
│       └── index.ts                # Type definitions for quotes and API responses
├── package.json                     # NPM package configuration
├── tsconfig.json                    # TypeScript configuration
└── README.md                        # Project documentation
```

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   ```
2. Navigate to the project directory:
   ```
   cd motivational-quotes-app
   ```
3. Install the dependencies:
   ```
   npm install
   ```

## Usage

To start the application, run:
```
npm start
```

The application will open in your default web browser, displaying the motivational quote of the day.

## API Integration

The application fetches quotes from a motivational quotes API. The API endpoint is currently a placeholder and should be replaced with the actual endpoint in the `src/api/quotesApi.ts` file.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or features you'd like to add.

## License

This project is licensed under the MIT License.