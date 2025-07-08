import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import axios from 'axios'
import * as cheerio from 'cheerio'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!)
  const scraperApiKey = process.env.SCRAPER_API_KEY;

  if (!scraperApiKey) {
    return NextResponse.json({ success: false, error: "Scraper API key is not set." }, { status: 500 });
  }
  
  console.log("Starting cron job via ScraperAPI: Scrape Jobs");

  try {
    const companyUrl = 'https://boards.greenhouse.io/airtable'; // Example company
    const targetUrl = `http://api.scraperapi.com?api_key=${scraperApiKey}&url=${encodeURIComponent(companyUrl)}`;
    
    // Call the Scraping API
    const response = await axios.get(targetUrl);
    
    // Parse the HTML response with Cheerio
    const $ = cheerio.load(response.data);
    const companyName = $('h1.company-name').text().trim();
    
    const jobs: any[] = [];
    $('div.opening').each((_i, el) => {
      jobs.push({
        title: $(el).find('a').text().trim(),
        url: 'https://boards.greenhouse.io' + $(el).find('a').attr('href'),
        location: $(el).find('.location').text().trim(),
      });
    });

    if (jobs && jobs.length > 0) {
      const jobsToInsert = jobs.map(job => ({
        title: job.title,
        company: companyName || 'Airtable',
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