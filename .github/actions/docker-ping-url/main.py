import os
import requests
import time

def ping_url(url, delay, max_trials):
    trails = 0

    while trails < max_trials:
        try:
            response = requests.get(url)
            if response.status_code == 200:
                print(f"Successfully pinged {url}")
                return True
        except requests.ConnectionError:
            print(f"Failed to connect to {url}. Retrying in {delay} seconds...")  
            time.sleep(delay)
            trails += 1
        except requests.exceptions.MissingSchema:
            print(f"Invalid URL: {url}")
            return False
    

def run():
    url = os.getenv("INPUT_URL")
    delay = int(os.getenv("INPUT_DELAY"))
    max_trials = int(os.getenv("INPUT_MAX_TRIALS"))

    website_reachable = ping_url(url, delay, max_trials)
    if not website_reachable:
        raise Exception(f"Failed to reach {url} after {max_trials} attempts.")
    
    print(f"Website, {url}, is reachable.")

if __name__ == "__main__":
    run()