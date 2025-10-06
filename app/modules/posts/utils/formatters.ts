import type { Post, PostStatus, PostCategory } from '../types/post'

// Status formatting
export const formatPostStatus = (status: PostStatus): string => {
  const statusMap: Record<PostStatus, string> = {
    draft: 'Draft',
    published: 'Published',
    archived: 'Archived',
    scheduled: 'Scheduled',
  }
  return statusMap[status] || status
}

export const getStatusColor = (status: PostStatus) => {
  const colorMap: Record<PostStatus, 'neutral' | 'success' | 'error' | 'info'> = {
    draft: 'neutral',
    published: 'success',
    archived: 'error',
    scheduled: 'info',
  }
  return colorMap[status] || 'neutral'
}

// Category formatting
export const formatPostCategory = (category: PostCategory): string => {
  const categoryMap: Record<PostCategory, string> = {
    news: 'News',
    tutorial: 'Tutorial',
    announcement: 'Announcement',
    blog: 'Blog',
  }
  return categoryMap[category] || category
}

export const getCategoryColor = (category: PostCategory) => {
  const colorMap: Record<PostCategory, 'info' | 'primary' | 'warning' | 'success'> = {
    news: 'info',
    tutorial: 'primary',
    announcement: 'warning',
    blog: 'success',
  }
  return colorMap[category] || 'neutral'
}

// DateTime formatting
export const formatDateTime = (dateString: string | null | undefined): string => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export const formatRelativeTime = (dateString: string | null | undefined): string => {
  if (!dateString) return 'N/A'

  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) return 'Just now'
  if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`
  if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`
  if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`

  return formatDate(dateString)
}

// Number formatting
export const formatNumber = (num: number | null | undefined): string => {
  if (num === null || num === undefined) return '0'
  return num.toLocaleString()
}

export const formatRating = (rating: number | null | undefined): string => {
  if (rating === null || rating === undefined) return 'N/A'
  return rating.toFixed(1)
}

// Text formatting
export const truncateText = (text: string, maxLength: number = 100): string => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

export const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Tags formatting
export const formatTags = (tags: string[]): string => {
  if (!tags || tags.length === 0) return 'No tags'
  return tags.join(', ')
}

// Boolean formatting
export const formatBoolean = (value: boolean): string => {
  return value ? 'Yes' : 'No'
}

// File size formatting
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

// Excerpt generation
export const generateExcerpt = (content: string, maxLength: number = 200): string => {
  // Strip HTML tags if present
  const stripped = content.replace(/<[^>]*>/g, '')
  return truncateText(stripped, maxLength)
}

// Validation helpers
export const isPublished = (post: Post): boolean => {
  return post.published && post.status === 'published'
}

export const isScheduled = (post: Post): boolean => {
  return post.status === 'scheduled' && !!post.scheduled_at
}

export const isDraft = (post: Post): boolean => {
  return post.status === 'draft'
}

export const canPublish = (post: Post): boolean => {
  return !post.published && (post.status === 'draft' || post.status === 'scheduled')
}

export const canUnpublish = (post: Post): boolean => {
  return post.published && post.status === 'published'
}
