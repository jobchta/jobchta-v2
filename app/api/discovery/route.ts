import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import axios from 'axios'
import * as cheerio from 'cheerio'

export const dynamic = 'force-dynamic'

const PLATFORMS_TO_SEARCH = {
    greenhouse: "boards.greenhouse.io",
    lever: "jobs.lever.co",
};

async function fetchGoogleResults(query: string): Promise<string | null> {
    const scraperApiKey = process.env.SCRAPER_API_KEY;
    if (!scraperApiKey) {
        console.error("Scraper API key is not set.");
        return null;
    }
    const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    console.log(`  - Searching Google with: ${query}`);
    const targetUrl = `http://api.scraperapi.com?api_key=${scraperApiKey}&url=${encodeURIComponent(googleUrl)}`;
    try {
        const response = await axios.get(targetUrl, { timeout: 60000 });
        return response.data;
    } catch (error) {
        console.error(`  - Error fetching Google results:`, (error as Error).message);
        return null;
    }
}

function extractCompaniesFromResults(html: string, platform: string, domain: string): any[] {
    const companies = new Set<any>();
    const $ = cheerio.load(html);

    $('a').each((i, el) => {
        const href = $(el).attr('href');
        if (href) {
            try {
                const url = new URL(href);
                if (url.hostname.endsWith(domain)) {
                    const subdomain = url.hostname.split('.')[0];
                    if (subdomain && subdomain !== 'boards' && subdomain !== 'jobs') {
                        const companyName = subdomain.charAt(0).toUpperCase() + subdomain.slice(1);
                        companies.add(JSON.stringify({
                            name: companyName,
                            career_page_url: `https://${url.hostname}`,
                            source: platform
                        }));
                    }
                }
            } catch (e) {
                // Ignore invalid URLs
            }
        }
    });

    return Array.from(companies).map(c => JSON.parse(c));
}


export async function GET() {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);
    console.log("--- Starting Accurate Discovery Bot ---");

    try {
        let allNewCompanies: any[] = [];

        for (const [platform, domain] of Object.entries(PLATFORMS_TO_SEARCH)) {
            const query = `site:${domain}`;
            const html = await fetchGoogleResults(query);
            if (html) {
                const foundCompanies = extractCompaniesFromResults(html, platform, domain);
                console.log(`  ✅ Found ${foundCompanies.length} potential companies on ${platform}.`);
                allNewCompanies.push(...foundCompanies);
            }
        }

        if (allNewCompanies.length > 0) {
            // Use upsert to avoid adding duplicates based on the unique career_page_url
            const { error } = await supabase.from("companies").upsert(allNewCompanies, { onConflict: "career_page_url" });
            if (error) throw error;
            console.log(`\n🎉 Discovery complete. Saved/updated ${allNewCompanies.length} companies.`);
        } else {
            console.log("No new companies were discovered in this run.");
        }

        return NextResponse.json({ success: true, discovered: allNewCompanies.length });

    } catch (error) {
        console.error("Error in Discovery Bot:", error);
        return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
    }
}
