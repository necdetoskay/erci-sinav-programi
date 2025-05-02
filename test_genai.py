import os
from google import genai
from google.genai import types
import sys

# Provided API Key
api_key = "AIzaSyA-xpTljdJtZan7n89pt-4N7fJr8SvjFDE" 

try:
    # Configure the client with the API key
    genai.configure(api_key=api_key)

    # Create the client (using configure is sufficient for basic use)
    # client = genai.Client(api_key=api_key) # Alternative way

    # Make a simple generate_content call
    print("Sending request to Gemini API...")
    response = genai.generate_text(
        model='models/gemini-1.0-pro', # Using a common model
        prompt='Why is the sky blue?' 
    )

    # Print the response
    print("\nAPI Response:")
    print(response.result)

except Exception as e:
    print(f"\nAn error occurred: {e}", file=sys.stderr)
    # It might be useful to print more details for debugging specific API errors
    if hasattr(e, 'code'):
        print(f"Error Code: {e.code}", file=sys.stderr)
    if hasattr(e, 'message'):
        print(f"Error Message: {e.message}", file=sys.stderr)
    sys.exit(1) # Exit with error status

print("\nTest script finished successfully.")
