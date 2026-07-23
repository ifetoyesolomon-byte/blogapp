You have the code for a blog app. Frontend, backend and database.
1. Fork this repo and pull to your local machine.
2. Deploy this application to your VM
PS: you need these .env in your project repo for your app to run

---
DB_USER=bloguser
DB_PASSWORD=blogpass
DB_NAME=blogdb
BACKEND_IMAGE=ghcr.io/your-github-username/simple-blog-backend:latest
FRONTEND_IMAGE=ghcr.io/your-github-username/simple-blog-frontend:latest
---
3. Create  CI/CD pipeline to automate deployment when changes are made.
PS: Make changes to colours in frontend/styles/globals.css to test your pipeline.