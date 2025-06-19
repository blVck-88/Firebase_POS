# Firebase POS System

A simple Point of Sale (POS) system built with Firebase.

## Features

-   **Authentication**: Secure login for Admin and Cashier roles using Firebase Authentication.
-   **Product Management (Admin)**: Admins can add, edit, and delete products, including names, prices, stock levels, categories, and images (stored in Firebase Storage).
-   **POS Interface (Cashier)**: Cashiers can search/browse products, add items to a cart, modify quantities, remove items, and process sales.
-   **Sales Tracking**: Transactions are recorded in Firestore, and stock levels are updated automatically. Admins can view sales history.

## Tech Stack

-   Firebase Authentication
-   Firestore (Database)
-   Firebase Storage (for product images)
-   HTML, CSS, JavaScript (Vanilla JS)
-   (Optional) Firebase Hosting for deployment

## Setup

1.  **Clone the repository (or create the files manually as guided).**

2.  **Firebase Project Setup**:
    *   Create a Firebase project at [https://console.firebase.google.com/](https://console.firebase.google.com/).
    *   Enable **Email/Password** authentication (Authentication -> Sign-in method).
    *   Enable **Firestore** (Firestore Database -> Create database -> Start in test mode).
    *   Enable **Firebase Storage** (Storage -> Get started).
    *   In your Firebase project settings (gear icon -> Project settings -> General), scroll to "Your apps".
    *   Click the "</>" (web) icon to register a new web app (if you haven't already).
    *   Copy the `firebaseConfig` object provided.

3.  **Configure Firebase SDK**:
    *   Create a file named `app.js` in the root directory (or use the provided one).
    *   Paste your `firebaseConfig` object into `app.js` where indicated:
        ```javascript
        const firebaseConfig = {
        apiKey: "AIzaSyCxoZlbj_6-UEJ6T6H2tnkKOp9ebX7YSrM",
        authDomain: "khan-firepos.firebaseapp.com",
        projectId: "khan-firepos",
        storageBucket: "khan-firepos.firebasestorage.app",
        messagingSenderId: "304752290702",
        appId: "1:304752290702:web:44108274f60cfbe26fd2df",
        measurementId: "G-SGMMWYK74F"
    };
        // Initialize Firebase
        const app = firebase.initializeApp(firebaseConfig);
        // Further Firebase services (auth, firestore, storage) will be initialized here
        ```

4.  **Install a local web server (optional but recommended for development)**:
    *   If you don't have one, you can use Node.js `http-server`:
        ```bash
        npm install -g http-server
        ```
    *   Navigate to the project directory in your terminal and run:
        ```bash
        http-server
        ```
    *   Open your browser to the address provided (usually `http://localhost:8080`).

5.  **Open `index.html` in your browser.**

## Firestore Structure

```
/users
  /{uid}
    - email: "user@example.com"
    - role: "admin" | "cashier"

/products
  /{productId}
    - name: "Product Name"
    - price: 10.99
    - stock: 100
    - category: "Category Name"
    - imageUrl: "gs://bucket/path/to/image.jpg"
    - createdAt: timestamp
    - updatedAt: timestamp

/sales
  /{saleId}
    - items: [ { productId, name, price, quantity } ]
    - subtotal: 20.00
    - tax: 1.60
    - total: 21.60
    - cashierId: "cashierUid"
    - cashierEmail: "cashier@example.com"
    - timestamp: timestamp
```

## TODO / Next Steps

-   Implement Authentication UI and logic.
-   Build Admin product management interface.
-   Build Cashier POS interface.
-   Implement sales recording and stock updates.
-   Add sales history view for Admins.
-   Refine UI/UX and add responsiveness.
