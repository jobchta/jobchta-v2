import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import chrome from 'chrome-aws-lambda'
import puppeteer from 'puppeteer-core'

export async function GET() {
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!)
  
  console.log("Starting cron job with Puppeteer: Scrape Jobs");
  let browser = null;

  try {
    browser = await puppeteer.launch({
      args: chrome.args,
      executablePath: await chrome.executablePath,
      headless: chrome.headless,
    })
  
    const page = await browser.newPage()
    // Go to a known Greenhouse board
    await page.goto('https://boards.greenhouse.io/airtable')
  
    const jobs = await page.$$eval("div.opening", (elements) => 
      elements.map(el => ({
        title: (el.querySelector('a') as HTMLElement)?.innerText,
        // Ensure the URL is absolute
        url: (el.querySelector('a') as HTMLAnchorElement)?.href,
        location: (el.querySelector('.location') as HTMLElement)?.innerText,
      }))
    )
    
    if (jobs && jobs.length > 0) {
      const jobsToInsert = jobs.map(job => ({
        title: job.title,
        company: 'Airtable', // This can be extracted more dynamically later
        location: job.location,
        url: job.url,
        source: 'greenhouse'
      }));

      // Use upsert to avoid duplicate errors on URLs
      const { error } = await supabase
        .from('jobs')
        .upsert(jobsToInsert, { onConflict: 'url', ignoreDuplicates: false });

      if (error) throw error;

      console.log(`Successfully scraped and saved ${jobs.length} jobs.`);
      return NextResponse.json({ success: true, message: `Saved ${jobs.length} jobs.` });

    } else {
      console.log("No jobs found to scrape.");
      return NextResponse.json({ success: true, message: "No new jobs found." });
    }

  } catch (error) {
    console.error("Error scraping jobs:", error);
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}