import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import axios from 'axios'
import * as cheerio from 'cheerio'

export const dynamic = 'force-dynamic'

async function fetchHtml(url: string): Promise<string | null> {
    const scraperApiKey = process.env.SCRAPER_API_KEY;
    if (!scraperApiKey) return null;

    console.log(`  - Scraping: ${url}`);
    const targetUrl = `http://api.scraperapi.com?api_key=${scraperApiKey}&url=${encodeURIComponent(url)}`;
    try {
        const response = await axios.get(targetUrl, { timeout: 60000 });
        return response.data;
    } catch (error) {
        console.error(`  - Error fetching ${url}:`, error);
        return null;
    }
}

function extractJobsFromHtml(html: string, companyName: string, source: string): any[] {
    const jobs: any[] = [];
    const $ = cheerio.load(html);

    if (source === 'greenhouse') {
        $('div.opening').each((i, el) => {
            const title = $(el).find('a').text().trim();
            const url = $(el).find('a').attr('href');
            if(title && url) {
                jobs.push({
                    title: title,
                    company: companyName,
                    url: `https://boards.greenhouse.io${url}`,
                    source: source
                });
            }
        });
    } else if (source === 'lever') {
        $('div.posting').each((i, el) => {
            const title = $(el).find('h5').text().trim();
            const url = $(el).find('a.posting-btn-submit').attr('href');
             if(title && url) {
                jobs.push({
                    title: title,
                    company: companyName,
                    url: url,
                    source: source
                });
            }
        });
    }
    
    console.log(`  - Found ${jobs.length} jobs for ${companyName}.`);
    return jobs;
}

export async function GET() {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!)
    console.log("--- Starting DB-Driven Job Scraper Cron Job ---");

    try {
        const { data: companies, error: companiesError } = await supabase
            .from('companies')
            .select('name, career_page_url, source');

        if (companiesError) throw companiesError;
        if (!companies || companies.length === 0) {
            return NextResponse.json({ success: true, message: "No companies configured." });
        }

        console.log(`Found ${companies.length} companies to scrape.`);
        let allJobs: any[] = [];

        for (const company of companies) {
            const html = await fetchHtml(company.career_page_url);
            if (html) {
                const jobs = extractJobsFromHtml(html, company.name, company.source);
                allJobs.push(...jobs);
            }
        }
        
        if (allJobs.length > 0) {
            const { error } = await supabase.from("jobs").upsert(allJobs, { onConflict: "url" });
            if (error) throw error;
            console.log(`\n✅ Successfully saved/updated ${allJobs.length} jobs.`);
            return NextResponse.json({ success: true, saved: allJobs.length });
        } else {
            console.log("No new jobs found across all companies.");
            return NextResponse.json({ success: true, saved: 0 });
        }
    } catch (error) {
        console.error("Error in Scraper Cron Job:", error);
        return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
    }
}
