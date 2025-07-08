import os
import requests
from bs4 import BeautifulSoup
from supabase import create_client, Client
from urllib.parse import urlparse, parse_qs

# --- CONFIGURATION ---
# Get Supabase credentials from environment variables (GitHub Secrets)
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

# Define your job search criteria
SEARCH_QUERY = "software engineer"
LOCATION = "Remote"

# Define the target job sites
TARGET_SITES = [
    "jobs.lever.co",
    "boards.greenhouse.io",
    "wd1.myworkdayjobs.com",
    "jobs.bamboohr.com",
    "smartrecruiters.com"
]

# --- SCRIPT ---

def scrape_and_save_jobs():
    """
    Scrapes Google for new job postings from target sites and saves them to Supabase.
    """
    print("--- Starting Job Scraper ---")
    
    if not all([SUPABASE_URL, SUPABASE_KEY]):
        print("❌ ERROR: Supabase credentials are not set.")
        return

    try:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("✅ Successfully connected to Supabase.")
    except Exception as e:
        print(f"❌ Could not connect to Supabase: {e}")
        return

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
    new_jobs_found = 0

    for site in TARGET_SITES:
        search_term = f'"{SEARCH_QUERY}" "{LOCATION}" site:{site}'
        print(f"\n🔎 Searching for: {search_term}")
        
        google_url = f"https://www.google.com/search?q={search_term}&tbs=qdr:d" # last 24 hours
        
        try:
            response = requests.get(google_url, headers=headers)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            links = soup.find_all('a')
            
            urls_to_check = []
            for link in links:
                href = link.get('href')
                if href and href.startswith('/url?q='):
                    clean_url = parse_qs(urlparse(href).query).get('q', [None])[0]
                    if clean_url and any(s in clean_url for s in TARGET_SITES):
                        urls_to_check.append(clean_url)
            
            if not urls_to_check:
                print("... No new job URLs found in search results.")
                continue

            for url in set(urls_to_check):
                try:
                    result = supabase.table('jobs').select('id').eq('url', url).execute()
                    
                    if not result.data:
                        print(f"  ➡️ Found new job: {url}")
                        job_data = {
                            "title": SEARCH_QUERY,
                            "company": urlparse(url).hostname,
                            "location": LOCATION,
                            "url": url,
                            "source": site
                        }
                        supabase.table('jobs').insert(job_data).execute()
                        new_jobs_found += 1
                except Exception as e:
                    if 'duplicate key value violates unique constraint' not in str(e):
                         print(f"  ❌ Error processing URL {url}: {e}")

        except requests.exceptions.RequestException as e:
            print(f"  ❌ Failed to fetch Google search results: {e}")

    print(f"\n--- Scraper Finished. Found and saved {new_jobs_found} new jobs. ---")

if __name__ == "__main__":
    scrape_and_save_jobs()