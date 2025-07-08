import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { chromium } from 'playwright-core'
import Spawner from 'chrome-aws-lambda'

export async function GET() {
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!)
  
  console.log("Starting cron job: Scrape Jobs");

  try {
    const browser = await chromium.launch({
      args: Spawner.args,
      executablePath: await Spawner.executablePath, // Corrected
      headless: Spawner.headless, // Corrected
    })
  
    const page = await browser.newPage()
    await page.goto('https://boards.greenhouse.io/airtable') // Example company
  
    const jobs = await page.$$eval("div.opening", (elements) => 
      elements.map(el => ({
        title: (el.querySelector('a') as HTMLElement)?.innerText,
        url: (el.querySelector('a') as HTMLAnchorElement)?.href,
        location: (el.querySelector('.location') as HTMLElement)?.innerText,
      }))
    )

    await browser.close()
    
    if (jobs && jobs.length > 0) {
      const jobsToInsert = jobs.map(job => ({
        title: job.title,
        company: 'Airtable',
        location: job.location,
        url: job.url,
        source: 'greenhouse'
      }));

      const { error } = await supabase
        .from('jobs')
        .upsert(jobsToInsert, { onConflict: 'url', ignoreDuplicates: true });

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
  }
}