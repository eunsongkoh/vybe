# Vybe 🎉

Vybe is a real-time crowd feedback system for DJs. It analyzes crowd movement and energy to generate a “Vibe Score,” helping DJs select the perfect tracks to match or elevate the mood at student parties and events.

## Core Features

*   **Real-Time Vibe Score:** Generates a live score based on crowd energy using computer vision.
*   **DJ Dashboard:** A responsive interface built with Next.js and TypeScript for monitoring the crowd and receiving track recommendations.
*   **Audience Voting System:** Allows the audience to vote on songs, providing direct feedback.
*   **AI-Powered Recommendations:** Uses Groq for fast inference to suggest tracks that align with the current vibe.

## Tech Stack

*   **Frontend:** Next.js, TypeScript
*   **Backend:** Python, AWS Lambda
*   **API:** Amazon API Gateway
*   **Database:** Amazon DynamoDB
*   **Computer Vision:** OpenCV
*   **AI/ML:** Groq

## Getting Started

To get a local copy up and running, follow these steps.

### Prerequisites

*   Node.js and npm
*   Python 3

### Installation

1.  **Clone the repo:**
    ```sh
    git clone https://github.com/eunsongkoh/vybe.git
    ```
2.  **Install frontend dependencies:**
    ```sh
    cd frontend
    npm install
    ```
3.  **Install backend dependencies:**
    ```sh
    cd ../backend
    # Assuming a requirements.txt file exists
    pip install -r requirements.txt
    ```

## Usage

1.  **Start the frontend development server:**
    ```sh
    cd frontend
    npm run dev
    ```
2.  **Start the backend server:**
    ```sh
    cd ../backend
    python app.py
    ```

## Future Development

*   Integration with Spotify / Apple Music APIs
*   Enhanced machine learning models for more accurate Vibe Scores
*   Scaling for larger venues and clubs
*   A mobile app for real-time song voting and requests

## Contributing

Contributions are welcome! Please follow these steps:

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## License

Distributed under the MIT License.
