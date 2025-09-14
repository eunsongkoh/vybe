# Vybe 🎉

Vybe is a real-time crowd feedback system for DJs, designed to keep the energy high at student parties. It analyzes crowd movement and energy to generate a “Vibe Score,” helping DJs select the perfect tracks to match or elevate the mood.

## Inspiration

Student life is a cycle of classes, assignments, and late-night study sessions. Parties are a chance to destress, bond, and recharge. But nothing ruins the night faster than bad music. Vybe gives DJs real-time feedback on how the crowd feels to keep the energy just right.

## What it does

Vybe analyzes crowd movement 💃🕺 and energy to generate a “Vibe Score”. Using this, it recommends tracks that match or lift the mood—helping DJs create unforgettable student parties.

## How we built it

*   **Frontend:** Built with Next.js and TypeScript for a fast, responsive DJ and Audience Dashboard.
*   **Backend:** Python services running on Lambda, with APIs through Amazon API Gateway.
*   **Data & Storage:** User interaction and engagement data stored in Amazon DynamoDB.
*   **Analysis:** Real-time computer vision powered by OpenCV to detect movement/facial expressions.
*   **AI Layer:** Used Groq for handling fast inference and recommendation logic.

## Built With

*   Next.js
*   TypeScript
*   Python
*   AWS Lambda
*   Amazon API Gateway
*   Amazon DynamoDB
*   OpenCV
*   Groq

## Getting Started

To get a local copy up and running, follow these simple steps.

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

## Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request
