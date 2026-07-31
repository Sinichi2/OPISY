"""
    This serves as the entry file for the backend server. It initializes the FastAPI application, sets up CORS middleware, 
    and defines the main function to run the server using Uvicorn.
"""
import uvicorn, json, os






if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000)