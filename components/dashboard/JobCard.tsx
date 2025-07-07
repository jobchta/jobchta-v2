'use client'

import { useState } from 'react'
import { createApplication } from "../../app/actions";
export type Job = {
  id: number
  created_at: string
  title: string | null
  company: string | null
  location: string | null
  url: string | null
  source: string | null
  description: string | null
}

export default function JobCard({ job }: { job: Job }) {
  const [isApplying, setIsApplying] = useState(false)
  const [applicationStatus, setApplicationStatus] = useState<{
    error?: string
    success?: string
  } | null>(null)

  const timeAgo = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    const intervals = {
      year: 31536000,
      month: 2592000,
      day: 86400,
      hour: 3600,
      minute: 60
    }

    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
      const interval = seconds / secondsInUnit
      if (interval >= 1) {
        return `${Math.floor(interval)} ${unit}${Math.floor(interval) === 1 ? '' : 's'} ago`
      }
    }

    return `${Math.floor(seconds)} second${seconds === 1 ? '' : 's'} ago`
  }

  const handleApply = async () => {
    setIsApplying(true)
    setApplicationStatus(null)
    
    try {
      const result = await createApplication(job.id)
      setApplicationStatus(result)
      
      if (result.error) {
        console.error('Application error:', result.error)
      }
    } catch (error) {
      console.error('Unexpected error:', error)
      setApplicationStatus({
        error: 'An unexpected error occurred. Please try again.'
      })
    } finally {
      setIsApplying(false)
    }
  }

  return (
    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 hover:bg-gray-700 transition-colors duration-200">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-white">
            {job.title || 'No Title Provided'}
          </h3>
          <p className="text-gray-400">
            {job.company || 'Company not specified'} • {job.location || 'Location not specified'}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Posted {timeAgo(job.created_at)} • Source: {job.source || 'Unknown'}
          </p>
          
          {applicationStatus?.error && (
            <p className="text-red-400 text-sm mt-2">
              {applicationStatus.error}
            </p>
          )}
          {applicationStatus?.success && (
            <p className="text-green-400 text-sm mt-2">
              {applicationStatus.success}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          {job.url && (
            <a
              href={job.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white underline text-sm whitespace-nowrap"
            >
              View Job Posting
            </a>
          )}
          
          <button
            onClick={handleApply}
            disabled={isApplying}
            className={`px-4 py-2 rounded-md font-medium text-sm whitespace-nowrap ${
              isApplying
                ? 'bg-indigo-800 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700'
            } text-white transition-colors`}
          >
            {isApplying ? 'Applying...' : 'Quick Apply'}
          </button>
        </div>
      </div>
      
      {job.description && (
        <div className="mt-3 pt-3 border-t border-gray-700">
          <p className="text-gray-300 text-sm line-clamp-2">
            {job.description}
          </p>
        </div>
      )}
    </div>
  )
}