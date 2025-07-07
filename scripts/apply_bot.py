import os
import time
import requests
from supabase import create_client, Client
from selenium import webdriver
from selenium.webdriver.chrome.service import Service as ChromeService
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# --- CONFIGURATION ---
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
DOWNLOAD_DIR = "/tmp" 

# --- SCRIPT ---

def get_pending_application(supabase: Client):
    try:
        response = supabase.table('applications').select(
            'id, jobs(url), profiles(full_name, email, phone, resume_url)'
        ).eq('status', 'pending').order('created_at').limit(1).single().execute()
        return response.data
    except Exception:
        return None

def update_application_status(supabase: Client, app_id: int, status: str, details: str = None):
    supabase.table('applications').update({
        'status': status, 'details': details
    }).eq('id', app_id).execute()
    print(f"✅ Updated application {app_id} status to: {status}")

def download_resume(resume_url: str) -> str:
    print(f"📄 Downloading resume from {resume_url}...")
    local_filename = os.path.join(DOWNLOAD_DIR, "resume.pdf")
    with requests.get(resume_url, stream=True) as r:
        r.raise_for_status()
        with open(local_filename, 'wb') as f:
            for chunk in r.iter_content(chunk_size=8192): f.write(chunk)
    print(f"📄 Resume downloaded to {local_filename}")
    return local_filename

def find_element_by_label(driver, label_text):
    """Finds an input element associated with a given label text."""
    return driver.find_element(By.XPATH, f"//label[contains(text(), '{label_text}')]/following-sibling::input")

def apply_to_workday_job(driver, job_url: str, profile: dict, resume_path: str):
    print(f"➡️ Navigating to Workday job: {job_url}")
    driver.get(job_url)
    wait = WebDriverWait(driver, 20)

    # First page: Upload resume
    resume_input = wait.until(EC.presence_of_element_located((By.XPATH, "//input[@type='file']")))
    resume_input.send_keys(resume_path)
    print("📎 Resume attached to Workday form.")
    
    # This part is highly variable. We look for a common "Autofill with Resume" button.
    try:
        wait.until(EC.element_to_be_clickable((By.XPATH, "//a[contains(@aria-label, 'Autofill with Resume')]"))).click()
        print("🤖 Clicked 'Autofill with Resume'.")
        time.sleep(5) # Give time for autofill to process
    except Exception:
        print("⚠️ Could not find 'Autofill with Resume' button, proceeding with manual fill.")

    # Second page: My Information
    find_element_by_label(driver, "Email Address").send_keys(profile['email'])
    find_element_by_label(driver, "Phone").send_keys(profile['phone'])

    print("✅ Workday form fields filled.")
    time.sleep(3)

def apply_to_greenhouse_job(driver, job_url: str, profile: dict, resume_path: str):
    # Greenhouse logic from previous step...
    print("Applying to Greenhouse Job...")
    time.sleep(2)

def apply_to_lever_job(driver, job_url: str, profile: dict, resume_path: str):
    # Lever logic from previous step...
    print("Applying to Lever Job...")
    time.sleep(2)

def main():
    print("--- Starting Apply Bot v3 ---")
    if not all([SUPABASE_URL, SUPABASE_KEY]):
        print("❌ ERROR: Supabase credentials not set.")
        return

    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    application = get_pending_application(supabase)

    if not application:
        print("--- No pending applications found. Exiting. ---")
        return

    app_id = application['id']
    job_url = application.get('jobs', {}).get('url')
    profile = application.get('profiles')

    if not all([job_url, profile, profile.get('resume_url')]):
        update_application_status(supabase, app_id, 'failed', 'Incomplete data.')
        return

    driver = None
    try:
        local_resume_path = download_resume(profile['resume_url'])

        options = webdriver.ChromeOptions()
        options.add_argument("--headless")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        
        service = ChromeService(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=service, options=options)
        
        # --- Main Routing Logic ---
        if 'boards.greenhouse.io' in job_url:
            apply_to_greenhouse_job(driver, job_url, profile, local_resume_path)
            update_application_status(supabase, app_id, 'completed', 'Bot filled Greenhouse form.')
        elif 'jobs.lever.co' in job_url:
            apply_to_lever_job(driver, job_url, profile, local_resume_path)
            update_application_status(supabase, app_id, 'completed', 'Bot filled Lever form.')
        elif 'myworkdayjobs.com' in job_url:
            apply_to_workday_job(driver, job_url, profile, local_resume_path)
            update_application_status(supabase, app_id, 'completed', 'Bot filled Workday form.')
        else:
            update_application_status(supabase, app_id, 'skipped', 'Bot does not support this job site yet.')

    except Exception as e:
        print(f"❌ An unexpected error occurred: {e}")
        update_application_status(supabase, app_id, 'failed', str(e))
    finally:
        if driver:
            driver.quit()
        print("--- Apply Bot Finished ---")

if __name__ == "__main__":
    main()