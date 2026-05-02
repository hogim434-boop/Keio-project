// 자유게시판 페이지 - Server Component
import { DUMMY_POSTS } from '@/lib/dummy-community'
import { CommunityClient } from './_components/community-client'

export default function CommunityPage() {
  return <CommunityClient posts={DUMMY_POSTS} />
}
